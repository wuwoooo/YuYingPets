import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { AcademicRecordsService } from '../academic-records/academic-records.service';
import { AdminConfigService } from '../admin-config/admin-config.service';
import { AdminInsightsService } from '../admin-insights/admin-insights.service';
import { DisplayService } from '../display/display.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { toNumber } from '@/common/utils/bigint.util';

type ProjectionSnapshotQuery = {
  startDate?: string;
  endDate?: string;
};

const DEFAULT_PROJECTION_SNAPSHOT_TTL_MS = 120_000;
const RECENT_SCORE_RECORD_LIMIT = 100;
const RECENT_HONOR_RECORD_LIMIT = 200;

@Injectable()
export class ProjectionService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly adminInsightsService: AdminInsightsService,
    private readonly academicRecordsService: AcademicRecordsService,
    private readonly adminConfigService: AdminConfigService,
    private readonly displayService: DisplayService,
  ) {}

  async snapshot(authorization: string | undefined, query: ProjectionSnapshotQuery) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (user.terminalType !== 'projection') {
      throw new UnauthorizedException('请使用投屏身份访问投屏快照');
    }

    const cacheKey = [
      'projection:snapshot',
      user.schoolId.toString(),
      query.startDate ?? '',
      query.endDate ?? '',
    ].join(':');
    const cached = await this.cacheManager.get<unknown>(cacheKey);
    if (cached) return cached;

    const auth = authorization;
    const [coreData, analyticsSummary, analyticsHeatmap, academicGrowth, displaySettings, displayTerminals, weatherInfo] =
      await Promise.all([
        this.loadProjectionCoreData(user.schoolId),
        this.unwrap(
          this.adminInsightsService.analyticsSummary(auth, {
            startDate: query.startDate,
            endDate: query.endDate,
            skipHeatmap: true,
            skipDetailSummary: true,
          }),
          null,
        ),
        this.unwrap(
          this.adminInsightsService.analyticsHeatmap(auth, {
            startDate: query.startDate,
            endDate: query.endDate,
            skipDetailSummary: true,
          }),
          null,
        ),
        this.unwrap(this.academicRecordsService.schoolGrowth(auth, { currentSemesterOnly: 'true' }), null),
        this.unwrap(this.adminConfigService.getDisplaySettings(auth), null),
        this.unwrap(this.displayService.terminals(auth), []),
        this.unwrap(this.displayService.weather({}), null),
      ]);

    const analytics = analyticsSummary
      ? {
          ...(analyticsSummary as Record<string, unknown>),
          heatMap: (analyticsHeatmap as { heatMap?: unknown } | null)?.heatMap ?? (analyticsSummary as { heatMap?: unknown }).heatMap,
        }
      : analyticsHeatmap;
    const displaySettingsData = displaySettings as {
      weatherLabel?: string | null;
      currentSemester?: { name?: string | null } | null;
    } | null;

    const response = {
      code: 0,
      message: 'ok',
      data: {
        classes: coreData.classes,
        students: coreData.students,
        rules: coreData.rules,
        honors: coreData.honors,
        rewards: coreData.rewards,
        analytics,
        scoreRecords: coreData.scoreRecords,
        honorRecords: coreData.honorRecords,
        academicGrowth,
        displayTerminals,
        weatherInfo,
        weatherLabel: displaySettingsData?.weatherLabel?.trim() || '大理',
        semesterName: displaySettingsData?.currentSemester?.name ?? null,
      },
    };

    await this.cacheManager.set(cacheKey, response, DEFAULT_PROJECTION_SNAPSHOT_TTL_MS);
    return response;
  }

  private async loadProjectionCoreData(schoolId: bigint) {
    const [classes, students, scoreRecords, rules, honors, rewards, honorRecords] = await Promise.all([
      this.loadProjectionClasses(schoolId),
      this.loadProjectionStudents(schoolId),
      this.loadProjectionScoreRecords(schoolId),
      this.loadProjectionRules(schoolId),
      this.loadProjectionHonors(schoolId),
      this.loadProjectionRewards(schoolId),
      this.loadProjectionHonorRecords(schoolId),
    ]);

    return {
      classes,
      students,
      scoreRecords,
      rules,
      honors,
      rewards,
      honorRecords,
    };
  }

  private async loadProjectionClasses(schoolId: bigint) {
    const rows = await this.prisma.classroom.findMany({
      where: { schoolId, deletedAt: null, status: 'enabled' },
      select: {
        id: true,
        schoolId: true,
        semesterId: true,
        code: true,
        gradeCode: true,
        gradeName: true,
        name: true,
        slogan: true,
        targetScore: true,
        countdownTitle: true,
        countdownDeadlineAt: true,
        sortOrder: true,
        displayStatus: true,
        homeroomTeacher: { select: { id: true, name: true, username: true } },
        students: {
          where: { deletedAt: null, status: 'enabled' },
          select: { id: true },
        },
        studentProfiles: { select: { currentScore: true, totalScore: true } },
        classScoreProfile: { select: { currentScore: true, totalScore: true } },
      },
      orderBy: [{ gradeCode: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });

    return rows.map((row) => ({
      id: toNumber(row.id),
      schoolId: toNumber(row.schoolId),
      semesterId: toNumber(row.semesterId),
      code: row.code,
      gradeCode: row.gradeCode,
      gradeName: row.gradeName,
      name: row.name,
      slogan: row.slogan,
      targetScore: row.targetScore,
      countdownTitle: row.countdownTitle,
      countdownDeadlineAt: row.countdownDeadlineAt,
      sortOrder: row.sortOrder,
      displayStatus: row.displayStatus,
      studentCount: row.students.length,
      currentScoreTotal: row.studentProfiles.reduce((sum, item) => sum + item.currentScore, 0),
      totalScoreTotal: row.studentProfiles.reduce((sum, item) => sum + item.totalScore, 0),
      classScore: row.classScoreProfile?.currentScore ?? 0,
      classTotalScore: row.classScoreProfile?.totalScore ?? 0,
      homeroomTeacher: row.homeroomTeacher
        ? {
            id: toNumber(row.homeroomTeacher.id),
            name: row.homeroomTeacher.name,
            username: row.homeroomTeacher.username,
          }
        : null,
    }));
  }

  private async loadProjectionStudents(schoolId: bigint) {
    const rows = await this.prisma.student.findMany({
      where: { schoolId, deletedAt: null, status: 'enabled' },
      select: {
        id: true,
        schoolId: true,
        classId: true,
        studentNo: true,
        name: true,
        gender: true,
        avatarUrl: true,
        status: true,
        classroom: { select: { name: true } },
        profile: { select: { currentScore: true, totalScore: true, currentPetLevel: true } },
        studentPet: {
          select: {
            id: true,
            nickname: true,
            lastRenameAt: true,
            currentStageNo: true,
            currentLevel: true,
            totalScore: true,
            pet: { select: { id: true, name: true, coverUrl: true } },
          },
        },
      },
      orderBy: [{ classId: 'asc' }, { studentNo: 'asc' }],
    });

    return rows.map((row) => ({
      id: toNumber(row.id),
      schoolId: toNumber(row.schoolId),
      classId: toNumber(row.classId),
      studentNo: row.studentNo,
      name: row.name,
      gender: row.gender,
      avatarUrl: row.avatarUrl,
      status: row.status,
      className: row.classroom.name,
      currentScore: row.profile?.currentScore ?? 0,
      totalScore: row.profile?.totalScore ?? 0,
      currentPetLevel: row.profile?.currentPetLevel ?? 1,
      latestAcademic: null,
      pet: row.studentPet
        ? {
            id: toNumber(row.studentPet.pet.id),
            studentPetId: toNumber(row.studentPet.id),
            petId: toNumber(row.studentPet.pet.id),
            name: row.studentPet.pet.name,
            nickname: row.studentPet.nickname ?? null,
            lastRenameAt: row.studentPet.lastRenameAt ?? null,
            coverUrl: row.studentPet.pet.coverUrl,
            currentStageNo: row.studentPet.currentStageNo,
            currentImageUrl: row.studentPet.pet.coverUrl,
            currentLevel: row.studentPet.currentLevel,
            currentStageName: null,
            totalScore: row.studentPet.totalScore,
            equippedDecorations: [],
          }
        : null,
    }));
  }

  private async loadProjectionScoreRecords(schoolId: bigint) {
    const rows = await this.prisma.scoreRecord.findMany({
      where: { schoolId },
      select: {
        id: true,
        schoolId: true,
        semesterId: true,
        classId: true,
        studentId: true,
        classGroupId: true,
        ruleId: true,
        subjectCode: true,
        sceneCode: true,
        dimension: true,
        tag: true,
        sentiment: true,
        scoreDelta: true,
        remark: true,
        sourceTerminal: true,
        sourceRole: true,
        operatorId: true,
        operatorName: true,
        occurredAt: true,
        createdAt: true,
        reversedAt: true,
        reversedById: true,
        reverseRemark: true,
        rule: { select: { name: true } },
        student: { select: { name: true } },
        classroom: { select: { name: true, gradeName: true } },
        reversedBy: { select: { name: true } },
      },
      orderBy: { occurredAt: 'desc' },
      take: RECENT_SCORE_RECORD_LIMIT,
    });

    return rows.map(({ rule, student, classroom, reversedBy, ...row }) => ({
      ...row,
      id: toNumber(row.id),
      schoolId: toNumber(row.schoolId),
      semesterId: toNumber(row.semesterId),
      classId: toNumber(row.classId),
      studentId: toNumber(row.studentId),
      classGroupId: toNumber(row.classGroupId),
      ruleId: toNumber(row.ruleId),
      operatorId: toNumber(row.operatorId),
      reversedById: toNumber(row.reversedById),
      reversedByName: reversedBy?.name ?? null,
      ruleName: rule?.name ?? null,
      studentName: student?.name ?? null,
      className: classroom ? `${classroom.gradeName}${classroom.name}` : null,
    }));
  }

  private async loadProjectionRules(schoolId: bigint) {
    const rows = await this.prisma.scoreRule.findMany({
      where: { schoolId, status: 'enabled', displayEnabled: true },
      select: {
        id: true,
        schoolId: true,
        semesterId: true,
        moduleType: true,
        subjectCode: true,
        sceneCode: true,
        code: true,
        name: true,
        scoreType: true,
        scoreMode: true,
        scoreTarget: true,
        scoreValue: true,
        minScore: true,
        maxScore: true,
        dimension: true,
        tag: true,
        sentiment: true,
        weight: true,
        aiSummaryText: true,
        description: true,
        allowedRoleCodes: true,
        isHighFrequency: true,
        displayEnabled: true,
        adminEnabled: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ isHighFrequency: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
      take: 240,
    });

    return rows.map((row) => ({
      ...row,
      id: toNumber(row.id),
      schoolId: toNumber(row.schoolId),
      semesterId: toNumber(row.semesterId),
      weight: row.weight === null ? null : Number(row.weight),
    }));
  }

  private async loadProjectionHonors(schoolId: bigint) {
    const rows = await this.prisma.honor.findMany({
      where: { schoolId, status: 'enabled' },
      select: {
        id: true,
        schoolId: true,
        code: true,
        name: true,
        category: true,
        iconUrl: true,
        description: true,
        conditionType: true,
        conditionConfig: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        honorRecords: {
          orderBy: { grantedAt: 'desc' },
          take: 1,
          select: { grantedAt: true },
        },
        _count: { select: { honorRecords: true } },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: 120,
    });

    return rows.map((row) => ({
      id: toNumber(row.id),
      schoolId: toNumber(row.schoolId),
      code: row.code,
      name: row.name,
      category: row.category,
      iconUrl: row.iconUrl,
      description: row.description,
      conditionType: row.conditionType,
      conditionConfig: row.conditionConfig as Record<string, unknown> | null,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      grantedCount: row._count.honorRecords,
      lastGrantedAt: row.honorRecords[0]?.grantedAt ?? null,
    }));
  }

  private async loadProjectionRewards(schoolId: bigint) {
    const rows = await this.prisma.reward.findMany({
      where: { schoolId, status: 'enabled' },
      select: {
        id: true,
        schoolId: true,
        scopeType: true,
        classId: true,
        code: true,
        name: true,
        category: true,
        imageUrl: true,
        scoreCost: true,
        stockQty: true,
        isInfiniteStock: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { rewardOrders: true } },
      },
      orderBy: [{ scoreCost: 'asc' }, { createdAt: 'desc' }],
      take: 120,
    });

    return rows.map((row) => ({
      id: toNumber(row.id),
      schoolId: toNumber(row.schoolId),
      scopeType: row.scopeType,
      classId: toNumber(row.classId),
      code: row.code,
      name: row.name,
      category: row.category,
      imageUrl: row.imageUrl,
      scoreCost: row.scoreCost,
      stockQty: row.stockQty,
      isInfiniteStock: row.isInfiniteStock,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      redeemedCount: row._count.rewardOrders,
    }));
  }

  private async loadProjectionHonorRecords(schoolId: bigint) {
    const rows = await this.prisma.honorRecord.findMany({
      where: { schoolId },
      select: {
        id: true,
        honorId: true,
        targetType: true,
        targetId: true,
        schoolId: true,
        classId: true,
        studentId: true,
        grantedBy: true,
        grantedAt: true,
        remark: true,
        createdAt: true,
        honor: { select: { name: true, iconUrl: true } },
        classroom: { select: { name: true } },
        student: { select: { name: true } },
        grantedByUser: { select: { name: true } },
      },
      orderBy: { grantedAt: 'desc' },
      take: RECENT_HONOR_RECORD_LIMIT,
    });

    return rows.map((row) => ({
      id: toNumber(row.id),
      honorId: toNumber(row.honorId),
      honorName: row.honor.name,
      honorIconUrl: row.honor.iconUrl,
      targetType: row.targetType,
      targetId: toNumber(row.targetId),
      schoolId: toNumber(row.schoolId),
      classId: toNumber(row.classId),
      className: row.classroom.name,
      studentId: row.studentId ? toNumber(row.studentId) : null,
      studentName: row.student?.name ?? null,
      grantedBy: row.grantedBy ? toNumber(row.grantedBy) : null,
      grantedByName: row.grantedByUser?.name ?? null,
      grantedAt: row.grantedAt,
      remark: row.remark,
      createdAt: row.createdAt,
    }));
  }

  private async unwrap<T>(promise: Promise<unknown>, fallback: T): Promise<T> {
    return promise
      .then((response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return (response as { data: T }).data;
        }
        return fallback;
      })
      .catch(() => fallback);
  }
}
