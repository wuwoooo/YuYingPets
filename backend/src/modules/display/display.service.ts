import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { toNumber } from '@/common/utils/bigint.util';
import { DisplayUnlockDto } from './dto/display-unlock.dto';
import { RealtimeService } from '../realtime/realtime.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { DisplayLockDto } from './dto/display-lock.dto';
import { DisplayTerminalInitializeDto } from './dto/display-terminal-initialize.dto';
import { getChinaPeriodStartLimit } from '@/common/utils/date.util';
import { DisplayWeatherQueryDto } from './dto/display-weather-query.dto';
import { normalizePetGrowthThresholds, resolveStageNeedScoreTotal } from '@/common/utils/pet-growth.util';
import { filterSemestersBySchoolYear } from '@/common/utils/school-year.util';
import { AiService } from '../ai/ai.service';

type DisplayWeatherPayload = {
  label: string;
  title: string;
  icon: string;
  temperatureC: number | null;
  temperatureText: string;
  conditionText: string;
  provider: string;
  observedAt: string | null;
  isStale: boolean;
};

type CachedDisplayWeather = {
  expiresAt: number;
  data: DisplayWeatherPayload;
};

type ResolvedWeatherLocation = {
  label: string;
  latitude: number;
  longitude: number;
};

const PET_CATEGORY_PRIORITY: Record<string, number> = {
  star: 0,
  zodiac: 1,
};
function normalizePetCategory(category: string | null | undefined): string {
  return (category ?? '').trim().toLowerCase();
}

function comparePetCatalogOrder(
  left: { category: string | null; code: string },
  right: { category: string | null; code: string },
): number {
  const leftPriority = PET_CATEGORY_PRIORITY[normalizePetCategory(left.category)] ?? 99;
  const rightPriority = PET_CATEGORY_PRIORITY[normalizePetCategory(right.category)] ?? 99;
  if (leftPriority !== rightPriority) return leftPriority - rightPriority;
  return left.code.localeCompare(right.code, 'en', { numeric: true });
}

