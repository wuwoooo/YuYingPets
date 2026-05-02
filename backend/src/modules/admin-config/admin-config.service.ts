import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { hashSync } from 'bcryptjs';
import { Prisma, Status } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { SchoolSettingsUpdateDto } from './dto/school-settings-update.dto';
import { SemesterSettingsUpdateDto } from './dto/semester-settings-update.dto';
import { DisplaySettingsUpdateDto } from './dto/display-settings-update.dto';
import { GradeSettingsUpdateDto } from './dto/grade-settings-update.dto';
import { PetGrowthSettingsUpdateDto } from './dto/pet-growth-settings-update.dto';
import { PermissionUserUpsertDto } from './dto/permission-user-upsert.dto';
import { toNumber } from '@/common/utils/bigint.util';
import { normalizePetGrowthThresholds } from '@/common/utils/pet-growth.util';

const rolePermissionTemplate: Record<string, { summary: string; permissions: string[] }> = {
  super_admin: {
    summary: '学校配置、终端初始化、权限分配、全局数据查看',
    permissions: ['学校配置', '终端初始化', '权限分配', '全局数据查看'],
  },
  school_admin: {
    summary: '学校运营配置、班级查看、统计分析、教师管理',
    permissions: ['学校运营配置', '班级查看', '统计分析', '教师管理'],
  },
  moral_admin: {
    summary: '规则维护、荣誉配置、奖励中心、数据分析查看',
    permissions: ['规则维护', '荣誉配置', '奖励中心', '数据分析查看'],
  },
  homeroom_teacher: {
    summary: '本班学生管理、积分评价、兑换审核',
    permissions: ['班级与学生管理', '积分评价与记录', '兑换审核', '数据分析查看'],
  },
  subject_teacher: {
    summary: '授课班级评价、积分记录、数据查看',
    permissions: ['积分评价与记录', '数据分析查看', '班级查看'],
  },
};

const SUBJECT_LABELS: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  geography: '地理',
  biology: '生物',
  history: '历史',
  politics: '政治',
  arts_it: '音美信综合',
  computer: '计算机',
  art: '美术',
  music: '音乐',
  pe: '体育',
};

function buildGradeCode(name: string, fallbackIndex: number) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized ? `grade-${normalized}` : `grade-${String(fallbackIndex).padStart(2, '0')}`;
}

