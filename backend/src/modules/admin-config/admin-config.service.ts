import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { hashSync } from 'bcryptjs';
import { Prisma, Status } from '@prisma/client';
import { pinyin } from 'pinyin-pro';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { SchoolSettingsUpdateDto } from './dto/school-settings-update.dto';
import { SemesterSettingsUpdateDto } from './dto/semester-settings-update.dto';
import { DisplaySettingsUpdateDto } from './dto/display-settings-update.dto';
import { GradeSettingsUpdateDto } from './dto/grade-settings-update.dto';
import { PetGrowthSettingsUpdateDto } from './dto/pet-growth-settings-update.dto';
import { PermissionUserUpsertDto } from './dto/permission-user-upsert.dto';
import { PermissionUserImportDto, PermissionUserImportRowDto } from './dto/permission-user-import.dto';
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
  academic_admin: {
    summary: '班级教师维护、课表管理、学业数据导入与分析查看',
    permissions: ['班级维护', '教师管理', '课表管理', '学业数据导入', '数据分析查看'],
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

function createTemporaryPassword() {
  return randomBytes(9).toString('base64url');
}

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

const SUBJECT_CODE_BY_LABEL: Record<string, string> = {
  语文: 'chinese',
  数学: 'math',
  英语: 'english',
  物理: 'physics',
  化学: 'chemistry',
  地理: 'geography',
  生物: 'biology',
  历史: 'history',
  政治: 'politics',
  道德与法治: 'politics',
  信息技术: 'computer',
  计算机: 'computer',
  美术: 'art',
  音乐: 'music',
  体育: 'pe',
};

const SCOPE_TYPE_LABELS: Record<string, string> = {
  school: '全校',
  grade: '年级范围',
  class_scope: '班级范围',
  subject_class: '学科班级',
};

function formatUserScopeDisplayName(scope: {
  scopeType: string;
  gradeCode?: string | null;
  subjectCode?: string | null;
  classroom?: { gradeName: string; name: string } | null;
  classId?: bigint | null;
}) {
  if (scope.scopeType === 'subject_class' && scope.classId && scope.subjectCode) {
    const classLabel = scope.classroom
      ? `${scope.classroom.gradeName} ${scope.classroom.name}`
      : `班级${toNumber(scope.classId)}`;
    const subjectLabel = SUBJECT_LABELS[scope.subjectCode] ?? scope.subjectCode;
    return `${classLabel}·${subjectLabel}`;
  }
  if (scope.scopeType === 'school') return '全校';
  if (scope.scopeType === 'class_scope' && scope.classroom) {
    return `${scope.classroom.gradeName} ${scope.classroom.name}`;
  }
  if (scope.scopeType === 'grade' && scope.gradeCode) {
    return scope.gradeCode;
  }
  if (scope.classroom?.name) return `${scope.classroom.gradeName} ${scope.classroom.name}`;
  if (scope.subjectCode) return SUBJECT_LABELS[scope.subjectCode] ?? scope.subjectCode;
  return SCOPE_TYPE_LABELS[scope.scopeType] ?? scope.scopeType;
}

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
    await this.ensureSystemRoles(user.schoolId);

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
          classScoreStudentLinkMultiplier: school.classScoreStudentLinkMultiplier ?? 0,
          petDecoChangeCost: school.petDecoChangeCost ?? 10,
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

    const petDecoChangeCost = Math.trunc(Number(body.petDecoChangeCost));
    if (!Number.isFinite(petDecoChangeCost) || petDecoChangeCost < 0 || petDecoChangeCost > 999) {
      throw new BadRequestException('装扮更换积分消耗必须是 0-999 之间的整数');
    }

    const updated = await this.prisma.school.update({
      where: { id: user.schoolId },
      data: {
        petGrowthThresholds: thresholds,
        classScoreStudentLinkMultiplier: Math.trunc(Number(body.classScoreStudentLinkMultiplier)),
        petDecoChangeCost,
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

  async getDisplaySettings(authorization: string | undefined) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanViewSchoolPresentation(user.roleCode);

    const [displayConfig, currentSemester] = await Promise.all([
      this.prisma.displayConfig.findFirst({
        where: { schoolId: user.schoolId, classId: null },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.semester.findFirst({
        where: { schoolId: user.schoolId, isCurrent: true },
        orderBy: { id: 'desc' },
      }),
    ]);

    return {
      code: 0,
      message: 'ok',
      data: {
        id: displayConfig ? toNumber(displayConfig.id) : null,
        title: displayConfig?.title ?? '育英星宠',
        subtitle: displayConfig?.subtitle ?? '校园荣誉体系下的萌宠成长激励平台',
        bgImageUrl: displayConfig?.bgImageUrl ?? null,
        weatherLabel: displayConfig?.weatherLabel ?? '大理',
        weatherLatitude: displayConfig?.weatherLatitude ? Number(displayConfig.weatherLatitude) : 25.6065,
        weatherLongitude: displayConfig?.weatherLongitude ? Number(displayConfig.weatherLongitude) : 100.2676,
        animationSpeed: displayConfig?.animationSpeed ?? 'normal',
        allowSkipAnimation: displayConfig?.allowSkipAnimation ?? true,
        defaultMode: displayConfig?.defaultMode ?? 'daily',
        currentSemester: currentSemester
          ? {
              id: toNumber(currentSemester.id),
              name: currentSemester.name,
            }
          : null,
      },
    };
  }

  async setPresentationMode(authorization: string | undefined, mode: 'report' | 'daily') {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanViewSchoolPresentation(user.roleCode);

    const existing = await this.prisma.displayConfig.findFirst({
      where: { schoolId: user.schoolId, classId: null },
      select: { id: true },
    });

    const saved = existing
      ? await this.prisma.displayConfig.update({
          where: { id: existing.id },
          data: { defaultMode: mode },
        })
      : await this.prisma.displayConfig.create({
          data: {
            schoolId: user.schoolId,
            title: '育英星宠',
            subtitle: '校园荣誉体系下的萌宠成长激励平台',
            allowSkipAnimation: true,
            animationSpeed: 'normal',
            defaultMode: mode,
          },
        });

    return { code: 0, message: 'ok', data: { id: toNumber(saved.id), defaultMode: mode } };
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
    this.ensureCanViewPermissionDirectory(user.roleCode);
    await this.ensureSystemRoles(user.schoolId);

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
    this.ensureCanViewPermissionDirectory(user.roleCode);
    await this.ensureSystemRoles(user.schoolId);

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
              .map((scope) => formatUserScopeDisplayName(scope))
              .filter(Boolean),
          ),
        );
        const template = rolePermissionTemplate[row.role.code] ?? { summary: '未配置权限摘要', permissions: [] };
        return {
          id: toNumber(row.id),
          name: row.name,
          username: row.username,
          phone: row.phone,
          dutyTags: this.normalizeDutyTags(row.dutyTags),
          roleCode: row.role.code,
          roleName: row.role.name,
          status: row.status,
          lastLoginAt: row.lastLoginAt,
          classIds: Array.from(
            new Set(
              row.scopes
                .filter((scope) => scope.scopeType === 'class_scope' && scope.classId)
                .map((scope) => toNumber(scope.classId))
                .filter((item): item is number => item !== null),
            ),
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
    this.ensureCanManagePermissionUsers(user.roleCode);
    await this.ensureSystemRoles(user.schoolId);
    this.ensureCanManagePermissionUserRole(user.roleCode, body.roleCode);

    const role = await this.findRole(user.schoolId, body.roleCode);
    await this.ensureUsernameAvailable(body.username);
    const temporaryPassword = createTemporaryPassword();

    const created = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          schoolId: user.schoolId,
          roleId: role.id,
          username: body.username,
          passwordHash: hashSync(temporaryPassword, 10),
          passwordChangeRequired: true,
          name: body.name,
          phone: body.phone ?? null,
          dutyTags: body.dutyTags === undefined ? [] : this.normalizeDutyTags(body.dutyTags),
          status: 'enabled',
        },
      });

      await this.replaceUserScopes(tx, user.schoolId, createdUser.id, role.code, body);

      return createdUser;
    });

    await this.logAction(user, 'permission_user', 'create', created.id, body);
    return { code: 0, message: 'ok', data: { id: toNumber(created.id), defaultPassword: temporaryPassword } };
  }

  async updatePermissionUser(authorization: string | undefined, id: number, body: PermissionUserUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManagePermissionUsers(user.roleCode);
    await this.ensureSystemRoles(user.schoolId);
    this.ensureCanManagePermissionUserRole(user.roleCode, body.roleCode);

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
    await this.ensureUsernameAvailable(body.username, BigInt(id));
    const temporaryPassword = body.resetPassword ? createTemporaryPassword() : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: BigInt(id) },
        data: {
          roleId: role.id,
          username: body.username,
          name: body.name,
          phone: body.phone ?? null,
          ...(body.dutyTags === undefined ? {} : { dutyTags: this.normalizeDutyTags(body.dutyTags) }),
          ...(temporaryPassword
            ? { passwordHash: hashSync(temporaryPassword, 10), passwordChangeRequired: true }
            : {}),
        },
      });

      await this.replaceUserScopes(tx, user.schoolId, BigInt(id), role.code, body, {
        preserveSubjectScopesIfMissing: true,
      });
    });

    await this.logAction(user, 'permission_user', 'update', BigInt(id), body);
    return { code: 0, message: 'ok', data: { id, defaultPassword: temporaryPassword } };
  }

  async importPermissionUsers(authorization: string | undefined, body: PermissionUserImportDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManagePermissionUsers(user.roleCode);
    await this.ensureSystemRoles(user.schoolId);

    const rows = (body.rows ?? [])
      .map((row, index) => ({
        sourceIndex: index + 2,
        name: row.name?.trim() ?? '',
        phone: this.normalizePhone(row.phone),
        roles: row.roles?.trim() ?? '',
        teachingClasses: row.teachingClasses?.trim() ?? '',
      }))
      .filter((row) => row.name);

    if (rows.length === 0) {
      throw new BadRequestException('导入文件中没有可识别的教师数据');
    }

    const [roles, classrooms, existingUsers, allUsers] = await Promise.all([
      this.prisma.role.findMany({ where: { schoolId: user.schoolId } }),
      this.prisma.classroom.findMany({
        where: { schoolId: user.schoolId, deletedAt: null },
        orderBy: [{ gradeCode: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.user.findMany({
        where: { schoolId: user.schoolId, deletedAt: null },
        select: { id: true, username: true, phone: true, name: true },
      }),
      this.prisma.user.findMany({
        select: { username: true },
      }),
    ]);
    const roleMap = new Map(roles.map((role) => [role.code, role]));
    const usernameSet = new Set(allUsers.map((item) => item.username.toLowerCase()));
    const seenImportPhones = new Map<string, number>();
    const seenImportNames = new Map<string, number>();
    const results: Array<{
      row: number;
      name: string;
      username: string;
      roleCode: string;
      roleName: string;
      action: 'created' | 'updated' | 'skipped';
      message?: string;
    }> = [];
    const warnings: string[] = [];

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const importDefaultPassword = createTemporaryPassword();

    for (const row of rows) {
      const seenPhoneRow = row.phone ? seenImportPhones.get(row.phone) : undefined;
      if (seenPhoneRow !== undefined) {
        skippedCount += 1;
        results.push({
          row: row.sourceIndex,
          name: row.name,
          username: '',
          roleCode: '',
          roleName: '',
          action: 'skipped',
          message: `手机号与第 ${seenPhoneRow} 行重复`,
        });
        continue;
      }

      const seenNameRow = seenImportNames.get(row.name);
      if (seenNameRow !== undefined) {
        skippedCount += 1;
        results.push({
          row: row.sourceIndex,
          name: row.name,
          username: '',
          roleCode: '',
          roleName: '',
          action: 'skipped',
          message: `姓名与第 ${seenNameRow} 行重复`,
        });
        continue;
      }
      if (row.phone) seenImportPhones.set(row.phone, row.sourceIndex);
      seenImportNames.set(row.name, row.sourceIndex);

      const parsedScopes = this.parseTeachingScopes(row.teachingClasses, classrooms, row.sourceIndex, warnings);
      const parsedHomeroomScopes = this.parseHomeroomScopes(row.roles, classrooms, row.sourceIndex, warnings);
      const roleCode = this.resolveImportRoleCode(row, parsedScopes.subjectScopes.length);
      if (!row.roles?.trim()) {
        warnings.push(
          `第 ${row.sourceIndex} 行「${row.name}」职务角色为空，已默认按任课教师导入；可在后续编辑中补全职务标签。`,
        );
      }
      if (roleCode === 'subject_teacher' && parsedScopes.subjectScopes.length === 0) {
        warnings.push(
          `第 ${row.sourceIndex} 行「${row.name}」未配置有效的任课班级及学科（或未填写任课班级），账号已导入；请稍后在「教师管理」中补全授课范围。`,
        );
      }
      const role = roleMap.get(roleCode);
      if (!role) {
        skippedCount += 1;
        results.push({
          row: row.sourceIndex,
          name: row.name,
          username: '',
          roleCode,
          roleName: roleCode,
          action: 'skipped',
          message: `系统缺少角色 ${roleCode}`,
        });
        continue;
      }
      this.ensureCanManagePermissionUserRole(user.roleCode, roleCode);

      if (roleCode !== 'homeroom_teacher' && roleCode !== 'subject_teacher' && row.roles) {
        warnings.push(`第 ${row.sourceIndex} 行「${row.name}」包含职务「${row.roles}」，已按账号角色「${role.name}」导入；细分职务建议后续作为岗位标签呈现。`);
      }

      const matchedUser = this.findImportExistingUser(row, existingUsers);
      const username = matchedUser
        ? matchedUser.username
        : this.buildUniqueUsername(row.name, usernameSet);
      usernameSet.add(username.toLowerCase());
      const classIds =
        roleCode === 'homeroom_teacher' && parsedHomeroomScopes.classIds.length > 0
          ? parsedHomeroomScopes.classIds
          : parsedScopes.classIds;

      const upsertBody: PermissionUserUpsertDto = {
        name: row.name,
        username,
        roleCode,
        phone: row.phone || undefined,
        dutyTags: this.normalizeDutyTags(row.roles),
        classIds,
        subjectScopes: parsedScopes.subjectScopes,
      };

      await this.prisma.$transaction(async (tx) => {
        if (matchedUser) {
          await tx.user.update({
            where: { id: matchedUser.id },
            data: {
              roleId: role.id,
              name: row.name,
              phone: row.phone || null,
              dutyTags: upsertBody.dutyTags ?? [],
            },
          });
          await this.replaceUserScopes(tx, user.schoolId, matchedUser.id, role.code, upsertBody);
          matchedUser.name = row.name;
          matchedUser.phone = row.phone || null;
          updatedCount += 1;
          results.push({
            row: row.sourceIndex,
            name: row.name,
            username,
            roleCode,
            roleName: role.name,
            action: 'updated',
          });
          return;
        }

        const created = await tx.user.create({
          data: {
            schoolId: user.schoolId,
            roleId: role.id,
            username,
            passwordHash: hashSync(importDefaultPassword, 10),
            passwordChangeRequired: true,
            name: row.name,
            phone: row.phone || null,
            dutyTags: upsertBody.dutyTags ?? [],
            status: 'enabled',
          },
        });
        await this.replaceUserScopes(tx, user.schoolId, created.id, role.code, upsertBody);
        existingUsers.push({
          id: created.id,
          username: created.username,
          phone: created.phone,
          name: created.name,
        });
        createdCount += 1;
        results.push({
          row: row.sourceIndex,
          name: row.name,
          username,
          roleCode,
          roleName: role.name,
          action: 'created',
        });
      });
    }

    const scheduleRelinkResult = await this.reconcileTeacherScheduleBindings(user.schoolId);

    await this.logAction(user, 'permission_user', 'import_teachers', user.id, {
      total: rows.length,
      createdCount,
      updatedCount,
      skippedCount,
      scheduleRelinkResult,
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        total: rows.length,
        createdCount,
        updatedCount,
        skippedCount,
        defaultPassword: createdCount > 0 ? importDefaultPassword : null,
        results,
        warnings,
        scheduleRelinkResult,
      },
    };
  }

  async resetPassword(authorization: string | undefined, id: number) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManagePermissionUsers(user.roleCode);

    const targetUser = await this.prisma.user.findFirst({
      where: { id: BigInt(id), schoolId: user.schoolId, deletedAt: null },
      include: { role: true },
    });
    if (!targetUser) {
      throw new NotFoundException('账号不存在');
    }
    this.ensureCanManagePermissionUserRole(user.roleCode, targetUser.role.code);
    const temporaryPassword = createTemporaryPassword();

    const updated = await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: { passwordHash: hashSync(temporaryPassword, 10), passwordChangeRequired: true },
    });

    await this.logAction(user, 'permission_user', 'reset_password', updated.id, {
      temporaryPasswordIssued: true,
    });
    return { code: 0, message: 'ok', data: { id, defaultPassword: temporaryPassword } };
  }

  async updatePermissionUserStatus(authorization: string | undefined, id: number, status: 'enabled' | 'disabled') {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManagePermissionUsers(user.roleCode);

    if (toNumber(user.id) === id && status === 'disabled') {
      throw new ForbiddenException('不能停用当前登录账号');
    }

    const exists = await this.prisma.user.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
        deletedAt: null,
      },
      include: { role: true },
    });
    if (!exists) {
      throw new NotFoundException('账号不存在');
    }
    this.ensureCanManagePermissionUserRole(user.roleCode, exists.role.code);

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

  private async ensureSystemRoles(schoolId: bigint) {
    const defaults = [
      ['super_admin', '系统管理员'],
      ['school_admin', '学校管理员'],
      ['academic_admin', '教务管理员'],
      ['moral_admin', '德育管理员'],
      ['homeroom_teacher', '班主任'],
      ['subject_teacher', '任课教师'],
    ] as const;
    const existing = await this.prisma.role.findMany({
      where: { schoolId, code: { in: defaults.map(([code]) => code) } },
      select: { code: true },
    });
    const existingCodes = new Set(existing.map((item) => item.code));
    const missing = defaults
      .filter(([code]) => !existingCodes.has(code))
      .map(([code, name]) => ({
        schoolId,
        code,
        name,
        isSystem: true,
      }));

    if (missing.length > 0) {
      await this.prisma.role.createMany({ data: missing });
    }
  }

  private async ensureUsernameAvailable(username: string, excludeUserId?: bigint) {
    const exists = await this.prisma.user.findFirst({
      where: {
        username,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });

    if (exists) {
      throw new BadRequestException(`登录账号重复：${username} 已被占用`);
    }
  }

  private normalizePhone(value: unknown) {
    return String(value ?? '')
      .trim()
      .replace(/\.0$/, '')
      .replace(/[^\d+]/g, '');
  }

  private normalizeDutyTags(value: unknown) {
    const rawItems = Array.isArray(value)
      ? value
      : String(value ?? '').split(/[,，;；、/／|]+/);
    return Array.from(
      new Set(
        rawItems
          .map((item) => String(item).trim())
          .filter(Boolean),
      ),
    );
  }

  private normalizeImportText(value: string) {
    return value
      .trim()
      .replace(/[（]/g, '(')
      .replace(/[）]/g, ')')
      .replace(/\s+/g, '')
      .replace(/班级/g, '班');
  }

  private buildUniqueUsername(name: string, usernameSet: Set<string>) {
    const base =
      pinyin(name, { toneType: 'none', type: 'array' })
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '') || `teacher${Date.now()}`;
    let username = base;
    let suffix = 2;
    while (usernameSet.has(username.toLowerCase())) {
      username = `${base}${suffix}`;
      suffix += 1;
    }
    return username;
  }

  private normalizeTeacherName(value: string) {
    return String(value ?? '').replace(/\s+/g, '').trim();
  }

  private resolveImportRoleCode(row: Pick<PermissionUserImportRowDto, 'roles' | 'teachingClasses'>, subjectScopeCount: number) {
    const roles = row.roles ?? '';
    const rolesTrimmed = roles.trim();
    const teachingText = row.teachingClasses?.trim() ?? '';
    if (roles.includes('班主任')) return 'homeroom_teacher';
    if (roles.includes('校长')) return 'school_admin';
    if (roles.includes('副校长')) return 'school_admin';
    if (roles.includes('学校领导')) return 'school_admin';
    if (roles.includes('领导')) return 'school_admin';
    if (roles.includes('学校管理员')) return 'school_admin';
    if (roles.includes('教务')) return 'academic_admin';
    if (roles.includes('教务处')) return 'academic_admin';
    if (roles.includes('考务')) return 'academic_admin';
    if (roles.includes('考试管理员')) return 'academic_admin';
    if (roles.includes('德育')) return 'moral_admin';
    if (subjectScopeCount > 0 || teachingText.length > 0) return 'subject_teacher';
    // 职务列为空或未填时默认按任课教师导入（可在后台再补全班级与学科）
    if (!rolesTrimmed) return 'subject_teacher';
    if (roles.includes('任课教师')) return 'subject_teacher';
    return 'school_admin';
  }

  private findImportExistingUser(
    row: { name: string; phone: string },
    existingUsers: Array<{ id: bigint; username: string; phone: string | null; name: string }>,
  ) {
    if (row.phone) {
      const byPhone = existingUsers.find((item) => this.normalizePhone(item.phone) === row.phone);
      if (byPhone) return byPhone;
    }
    return existingUsers.find((item) => item.name === row.name) ?? null;
  }

  private async reconcileTeacherScheduleBindings(schoolId: bigint) {
    const activeTeachers = await this.prisma.user.findMany({
      where: {
        schoolId,
        deletedAt: null,
        status: 'enabled',
        role: { code: { in: ['homeroom_teacher', 'subject_teacher'] } },
      },
      select: { id: true, name: true },
    });

    const activeTeacherMap = new Map<string, bigint>();
    const duplicateTeacherNames = new Set<string>();
    for (const teacher of activeTeachers) {
      const normalizedName = this.normalizeTeacherName(teacher.name);
      if (!normalizedName) continue;
      if (activeTeacherMap.has(normalizedName)) {
        duplicateTeacherNames.add(normalizedName);
        activeTeacherMap.delete(normalizedName);
        continue;
      }
      if (!duplicateTeacherNames.has(normalizedName)) {
        activeTeacherMap.set(normalizedName, teacher.id);
      }
    }

    const [legacyTeachers, pendingSlots] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          schoolId,
          deletedAt: { not: null },
        },
        select: { id: true, name: true },
      }),
      this.prisma.pendingTeacherScheduleSlot.findMany({
        where: { schoolId },
      }),
    ]);

    const legacyTeacherRelinks = legacyTeachers
      .map((teacher) => {
        const nextTeacherId = activeTeacherMap.get(this.normalizeTeacherName(teacher.name));
        if (!nextTeacherId) return null;
        return {
          fromTeacherId: teacher.id,
          toTeacherId: nextTeacherId,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    let relinkedScheduleSlotCount = 0;
    if (legacyTeacherRelinks.length > 0) {
      const updateResults = await this.prisma.$transaction(
        legacyTeacherRelinks.map((item) =>
          this.prisma.teacherScheduleSlot.updateMany({
            where: {
              schoolId,
              teacherId: item.fromTeacherId,
            },
            data: {
              teacherId: item.toTeacherId,
            },
          }),
        ),
      );
      relinkedScheduleSlotCount = updateResults.reduce((sum, item) => sum + item.count, 0);
    }

    const matchedPendingSlots = pendingSlots
      .map((slot) => {
        const teacherId = activeTeacherMap.get(this.normalizeTeacherName(slot.teacherName));
        if (!teacherId) return null;
        return {
          pendingId: slot.id,
          row: {
            schoolId,
            teacherId,
            classId: slot.classId,
            weekday: slot.weekday,
            periodNo: slot.periodNo,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: slot.subject,
            className: slot.className,
            sourceFile: slot.sourceFile,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (matchedPendingSlots.length > 0) {
      await this.prisma.$transaction([
        this.prisma.teacherScheduleSlot.createMany({
          data: matchedPendingSlots.map((item) => item.row),
        }),
        this.prisma.pendingTeacherScheduleSlot.deleteMany({
          where: {
            id: { in: matchedPendingSlots.map((item) => item.pendingId) },
          },
        }),
      ]);
    }

    return {
      relinkedScheduleSlotCount,
      linkedPendingSlotCount: matchedPendingSlots.length,
      skippedDuplicateTeacherNameCount: duplicateTeacherNames.size,
    };
  }

  private buildImportClassroomMap(
    classrooms: Array<{ id: bigint; gradeName: string; name: string; code: string }>,
  ) {
    const classMap = new Map<string, { id: bigint; gradeName: string; name: string; code: string }>();

    for (const classroom of classrooms) {
      const normalizedName = this.normalizeImportText(classroom.name);
      const normalizedCode = this.normalizeImportText(classroom.code);
      const keys = [
        `${classroom.gradeName}${classroom.name}`,
        `${classroom.gradeName}${classroom.code}`,
        classroom.name,
        classroom.code,
        normalizedName,
        normalizedCode,
      ]
        .filter(Boolean)
        .map((item) => this.normalizeImportText(item));
      keys.forEach((key) => classMap.set(key, classroom));
    }

    return classMap;
  }

  private parseHomeroomScopes(
    roles: string,
    classrooms: Array<{ id: bigint; gradeName: string; name: string; code: string }>,
    rowIndex: number,
    warnings: string[],
  ) {
    const classMap = this.buildImportClassroomMap(classrooms);
    const classIds = new Set<number>();
    const normalizedRoles = roles
      .replace(/[（]/g, '(')
      .replace(/[）]/g, ')');

    for (const part of this.splitImportList(normalizedRoles)) {
      if (!part.includes('班主任')) continue;
      const matched = part.match(/班主任(?:\(([^)]+)\))?/);
      const rawClassLabel = matched?.[1]?.trim() ?? '';
      if (!rawClassLabel) continue;

      const normalizedClassLabel = this.normalizeImportText(rawClassLabel);
      const candidateKeys = Array.from(
        new Set([
          normalizedClassLabel,
          normalizedClassLabel.endsWith('班') ? normalizedClassLabel : `${normalizedClassLabel}班`,
        ]),
      );
      const classroom = candidateKeys
        .map((key) => classMap.get(key))
        .find(Boolean);

      if (!classroom) {
        warnings.push(`第 ${rowIndex} 行未匹配到班主任班级「${rawClassLabel}」`);
        continue;
      }

      classIds.add(Number(classroom.id));
    }

    return {
      classIds: Array.from(classIds),
    };
  }

  private parseTeachingScopes(
    value: string,
    classrooms: Array<{ id: bigint; gradeName: string; name: string; code: string }>,
    rowIndex: number,
    warnings: string[],
  ) {
    const classIds = new Set<number>();
    const subjectScopeMap = new Map<string, { classId: number; subjectCode: string }>();
    const classMap = this.buildImportClassroomMap(classrooms);

    const parts = this.splitImportList(value);

    for (const part of parts) {
      const normalizedPart = this.normalizeImportText(part);
      const matched = normalizedPart.match(/^(.+?班)(?:\((.+)\))?$/);
      const classLabel = matched?.[1] ?? normalizedPart;
      const subjectText = matched?.[2] ?? '';
      const classroom = classMap.get(classLabel);
      if (!classroom) {
        warnings.push(`第 ${rowIndex} 行未匹配到班级「${part}」`);
        continue;
      }

      const classId = Number(classroom.id);
      classIds.add(classId);
      const subjectLabels = subjectText
        .split(/[,，、/／|]+/)
        .map((item) => item.trim())
        .filter(Boolean);
      for (const subjectLabel of subjectLabels) {
        const subjectCode = SUBJECT_CODE_BY_LABEL[subjectLabel];
        if (!subjectCode) {
          warnings.push(`第 ${rowIndex} 行未识别学科「${subjectLabel}」`);
          continue;
        }
        subjectScopeMap.set(`${classId}:${subjectCode}`, { classId, subjectCode });
      }
    }

    return {
      classIds: Array.from(classIds),
      subjectScopes: Array.from(subjectScopeMap.values()),
    };
  }

  private splitImportList(value: string) {
    const parts: string[] = [];
    let current = '';
    let depth = 0;

    for (const char of value) {
      if (char === '（' || char === '(') {
        depth += 1;
        current += char;
        continue;
      }
      if (char === '）' || char === ')') {
        depth = Math.max(0, depth - 1);
        current += char;
        continue;
      }
      if (depth === 0 && /[,，;；\n]/.test(char)) {
        if (current.trim()) parts.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
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

  private async resolveSubjectScopes(
    tx: Prisma.TransactionClient,
    userId: bigint,
    body: PermissionUserUpsertDto,
    preserveIfMissing = false,
  ) {
    if (preserveIfMissing && body.subjectScopes === undefined) {
      const existingScopes = await tx.userScope.findMany({
        where: {
          userId,
          scopeType: 'subject_class',
          classId: { not: null },
          subjectCode: { not: null },
        },
        select: {
          classId: true,
          subjectCode: true,
        },
      });
      return existingScopes
        .map((item) => {
          const classId = toNumber(item.classId);
          const subjectCode = item.subjectCode?.trim();
          if (!classId || !subjectCode) return null;
          return { classId, subjectCode };
        })
        .filter((item): item is { classId: number; subjectCode: string } => item !== null);
    }

    return this.normalizeSubjectScopes(body);
  }

  private async replaceUserScopes(
    tx: Prisma.TransactionClient,
    schoolId: bigint,
    userId: bigint,
    roleCode: string,
    body: PermissionUserUpsertDto,
    options?: { preserveSubjectScopesIfMissing?: boolean },
  ) {
    const subjectScopes = await this.resolveSubjectScopes(
      tx,
      userId,
      body,
      options?.preserveSubjectScopesIfMissing,
    );

    await tx.userScope.deleteMany({ where: { userId } });
    await tx.teacherClassAssignment.deleteMany({ where: { teacherId: userId } });
    await tx.classroom.updateMany({
      where: { schoolId, homeroomTeacherId: userId },
      data: { homeroomTeacherId: null },
    });

    if (['super_admin', 'school_admin', 'academic_admin', 'moral_admin'].includes(roleCode)) {
      await tx.userScope.create({
        data: {
          userId,
          scopeType: 'school',
        },
      });
      if (subjectScopes.length > 0) {
        await tx.userScope.createMany({
          data: subjectScopes.map((item) => ({
            userId,
            scopeType: 'subject_class',
            classId: BigInt(item.classId),
            subjectCode: item.subjectCode,
          })),
        });
        await this.createSubjectTeacherAssignments(tx, schoolId, userId, subjectScopes);
      }
      return;
    }

    if (roleCode === 'subject_teacher') {
      // 允许任课教师暂时没有授课班级/学科（如批量导入占位），功能界面保存时仍会校验必填。
      if (subjectScopes.length === 0) {
        return;
      }
      await tx.userScope.createMany({
        data: subjectScopes.map((item) => ({
          userId,
          scopeType: 'subject_class',
          classId: BigInt(item.classId),
          subjectCode: item.subjectCode,
        })),
      });
      await this.createSubjectTeacherAssignments(tx, schoolId, userId, subjectScopes);
      return;
    }

    if (body.classIds?.length) {
      const classIds = Array.from(new Set(body.classIds));
      await tx.userScope.createMany({
        data: classIds.map((classId) => ({
          userId,
          scopeType: 'class_scope',
          classId: BigInt(classId),
        })),
      });

      if (roleCode === 'homeroom_teacher') {
        const targetClassIds = classIds.map((classId) => BigInt(classId));
        const replacedHomeroomAssignments = await tx.teacherClassAssignment.findMany({
          where: {
            schoolId,
            classId: { in: targetClassIds },
            roleInClass: 'homeroom',
            teacherId: { not: userId },
          },
          select: { teacherId: true, classId: true },
        });
        await tx.teacherClassAssignment.deleteMany({
          where: {
            schoolId,
            classId: { in: targetClassIds },
            roleInClass: 'homeroom',
            teacherId: { not: userId },
          },
        });
        for (const assignment of replacedHomeroomAssignments) {
          await this.deleteClassScopeIfNoRemainingAssignment(tx, assignment.teacherId, assignment.classId);
        }

        await tx.teacherClassAssignment.createMany({
          data: classIds.map((classId) => ({
            schoolId,
            teacherId: userId,
            classId: BigInt(classId),
            roleInClass: 'homeroom',
            isPrimary: true,
            status: 'enabled',
          })),
        });
        await tx.classroom.updateMany({
          where: { schoolId, id: { in: targetClassIds } },
          data: { homeroomTeacherId: userId },
        });

        if (subjectScopes.length > 0) {
          await tx.userScope.createMany({
            data: subjectScopes.map((item) => ({
              userId,
              scopeType: 'subject_class',
              classId: BigInt(item.classId),
              subjectCode: item.subjectCode,
            })),
          });
          await this.createSubjectTeacherAssignments(tx, schoolId, userId, subjectScopes);
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

  private async createSubjectTeacherAssignments(
    tx: Prisma.TransactionClient,
    schoolId: bigint,
    teacherId: bigint,
    subjectScopes: Array<{ classId: number; subjectCode: string }>,
  ) {
    if (subjectScopes.length === 0) return;
    await tx.teacherClassAssignment.createMany({
      data: subjectScopes.map((item) => ({
        schoolId,
        teacherId,
        classId: BigInt(item.classId),
        roleInClass: 'subject_teacher',
        subjectCode: item.subjectCode,
        isPrimary: false,
        status: 'enabled',
      })),
    });
  }

  private async deleteClassScopeIfNoRemainingAssignment(
    tx: Prisma.TransactionClient,
    teacherId: bigint,
    classId: bigint,
  ) {
    const remainingAssignment = await tx.teacherClassAssignment.findFirst({
      where: {
        teacherId,
        classId,
      },
      select: { id: true },
    });
    if (remainingAssignment) return;

    const subjectScope = await tx.userScope.findFirst({
      where: {
        userId: teacherId,
        classId,
        scopeType: 'subject_class',
      },
      select: { id: true },
    });
    if (subjectScope) return;

    await tx.userScope.deleteMany({
      where: {
        userId: teacherId,
        classId,
        scopeType: 'class_scope',
      },
    });
  }

  private ensureCanManageAdminConfig(roleCode: string) {
    if (!['super_admin', 'school_admin'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权访问管理配置');
    }
  }

  private ensureCanViewSchoolPresentation(roleCode: string) {
    if (!['super_admin', 'school_admin', 'academic_admin', 'moral_admin', 'grade_admin'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权使用汇报展示模式');
    }
  }

  private ensureCanViewPermissionDirectory(roleCode: string) {
    if (!['super_admin', 'school_admin', 'academic_admin'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权查看账号与角色目录');
    }
  }

  private ensureCanManagePermissionUsers(roleCode: string) {
    if (!['super_admin', 'school_admin', 'academic_admin'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权维护教师账号');
    }
  }

  private ensureCanManagePermissionUserRole(roleCode: string, targetRoleCode: string) {
    if (['super_admin', 'school_admin'].includes(roleCode)) {
      return;
    }
    if (roleCode === 'academic_admin' && ['academic_admin', 'homeroom_teacher', 'subject_teacher'].includes(targetRoleCode)) {
      return;
    }
    throw new ForbiddenException('当前角色无权维护该账号角色');
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
