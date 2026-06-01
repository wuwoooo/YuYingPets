import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { RewardUpsertDto } from './dto/reward-upsert.dto';
import { RewardOrderCreateDto } from './dto/reward-order-create.dto';
import { toNumber } from '@/common/utils/bigint.util';
import { OperationLogService } from '../operation-log/operation-log.service';
import { RealtimeService } from '../realtime/realtime.service';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import type { AuthUser } from '@/common/auth/auth-user.interface';
import type { Prisma, Reward } from '@prisma/client';

@Injectable()
export class RewardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async list(authorization: string | undefined, query: Record<string, string>) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const includeDisabled = query.includeDisabled === 'true';
    const scopeType = query.scopeType === 'class' || query.scopeType === 'global' ? query.scopeType : undefined;
    const classId = query.classId ? Number(query.classId) : undefined;

    if (classId) {
      this.authService.ensureCanAccessClass(user, classId);
    }

    let where: Prisma.RewardWhereInput = {
      schoolId: user.schoolId,
      category: query.category || undefined,
      scopeType,
      classId: classId ? BigInt(classId) : undefined,
      status: includeDisabled ? undefined : 'enabled',
    };

    if (!this.canManageGlobalRewards(user.roleCode)) {
      this.ensureCanManageClassRewards(user.roleCode);
      const accessibleClassIds = this.authService.getAccessibleClassIds(user);
      where = {
        ...where,
        scopeType: 'class',
        classId: classId ? BigInt(classId) : { in: accessibleClassIds ?? [BigInt(-1)] },
      };
    }

    return this.prisma.reward.findMany({
      where,
      include: {
        _count: {
          select: {
            rewardOrders: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ scoreCost: 'asc' }, { createdAt: 'desc' }],
    }).then((rows) => ({
      code: 0,
      message: 'ok',
      data: rows.map((row) => this.serializeReward(row)),
    }));
  }

  async create(authorization: string | undefined, body: RewardUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const scopeType = body.scopeType ?? 'global';
    const classId = body.classId ? BigInt(body.classId) : null;
    this.validateRewardPayload(body, scopeType);

    if (scopeType === 'global') {
      this.ensureCanManageGlobalRewards(user.roleCode);
    } else {
      this.ensureCanManageClassRewards(user.roleCode);
      if (!classId) {
        throw new BadRequestException('班级奖励必须选择班级');
      }
      this.authService.ensureCanAccessClass(user, classId);
    }

    const created = await this.prisma.reward.create({
      data: {
        schoolId: user.schoolId,
        scopeType,
        classId,
        code: this.resolveRewardCode(scopeType, body, user),
        name: body.name,
        category: this.resolveRewardCategory(scopeType, body),
        imageUrl: scopeType === 'class' ? null : body.imageUrl?.trim() || null,
        scoreCost: body.scoreCost,
        stockQty: this.resolveRewardStockQty(scopeType, body),
        isInfiniteStock: body.isInfiniteStock ?? false,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'reward',
      action: 'create',
      targetType: 'reward',
      targetId: created.id,
      detail: {
        code: created.code,
        name: body.name,
        scoreCost: body.scoreCost,
        scopeType,
        classId: classId ? toNumber(classId) : null,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(created.id) } };
  }

  async update(authorization: string | undefined, id: number, body: RewardUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const reward = await this.prisma.reward.findFirst({
      where: { id: BigInt(id), schoolId: user.schoolId },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!reward) {
      throw new NotFoundException('奖励不存在');
    }

    this.ensureCanEditReward(user, reward);

    const nextScopeType = (body.scopeType ?? reward.scopeType) as 'global' | 'class';
    if (nextScopeType !== reward.scopeType) {
      throw new BadRequestException('奖励范围创建后不可修改');
    }
    if (reward.scopeType === 'class' && body.classId && reward.classId !== BigInt(body.classId)) {
      throw new BadRequestException('班级奖励不允许跨班修改');
    }

    this.validateRewardPayload(body, nextScopeType, reward);

    const updated = await this.prisma.reward.update({
      where: { id: BigInt(id) },
      data: {
        code: this.resolveUpdatedRewardCode(reward, body),
        name: body.name.trim(),
        category: this.resolveRewardCategory(nextScopeType, body, reward),
        imageUrl: nextScopeType === 'class' ? null : body.imageUrl?.trim() || null,
        scoreCost: body.scoreCost,
        stockQty: this.resolveRewardStockQty(nextScopeType, body, reward),
        isInfiniteStock: body.isInfiniteStock ?? false,
        updatedBy: user.id,
      },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'reward',
      action: 'update',
      targetType: 'reward',
      targetId: updated.id,
      detail: {
        code: updated.code,
        name: body.name,
        scoreCost: body.scoreCost,
        scopeType: reward.scopeType,
        classId: reward.classId ? toNumber(reward.classId) : null,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(updated.id) } };
  }

  async uploadRewardAsset(
    authorization: string | undefined,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageGlobalRewards(user.roleCode);

    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('仅支持上传图片文件');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('图片大小不能超过 5MB');
    }

    const uploadsDir = resolve(process.cwd(), 'public/uploads/rewards');
    await mkdir(uploadsDir, { recursive: true });
    const extension = extname(file.originalname || '').toLowerCase() || '.png';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
    await writeFile(resolve(uploadsDir, fileName), file.buffer);

    return {
      code: 0,
      message: 'ok',
      data: {
        url: `/uploads/rewards/${fileName}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    };
  }

  async updateStatus(authorization: string | undefined, id: number, status: 'enabled' | 'disabled') {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const reward = await this.prisma.reward.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
      },
    });
    if (!reward) {
      throw new NotFoundException('奖励不存在');
    }
    this.ensureCanEditReward(user, reward);

    const updated = await this.prisma.reward.update({
      where: { id: BigInt(id) },
      data: { status, updatedBy: user.id },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'reward',
      action: 'status_update',
      targetType: 'reward',
      targetId: updated.id,
      detail: {
        code: reward.code,
        name: reward.name,
        status,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(updated.id), status } };
  }

  async deleteReward(authorization: string | undefined, id: number) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const reward = await this.prisma.reward.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
      },
      include: {
        _count: {
          select: {
            rewardOrders: true,
          },
        },
      },
    });
    if (!reward) {
      throw new NotFoundException('奖励不存在');
    }
    this.ensureCanEditReward(user, reward);
    if (reward._count.rewardOrders > 0) {
      throw new ForbiddenException('该奖励已有兑换记录，不能删除');
    }

    await this.prisma.reward.delete({
      where: { id: BigInt(id) },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'reward',
      action: 'delete',
      targetType: 'reward',
      targetId: BigInt(id),
      detail: {
        code: reward.code,
        name: reward.name,
      },
    });

    return { code: 0, message: 'ok', data: { id } };
  }

  async orders(authorization: string | undefined, query: Record<string, string>) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);

    if (query.classId) {
      this.authService.ensureCanAccessClass(user, Number(query.classId));
    }

    const rows = await this.prisma.rewardOrder.findMany({
      where: {
        schoolId: user.schoolId,
        classId: query.classId ? BigInt(query.classId) : undefined,
        studentId: query.studentId ? BigInt(query.studentId) : undefined,
      },
      include: {
        reward: true,
        student: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const filteredRows =
      ['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)
        ? rows
        : rows.filter((row) => this.authService.canAccessClass(user, row.classId));

    return {
      code: 0,
      message: 'ok',
      data: filteredRows.map((row) => ({
        ...row,
        id: toNumber(row.id),
        schoolId: toNumber(row.schoolId),
        classId: toNumber(row.classId),
        studentId: toNumber(row.studentId),
        rewardId: toNumber(row.rewardId),
        operatorId: toNumber(row.operatorId),
        reward: {
          ...this.serializeReward(row.reward),
        },
        student: {
          id: toNumber(row.student.id),
          classId: toNumber(row.student.classId),
          name: row.student.name,
          studentNo: row.student.studentNo,
        },
      })),
    };
  }

  async createOrder(authorization: string | undefined, body: RewardOrderCreateDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.authService.ensureCanAccessClass(user, body.classId);

    if (body.sourceTerminal === 'display' && user.roleCode !== 'homeroom_teacher') {
      throw new ForbiddenException('展示端兑换仅允许班主任执行');
    }
    if (body.sourceTerminal === 'display') {
      await this.authService.ensureIsHomeroomOfClass(user, body.classId);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.findFirst({
        where: {
          id: BigInt(body.studentId),
          classId: BigInt(body.classId),
          deletedAt: null,
          status: 'enabled',
        },
      });
      if (!student) {
        throw new NotFoundException('学生不存在');
      }

      const reward = await tx.reward.findFirst({
        where: {
          id: BigInt(body.rewardId),
          schoolId: user.schoolId,
          status: 'enabled',
        },
      });
      if (!reward) {
        throw new NotFoundException('奖励不存在');
      }
      if (reward.scopeType === 'class' && reward.classId !== BigInt(body.classId)) {
        throw new ForbiddenException('该奖励不属于当前班级');
      }

      const profile = await tx.studentProfile.findUnique({
        where: { studentId: BigInt(body.studentId) },
      });
      if (!profile || profile.currentScore < reward.scoreCost) {
        throw new ForbiddenException('学生积分不足，无法兑换');
      }

      if (!reward.isInfiniteStock && reward.stockQty !== null && reward.stockQty <= 0) {
        throw new ForbiddenException('奖励库存不足');
      }

      await tx.studentProfile.update({
        where: { studentId: BigInt(body.studentId) },
        data: {
          currentScore: { decrement: reward.scoreCost },
          rewardsCount: { increment: 1 },
        },
      });

      if (!reward.isInfiniteStock && reward.stockQty !== null) {
        const stockUpdated = await tx.reward.updateMany({
          where: {
            id: reward.id,
            stockQty: { gt: 0 },
          },
          data: { stockQty: { decrement: 1 } },
        });
        if (stockUpdated.count === 0) {
          throw new ForbiddenException('奖励库存不足');
        }
      }

      const order = await tx.rewardOrder.create({
        data: {
          schoolId: user.schoolId,
          classId: BigInt(body.classId),
          studentId: BigInt(body.studentId),
          rewardId: reward.id,
          scoreCost: reward.scoreCost,
          status: 'received',
          sourceTerminal: body.sourceTerminal,
          operatorId: user.id,
          operatorRole: user.roleCode,
        },
      });

      return {
        orderId: toNumber(order.id),
        rewardId: toNumber(reward.id),
        studentId: toNumber(student.id),
        scoreCost: reward.scoreCost,
        status: order.status,
      };
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: body.sourceTerminal,
      module: 'reward_order',
      action: 'create',
      targetType: 'student',
      targetId: BigInt(body.studentId),
      detail: {
        classId: body.classId,
        rewardId: body.rewardId,
        scoreCost: result.scoreCost,
      },
    });

    this.realtimeService.emitRewardOrderCreated(body.classId, {
      classId: body.classId,
      studentId: body.studentId,
      rewardId: body.rewardId,
      scoreCost: result.scoreCost,
      operatorName: user.name,
      sourceTerminal: body.sourceTerminal,
    });

    return { code: 0, message: 'ok', data: result };
  }

  private serializeReward(
    row: Reward & {
      _count?: { rewardOrders: number };
      createdByUser?: { id: bigint; name: string } | null;
    },
  ) {
    return {
      id: toNumber(row.id),
      schoolId: toNumber(row.schoolId),
      classId: row.classId ? toNumber(row.classId) : null,
      scopeType: row.scopeType,
      code: row.code,
      name: row.name,
      category: row.category ?? '',
      imageUrl: row.imageUrl,
      scoreCost: row.scoreCost,
      stockQty: row.stockQty,
      isInfiniteStock: row.isInfiniteStock,
      status: row.status,
      rewardOrderCount: row._count?.rewardOrders ?? 0,
      createdBy: row.createdBy ? toNumber(row.createdBy) : null,
      createdByName: row.createdByUser?.name ?? null,
      sourceLabel: row.scopeType === 'class' ? '班级奖励' : '学校奖励',
    };
  }

  private validateRewardPayload(body: RewardUpsertDto, scopeType: 'global' | 'class', current?: Reward) {
    const name = body.name?.trim();
    if (!name) {
      throw new BadRequestException('奖励名称不能为空');
    }
    if (body.scoreCost < 0) {
      throw new BadRequestException('奖励分值不能小于 0');
    }

    const isInfiniteStock = body.isInfiniteStock ?? current?.isInfiniteStock ?? false;
    if (scopeType === 'class' && !isInfiniteStock && body.stockQty === undefined && current?.stockQty === undefined) {
      throw new BadRequestException('有限库存的班级奖励必须填写库存数量');
    }
    if (!isInfiniteStock && body.stockQty !== undefined && body.stockQty < 0) {
      throw new BadRequestException('库存数量不能小于 0');
    }
  }

  private resolveRewardStockQty(scopeType: 'global' | 'class', body: RewardUpsertDto, current?: Reward) {
    const isInfiniteStock = body.isInfiniteStock ?? current?.isInfiniteStock ?? false;
    if (isInfiniteStock) {
      return null;
    }
    if (body.stockQty !== undefined) {
      return body.stockQty;
    }
    if (scopeType === 'class' && current?.stockQty === undefined) {
      throw new BadRequestException('有限库存的班级奖励必须填写库存数量');
    }
    return current?.stockQty ?? null;
  }

  private resolveRewardCategory(scopeType: 'global' | 'class', body: RewardUpsertDto, current?: Reward) {
    if (scopeType === 'class') {
      return 'class_custom';
    }
    if (body.category !== undefined) {
      return body.category.trim() || null;
    }
    return current?.category ?? null;
  }

  private resolveRewardCode(scopeType: 'global' | 'class', body: RewardUpsertDto, user: AuthUser) {
    const explicitCode = body.code?.trim();
    if (explicitCode) {
      return explicitCode;
    }
    const prefix = scopeType === 'class' ? `reward-class-${body.classId ?? 'x'}` : `reward-school-${toNumber(user.schoolId)}`;
    return `${prefix}-${Date.now()}`;
  }

  private resolveUpdatedRewardCode(current: Reward, body: RewardUpsertDto) {
    const explicitCode = body.code?.trim();
    if (explicitCode) {
      return explicitCode;
    }
    return current.code;
  }

  private ensureCanEditReward(user: AuthUser, reward: Reward) {
    if (this.canManageGlobalRewards(user.roleCode)) {
      if (reward.classId) {
        this.authService.ensureCanAccessClass(user, reward.classId);
      }
      return;
    }

    this.ensureCanManageClassRewards(user.roleCode);
    if (reward.scopeType !== 'class') {
      throw new ForbiddenException('当前角色无权维护学校奖励');
    }
    if (!reward.classId) {
      throw new ForbiddenException('班级奖励缺少班级信息');
    }
    this.authService.ensureCanAccessClass(user, reward.classId);
    if (reward.createdBy !== user.id) {
      throw new ForbiddenException('只能维护自己创建的班级奖励');
    }
  }

  private canManageGlobalRewards(roleCode: string) {
    return ['super_admin', 'school_admin', 'moral_admin'].includes(roleCode);
  }

  private ensureCanManageGlobalRewards(roleCode: string) {
    if (!this.canManageGlobalRewards(roleCode)) {
      throw new ForbiddenException('当前角色无权维护学校奖励');
    }
  }

  private ensureCanManageClassRewards(roleCode: string) {
    if (!['super_admin', 'school_admin', 'moral_admin', 'homeroom_teacher', 'subject_teacher'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权维护班级奖励');
    }
  }
}