@Injectable()
export class AdminConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
  ) {}

  async getSettings(authorization: string | undefined) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageAdminConfig(user.roleCode);

    const [school, semester, displayConfig, displayTerminalCount, roles, rawGradeConfigs] = await Promise.all([
      this.prisma.school.findUniqueOrThrow({ where: { id: user.schoolId } }),
      this.prisma.semester.findFirst({
        where: { schoolId: user.schoolId, isCurrent: true },
        orderBy: { id: 'desc' },
      }),
      this.prisma.displayConfig.findFirst({
        where: { schoolId: user.schoolId, classId: null },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.displayTerminal.count({ where: { schoolId: user.schoolId, status: 'enabled' } }),
      this.prisma.role.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { id: 'asc' },
      }),
      this.prisma.gradeConfig.findMany({
        where: { schoolId: user.schoolId, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
    ]);
    const gradeConfigs = await this.ensureGradeConfigs(user.schoolId, rawGradeConfigs);

    return {
      code: 0,
      message: 'ok',
      data: {
        school: {
          id: toNumber(school.id),
          code: school.code,
          name: school.name,
          englishName: school.englishName,
          motto: school.motto,
          phone: school.phone,
          address: school.address,
          petGrowth: {
            thresholds: normalizePetGrowthThresholds(school.petGrowthThresholds),
          },
        },
        semester: semester
          ? {
              id: toNumber(semester.id),
              name: semester.name,
              startDate: semester.startDate,
              endDate: semester.endDate,
              isCurrent: semester.isCurrent,
              status: semester.status,
            }
          : null,
        display: {
          id: toNumber(displayConfig?.id),
          title: displayConfig?.title ?? '育英星宠',
          subtitle: displayConfig?.subtitle ?? '校园荣誉体系下的萌宠成长激励平台',
          bgImageUrl: displayConfig?.bgImageUrl ?? null,
          weatherLabel: displayConfig?.weatherLabel ?? '大理',
          weatherLatitude: displayConfig?.weatherLatitude ? Number(displayConfig.weatherLatitude) : 25.6065,
          weatherLongitude: displayConfig?.weatherLongitude ? Number(displayConfig.weatherLongitude) : 100.2676,
          animationSpeed: displayConfig?.animationSpeed ?? 'normal',
          allowSkipAnimation: displayConfig?.allowSkipAnimation ?? true,
          defaultMode: displayConfig?.defaultMode ?? 'daily',
          terminalCount: displayTerminalCount,
        },
        gradeConfigs: gradeConfigs.map((item) => ({
          id: toNumber(item.id),
          code: item.code,
          name: item.name,
          sortOrder: item.sortOrder,
          status: item.status,
        })),
        roleTemplates: roles.map((role) => ({
          code: role.code,
          name: role.name,
          summary: rolePermissionTemplate[role.code]?.summary ?? '未配置权限摘要',
          permissions: rolePermissionTemplate[role.code]?.permissions ?? [],
        })),
      },
    };
  }

  async updateSchool(authorization: string | undefined, body: SchoolSettingsUpdateDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageAdminConfig(user.roleCode);

    const updated = await this.prisma.school.update({
      where: { id: user.schoolId },
      data: {
        code: body.code,
        name: body.name,
        englishName: body.englishName,
        motto: body.motto,
        phone: body.phone,
        address: body.address,
      },
    });

    await this.logAction(user, 'school', 'update', updated.id, body);
    return { code: 0, message: 'ok', data: { id: toNumber(updated.id) } };
  }

  async updatePetGrowth(authorization: string | undefined, body: PetGrowthSettingsUpdateDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageAdminConfig(user.roleCode);

    const thresholds = body.thresholds.map((item) => Math.trunc(Number(item)));
    if (thresholds.length !== 10) {
      throw new BadRequestException('成长阈值必须完整配置 10 个等级');
    }

    for (let index = 0; index < thresholds.length; index += 1) {
      if (!Number.isFinite(thresholds[index]) || thresholds[index] < 0) {
        throw new BadRequestException(`第 ${index + 1} 级成长阈值必须是大于等于 0 的整数`);
      }
      if (index > 0 && thresholds[index] < thresholds[index - 1]) {
        throw new BadRequestException(`第 ${index + 1} 级成长阈值不能小于前一级`);
      }
    }

    const updated = await this.prisma.school.update({
      where: { id: user.schoolId },
      data: {
        petGrowthThresholds: thresholds,
      },
    });

    await this.logAction(user, 'school_pet_growth', 'update', updated.id, body);
    return { code: 0, message: 'ok', data: { id: toNumber(updated.id) } };
  }

  async updateSemester(authorization: string | undefined, body: SemesterSettingsUpdateDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageAdminConfig(user.roleCode);

    const updated = await this.prisma.semester.update({
      where: { id: BigInt(body.id) },
      data: {
        name: body.name,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        isCurrent: true,
      },
    });

    await this.prisma.semester.updateMany({
      where: {
        schoolId: user.schoolId,
        id: { not: updated.id },
      },
      data: {
        isCurrent: false,
      },
    });

    await this.logAction(user, 'semester', 'update', updated.id, body);
    return { code: 0, message: 'ok', data: { id: toNumber(updated.id) } };
  }

  async updateDisplay(authorization: string | undefined, body: DisplaySettingsUpdateDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageAdminConfig(user.roleCode);

    const existing = await this.prisma.displayConfig.findFirst({
      where: { schoolId: user.schoolId, classId: null },
      select: { id: true },
    });

    const saved = existing
      ? await this.prisma.displayConfig.update({
          where: { id: existing.id },
          data: {
            title: body.title,
            subtitle: body.subtitle,
            bgImageUrl: body.bgImageUrl,
            weatherLabel: body.weatherLabel,
            weatherLatitude: body.weatherLatitude,
            weatherLongitude: body.weatherLongitude,
            animationSpeed: body.animationSpeed,
            allowSkipAnimation: body.allowSkipAnimation,
            defaultMode: body.defaultMode,
          },
        })
      : await this.prisma.displayConfig.create({
          data: {
            schoolId: user.schoolId,
            title: body.title,
            subtitle: body.subtitle,
            bgImageUrl: body.bgImageUrl,
            weatherLabel: body.weatherLabel,
            weatherLatitude: body.weatherLatitude,
            weatherLongitude: body.weatherLongitude,
            animationSpeed: body.animationSpeed,
            allowSkipAnimation: body.allowSkipAnimation ?? true,
            defaultMode: body.defaultMode,
          },
        });

    await this.logAction(user, 'display_config', 'update', saved.id, body);
    return { code: 0, message: 'ok', data: { id: toNumber(saved.id) } };
  }

  async updateGrades(authorization: string | undefined, body: GradeSettingsUpdateDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageAdminConfig(user.roleCode);

    const rows = body.grades
      .map((item, index) => ({
        id: item.id,
        name: item.name.trim(),
        sortOrder: item.sortOrder ?? index + 1,
        status: (item.status === 'disabled' ? 'disabled' : 'enabled') as Status,
      }))
      .filter((item) => item.name);

    if (rows.length === 0) {
      throw new NotFoundException('请至少保留一个年级');
    }

    const keptIds = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.gradeConfig.findMany({
        where: { schoolId: user.schoolId, deletedAt: null },
        select: { id: true, code: true },
        orderBy: { id: 'asc' },
      });
      const existingMap = new Map(existing.map((item) => [toNumber(item.id), item]));
      const touchedIds: bigint[] = [];

      for (let index = 0; index < rows.length; index += 1) {
        const item = rows[index];
        if (item.id && existingMap.has(item.id)) {
          const updated = await tx.gradeConfig.update({
            where: { id: BigInt(item.id) },
            data: {
              name: item.name,
              sortOrder: item.sortOrder,
              status: item.status,
              deletedAt: null,
            },
            select: { id: true },
          });
          touchedIds.push(updated.id);
          continue;
        }

        const created = await tx.gradeConfig.create({
          data: {
            schoolId: user.schoolId,
            code: buildGradeCode(item.name, index + 1),
            name: item.name,
            sortOrder: item.sortOrder,
            status: item.status,
          },
          select: { id: true },
        });
        touchedIds.push(created.id);
      }

      await tx.gradeConfig.updateMany({
        where: {
          schoolId: user.schoolId,
          deletedAt: null,
          id: { notIn: touchedIds },
        },
        data: {
          status: 'disabled',
          deletedAt: new Date(),
        },
      });

      return touchedIds;
    });

    await this.logAction(user, 'grade_config', 'update', keptIds[0] ?? BigInt(0), body);
    return { code: 0, message: 'ok', data: { count: keptIds.length } };
  }

  async listRoleTemplates(authorization: string | undefined) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageAdminConfig(user.roleCode);

    const roles = await this.prisma.role.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { id: 'asc' },
    });

    return {
      code: 0,
      message: 'ok',
      data: roles.map((role) => ({
        id: toNumber(role.id),
        code: role.code,
        name: role.name,
        summary: rolePermissionTemplate[role.code]?.summary ?? '未配置权限摘要',
        permissions: rolePermissionTemplate[role.code]?.permissions ?? [],
      })),
    };
  }

  async listPermissionUsers(authorization: string | undefined) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageAdminConfig(user.roleCode);

    const rows = await this.prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        deletedAt: null,
      },
      include: {
        role: true,
        scopes: {
          include: {
            classroom: true,
          },
        },
      },
      orderBy: [{ roleId: 'asc' }, { id: 'asc' }],
    });

    return {
      code: 0,
      message: 'ok',
      data: rows.map((row) => {
        const subjectScopes = row.scopes
          .filter((scope) => scope.scopeType === 'subject_class' && scope.classId && scope.subjectCode)
          .map((scope) => ({
            classId: toNumber(scope.classId),
            className: scope.classroom?.name ?? null,
            gradeName: scope.classroom?.gradeName ?? null,
            subjectCode: scope.subjectCode as string,
            subjectLabel: SUBJECT_LABELS[scope.subjectCode as string] ?? (scope.subjectCode as string),
          }))
          .sort(
            (a, b) =>
              `${a.gradeName ?? ''}${a.className ?? ''}${a.subjectLabel}`.localeCompare(
                `${b.gradeName ?? ''}${b.className ?? ''}${b.subjectLabel}`,
                'zh-CN',
              ),
          );
        const scopeNames = Array.from(
          new Set(
            row.scopes
              .map((scope) => {
                if (scope.scopeType === 'subject_class' && scope.classId && scope.subjectCode) {
                  const classLabel = scope.classroom
                    ? `${scope.classroom.gradeName} ${scope.classroom.name}`
                    : `班级${toNumber(scope.classId)}`;
                  const subjectLabel = SUBJECT_LABELS[scope.subjectCode] ?? scope.subjectCode;
                  return `${classLabel}·${subjectLabel}`;
                }
                return scope.classroom?.name ?? scope.gradeCode ?? scope.subjectCode ?? scope.scopeType;
              })
              .filter(Boolean),
          ),
        );
        const template = rolePermissionTemplate[row.role.code] ?? { summary: '未配置权限摘要', permissions: [] };
        return {
          id: toNumber(row.id),
          name: row.name,
          username: row.username,
          phone: row.phone,
          roleCode: row.role.code,
          roleName: row.role.name,
          status: row.status,
          lastLoginAt: row.lastLoginAt,
          classIds: Array.from(
            new Set(row.scopes.map((scope) => toNumber(scope.classId)).filter((item): item is number => item !== null)),
          ),
          subjectScopes,
          scopeDisplay: scopeNames.join('、') || '全校范围',
          permissionSummary: template.summary,
          permissions: template.permissions,
        };
      }),
    };
  }

  async createPermissionUser(authorization: string | undefined, body: PermissionUserUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageAdminConfig(user.roleCode);

    const role = await this.findRole(user.schoolId, body.roleCode);

    const created = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          schoolId: user.schoolId,
          roleId: role.id,
          username: body.username,
          passwordHash: hashSync('123456', 10),
          name: body.name,
          phone: body.phone ?? null,
          status: 'enabled',
        },
      });

      await this.replaceUserScopes(tx, createdUser.id, role.code, body);

      return createdUser;
    });

    await this.logAction(user, 'permission_user', 'create', created.id, body);
    return { code: 0, message: 'ok', data: { id: toNumber(created.id), defaultPassword: '123456' } };
  }

  async updatePermissionUser(authorization: string | undefined, id: number, body: PermissionUserUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageAdminConfig(user.roleCode);

    const exists = await this.prisma.user.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('教师账号不存在');
    }

    const role = await this.findRole(user.schoolId, body.roleCode);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: BigInt(id) },
        data: {
          roleId: role.id,
          username: body.username,
          name: body.name,
          phone: body.phone ?? null,
          ...(body.resetPassword ? { passwordHash: hashSync('123456', 10) } : {}),
        },
      });

      await this.replaceUserScopes(tx, BigInt(id), role.code, body);
    });

    await this.logAction(user, 'permission_user', 'update', BigInt(id), body);
    return { code: 0, message: 'ok', data: { id } };
  }

  async resetPassword(authorization: string | undefined, id: number) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageAdminConfig(user.roleCode);

    const updated = await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: { passwordHash: hashSync('123456', 10) },
    });

    await this.logAction(user, 'permission_user', 'reset_password', updated.id, { defaultPassword: '123456' });
    return { code: 0, message: 'ok', data: { id, defaultPassword: '123456' } };
  }

  async updatePermissionUserStatus(authorization: string | undefined, id: number, status: 'enabled' | 'disabled') {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageAdminConfig(user.roleCode);

    if (toNumber(user.id) === id && status === 'disabled') {
      throw new ForbiddenException('不能停用当前登录账号');
    }

    const exists = await this.prisma.user.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
        deletedAt: null,
      },
      select: { id: true, status: true },
    });
    if (!exists) {
      throw new NotFoundException('账号不存在');
    }

    const updated = await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: { status },
    });

    await this.logAction(user, 'permission_user', 'update_status', updated.id, { status });
    return { code: 0, message: 'ok', data: { id, status } };
  }

  private async ensureGradeConfigs(schoolId: bigint, currentConfigs: Array<{
    id: bigint;
    code: string;
    name: string;
    sortOrder: number | null;
    status: Status;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }>) {
    if (currentConfigs.length > 0) {
      return currentConfigs;
    }

    const classrooms = await this.prisma.classroom.findMany({
      where: { schoolId, deletedAt: null },
      select: { gradeCode: true, gradeName: true },
      orderBy: [{ gradeCode: 'asc' }, { id: 'asc' }],
    });

    const deduped = Array.from(
      new Map(
        classrooms
          .filter((item) => item.gradeName)
          .map((item, index) => [
            item.gradeCode,
            {
              schoolId,
              code: item.gradeCode,
              name: item.gradeName,
              sortOrder: index + 1,
              status: 'enabled' as Status,
            },
          ]),
      ).values(),
    );

    if (deduped.length === 0) {
      return currentConfigs;
    }

    await this.prisma.gradeConfig.createMany({ data: deduped });
    return this.prisma.gradeConfig.findMany({
      where: { schoolId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  private async findRole(schoolId: bigint, roleCode: string) {
    const role = await this.prisma.role.findFirst({
      where: {
        schoolId,
        code: roleCode,
      },
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  private normalizeSubjectScopes(body: PermissionUserUpsertDto) {
    return Array.from(
      new Map(
        (body.subjectScopes ?? [])
          .filter((item) => item.classId && item.subjectCode?.trim())
          .map((item) => [
            `${item.classId}:${item.subjectCode.trim()}`,
            {
              classId: item.classId,
              subjectCode: item.subjectCode.trim(),
            },
          ]),
      ).values(),
    );
  }

  private async replaceUserScopes(
    tx: Prisma.TransactionClient,
    userId: bigint,
    roleCode: string,
    body: PermissionUserUpsertDto,
  ) {
    await tx.userScope.deleteMany({ where: { userId } });

    if (roleCode === 'super_admin') {
      await tx.userScope.create({
        data: {
          userId,
          scopeType: 'school',
        },
      });
      return;
    }

    if (roleCode === 'subject_teacher') {
      const subjectScopes = this.normalizeSubjectScopes(body);
      if (subjectScopes.length === 0) {
        throw new BadRequestException('任课教师至少需要配置一个授课班级和学科');
      }
      await tx.userScope.createMany({
        data: subjectScopes.map((item) => ({
          userId,
          scopeType: 'subject_class',
          classId: BigInt(item.classId),
          subjectCode: item.subjectCode,
        })),
      });
      return;
    }

    if (body.classIds?.length) {
      await tx.userScope.createMany({
        data: Array.from(new Set(body.classIds)).map((classId) => ({
          userId,
          scopeType: 'class_scope',
          classId: BigInt(classId),
        })),
      });

      if (roleCode === 'homeroom_teacher') {
        const subjectScopes = this
          .normalizeSubjectScopes(body)
          .filter((item) => body.classIds?.includes(item.classId));
        if (subjectScopes.length > 0) {
          await tx.userScope.createMany({
            data: subjectScopes.map((item) => ({
              userId,
              scopeType: 'subject_class',
              classId: BigInt(item.classId),
              subjectCode: item.subjectCode,
            })),
          });
        }
      }
      return;
    }

    await tx.userScope.create({
      data: {
        userId,
        scopeType: 'class_scope',
      },
    });
  }

  private ensureCanManageAdminConfig(roleCode: string) {
    if (!['super_admin', 'school_admin', 'moral_admin'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权访问管理配置');
    }
  }

  private async logAction(
    user: Awaited<ReturnType<AuthService['getAuthUserFromAuthorization']>>,
    module: string,
    action: string,
    targetId: bigint,
    detail: unknown,
  ) {
    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module,
      action,
      targetType: module,
      targetId,
      detail: detail as Prisma.InputJsonValue | undefined,
    });
  }
}
