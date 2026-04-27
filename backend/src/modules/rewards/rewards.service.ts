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

@Injectable()
export class RewardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async list(authorization: string | undefined, query: Record<string, string>) {
    const includeDisabled = query.includeDisabled === 'true';
    if (includeDisabled) {
      const user = await this.authService.getAuthUserFromAuthorization(authorization);
      this.ensureCanManageRewards(user.roleCode);
      return this.prisma.reward.findMany({
        where: {
          schoolId: user.schoolId,
          category: query.category || undefined,
        },
        include: {
          _count: {
            select: {
              rewardOrders: true,
            },
          },
        },
        orderBy: [{ scoreCost: 'asc' }, { createdAt: 'desc' }],
      }).then((rows) => ({
        code: 0,
        message: 'ok',
        data: rows.map((row) => ({
          id: toNumber(row.id),
          schoolId: toNumber(row.schoolId),
          code: row.code,
          name: row.name,
          category: row.category,
          imageUrl: row.imageUrl,
          scoreCost: row.scoreCost,
          stockQty: row.stockQty,
          isInfiniteStock: row.isInfiniteStock,
          status: row.status,
          rewardOrderCount: row._count.rewardOrders,
        })),
      }));
    }

    return this.prisma.reward.findMany({
      where: {
        status: 'enabled',
        category: query.category || undefined,
      },
      include: {
        _count: {
          select: {
            rewardOrders: true,
          },
        },
      },
      orderBy: [{ scoreCost: 'asc' }, { createdAt: 'desc' }],
    }).then((rows) => ({
      code: 0,
      message: 'ok',
      data: rows.map((row) => ({
        id: toNumber(row.id),
        schoolId: toNumber(row.schoolId),
        code: row.code,
        name: row.name,
        category: row.category,
        imageUrl: row.imageUrl,
        scoreCost: row.scoreCost,
        stockQty: row.stockQty,
        isInfiniteStock: row.isInfiniteStock,
        status: row.status,
        rewardOrderCount: row._count.rewardOrders,
      })),
    }));
  }

  async create(authorization: string | undefined, body: RewardUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageRewards(user.roleCode);

    const created = await this.prisma.reward.create({
      data: {
        schoolId: user.schoolId,
        code: body.code,
        name: body.name,
        category: body.category,
        imageUrl: body.imageUrl,
        scoreCost: body.scoreCost,
        stockQty: body.stockQty,
        isInfiniteStock: body.isInfiniteStock ?? false,
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
        code: body.code,
        name: body.name,
        scoreCost: body.scoreCost,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(created.id) } };
  }

  async update(authorization: string | undefined, id: number, body: RewardUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageRewards(user.roleCode);

    const exists = await this.prisma.reward.findFirst({
      where: { id: BigInt(id), schoolId: user.schoolId, status: 'enabled' },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('奖励不存在');
    }

    const updated = await this.prisma.reward.update({
      where: { id: BigInt(id) },
      data: {
        code: body.code,
        name: body.name,
        category: body.category,
        imageUrl: body.imageUrl,
        scoreCost: body.scoreCost,
        stockQty: body.stockQty,
        isInfiniteStock: body.isInfiniteStock ?? false,
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
        code: body.code,
        name: body.name,
        scoreCost: body.scoreCost,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(updated.id) } };
  }

  async uploadRewardAsset(
    authorization: string | undefined,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageRewards(user.roleCode);

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
    this.ensureCanManageRewards(user.roleCode);

    const reward = await this.prisma.reward.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
      },
    });
    if (!reward) {
      throw new NotFoundException('奖励不存在');
    }

    const updated = await this.prisma.reward.update({
      where: { id: BigInt(id) },
      data: { status },
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
    this.ensureCanManageRewards(user.roleCode);

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
          ...row.reward,
          id: toNumber(row.reward.id),
          schoolId: toNumber(row.reward.schoolId),
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
        await tx.reward.update({
          where: { id: reward.id },
          data: { stockQty: { decrement: 1 } },
        });
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

  private ensureCanManageRewards(roleCode: string) {
    if (!['super_admin', 'school_admin', 'moral_admin'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权维护奖励');
    }
  }
}