@Injectable()
export class DisplayService {
  private readonly weatherCache = new Map<string, CachedDisplayWeather>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly realtimeService: RealtimeService,
    private readonly operationLogService: OperationLogService,
    private readonly aiService: AiService,
  ) {}

  private async ensureDisplayClassAccess(authorization: string | undefined, classId: number) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.authService.ensureCanAccessClass(user, classId);
    return user;
  }

  async terminalState(terminalCode: string) {
    const terminal = await this.prisma.displayTerminal.findFirst({
      where: {
        terminalCode,
        status: 'enabled',
      },
      include: {
        classroom: {
          include: {
            homeroomTeacher: true,
          },
        },
      },
    });

    return {
      code: 0,
      message: 'ok',
      data: terminal
        ? {
            terminalCode: terminal.terminalCode,
            terminalName: terminal.terminalName,
            isInitialized: Boolean(terminal.classId),
            initializedAt: terminal.initializedAt,
            lastBoundAt: terminal.lastBoundAt,
            classId: terminal.classId ? toNumber(terminal.classId) : null,
            classInfo: terminal.classroom
              ? {
                  id: toNumber(terminal.classroom.id),
                  gradeName: terminal.classroom.gradeName,
                  className: terminal.classroom.name,
                  slogan: terminal.classroom.slogan,
                  homeroomTeacherName: terminal.classroom.homeroomTeacher?.name ?? null,
                  classHonors: await this.listClassHonorBadges(
                    terminal.classroom.schoolId,
                    toNumber(terminal.classroom.id)!,
                    8,
                  ),
                }
              : null,
          }
        : {
            terminalCode,
            terminalName: `育英星宠终端-${terminalCode.slice(-6)}`,
            isInitialized: false,
            initializedAt: null,
            lastBoundAt: null,
            classId: null,
            classInfo: null,
          },
    };
  }

  async terminals(authorization: string | undefined) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!this.authService.canManageAllDisplays(user)) {
      throw new ForbiddenException('当前角色不可查看大屏终端列表');
    }

    const rows = await this.prisma.displayTerminal.findMany({
      where: {
        schoolId: user.schoolId,
        status: 'enabled',
      },
      include: {
        classroom: {
          select: {
            id: true,
            gradeName: true,
            name: true,
            displayStatus: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    const onlineTerminalCodes = await this.realtimeService.resolveDisplayTerminalOnlineCodes(
      rows.map((item) => ({
        terminalCode: item.terminalCode,
        lastOnlineAt: item.lastOnlineAt,
      })),
    );

    return {
      code: 0,
      message: 'ok',
      data: rows.map((row) => ({
        id: toNumber(row.id),
        terminalCode: row.terminalCode,
        terminalName: row.terminalName,
        classId: row.classId ? toNumber(row.classId) : null,
        classInfo: row.classroom
          ? {
              id: toNumber(row.classroom.id),
              gradeName: row.classroom.gradeName,
              className: row.classroom.name,
              displayStatus: row.classroom.displayStatus,
            }
          : null,
        onlineStatus: onlineTerminalCodes.has(row.terminalCode) ? 'online' : 'offline',
        initializedAt: row.initializedAt,
        lastBoundAt: row.lastBoundAt,
        lastOnlineAt: row.lastOnlineAt,
      })),
    };
  }

  async deleteTerminal(authorization: string | undefined, id: number) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!this.authService.canManageAllDisplays(user)) {
      throw new ForbiddenException('当前角色不可删除大屏终端');
    }

    const terminal = await this.prisma.displayTerminal.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
        status: 'enabled',
      },
      include: {
        classroom: {
          select: {
            id: true,
            gradeName: true,
            name: true,
          },
        },
      },
    });

    if (!terminal) {
      throw new NotFoundException('大屏终端不存在');
    }

    await this.prisma.displayTerminal.delete({
      where: { id: BigInt(id) },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'display_terminal',
      action: 'delete',
      targetType: 'display_terminal',
      targetId: BigInt(id),
      detail: {
        terminalCode: terminal.terminalCode,
        terminalName: terminal.terminalName,
        classId: terminal.classId ? toNumber(terminal.classId) : null,
        className: terminal.classroom
          ? `${terminal.classroom.gradeName}${terminal.classroom.name}`
          : null,
      },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        id,
      },
    };
  }

  async classBindings(authorization: string | undefined, terminalCode?: string) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!this.authService.canInitializeDisplayTerminal(user)) {
      throw new ForbiddenException('仅班主任及以上账号可查看班级绑定状态');
    }

    const rows = await this.prisma.displayTerminal.findMany({
      where: {
        schoolId: user.schoolId,
        status: 'enabled',
        classId: { not: null },
      },
      select: {
        classId: true,
        terminalCode: true,
        terminalName: true,
      },
      orderBy: [{ lastBoundAt: 'desc' }, { id: 'desc' }],
    });

    return {
      code: 0,
      message: 'ok',
      data: rows.map((row) => ({
        classId: toNumber(row.classId!),
        terminalCode: row.terminalCode,
        terminalName: row.terminalName,
        isCurrentTerminal: terminalCode ? row.terminalCode === terminalCode : false,
      })),
    };
  }

  async terminalInitialize(
    authorization: string | undefined,
    dto: DisplayTerminalInitializeDto,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!this.authService.canInitializeDisplayTerminal(user)) {
      throw new ForbiddenException('仅班主任及以上账号可绑定展示终端');
    }

    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id: BigInt(dto.classId),
        schoolId: user.schoolId,
        deletedAt: null,
        status: 'enabled',
      },
      include: {
        homeroomTeacher: true,
        classScoreProfile: true,
      },
    });

    if (!classroom) {
      throw new NotFoundException('要绑定的班级不存在');
    }

    if (!this.authService.canManageAllDisplays(user)) {
      await this.authService.ensureIsHomeroomOfClass(user, dto.classId);
    }

    if (!this.authService.canOverrideClassDisplayBinding(user)) {
      const existingBindingCount = await this.prisma.displayTerminal.count({
        where: {
          schoolId: user.schoolId,
          status: 'enabled',
          classId: BigInt(dto.classId),
          terminalCode: { not: dto.terminalCode },
        },
      });

      if (existingBindingCount >= 2) {
        throw new BadRequestException(
          '该班级已绑定 2 个终端，一个班级最多同时绑定两个终端',
        );
      }
    }

    const terminal = await this.prisma.displayTerminal.upsert({
      where: { terminalCode: dto.terminalCode },
      update: {
        schoolId: user.schoolId,
        classId: BigInt(dto.classId),
        terminalName: dto.terminalName,
        initializedBy: user.id,
        initializedAt: new Date(),
        lastBoundAt: new Date(),
        lastOnlineAt: new Date(),
        status: 'enabled',
      },
      create: {
        schoolId: user.schoolId,
        classId: BigInt(dto.classId),
        terminalCode: dto.terminalCode,
        terminalName: dto.terminalName,
        initializedBy: user.id,
        initializedAt: new Date(),
        lastBoundAt: new Date(),
        lastOnlineAt: new Date(),
        status: 'enabled',
      },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'display',
      module: 'display_terminal',
      action: 'initialize',
      targetType: 'class',
      targetId: BigInt(dto.classId),
      detail: {
        terminalCode: dto.terminalCode,
        terminalName: dto.terminalName,
        classId: dto.classId,
      },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        terminalId: toNumber(terminal.id),
        terminalCode: terminal.terminalCode,
        terminalName: terminal.terminalName,
        classId: dto.classId,
        classInfo: {
          id: toNumber(classroom.id),
          gradeName: classroom.gradeName,
          className: classroom.name,
          slogan: classroom.slogan,
          homeroomTeacherName: classroom.homeroomTeacher?.name ?? null,
        },
      },
    };
  }

  async unlock(authorization: string | undefined, dto: DisplayUnlockDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!this.authService.canOperateDisplay(user)) {
      throw new ForbiddenException('当前角色不可解锁展示端操作模式');
    }
    this.authService.ensureCanAccessClass(user, dto.classId);

    const unlockMinutes = Number(this.configService.get('DISPLAY_UNLOCK_MINUTES', '15'));
    const expiresAt = new Date(Date.now() + unlockMinutes * 60 * 1000);

    const session = await this.prisma.displayUnlockSession.create({
      data: {
        classId: BigInt(dto.classId),
        displayTerminalCode: dto.displayTerminalCode,
        userId: user.id,
        roleCode: user.roleCode,
        unlockedAt: new Date(),
        expiredAt: expiresAt,
        status: 'active',
      },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'display',
      module: 'display',
      action: 'unlock',
      targetType: 'class',
      targetId: BigInt(dto.classId),
      detail: {
        classId: dto.classId,
        displayTerminalCode: dto.displayTerminalCode,
        expiredAt: expiresAt.toISOString(),
      },
    });

    this.realtimeService.emitDisplayUnlocked(dto.classId, dto.displayTerminalCode, {
      classId: dto.classId,
      displayTerminalCode: dto.displayTerminalCode,
      unlockedBy: user.name,
      roleCode: user.roleCode,
      expiredAt: expiresAt.toISOString(),
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        classId: dto.classId,
        displayTerminalCode: dto.displayTerminalCode,
        unlockSessionId: toNumber(session.id),
        expiredAt: expiresAt.toISOString(),
      },
    };
  }

  async unlockRenew(authorization: string | undefined, dto: DisplayUnlockDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!this.authService.canOperateDisplay(user)) {
      throw new ForbiddenException('当前角色不可续期展示端操作模式');
    }
    this.authService.ensureCanAccessClass(user, dto.classId);

    const latestSession = await this.prisma.displayUnlockSession.findFirst({
      where: {
        classId: BigInt(dto.classId),
        displayTerminalCode: dto.displayTerminalCode,
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    if (!latestSession || latestSession.status !== 'active' || latestSession.expiredAt <= now) {
      return {
        code: 0,
        message: 'ok',
        data: {
          classId: dto.classId,
          displayTerminalCode: dto.displayTerminalCode,
          status: latestSession ? 'expired' : 'locked',
          unlockSessionId: latestSession ? toNumber(latestSession.id) : null,
          expiredAt: latestSession?.expiredAt ?? null,
        },
      };
    }

    const unlockMinutes = Number(this.configService.get('DISPLAY_UNLOCK_MINUTES', '15'));
    const expiresAt = new Date(Date.now() + unlockMinutes * 60 * 1000);
    const renewed = await this.prisma.displayUnlockSession.update({
      where: { id: latestSession.id },
      data: {
        expiredAt: expiresAt,
      },
    });

    this.realtimeService.emitDisplayUnlocked(dto.classId, dto.displayTerminalCode, {
      classId: dto.classId,
      displayTerminalCode: dto.displayTerminalCode,
      unlockSessionId: toNumber(renewed.id),
      renewedBy: user.name,
      roleCode: user.roleCode,
      expiredAt: expiresAt.toISOString(),
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        classId: dto.classId,
        displayTerminalCode: dto.displayTerminalCode,
        status: 'active',
        unlockSessionId: toNumber(renewed.id),
        expiredAt: expiresAt.toISOString(),
      },
    };
  }

  async unlockStatus(authorization: string | undefined, classId: number, displayTerminalCode: string) {
    await this.ensureDisplayClassAccess(authorization, classId);
    const session = await this.prisma.displayUnlockSession.findFirst({
      where: {
        classId: BigInt(classId),
        displayTerminalCode,
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const status =
      !session ? 'locked' : session.status === 'active' && session.expiredAt > now ? 'active' : 'expired';

    return {
      code: 0,
      message: 'ok',
      data: {
        classId,
        displayTerminalCode,
        status,
        unlockSessionId: session ? toNumber(session.id) : null,
        expiredAt: session?.expiredAt ?? null,
      },
    };
  }

  async lock(authorization: string | undefined, dto: DisplayLockDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!this.authService.canOperateDisplay(user)) {
      throw new ForbiddenException('当前角色不可锁定展示端操作模式');
    }
    this.authService.ensureCanAccessClass(user, dto.classId);

    const updated = await this.prisma.displayUnlockSession.updateMany({
      where: {
        classId: BigInt(dto.classId),
        displayTerminalCode: dto.displayTerminalCode,
        status: 'active',
      },
      data: {
        status: 'locked',
        expiredAt: new Date(),
      },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'display',
      module: 'display',
      action: 'lock',
      targetType: 'class',
      targetId: BigInt(dto.classId),
      detail: {
        classId: dto.classId,
        displayTerminalCode: dto.displayTerminalCode,
        updatedCount: updated.count,
      },
    });

    this.realtimeService.emitDisplayUnlocked(dto.classId, dto.displayTerminalCode, {
      classId: dto.classId,
      displayTerminalCode: dto.displayTerminalCode,
      status: 'locked',
      updatedCount: updated.count,
    });

    return { code: 0, message: 'ok', data: { updatedCount: updated.count } };
  }

  async entryConfig(classId?: number) {
    const row = await this.prisma.displayConfig.findFirst({
      where: {
        classId: classId ? BigInt(classId) : null,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      code: 0,
      message: 'ok',
      data: row
        ? {
            id: toNumber(row.id),
            schoolId: toNumber(row.schoolId),
            classId: toNumber(row.classId),
            bgImageUrl: row.bgImageUrl,
            title: row.title,
            subtitle: row.subtitle,
            animationSpeed: row.animationSpeed,
            allowSkipAnimation: row.allowSkipAnimation,
            defaultMode: row.defaultMode,
          }
        : null,
    };
  }

  async weather(query: DisplayWeatherQueryDto) {
    const location = await this.resolveWeatherLocation(query);
    const cacheKey = this.buildWeatherCacheKey(location);
    const now = Date.now();
    const cached = this.weatherCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return {
        code: 0,
        message: 'ok',
        data: cached.data,
      };
    }

    const providerErrors: string[] = [];
    const fresh =
      (await this.fetchWeatherFromQWeather(location).catch((error: unknown) => {
        providerErrors.push(this.toWeatherErrorMessage('qweather', error));
        return null;
      })) ??
      (await this.fetchWeatherFromOpenMeteo(location).catch((error: unknown) => {
        providerErrors.push(this.toWeatherErrorMessage('open-meteo', error));
        return null;
      }));

    if (fresh) {
      const ttlMinutes = Number(this.configService.get('DISPLAY_WEATHER_CACHE_MINUTES', '10'));
      this.weatherCache.set(cacheKey, {
        expiresAt: now + Math.max(1, ttlMinutes) * 60 * 1000,
        data: fresh,
      });
      return {
        code: 0,
        message: 'ok',
        data: fresh,
      };
    }

    if (cached) {
      return {
        code: 0,
        message: 'ok',
        data: {
          ...cached.data,
          isStale: true,
          title: `${cached.data.title}（缓存）`,
        },
      };
    }

    const label = location.label;
    return {
      code: 0,
      message: 'ok',
      data: {
        label,
        title:
          providerErrors.length > 0
            ? `天气接口暂时不可用：${providerErrors.join('；')}`
            : '天气接口暂时不可用',
        icon: 'fa-cloud',
        temperatureC: null,
        temperatureText: '--°C',
        conditionText: '天气暂不可用',
        provider: 'unavailable',
        observedAt: null,
        isStale: false,
      } satisfies DisplayWeatherPayload,
    };
  }

  async home(authorization: string | undefined, classId: number) {
    await this.ensureDisplayClassAccess(authorization, classId);
    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id: BigInt(classId),
        deletedAt: null,
        status: 'enabled',
      },
      include: {
        students: {
          where: { deletedAt: null, status: 'enabled' },
          include: {
            profile: true,
            studentPet: {
              include: {
                pet: true,
              },
            },
          },
        },
        homeroomTeacher: true,
        classScoreProfile: true,
      },
    });

    if (!classroom) {
      throw new NotFoundException('班级不存在');
    }

    const topStudents = [...classroom.students]
      .sort((a, b) => (b.profile?.currentScore ?? 0) - (a.profile?.currentScore ?? 0))
      .slice(0, 5);

    return {
      code: 0,
      message: 'ok',
      data: {
        classId,
        className: classroom.name,
        gradeName: classroom.gradeName,
        slogan: classroom.slogan,
        targetScore: classroom.targetScore,
        countdown:
          classroom.countdownTitle && classroom.countdownDeadlineAt
            ? {
                title: classroom.countdownTitle,
                deadlineAt: classroom.countdownDeadlineAt,
              }
            : null,
        homeroomTeacher: classroom.homeroomTeacher
          ? {
              id: toNumber(classroom.homeroomTeacher.id),
              name: classroom.homeroomTeacher.name,
            }
          : null,
        studentCount: classroom.students.length,
        scoreSummary: {
          currentScoreTotal: classroom.students.reduce(
            (sum, item) => sum + (item.profile?.currentScore ?? 0),
            0,
          ),
          totalScoreTotal: classroom.students.reduce(
            (sum, item) => sum + (item.profile?.totalScore ?? 0),
            0,
          ),
          classScore: classroom.classScoreProfile?.currentScore ?? 0,
          classTotalScore: classroom.classScoreProfile?.totalScore ?? 0,
        },
        topStudents: topStudents.map((student) => ({
          id: toNumber(student.id),
          name: student.name,
          avatarUrl: student.avatarUrl,
          currentScore: student.profile?.currentScore ?? 0,
          currentPetLevel: student.profile?.currentPetLevel ?? 1,
          petName: student.studentPet?.pet.name ?? null,
        })),
        recentHonors: await this.listRecentHonorRecords(classroom.schoolId, classId, 8),
        classHonors: await this.listClassHonorBadges(classroom.schoolId, classId, 8),
      },
    };
  }

  async honorRecords(authorization: string | undefined, classId: number, query: Record<string, string>) {
    await this.ensureDisplayClassAccess(authorization, classId);
    const studentId = query.studentId ? Number(query.studentId) : undefined;
    const targetType =
      query.targetType === 'student' || query.targetType === 'class' ? query.targetType : undefined;
    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id: BigInt(classId),
        deletedAt: null,
        status: 'enabled',
      },
      select: { schoolId: true },
    });
    if (!classroom) {
      throw new NotFoundException('班级不存在');
    }

    const rows = await this.prisma.honorRecord.findMany({
      where: {
        schoolId: classroom.schoolId,
        classId: BigInt(classId),
        targetType,
        studentId: studentId ? BigInt(studentId) : undefined,
      },
      include: {
        honor: true,
        student: true,
        grantedByUser: true,
      },
      orderBy: { grantedAt: 'desc' },
      take: studentId ? 20 : 12,
    });

    return {
      code: 0,
      message: 'ok',
      data: rows.map((row) => this.mapHonorRecordRow(row)),
    };
  }

  private async listRecentHonorRecords(schoolId: bigint, classId: number, take: number) {
    const rows = await this.prisma.honorRecord.findMany({
      where: {
        schoolId,
        classId: BigInt(classId),
      },
      include: {
        honor: true,
        student: true,
        grantedByUser: true,
      },
      orderBy: { grantedAt: 'desc' },
      take,
    });
    return rows.map((row) => this.mapHonorRecordRow(row));
  }

  /** 班级集体荣誉：按 honorId 去重，保留最近颁发记录 */
  private async listClassHonorBadges(schoolId: bigint, classId: number, take: number) {
    const rows = await this.prisma.honorRecord.findMany({
      where: {
        schoolId,
        classId: BigInt(classId),
        targetType: 'class',
      },
      include: {
        honor: true,
        student: true,
        grantedByUser: true,
      },
      orderBy: { grantedAt: 'desc' },
      take: Math.max(take * 4, 24),
    });

    const seen = new Set<number>();
    const badges = [];
    for (const row of rows) {
      const honorId = toNumber(row.honorId);
      if (honorId == null || seen.has(honorId)) {
        continue;
      }
      seen.add(honorId);
      badges.push(this.mapHonorRecordRow(row));
      if (badges.length >= take) {
        break;
      }
    }
    return badges;
  }

  private mapHonorRecordRow(row: {
    id: bigint;
    honorId: bigint;
    targetType: string;
    targetId: bigint;
    classId: bigint;
    studentId: bigint | null;
    grantedAt: Date;
    remark: string | null;
    honor: { name: string; iconUrl: string | null };
    student: { name: string } | null;
    grantedByUser: { name: string } | null;
  }) {
    return {
      id: toNumber(row.id),
      honorId: toNumber(row.honorId),
      honorName: row.honor.name,
      honorIconUrl: row.honor.iconUrl,
      targetType: row.targetType,
      targetId: toNumber(row.targetId),
      classId: toNumber(row.classId),
      studentId: row.studentId ? toNumber(row.studentId) : null,
      studentName: row.student?.name ?? null,
      grantedAt: row.grantedAt,
      remark: row.remark,
      grantedByName: row.grantedByUser?.name ?? null,
    };
  }

  private async resolveWeatherLocation(query: DisplayWeatherQueryDto): Promise<ResolvedWeatherLocation> {
    if (
      typeof query.latitude === 'number' &&
      Number.isFinite(query.latitude) &&
      typeof query.longitude === 'number' &&
      Number.isFinite(query.longitude)
    ) {
      return {
        label: query.label?.trim() || this.configService.get<string>('DISPLAY_WEATHER_LABEL', '大理'),
        latitude: query.latitude,
        longitude: query.longitude,
      };
    }

    const displayConfig = await this.prisma.displayConfig.findFirst({
      where: { classId: null },
      orderBy: { updatedAt: 'desc' },
      select: {
        weatherLabel: true,
        weatherLatitude: true,
        weatherLongitude: true,
      },
    });

    return {
      label: query.label?.trim() || displayConfig?.weatherLabel || this.configService.get<string>('DISPLAY_WEATHER_LABEL', '大理'),
      latitude:
        displayConfig?.weatherLatitude !== null && displayConfig?.weatherLatitude !== undefined
          ? Number(displayConfig.weatherLatitude)
          : Number(this.configService.get('DISPLAY_WEATHER_LATITUDE', '25.6065')),
      longitude:
        displayConfig?.weatherLongitude !== null && displayConfig?.weatherLongitude !== undefined
          ? Number(displayConfig.weatherLongitude)
          : Number(this.configService.get('DISPLAY_WEATHER_LONGITUDE', '100.2676')),
    };
  }

  private buildWeatherCacheKey(location: ResolvedWeatherLocation) {
    return `${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}:${location.label}`;
  }

  private toWeatherErrorMessage(provider: string, error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    return `${provider} ${message}`;
  }

  private async fetchWeatherFromQWeather(
    query: ResolvedWeatherLocation,
  ): Promise<DisplayWeatherPayload | null> {
    const apiKey = this.configService.get<string>('QWEATHER_API_KEY')?.trim();
    if (!apiKey) {
      return null;
    }

    const apiHost = this.configService.get<string>('QWEATHER_API_HOST')?.trim() || 'https://devapi.qweather.com';
    const url = new URL('/v7/weather/now', apiHost);
    url.searchParams.set('location', `${query.longitude},${query.latitude}`);
    url.searchParams.set('lang', 'zh');

    const response = await fetch(url, {
      headers: {
        'X-QW-Api-Key': apiKey,
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) {
      throw new Error(`接口返回 ${response.status}`);
    }
    const payload = (await response.json()) as {
      code?: string;
      now?: {
        temp?: string;
        text?: string;
        icon?: string;
        obsTime?: string;
      };
    };
    if (payload.code !== '200' || !payload.now) {
      throw new Error(`业务返回 ${payload.code ?? 'unknown'}`);
    }

    const temperatureC = this.parseTemperature(payload.now.temp);
    const conditionText = payload.now.text?.trim() || '天气未知';
    return this.createWeatherPayload({
      label: query.label,
      temperatureC,
      conditionText,
      icon: this.resolveQWeatherIcon(payload.now.icon),
      provider: 'qweather',
      observedAt: payload.now.obsTime ?? null,
    });
  }

  private async fetchWeatherFromOpenMeteo(
    query: ResolvedWeatherLocation,
  ): Promise<DisplayWeatherPayload> {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(query.latitude));
    url.searchParams.set('longitude', String(query.longitude));
    url.searchParams.set('current', 'temperature_2m,weather_code,is_day');
    url.searchParams.set('timezone', 'auto');

    const response = await fetch(url, {
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) {
      throw new Error(`接口返回 ${response.status}`);
    }

    const payload = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        is_day?: number;
        time?: string;
      };
    };
    const current = payload.current;
    if (!current) {
      throw new Error('缺少 current 数据');
    }

    const presentation = this.getOpenMeteoPresentation(current.weather_code, Number(current.is_day) === 1);
    const temperatureC = Number.isFinite(current.temperature_2m) ? Number(current.temperature_2m) : null;

    return this.createWeatherPayload({
      label: query.label,
      temperatureC,
      conditionText: presentation.text,
      icon: presentation.icon,
      provider: 'open-meteo',
      observedAt: current.time ?? null,
    });
  }

  private createWeatherPayload(input: {
    label?: string;
    temperatureC: number | null;
    conditionText: string;
    icon: string;
    provider: string;
    observedAt: string | null;
  }): DisplayWeatherPayload {
    const label = input.label?.trim() || '当前城市';
    const temperatureText =
      input.temperatureC === null || Number.isNaN(input.temperatureC)
        ? '--°C'
        : `${Math.round(input.temperatureC)}°C`;

    return {
      label,
      title: `今日天气：${temperatureText} ${input.conditionText}`,
      icon: input.icon,
      temperatureC: input.temperatureC,
      temperatureText,
      conditionText: input.conditionText,
      provider: input.provider,
      observedAt: input.observedAt,
      isStale: false,
    };
  }

  private parseTemperature(value?: string) {
    const temperature = Number(value);
    return Number.isFinite(temperature) ? temperature : null;
  }

  private resolveQWeatherIcon(iconCode?: string) {
    const code = Number(iconCode);
    if ([100, 150].includes(code)) return code === 150 ? 'fa-moon' : 'fa-sun';
    if ([101, 102, 103, 151, 152, 153].includes(code)) {
      return code >= 151 ? 'fa-cloud-moon' : 'fa-cloud-sun';
    }
    if ([104, 154].includes(code)) return 'fa-cloud';
    if ([300, 301, 305, 306, 307, 308, 309, 310, 311, 312, 313].includes(code)) {
      return 'fa-cloud-rain';
    }
    if ([302, 303, 304].includes(code)) return 'fa-cloud-bolt';
    if ([400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410].includes(code)) {
      return 'fa-snowflake';
    }
    if ([500, 501, 509, 510, 514, 515].includes(code)) return 'fa-smog';
    return 'fa-cloud';
  }

  private getOpenMeteoPresentation(code?: number, isDay = true) {
    const item = {
      0: { text: '晴', dayIcon: 'fa-sun', nightIcon: 'fa-moon' },
      1: { text: '大部晴朗', dayIcon: 'fa-cloud-sun', nightIcon: 'fa-cloud-moon' },
      2: { text: '局部多云', dayIcon: 'fa-cloud-sun', nightIcon: 'fa-cloud-moon' },
      3: { text: '阴', dayIcon: 'fa-cloud', nightIcon: 'fa-cloud' },
      45: { text: '有雾', dayIcon: 'fa-smog', nightIcon: 'fa-smog' },
      48: { text: '雾凇', dayIcon: 'fa-smog', nightIcon: 'fa-smog' },
      51: { text: '毛毛雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
      53: { text: '小雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
      55: { text: '中雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
      56: { text: '冻毛毛雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
      57: { text: '冻雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
      61: { text: '小雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
      63: { text: '中雨', dayIcon: 'fa-cloud-showers-heavy', nightIcon: 'fa-cloud-showers-heavy' },
      65: { text: '大雨', dayIcon: 'fa-cloud-showers-heavy', nightIcon: 'fa-cloud-showers-heavy' },
      66: { text: '冻雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
      67: { text: '强冻雨', dayIcon: 'fa-cloud-showers-heavy', nightIcon: 'fa-cloud-showers-heavy' },
      71: { text: '小雪', dayIcon: 'fa-snowflake', nightIcon: 'fa-snowflake' },
      73: { text: '中雪', dayIcon: 'fa-snowflake', nightIcon: 'fa-snowflake' },
      75: { text: '大雪', dayIcon: 'fa-snowflake', nightIcon: 'fa-snowflake' },
      77: { text: '冰粒', dayIcon: 'fa-snowflake', nightIcon: 'fa-snowflake' },
      80: { text: '阵雨', dayIcon: 'fa-cloud-sun-rain', nightIcon: 'fa-cloud-moon-rain' },
      81: { text: '较强阵雨', dayIcon: 'fa-cloud-sun-rain', nightIcon: 'fa-cloud-moon-rain' },
      82: { text: '强阵雨', dayIcon: 'fa-cloud-showers-heavy', nightIcon: 'fa-cloud-showers-heavy' },
      85: { text: '阵雪', dayIcon: 'fa-snowflake', nightIcon: 'fa-snowflake' },
      86: { text: '强阵雪', dayIcon: 'fa-snowflake', nightIcon: 'fa-snowflake' },
      95: { text: '雷阵雨', dayIcon: 'fa-cloud-bolt', nightIcon: 'fa-cloud-bolt' },
      96: { text: '雷雨夹冰雹', dayIcon: 'fa-cloud-bolt', nightIcon: 'fa-cloud-bolt' },
      99: { text: '强雷雨冰雹', dayIcon: 'fa-cloud-bolt', nightIcon: 'fa-cloud-bolt' },
    }[Number(code)] || { text: '天气未知', dayIcon: 'fa-cloud', nightIcon: 'fa-cloud' };

    return {
      text: item.text,
      icon: isDay ? item.dayIcon : item.nightIcon,
    };
  }

  async leaderboard(authorization: string | undefined, classId: number, type: string) {
    await this.ensureDisplayClassAccess(authorization, classId);
    const students = await this.prisma.student.findMany({
      where: {
        classId: BigInt(classId),
        deletedAt: null,
        status: 'enabled',
      },
      include: {
        profile: true,
        studentPet: {
          include: {
            pet: {
              include: {
                stages: {
                  orderBy: { stageNo: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    const leaderboardType =
      type === 'pet-level' ? 'pet-level' : type === 'honor' ? 'honor' : 'score';
    const metric =
      leaderboardType === 'pet-level'
        ? (item: (typeof students)[number]) => item.profile?.currentPetLevel ?? 1
        : leaderboardType === 'honor'
          ? (item: (typeof students)[number]) => item.profile?.honorsCount ?? 0
          : (item: (typeof students)[number]) => item.profile?.currentScore ?? 0;

    const rows = [...students]
      .sort((a, b) => metric(b) - metric(a))
      .map((student, index) => {
        const studentPet = student.studentPet;
        const petImageUrl = studentPet
          ? (studentPet.pet.stages.find((stage) => stage.stageNo === studentPet.currentStageNo)?.imageUrl ??
            studentPet.pet.coverUrl ??
            null)
          : null;

        return {
          rank: index + 1,
          id: toNumber(student.id),
          name: student.name,
          avatarUrl: student.avatarUrl,
          currentScore: student.profile?.currentScore ?? 0,
          currentPetLevel: student.profile?.currentPetLevel ?? 1,
          honorsCount: student.profile?.honorsCount ?? 0,
          petName: studentPet?.pet.name ?? null,
          petNickname: studentPet?.nickname ?? null,
          petImageUrl,
          hasPet: Boolean(studentPet),
        };
      });

    return { code: 0, message: 'ok', data: { classId, type: leaderboardType, rows } };
  }

  async roster(authorization: string | undefined, classId: number) {
    await this.ensureDisplayClassAccess(authorization, classId);
    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id: BigInt(classId),
        deletedAt: null,
        status: 'enabled',
      },
      select: { id: true },
    });
    if (!classroom) {
      throw new NotFoundException('班级不存在');
    }

    const [students, groups] = await Promise.all([
      this.prisma.student.findMany({
        where: {
          classId: BigInt(classId),
          deletedAt: null,
          status: 'enabled',
        },
        include: {
          profile: true,
          groupRel: {
            include: {
              classGroup: true,
            },
          },
          studentPet: {
            include: {
              pet: {
                include: {
                  stages: {
                    orderBy: { stageNo: 'asc' },
                  },
                },
              },
              decorations: {
                where: { isEquipped: true },
                include: { decoration: true },
              },
            },
          },
        },
        orderBy: [{ studentNo: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.classGroup.findMany({
        where: { classId: BigInt(classId), status: 'enabled' },
        select: { id: true, groupNo: true, name: true },
        orderBy: [{ groupNo: 'asc' }, { id: 'asc' }],
      }),
    ]);

    return {
      code: 0,
      message: 'ok',
      data: {
        classId,
        groups: groups.map((group) => ({
          id: toNumber(group.id),
          groupNo: group.groupNo,
          name: group.name,
        })),
        students: students.map((student) => {
          const studentPet = student.studentPet;
          const petImageUrl = studentPet
            ? (studentPet.pet.stages.find((stage) => stage.stageNo === studentPet.currentStageNo)?.imageUrl ??
              studentPet.pet.coverUrl ??
              null)
            : null;

          const equippedDecorations = studentPet
            ? studentPet.decorations
                .filter((d) => d.isEquipped)
                .map((d) => ({
                  type: d.decoration.type,
                  code: d.decoration.code,
                  imageUrl: d.decoration.imageUrl,
                  previewUrl: d.decoration.previewUrl,
                  name: d.decoration.name,
                }))
            : [];

          return {
            id: toNumber(student.id),
            name: student.name,
            studentNo: student.studentNo,
            avatarUrl: student.avatarUrl,
            currentScore: student.profile?.currentScore ?? 0,
            totalScore: student.profile?.totalScore ?? 0,
            currentPetLevel: student.profile?.currentPetLevel ?? 1,
            honorsCount: student.profile?.honorsCount ?? 0,
            groupNo: student.groupRel?.classGroup?.groupNo ?? null,
            groupName: student.groupRel?.classGroup?.name ?? null,
            pet: studentPet
              ? {
                  id: toNumber(studentPet.pet.id),
                  studentPetId: toNumber(studentPet.id),
                  petId: toNumber(studentPet.id),
                  name: studentPet.pet.name,
                  nickname: studentPet.nickname ?? null,
                  lastRenameAt: studentPet.lastRenameAt ?? null,
                  coverUrl: studentPet.pet.coverUrl,
                  currentImageUrl: petImageUrl,
                  currentLevel: studentPet.currentLevel,
                  currentStageName:
                    studentPet.pet.stages.find((stage) => stage.stageNo === studentPet.currentStageNo)?.name ??
                    null,
                  totalScore: studentPet.totalScore,
                  equippedDecorations,
                }
              : null,
          };
        }),
      },
    };
  }

  async classScoreRanking(authorization: string | undefined, classId: number) {
    await this.ensureDisplayClassAccess(authorization, classId);
    const currentClass = await this.prisma.classroom.findFirst({
      where: {
        id: BigInt(classId),
        deletedAt: null,
        status: 'enabled',
      },
      select: {
        schoolId: true,
        gradeCode: true,
        gradeName: true,
      },
    });
    if (!currentClass) {
      throw new NotFoundException('班级不存在');
    }

    const classrooms = await this.prisma.classroom.findMany({
      where: {
        schoolId: currentClass.schoolId,
        gradeCode: currentClass.gradeCode,
        deletedAt: null,
        status: 'enabled',
      },
      include: {
        classScoreProfile: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    const sortedRows = classrooms.sort((left, right) => {
      const scoreDiff = (right.classScoreProfile?.currentScore ?? 0) - (left.classScoreProfile?.currentScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (left.sortOrder ?? 999999) - (right.sortOrder ?? 999999) || Number(left.id - right.id);
    });

    let lastScore: number | null = null;
    let currentRank = 0;

    const rows = sortedRows.map((row, index) => {
      const currentScore = row.classScoreProfile?.currentScore ?? 0;
      if (lastScore === null || currentScore !== lastScore) {
        currentRank = index + 1;
        lastScore = currentScore;
      }
      return {
        rank: currentRank,
        classId: toNumber(row.id),
        className: row.name,
        gradeCode: row.gradeCode,
        gradeName: row.gradeName,
        currentScore,
        totalScore: row.classScoreProfile?.totalScore ?? 0,
        lastScoreAt: row.classScoreProfile?.lastScoreAt ?? null,
        isCurrentClass: row.id === BigInt(classId),
      };
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        classId,
        gradeCode: currentClass.gradeCode,
        gradeName: currentClass.gradeName,
        rows,
      },
    };
  }

  async academicGrowth(authorization: string | undefined, classId: number, selectedExamId?: number) {
    await this.ensureDisplayClassAccess(authorization, classId);
    const currentClass = await this.prisma.classroom.findFirst({
      where: {
        id: BigInt(classId),
        deletedAt: null,
        status: 'enabled',
      },
      select: {
        id: true,
        schoolId: true,
        semesterId: true,
        gradeCode: true,
        gradeName: true,
        name: true,
      },
    });
    if (!currentClass) {
      throw new NotFoundException('班级不存在');
    }

    const [schoolSemesters, currentSemester] = await Promise.all([
      this.prisma.semester.findMany({
        where: { schoolId: currentClass.schoolId, status: 'enabled' },
        select: { id: true, name: true, startDate: true },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.semester.findFirst({
        where: { schoolId: currentClass.schoolId, isCurrent: true, status: 'enabled' },
        orderBy: { id: 'desc' },
        select: { id: true, name: true, startDate: true },
      }),
    ]);
    const schoolYearAnchor =
      currentSemester ?? schoolSemesters.find((item) => item.id === currentClass.semesterId) ?? null;
    const schoolYearSemesters = filterSemestersBySchoolYear(schoolSemesters, schoolYearAnchor);
    const schoolYearSemesterIds =
      schoolYearSemesters.length > 0
        ? schoolYearSemesters.map((item) => item.id)
        : [currentClass.semesterId];

    const classrooms = await this.prisma.classroom.findMany({
      where: {
        schoolId: currentClass.schoolId,
        semesterId: currentClass.semesterId,
        gradeCode: currentClass.gradeCode,
        deletedAt: null,
        status: 'enabled',
      },
      select: {
        id: true,
        gradeName: true,
        name: true,
        sortOrder: true,
        students: {
          where: { deletedAt: null, status: 'enabled' },
          select: {
            id: true,
            studentNo: true,
            name: true,
            profile: true,
            groupRel: {
              select: {
                classGroup: {
                  select: {
                    groupNo: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    const classIds = classrooms.map((item) => item.id);

    const exams = await this.prisma.academicExam.findMany({
      where: {
        schoolId: currentClass.schoolId,
        semesterId: { in: schoolYearSemesterIds },
        records: {
          some: {
            classId: currentClass.id,
          },
        },
      },
      include: {
        _count: {
          select: { records: true },
        },
      },
      orderBy: [{ examDate: 'desc' }, { id: 'desc' }],
      take: 30,
    });

    if (exams.length === 0) {
      return {
        code: 0,
        message: 'ok',
        data: {
          classId,
          gradeName: currentClass.gradeName,
          className: currentClass.name,
          hasData: false,
          latestExam: null,
          previousExam: null,
          examOptions: [],
          metrics: {
            academicIndex: 0,
            indexDelta: 0,
            coverageRate: 0,
            averageScore: 0,
            participantCount: 0,
            progressCount: 0,
            declineCount: 0,
            riskCount: 0,
          },
          subjects: [],
          subjectColumns: [],
          classSummaries: [],
          studentRows: [],
          trend: [],
          progressLeaders: [],
          riskStudents: [],
          insight: '暂无成绩导入数据，导入后将自动生成学业成长大屏。',
        },
      };
    }

    const latestExam = exams[0];
    const currentExam =
      (selectedExamId ? exams.find((item) => toNumber(item.id) === selectedExamId) : null) ?? latestExam;
    const currentExamIndex = exams.findIndex((item) => item.id === currentExam.id);
    const previousExam = exams[currentExamIndex + 1] ?? null;
    const examIds = exams.map((item) => item.id);
    const subjectExamIds = previousExam ? [currentExam.id, previousExam.id] : [currentExam.id];
    const [totalRows, subjectRows] = await Promise.all([
      this.prisma.academicScoreRecord.findMany({
        where: {
          schoolId: currentClass.schoolId,
          semesterId: { in: schoolYearSemesterIds },
          examId: { in: examIds },
          classId: { in: classIds },
          subjectCode: 'total',
        },
        orderBy: [{ exam: { examDate: 'desc' } }, { classId: 'asc' }, { classRank: 'asc' }, { studentNo: 'asc' }],
        take: 5000,
      }),
      this.prisma.academicScoreRecord.findMany({
        where: {
          schoolId: currentClass.schoolId,
          semesterId: { in: schoolYearSemesterIds },
          examId: { in: subjectExamIds },
          classId: { in: classIds },
          subjectCode: { not: 'total' },
        },
        orderBy: [{ classId: 'asc' }, { studentNo: 'asc' }, { subjectCode: 'asc' }],
        take: 8000,
      }),
    ]);

    const latestTotalRows = totalRows.filter((row) => row.examId === currentExam.id && row.score !== null);
    const allStudents = classrooms.flatMap((item) => item.students);
    const currentClassStudents = classrooms.find((item) => item.id === currentClass.id)?.students ?? [];
    const latestClassRows = this.buildRosterScoreRows(latestTotalRows, currentClassStudents);
    const previousByStudent = new Map(
      totalRows
        .filter((row) => previousExam && row.examId === previousExam.id && row.score !== null)
        .map((row) => [row.studentId.toString(), row]),
    );
    const studentById = new Map(allStudents.map((item) => [item.id.toString(), item]));
    const currentClassStudentIdSet = new Set(currentClassStudents.map((student) => student.id.toString()));

    const latestAverage = this.averageNumber(latestClassRows.map((row) => Number(row.score)));
    const progressCount = latestClassRows.filter((row) => (this.resolveAcademicClassRankDelta(row) ?? 0) > 0).length;
    const declineCount = latestClassRows.filter((row) => (this.resolveAcademicClassRankDelta(row) ?? 0) < 0).length;
    const coverageRate = currentClassStudents.length ? Math.round((latestClassRows.length / currentClassStudents.length) * 100) : 0;
    const declineRate = latestClassRows.length ? (declineCount / latestClassRows.length) * 100 : 0;
    const gradeAverage = this.averageNumber(latestTotalRows.map((row) => Number(row.score)));
    const academicIndex = gradeAverage > 0 ? Math.round((latestAverage / gradeAverage) * 1000) / 10 : 0;
    const previousTotalRows = previousExam
      ? totalRows.filter((row) => row.examId === previousExam.id && row.score !== null)
      : [];
    const previousClassRows = previousExam
      ? this.buildRosterScoreRows(previousTotalRows, currentClassStudents)
      : [];
    const previousAverage = this.averageNumber(previousClassRows.map((row) => Number(row.score)));
    const previousGradeAverage = this.averageNumber(previousTotalRows.map((row) => Number(row.score)));
    const previousGrowthIndex = previousGradeAverage > 0 ? Math.round((previousAverage / previousGradeAverage) * 1000) / 10 : 0;
    const indexDelta = previousExam ? Math.round((academicIndex - previousGrowthIndex) * 10) / 10 : 0;

    const latestSubjectRows = subjectRows.filter(
      (row) =>
        row.examId === currentExam.id &&
        row.score !== null &&
        currentClassStudentIdSet.has(row.studentId.toString()),
    );
    const previousSubjectByStudentAndSubject = new Map(
      subjectRows
        .filter(
          (row) =>
            previousExam &&
            row.examId === previousExam.id &&
            row.score !== null &&
            currentClassStudentIdSet.has(row.studentId.toString()),
        )
        .map((row) => [`${row.studentId}:${row.subjectCode}`, row]),
    );
    const latestSubjectByStudentAndSubject = new Map(
      latestSubjectRows.map((row) => [`${row.studentId}:${row.subjectCode}`, row]),
    );
    const subjects = Array.from(
      latestSubjectRows.reduce((map, row) => {
        const current = map.get(row.subjectCode) ?? {
          subjectCode: row.subjectCode,
          subjectName: row.subjectName,
          scores: [] as number[],
          progressCount: 0,
        };
        current.scores.push(Number(row.score));
        const previous = previousSubjectByStudentAndSubject.get(`${row.studentId}:${row.subjectCode}`);
        if (previous && Number(row.score) - Number(previous.score) > 0) {
          current.progressCount += 1;
        }
        map.set(row.subjectCode, current);
        return map;
      }, new Map<string, { subjectCode: string; subjectName: string; scores: number[]; progressCount: number }>())
        .values(),
    ).map((item) => ({
      subjectCode: item.subjectCode,
      subjectName: item.subjectName,
      averageScore: this.averageNumber(item.scores),
      maxScore: item.scores.length ? Math.max(...item.scores) : 0,
      minScore: item.scores.length ? Math.min(...item.scores) : 0,
      progressRate: item.scores.length ? Math.round((item.progressCount / item.scores.length) * 100) : 0,
    }));

    const classSummaries = classrooms
      .map((classroom) => {
        const rows = this.buildRosterScoreRows(latestTotalRows, classroom.students);
        const classProgress = rows.filter((row) => (this.resolveAcademicClassRankDelta(row) ?? 0) > 0).length;
        const classDecline = rows.filter((row) => (this.resolveAcademicClassRankDelta(row) ?? 0) < 0).length;
        const classAverage = this.averageNumber(rows.map((row) => Number(row.score)));
        const classAcademicIndex = gradeAverage > 0 ? Math.round((classAverage / gradeAverage) * 1000) / 10 : 0;
        const classDeclineRate = rows.length ? (classDecline / rows.length) * 100 : 0;
        return {
          classId: toNumber(classroom.id),
          className: classroom.name,
          gradeName: classroom.gradeName,
          averageScore: classAverage,
          participantCount: rows.length,
          progressCount: classProgress,
          declineCount: classDecline,
          academicIndex: classAcademicIndex,
          riskLevel: classDeclineRate >= 35 ? 'high' : classDeclineRate >= 18 ? 'medium' : 'low',
          isCurrentClass: classroom.id === currentClass.id,
        };
      })
      .sort((left, right) => right.academicIndex - left.academicIndex || right.averageScore - left.averageScore);

    const subjectColumns = subjects.slice(0, 8).map((item) => ({ subjectCode: item.subjectCode, subjectName: item.subjectName }));
    const displayClassRankByStudentId = this.buildRosterClassRanks(
      latestClassRows.map((row) => ({ studentId: row.studentId, totalScore: Number(row.score) })),
    );
    const studentRows = latestClassRows
      .map((row) => {
        const student = studentById.get(row.studentId.toString());
        const score = Number(row.score);
        const rankDelta = this.resolveAcademicClassRankDelta(row);
        const subjectScores = subjectColumns.map((subject) => {
          const subjectRow = latestSubjectByStudentAndSubject.get(`${row.studentId}:${subject.subjectCode}`);
          return subjectRow?.score === null || subjectRow?.score === undefined ? null : Number(subjectRow.score);
        });
        return {
          studentId: toNumber(row.studentId),
          studentNo: student?.studentNo ?? row.studentNo,
          studentName: student?.name ?? row.studentName,
          classId: toNumber(currentClass.id),
          className: currentClass.name,
          groupName: student?.groupRel?.classGroup?.name ?? null,
          totalScore: score,
          rankDelta,
          classRank: displayClassRankByStudentId.get(row.studentId.toString()) ?? null,
          schoolRank: row.schoolRank,
          behaviorScore: student?.profile?.currentScore ?? 0,
          subjectScores,
        };
      })
      .sort((left, right) => (left.classRank ?? 99999) - (right.classRank ?? 99999) || right.totalScore - left.totalScore);

    const signalRows = latestClassRows.map((row) => {
      const student = studentById.get(row.studentId.toString());
      const score = Number(row.score);
      const rankDelta = this.resolveAcademicClassRankDelta(row);
      return {
        studentId: toNumber(row.studentId),
        studentName: student?.name ?? row.studentName,
        classId: toNumber(currentClass.id),
        className: currentClass.name,
        totalScore: score,
        rankDelta,
        classRank: displayClassRankByStudentId.get(row.studentId.toString()) ?? null,
        schoolRank: row.schoolRank,
        behaviorScore: student?.profile?.currentScore ?? 0,
      };
    });
    const progressLeaders = signalRows
      .filter((item) => (item.rankDelta ?? 0) > 0)
      .sort((left, right) => (right.rankDelta ?? 0) - (left.rankDelta ?? 0) || right.totalScore - left.totalScore)
      .slice(0, 12);
    const riskStudents = signalRows
      .filter((item) => (item.rankDelta ?? 0) < 0)
      .sort((left, right) => (left.rankDelta ?? 0) - (right.rankDelta ?? 0) || left.totalScore - right.totalScore)
      .slice(0, 12);

    const trend = exams
      .map((exam) => {
        const rows = this.buildRosterScoreRows(
          totalRows.filter((row) => row.examId === exam.id && row.score !== null),
          currentClassStudents,
        );
        const gradeRows = totalRows.filter((row) => row.examId === exam.id && row.score !== null);
        const classAverage = this.averageNumber(rows.map((row) => Number(row.score)));
        const gradeAverageForExam = this.averageNumber(gradeRows.map((row) => Number(row.score)));
        return {
          examId: toNumber(exam.id),
          examName: exam.name,
          examDate: exam.examDate,
          periodLabel: exam.periodLabel,
          importedAt: exam.importedAt,
          averageScore: classAverage,
          gradeAverage: gradeAverageForExam,
          relativeIndex: gradeAverageForExam > 0 ? Math.round((classAverage / gradeAverageForExam) * 1000) / 10 : 0,
          participantCount: rows.length,
        };
      })
      .reverse();

    const currentClassSummary = classSummaries.find((item) => item.classId === classId) ?? classSummaries[0] ?? null;
    const gradeBaselineIndex = gradeAverage > 0 ? 100 : 0;

    return {
      code: 0,
      message: 'ok',
      data: {
        classId,
        gradeName: currentClass.gradeName,
        className: currentClass.name,
        hasData: latestClassRows.length > 0,
        latestExam: {
          id: toNumber(currentExam.id),
          name: currentExam.name,
          gradeName: currentExam.gradeName,
          examDate: currentExam.examDate,
          periodLabel: currentExam.periodLabel,
          importedAt: currentExam.importedAt,
          recordCount: currentExam._count.records,
        },
        previousExam: previousExam
          ? {
              id: toNumber(previousExam.id),
              name: previousExam.name,
              gradeName: previousExam.gradeName,
              examDate: previousExam.examDate,
              periodLabel: previousExam.periodLabel,
              importedAt: previousExam.importedAt,
              recordCount: previousExam._count.records,
            }
          : null,
        examOptions: exams.map((exam) => ({
          id: toNumber(exam.id),
          name: exam.name,
          gradeName: exam.gradeName,
          examDate: exam.examDate,
          periodLabel: exam.periodLabel,
          importedAt: exam.importedAt,
          recordCount: exam._count.records,
          isLatest: exam.id === latestExam.id,
          isSelected: exam.id === currentExam.id,
        })),
        metrics: {
          academicIndex,
          indexDelta,
          coverageRate,
          averageScore: latestAverage,
          participantCount: latestClassRows.length,
          progressCount,
          declineCount,
          riskCount: riskStudents.length,
          currentClassAcademicIndex: currentClassSummary?.academicIndex ?? 0,
          currentClassAverage: currentClassSummary?.averageScore ?? 0,
          gradeBaselineIndex,
          gradeAverage,
          gradeParticipantCount: latestTotalRows.length,
        },
        subjects,
        subjectColumns,
        classSummaries,
        studentRows,
        trend,
        progressLeaders,
        riskStudents,
        insight: `${currentClass.gradeName}${currentClass.name} · ${currentExam.name} 已覆盖 ${latestClassRows.length}/${currentClassStudents.length} 人，班级学业指数 ${academicIndex}，较上次 ${indexDelta >= 0 ? '+' : ''}${indexDelta}。`,
      },
    };
  }

  async academicAiSummary(
    authorization: string | undefined,
    classId: number,
    studentId: number,
    periodType: 'weekly' | 'monthly' = 'weekly',
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.authService.ensureCanAccessClass(user, classId);
    const student = await this.resolveDisplayAccessibleStudent(classId, studentId);

    const limitDate = getChinaPeriodStartLimit(periodType);

    const snapshot = await this.prisma.aiStudentSnapshot.findFirst({
      where: {
        studentId: student.id,
        periodType,
        createdAt: {
          gte: limitDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      code: 0,
      message: 'ok',
      data: snapshot
        ? {
            id: toNumber(snapshot.id),
            studentId,
            classId,
            periodType: snapshot.periodType,
            snapshotDate: snapshot.snapshotDate,
            generatedAt: snapshot.createdAt,
            positiveSummary: snapshot.positiveSummary,
            negativeSummary: snapshot.negativeSummary,
            dimensionSummary: snapshot.dimensionSummary,
            trendSummary: snapshot.trendSummary,
            aiSummary: snapshot.aiSummary,
            aiSuggestion: snapshot.aiSuggestion,
          }
        : null,
    };
  }

  async academicAiGenerate(
    authorization: string | undefined,
    classId: number,
    studentId: number,
    periodType: 'weekly' | 'monthly' = 'weekly',
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!this.authService.canOperateDisplay(user)) {
      throw new ForbiddenException('当前角色不可生成展示端学情摘要');
    }
    this.authService.ensureCanAccessClass(user, classId);
    await this.resolveDisplayAccessibleStudent(classId, studentId);
    return this.aiService.generate(authorization, studentId, periodType);
  }

  async petCatalog() {
    const [school, pets] = await Promise.all([
      this.prisma.school.findFirst({
        where: { status: 'enabled' },
        orderBy: { id: 'asc' },
        select: { petGrowthThresholds: true },
      }),
      this.prisma.pet.findMany({
        where: {
          status: 'enabled',
          category: { in: ['star', 'zodiac'] },
        },
        include: {
          stages: {
            orderBy: { stageNo: 'asc' },
          },
        },
      }),
    ]);
    const petGrowthThresholds = normalizePetGrowthThresholds(school?.petGrowthThresholds);
    const sortedPets = [...pets].sort(comparePetCatalogOrder);

    return {
      code: 0,
      message: 'ok',
      data: sortedPets.map((pet) => ({
        id: toNumber(pet.id),
        code: pet.code,
        name: pet.name,
        category: pet.category,
        rarity: pet.rarity,
        description: pet.description,
        coverUrl: pet.coverUrl,
        sourceType: pet.sourceType,
        status: pet.status,
        stageCount: pet.stages.length,
        stages: pet.stages.map((stage) => ({
          id: toNumber(stage.id),
          stageNo: stage.stageNo,
          levelNo: stage.levelNo,
          name: stage.name,
          imageUrl: stage.imageUrl,
          needScoreTotal: resolveStageNeedScoreTotal(stage.stageNo, stage.needScoreTotal, petGrowthThresholds),
          animationKey: stage.animationKey,
        })),
      })),
    };
  }

  async rewardCenter(authorization: string | undefined, classId: number) {
    await this.ensureDisplayClassAccess(authorization, classId);
    const rewards = await this.prisma.reward.findMany({
      where: {
        status: 'enabled',
        OR: [{ scopeType: 'global' }, { scopeType: 'class', classId: BigInt(classId) }],
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ scoreCost: 'asc' }, { createdAt: 'desc' }],
    });

    const latestOrders = await this.prisma.rewardOrder.findMany({
      where: { classId: BigInt(classId) },
      include: {
        reward: true,
        student: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        classId,
        rewards: rewards.map((reward) => ({
          id: toNumber(reward.id),
          classId: reward.classId ? toNumber(reward.classId) : null,
          scopeType: reward.scopeType,
          code: reward.code,
          name: reward.name,
          category: reward.category,
          imageUrl: reward.imageUrl,
          scoreCost: reward.scoreCost,
          stockQty: reward.stockQty,
          isInfiniteStock: reward.isInfiniteStock,
          createdBy: reward.createdBy ? toNumber(reward.createdBy) : null,
          createdByName: reward.createdByUser?.name ?? null,
          sourceLabel: reward.scopeType === 'class' ? '班级奖励' : '学校奖励',
        })),
        latestOrders: latestOrders.map((order) => ({
          id: toNumber(order.id),
          studentId: toNumber(order.studentId),
          studentName: order.student.name,
          rewardId: toNumber(order.rewardId),
          rewardName: order.reward.name,
          scoreCost: order.scoreCost,
          status: order.status,
          createdAt: order.createdAt,
        })),
      },
    };
  }

  /** 大屏 AI：当前在班，或在该班有学业成绩记录（调班后仍可查看历史名单中的学情） */
  private async resolveDisplayAccessibleStudent(classId: number, studentId: number) {
    const student = await this.prisma.student.findFirst({
      where: {
        id: BigInt(studentId),
        deletedAt: null,
        status: 'enabled',
      },
      select: {
        id: true,
        classId: true,
      },
    });
    if (!student) {
      throw new NotFoundException('学生不存在或不属于当前大屏班级');
    }

    if (Number(student.classId) === classId) {
      return student;
    }

    const academicRecord = await this.prisma.academicScoreRecord.findFirst({
      where: {
        studentId: student.id,
        classId: BigInt(classId),
      },
      select: { id: true },
    });
    if (!academicRecord) {
      throw new NotFoundException('学生不存在或不属于当前大屏班级');
    }

    return student;
  }

  /** 按当前在班学生的考试总分重算展示班排（同分同名次，与班级积分榜规则一致） */
  private buildRosterClassRanks(rows: Array<{ studentId: bigint; totalScore: number }>) {
    const sorted = [...rows].sort((left, right) => right.totalScore - left.totalScore);
    let lastScore: number | null = null;
    let currentRank = 0;
    const rankByStudentId = new Map<string, number>();
    sorted.forEach((row, index) => {
      if (lastScore === null || row.totalScore !== lastScore) {
        currentRank = index + 1;
        lastScore = row.totalScore;
      }
      rankByStudentId.set(row.studentId.toString(), currentRank);
    });
    return rankByStudentId;
  }

  /** 按当前在班名单聚合成绩：调班后旧班移除、新班纳入 */
  private buildRosterScoreRows<T extends { studentId: bigint; score: unknown }>(
    rows: T[],
    rosterStudents: Array<{ id: bigint }>,
  ): T[] {
    const rowByStudentId = new Map(
      rows
        .filter((row) => row.score !== null && row.score !== undefined)
        .map((row) => [row.studentId.toString(), row]),
    );
    return rosterStudents
      .map((student) => rowByStudentId.get(student.id.toString()))
      .filter((row): row is T => row != null);
  }

  private averageNumber(values: number[]) {
    const finite = values.filter((value) => Number.isFinite(value));
    if (finite.length === 0) return 0;
    return Math.round((finite.reduce((sum, value) => sum + value, 0) / finite.length) * 10) / 10;
  }

  private clampMetric(value: number, min = 0, max = 100) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  private resolveAcademicClassRankDelta(row: { classRankDelta: number | null }) {
    const explicit = row.classRankDelta;
    return typeof explicit === 'number' && Number.isFinite(explicit) ? explicit : null;
  }
}
