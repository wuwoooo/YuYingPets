import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleType, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { AuthUser } from '@/common/auth/auth-user.interface';
import { AuthService } from '../auth/auth.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { PetUpsertDto } from './dto/pet-upsert.dto';
import { toNumber } from '@/common/utils/bigint.util';
import { normalizePetGrowthThresholds, resolveStageNeedScoreTotal } from '@/common/utils/pet-growth.util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';

type CachedAnalyticsInsight = {
  summary: string;
  suggestion: string;
  reportSummary: string;
  source: 'ark' | 'fallback';
  generatedAt: string;
  reportDate: string;
  classId: number;
  className: string;
};

/** 与前台评价一致的学科别名，用于任课筛选积分记录 */
const ANALYTICS_SUBJECT_COMPATIBILITY: Record<string, readonly string[]> = {
  computer: ['computer', 'arts_it'],
  art: ['art', 'arts_it'],
  music: ['music', 'arts_it'],
  pe: ['pe', 'arts_it'],
  mathematics: ['math', 'mathematics'],
  math: ['math', 'mathematics'],
};

const PET_CATEGORY_PRIORITY: Record<string, number> = {
  star: 0,
  zodiac: 1,
};
const VISIBLE_PET_CATEGORIES = ['star', 'zodiac'];

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
export class AdminInsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
    private readonly configService: ConfigService,
  ) {}

  async analytics(
    authorization: string | undefined,
    filters?: {
      gradeName?: string;
      classId?: number;
      subjectCode?: string;
      regenerateAi?: boolean;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);

    const accessibleClassIds = await this.getAccessibleClassIds(user);
    const classWhere: Prisma.ClassroomWhereInput = {
      schoolId: user.schoolId,
      deletedAt: null,
      status: 'enabled',
      ...(accessibleClassIds === null ? {} : { id: { in: accessibleClassIds.map((id) => BigInt(id)) } }),
      ...(filters?.gradeName ? { gradeName: filters.gradeName } : {}),
      ...(filters?.classId ? { id: BigInt(filters.classId) } : {}),
    };

    const classes = await this.prisma.classroom.findMany({
      where: classWhere,
      include: {
        students: {
          where: { deletedAt: null, status: 'enabled' },
          include: { profile: true },
        },
        classScoreProfile: true,
      },
      orderBy: [{ gradeCode: 'asc' }, { code: 'asc' }],
    });

    const resolvedClassIds = classes.map((item) => item.id);
    const hasClassScope = resolvedClassIds.length > 0;

    const dateRange = this.resolveAnalyticsDateRange(filters?.startDate, filters?.endDate);

    const [students, rules, scoreRecords] = await Promise.all([
      this.prisma.student.findMany({
        where: {
          schoolId: user.schoolId,
          deletedAt: null,
          status: 'enabled',
          ...(hasClassScope ? { classId: { in: resolvedClassIds } } : { classId: BigInt(-1) }),
        },
        include: { profile: true },
      }),
      this.prisma.scoreRule.findMany({
        where: {
          schoolId: user.schoolId,
          status: 'enabled',
        },
      }),
      this.prisma.scoreRecord.findMany({
        where: {
          schoolId: user.schoolId,
          ...(hasClassScope ? { classId: { in: resolvedClassIds } } : { classId: BigInt(-1) }),
          createdAt: {
            gte: dateRange.startAt,
            lt: dateRange.endAtExclusive,
          },
        },
        include: {
          rule: true,
          classroom: true,
          student: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 8000,
      }),
    ]);

    const subjectFilterRaw = filters?.subjectCode?.trim();
    if (subjectFilterRaw) {
      this.ensureSubjectAnalyticsScope(user, filters?.classId, subjectFilterRaw);
    }
    const scopedScoreRecords = subjectFilterRaw
      ? scoreRecords.filter((record) => this.recordMatchesAnalyticsSubject(record, subjectFilterRaw))
      : scoreRecords;

    const sumStudentScore = (studentsOfClass: Array<{ profile: { currentScore: number } | null }>) =>
      studentsOfClass.reduce((sum, student) => sum + (student.profile?.currentScore ?? 0), 0);

    const getClassScore = (classroom: (typeof classes)[number]) => classroom.classScoreProfile?.currentScore ?? 0;

    const totalScore = classes.reduce((sum, classroom) => sum + getClassScore(classroom), 0);
    const positiveRuleCount = scopedScoreRecords.filter((item) => item.sentiment === 'positive').length;
    const negativeRuleCount = scopedScoreRecords.filter((item) => item.sentiment === 'negative').length;
    const averageScore = students.length > 0
      ? Math.round(students.reduce((sum, student) => sum + (student.profile?.currentScore ?? 0), 0) / students.length)
      : 0;
    const activeDays = new Set(scopedScoreRecords.map((item) => item.createdAt.toISOString().slice(0, 10))).size;

    const gradeTrend = Array.from(
      classes.reduce((map, item) => {
        const current = map.get(item.gradeName) ?? { score: 0, count: 0 };
        current.score += getClassScore(item);
        current.count += 1;
        map.set(item.gradeName, current);
        return map;
      }, new Map<string, { score: number; count: number }>()),
    ).map(([name, value]) => ({ name, value: value.count > 0 ? Math.round(value.score / value.count) : 0 }));

    const ruleDistribution = Array.from(
      scopedScoreRecords.reduce((map, item) => {
        const key = item.dimension || item.rule.dimension || item.sceneCode || '未分类';
        map.set(key, (map.get(key) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    )
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    const subjectDistribution = Array.from(
      scopedScoreRecords.reduce((map, item) => {
        const key = item.subjectCode || item.rule.subjectCode || '通用';
        map.set(key, (map.get(key) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    )
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    const topClasses = classes
      .map((item) => ({
        id: toNumber(item.id),
        name: item.name,
        currentScoreTotal: getClassScore(item),
      }))
      .sort((left, right) => right.currentScoreTotal - left.currentScoreTotal)
      .slice(0, 8);

    const topStudents = classes
      .flatMap((item) =>
        item.students.map((student) => ({
          studentId: toNumber(student.id) ?? 0,
          studentName: student.name,
          classId: toNumber(item.id) ?? 0,
          className: item.name,
          currentScore: student.profile?.currentScore ?? 0,
        })),
      )
      .sort((left, right) => right.currentScore - left.currentScore)
      .slice(0, 15);

    const heatMapRows = ['早读', '上午', '午后', '晚辅'];
    const heatMapCols = ['一', '二', '三', '四', '五'];
    const heatMap = heatMapRows.map((rowName, rowIndex) => ({
      row: rowName,
      values: heatMapCols.map((_, colIndex) => {
        const count = scopedScoreRecords.filter((record) => {
          const date = record.createdAt;
          const day = date.getDay();
          const hour = date.getHours();
          const bucket = hour < 9 ? 0 : hour < 12 ? 1 : hour < 17 ? 2 : 3;
          const normalizedDay = day === 0 ? 4 : day - 1;
          return bucket === rowIndex && normalizedDay === colIndex;
        }).length;
        return count;
      }),
    }));

    const riskStudentMap = scopedScoreRecords.reduce((map, item) => {
      const studentId = toNumber(item.studentId) ?? 0;
      const current = map.get(studentId) ?? {
        studentId,
        studentName: item.student.name,
        className: item.classroom.name,
        positiveCount: 0,
        negativeCount: 0,
        scoreDelta: 0,
      };
      current.scoreDelta += item.scoreDelta;
      if (item.sentiment === 'positive') current.positiveCount += 1;
      if (item.sentiment === 'negative') current.negativeCount += 1;
      map.set(studentId, current);
      return map;
    }, new Map<number, {
      studentId: number;
      studentName: string;
      className: string;
      positiveCount: number;
      negativeCount: number;
      scoreDelta: number;
    }>());

    const riskStudents = Array.from(riskStudentMap.values())
      .map((item) => ({
        ...item,
        riskLevel:
          item.negativeCount >= 6 || item.scoreDelta <= -8
            ? 'high'
            : item.negativeCount >= 3 || item.scoreDelta < 0
              ? 'medium'
              : 'low',
        reason:
          item.negativeCount >= 6 || item.scoreDelta <= -8
            ? '近期负向事件偏多，积分回落明显'
            : item.negativeCount >= 3
              ? '近阶段负向信号有聚集趋势'
              : '已有零散负向信号，建议持续观察',
      }))
      .filter((item) => item.negativeCount > 0)
      .sort((left, right) => right.negativeCount - left.negativeCount || left.scoreDelta - right.scoreDelta)
      .slice(0, 6);

    const scopedClass = filters?.classId
      ? classes.find((item) => (toNumber(item.id) ?? 0) === filters.classId)
      : null;

    const academicDeskContext =
      scopedClass && !subjectFilterRaw
        ? await this.loadClassAcademicFactsForInsights(user.schoolId, scopedClass.id)
        : null;
    const academicFactsForAi = academicDeskContext?.structured ?? null;
    const academicHintLine = academicDeskContext?.summaryLine ?? '';

    const fallbackSummary = `${this.buildAnalyticsSummary({
      gradeName: filters?.gradeName,
      className: scopedClass?.name,
      dateRangeLabel: dateRange.label,
      totalScore,
      averageScore,
      activeDays,
      positiveRuleCount,
      negativeRuleCount,
      ruleDistribution,
      subjectDistribution,
      topClasses,
      riskStudents,
    })}${academicHintLine ? `\n\n【教务最近一次全科导入】${academicHintLine}` : ''}`;
    const fallbackSuggestion = `${this.buildAnalyticsSuggestion({
      activeDays,
      subjectDistribution,
      ruleDistribution,
      riskStudents,
    })}${academicHintLine ? '（若上述摘要含进退步，请安排任课与班主任对名单做归因复核。）' : ''}`;
    const fallbackReportSummary = `${this.buildAnalyticsReportSummary({
      gradeName: filters?.gradeName,
      className: scopedClass?.name,
      dateRangeLabel: dateRange.label,
      totalScore,
      averageScore,
      activeDays,
      positiveRuleCount,
      negativeRuleCount,
      ruleDistribution,
      subjectDistribution,
      riskStudents,
    })}${academicHintLine ? ` ${academicHintLine}` : ''}`;
    const aiInsight = scopedClass
      ? await this.resolveClassAnalyticsInsight({
          schoolId: toNumber(user.schoolId) ?? 0,
          classId: filters?.classId ?? (toNumber(scopedClass.id) ?? 0),
          className: scopedClass.name,
          gradeName: scopedClass.gradeName,
          dateRangeLabel: dateRange.label,
          dateRangeKey: dateRange.key,
          reportDate: dateRange.endDate,
          regenerateAi: Boolean(filters?.regenerateAi),
          totalScore,
          averageScore,
          activeDays,
          positiveRuleCount,
          negativeRuleCount,
          gradeTrend,
          ruleDistribution,
          subjectDistribution,
          topClasses,
          riskStudents,
          fallbackSummary,
          fallbackSuggestion,
          fallbackReportSummary,
          academicFacts: academicFactsForAi,
          subjectScopeCode: subjectFilterRaw || undefined,
        })
      : await this.resolveGlobalAnalyticsInsight({
          schoolId: toNumber(user.schoolId) ?? 0,
          gradeName: filters?.gradeName,
          dateRangeLabel: dateRange.label,
          dateRangeKey: dateRange.key,
          reportDate: dateRange.endDate,
          regenerateAi: Boolean(filters?.regenerateAi),
          totalScore,
          averageScore,
          activeDays,
          positiveRuleCount,
          negativeRuleCount,
          gradeTrend,
          ruleDistribution,
          subjectDistribution,
          topClasses,
          riskStudents,
          fallbackSummary,
          fallbackSuggestion,
          fallbackReportSummary,
        });

    return {
      code: 0,
      message: 'ok',
      data: {
        totalScore,
        positiveRuleCount,
        negativeRuleCount,
        averageScore,
        activeDays,
        gradeTrend,
        ruleDistribution,
        subjectDistribution,
        topClasses,
        topStudents,
        riskStudents,
        aiInsight,
        heatMap: {
          rows: heatMapRows,
          cols: heatMapCols,
          data: heatMap,
        },
      },
    };
  }

  async analyticsReportStatus(
    authorization: string | undefined,
    classId?: number,
    gradeName?: string,
    startDate?: string,
    endDate?: string,
    subjectCode?: string,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const dateRange = this.resolveAnalyticsDateRange(startDate, endDate);

    if (!classId) {
      const cached = await this.readCachedAnalyticsInsight(
        toNumber(user.schoolId) ?? 0,
        this.buildAnalyticsScopeKey(null, gradeName, dateRange.key),
        dateRange.endDate,
      );
      return {
        code: 0,
        message: 'ok',
        data: {
          hasTodayReport: Boolean(cached),
          classId: null,
          className: null,
          reportDate: cached?.reportDate ?? dateRange.endDate,
          generatedAt: cached?.generatedAt ?? null,
          source: cached?.source ?? null,
        },
      };
    }

    const subjectScope = subjectCode?.trim();

    const accessibleClassIds = await this.getAccessibleClassIds(user);
    if (accessibleClassIds !== null && !accessibleClassIds.includes(classId)) {
      throw new ForbiddenException('当前角色无权访问该班级');
    }

    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id: BigInt(classId),
        schoolId: user.schoolId,
        deletedAt: null,
        status: 'enabled',
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!classroom) {
      throw new NotFoundException('班级不存在');
    }

    if (subjectScope) {
      this.ensureSubjectAnalyticsScope(user, classId, subjectScope);
    }

    const cached = await this.readCachedAnalyticsInsight(
      toNumber(user.schoolId) ?? 0,
      this.buildAnalyticsScopeKey(classId, undefined, dateRange.key, subjectScope),
      dateRange.endDate,
    );

    return {
      code: 0,
      message: 'ok',
      data: {
        hasTodayReport: Boolean(cached),
        classId,
        className: classroom.name,
        reportDate: cached?.reportDate ?? dateRange.endDate,
        generatedAt: cached?.generatedAt ?? null,
        source: cached?.source ?? null,
      },
    };
  }

  async getPetGrowthThresholds(authorization: string | undefined) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManagePets(user.roleCode);

    const school = await this.prisma.school.findUniqueOrThrow({
      where: { id: user.schoolId },
      select: { petGrowthThresholds: true },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        thresholds: normalizePetGrowthThresholds(school.petGrowthThresholds),
      },
    };
  }

  async listPets(authorization: string | undefined, category?: string) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const accessibleClassIds = await this.getAccessibleClassIds(user);

    const [school, pets] = await Promise.all([
      this.prisma.school.findUniqueOrThrow({
        where: { id: user.schoolId },
        select: { petGrowthThresholds: true },
      }),
      this.prisma.pet.findMany({
        where: {
          schoolId: user.schoolId,
          status: 'enabled',
          category:
            category && category !== 'all' && VISIBLE_PET_CATEGORIES.includes(category)
              ? category
              : { in: VISIBLE_PET_CATEGORIES },
        },
        include: {
          stages: {
            orderBy: { stageNo: 'asc' },
          },
          studentPets: {
            include: {
              student: true,
            },
          },
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);
    const petGrowthThresholds = normalizePetGrowthThresholds(school.petGrowthThresholds);

    const filtered = pets
      .map((pet) => {
        const studentPets =
          accessibleClassIds === null
            ? pet.studentPets
            : pet.studentPets.filter((item) => accessibleClassIds.includes(toNumber(item.student.classId) ?? -1));
        return {
          id: toNumber(pet.id),
          schoolId: toNumber(pet.schoolId),
          code: pet.code,
          name: pet.name,
          category: pet.category,
          rarity: pet.rarity,
          sourceType: pet.sourceType,
          coverUrl: pet.coverUrl,
          description: pet.description,
          status: pet.status,
          bindCount: studentPets.length,
          maxLevel: studentPets.reduce((max, item) => Math.max(max, item.currentLevel), 0),
          stages: pet.stages.map((stage) => ({
            stageNo: stage.stageNo,
            levelNo: stage.levelNo,
            name: stage.name,
            imageUrl: stage.imageUrl,
            needScoreTotal: resolveStageNeedScoreTotal(stage.stageNo, stage.needScoreTotal, petGrowthThresholds),
            animationKey: stage.animationKey,
          })),
        };
      })
      .filter((pet) => accessibleClassIds === null || pet.status === 'enabled');

    filtered.sort(comparePetCatalogOrder);

    return { code: 0, message: 'ok', data: filtered };
  }

  async createPet(authorization: string | undefined, body: PetUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManagePets(user.roleCode);
    const normalizedStages = this.normalizePetStages(body);
    const category = this.normalizeVisiblePetCategory(body.category);

    const created = await this.prisma.$transaction(async (tx) => {
      const pet = await tx.pet.create({
        data: {
          schoolId: user.schoolId,
          code: body.code,
          name: body.name,
          category,
          rarity: body.rarity,
          sourceType: body.sourceType ?? 'custom',
          coverUrl: this.resolveCoverUrl(body, normalizedStages),
          description: body.description,
        },
      });
      await tx.petStage.createMany({
        data: normalizedStages.map((stage) => ({
          petId: pet.id,
          stageNo: stage.stageNo,
          levelNo: stage.levelNo,
          name: stage.name,
          imageUrl: stage.imageUrl,
          needScoreTotal: stage.needScoreTotal,
          animationKey: stage.animationKey ?? null,
        })),
      });
      return pet;
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'pet',
      action: 'create',
      targetType: 'pet',
      targetId: created.id,
      detail: {
        code: body.code,
        name: body.name,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(created.id) } };
  }

  async updatePet(authorization: string | undefined, id: number, body: PetUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManagePets(user.roleCode);
    const normalizedStages = this.normalizePetStages(body);
    const category = this.normalizeVisiblePetCategory(body.category);

    const exists = await this.prisma.pet.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
        status: 'enabled',
      },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('萌宠不存在');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const pet = await tx.pet.update({
        where: { id: BigInt(id) },
        data: {
          code: body.code,
          name: body.name,
          category,
          rarity: body.rarity,
          sourceType: body.sourceType ?? undefined,
          coverUrl: this.resolveCoverUrl(body, normalizedStages),
          description: body.description,
        },
      });
      await tx.petStage.deleteMany({
        where: { petId: BigInt(id) },
      });
      await tx.petStage.createMany({
        data: normalizedStages.map((stage) => ({
          petId: BigInt(id),
          stageNo: stage.stageNo,
          levelNo: stage.levelNo,
          name: stage.name,
          imageUrl: stage.imageUrl,
          needScoreTotal: stage.needScoreTotal,
          animationKey: stage.animationKey ?? null,
        })),
      });
      return pet;
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'pet',
      action: 'update',
      targetType: 'pet',
      targetId: updated.id,
      detail: {
        code: body.code,
        name: body.name,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(updated.id) } };
  }

  async updatePetStatus(authorization: string | undefined, id: number, status: 'enabled' | 'disabled') {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManagePets(user.roleCode);

    const pet = await this.prisma.pet.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
      },
      include: {
        _count: {
          select: {
            studentPets: true,
          },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException('萌宠不存在');
    }
    if (pet.sourceType === 'system' && status === 'disabled') {
      throw new ForbiddenException('系统图鉴不允许停用');
    }
    if (pet.sourceType === 'custom' && status === 'disabled' && pet._count.studentPets > 0) {
      throw new ForbiddenException('该自定义萌宠已有学生绑定，不能直接停用');
    }

    const updated = await this.prisma.pet.update({
      where: { id: BigInt(id) },
      data: { status },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'pet',
      action: 'status_update',
      targetType: 'pet',
      targetId: updated.id,
      detail: {
        code: pet.code,
        name: pet.name,
        status,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(updated.id), status } };
  }

  async deletePet(authorization: string | undefined, id: number) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManagePets(user.roleCode);

    const pet = await this.prisma.pet.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
      },
      include: {
        _count: {
          select: {
            studentPets: true,
          },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException('萌宠不存在');
    }
    if (pet.sourceType === 'system') {
      throw new ForbiddenException('系统图鉴不允许删除');
    }
    if (pet._count.studentPets > 0) {
      throw new ForbiddenException('该萌宠已有学生绑定，不能删除');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.petStage.deleteMany({
        where: { petId: BigInt(id) },
      });
      await tx.pet.delete({
        where: { id: BigInt(id) },
      });
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'pet',
      action: 'delete',
      targetType: 'pet',
      targetId: BigInt(id),
      detail: {
        code: pet.code,
        name: pet.name,
      },
    });

    return { code: 0, message: 'ok', data: { id } };
  }

  async uploadPetAsset(
    authorization: string | undefined,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManagePets(user.roleCode);

    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('仅支持上传图片文件');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('图片大小不能超过 5MB');
    }

    const uploadsDir = resolve(process.cwd(), 'public/uploads/pets');
    await mkdir(uploadsDir, { recursive: true });
    const extension = extname(file.originalname || '').toLowerCase() || '.png';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
    await writeFile(resolve(uploadsDir, fileName), file.buffer);

    return {
      code: 0,
      message: 'ok',
      data: {
        url: `/uploads/pets/${fileName}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    };
  }

  private buildAnalyticsSummary(input: {
    gradeName?: string;
    className?: string;
    dateRangeLabel: string;
    totalScore: number;
    averageScore: number;
    activeDays: number;
    positiveRuleCount: number;
    negativeRuleCount: number;
    ruleDistribution: Array<{ name: string; value: number }>;
    subjectDistribution: Array<{ name: string; value: number }>;
    topClasses: Array<{ id: number | null; name: string; currentScoreTotal: number }>;
    riskStudents: Array<{ studentName: string; negativeCount: number }>;
  }) {
    const scopeLabel = input.className ? `${input.className}` : input.gradeName ? `${input.gradeName}` : '当前筛选范围';
    if (input.totalScore === 0 && input.averageScore === 0 && input.activeDays === 0) {
      return `${scopeLabel}在${input.dateRangeLabel}暂无有效积分与评价记录，班级学情数据尚未形成，暂时不能据此输出趋势判断。`;
    }
    const topRule = input.ruleDistribution[0]?.name ?? '未分类';
    const topSubject = input.subjectDistribution[0]?.name ?? '通用';
    const riskCount = input.riskStudents.length;
    return `${scopeLabel}在${input.dateRangeLabel}累计积分 ${input.totalScore} 分，人均积分 ${input.averageScore} 分，活跃评价日 ${input.activeDays} 天，正向/负向事件分别为 ${input.positiveRuleCount}/${input.negativeRuleCount}。当前高频行为维度集中在“${topRule}”，主要发生在“${topSubject}”相关学习场景，需重点关注 ${riskCount} 名存在负向聚集信号的学生。`;
  }

  private buildAnalyticsSuggestion(input: {
    activeDays: number;
    subjectDistribution: Array<{ name: string; value: number }>;
    ruleDistribution: Array<{ name: string; value: number }>;
    riskStudents: Array<{ riskLevel: string }>;
  }) {
    if (input.activeDays === 0 && input.subjectDistribution.length === 0 && input.ruleDistribution.length === 0) {
      return '建议先补充该班级的课堂、作业、测评等真实评价记录，再生成班级 AI 报告。';
    }
    const topSubject = input.subjectDistribution[0]?.name ?? '通用';
    const topRule = input.ruleDistribution[0]?.name ?? '课堂学习';
    const highRiskCount = input.riskStudents.filter((item) => item.riskLevel === 'high').length;
    if (highRiskCount > 0) {
      return `建议本周优先围绕“${topRule}”建立短周期干预动作，并对高风险学生安排班主任复盘，避免问题继续累积。`;
    }
    if (input.activeDays < 5) {
      return `建议先提升“${topSubject}”相关学习场景的评价活跃度，补充课堂与作业记录，避免画像失真。`;
    }
    return `建议继续强化“${topSubject}”场景中的正向反馈，同时对“${topRule}”维度做更细的分层跟踪。`;
  }

  private buildAnalyticsReportSummary(input: {
    gradeName?: string;
    className?: string;
    dateRangeLabel: string;
    totalScore: number;
    averageScore: number;
    activeDays: number;
    positiveRuleCount: number;
    negativeRuleCount: number;
    ruleDistribution: Array<{ name: string; value: number }>;
    subjectDistribution: Array<{ name: string; value: number }>;
    riskStudents: Array<{ studentName: string; className: string; riskLevel: string }>;
  }) {
    const scopeLabel = input.className ? `${input.className}` : input.gradeName ? `${input.gradeName}` : '全校';
    if (input.totalScore === 0 && input.averageScore === 0 && input.activeDays === 0) {
      return `${scopeLabel}在${input.dateRangeLabel}暂无有效积分与评价记录，系统暂不输出趋势性结论。建议先完成班级日常评价数据采集后再生成汇报摘要。`;
    }
    const topRule = input.ruleDistribution[0]?.name ?? '未分类';
    const topSubject = input.subjectDistribution[0]?.name ?? '通用';
    const highRiskStudents = input.riskStudents.filter((item) => item.riskLevel === 'high').slice(0, 3);
    const riskLine =
      highRiskStudents.length > 0
        ? `需要重点关注的学生包括${highRiskStudents.map((item) => `${item.className}${item.studentName}`).join('、')}。`
        : '当前未发现高风险学生聚集现象。';

    return `${scopeLabel}在${input.dateRangeLabel}累计积分为 ${input.totalScore} 分，人均积分 ${input.averageScore} 分，活跃评价日 ${input.activeDays} 天，正向/负向事件为 ${input.positiveRuleCount}/${input.negativeRuleCount}。行为记录主要集中在“${topRule}”维度，学科事件以“${topSubject}”为主。${riskLine}整体上，当前数据能够支撑学校开展阶段性汇报与班级跟进。`;
  }

  private async resolveClassAnalyticsInsight(input: {
    schoolId: number;
    classId: number;
    className: string;
    gradeName?: string;
    dateRangeLabel: string;
    dateRangeKey: string;
    reportDate: string;
    regenerateAi: boolean;
    totalScore: number;
    averageScore: number;
    activeDays: number;
    positiveRuleCount: number;
    negativeRuleCount: number;
    gradeTrend: Array<{ name: string; value: number }>;
    ruleDistribution: Array<{ name: string; value: number }>;
    subjectDistribution: Array<{ name: string; value: number }>;
    topClasses: Array<{ id: number | null; name: string; currentScoreTotal: number }>;
    riskStudents: Array<{
      studentId: number;
      studentName: string;
      className: string;
      positiveCount: number;
      negativeCount: number;
      scoreDelta: number;
      riskLevel: string;
      reason: string;
    }>;
    fallbackSummary: string;
    fallbackSuggestion: string;
    fallbackReportSummary: string;
    academicFacts: Record<string, unknown> | null;
    subjectScopeCode?: string;
  }) {
    const reportDate = input.reportDate;
    if (input.totalScore === 0 && input.averageScore === 0 && input.activeDays === 0) {
      return {
        summary: input.fallbackSummary,
        suggestion: input.fallbackSuggestion,
        reportSummary: input.fallbackReportSummary,
        source: 'fallback' as const,
        generatedAt: null,
        reportDate,
        classId: input.classId,
        className: input.className,
        isCached: false,
      };
    }

    const cached = input.regenerateAi
      ? null
      : await this.readCachedAnalyticsInsight(
          input.schoolId,
          this.buildAnalyticsScopeKey(input.classId, undefined, input.dateRangeKey, input.subjectScopeCode),
          reportDate,
        );

    if (cached) {
      return {
        summary: cached.summary,
        suggestion: cached.suggestion,
        reportSummary: cached.reportSummary,
        source: cached.source,
        generatedAt: cached.generatedAt,
        reportDate: cached.reportDate,
        classId: cached.classId,
        className: cached.className,
        isCached: true,
      };
    }

    const generatedAt = new Date().toISOString();
    const generated = await this.generateAnalyticsInsightWithArk({
      gradeName: input.gradeName,
      className: input.className,
      dateRangeLabel: input.dateRangeLabel,
      totalScore: input.totalScore,
      averageScore: input.averageScore,
      activeDays: input.activeDays,
      positiveRuleCount: input.positiveRuleCount,
      negativeRuleCount: input.negativeRuleCount,
      gradeTrend: input.gradeTrend,
      ruleDistribution: input.ruleDistribution,
      subjectDistribution: input.subjectDistribution,
      topClasses: input.topClasses,
      riskStudents: input.riskStudents,
      fallbackSummary: input.fallbackSummary,
      fallbackSuggestion: input.fallbackSuggestion,
      fallbackReportSummary: input.fallbackReportSummary,
      academicFacts: input.academicFacts,
    });

    await this.writeCachedAnalyticsInsight(
      input.schoolId,
      this.buildAnalyticsScopeKey(input.classId, undefined, input.dateRangeKey, input.subjectScopeCode),
      {
      summary: generated.summary,
      suggestion: generated.suggestion,
      reportSummary: generated.reportSummary,
      source: generated.source,
      generatedAt,
      reportDate,
      classId: input.classId,
      className: input.className,
    });

    return {
      summary: generated.summary,
      suggestion: generated.suggestion,
      reportSummary: generated.reportSummary,
      source: generated.source,
      generatedAt,
      reportDate,
      classId: input.classId,
      className: input.className,
      isCached: false,
    };
  }

  private async resolveGlobalAnalyticsInsight(input: {
    schoolId: number;
    gradeName?: string;
    dateRangeLabel: string;
    dateRangeKey: string;
    reportDate: string;
    regenerateAi: boolean;
    totalScore: number;
    averageScore: number;
    activeDays: number;
    positiveRuleCount: number;
    negativeRuleCount: number;
    gradeTrend: Array<{ name: string; value: number }>;
    ruleDistribution: Array<{ name: string; value: number }>;
    subjectDistribution: Array<{ name: string; value: number }>;
    topClasses: Array<{ id: number | null; name: string; currentScoreTotal: number }>;
    riskStudents: Array<{
      studentId: number;
      studentName: string;
      className: string;
      positiveCount: number;
      negativeCount: number;
      scoreDelta: number;
      riskLevel: string;
      reason: string;
    }>;
    fallbackSummary: string;
    fallbackSuggestion: string;
    fallbackReportSummary: string;
  }) {
    const reportDate = input.reportDate;
    const scopeKey = this.buildAnalyticsScopeKey(null, input.gradeName, input.dateRangeKey);

    if (input.totalScore === 0 && input.averageScore === 0 && input.activeDays === 0) {
      return {
        summary: input.fallbackSummary,
        suggestion: input.fallbackSuggestion,
        reportSummary: input.fallbackReportSummary,
        source: 'fallback' as const,
        generatedAt: null,
        reportDate,
        classId: null,
        className: null,
        isCached: false,
      };
    }

    const cached = input.regenerateAi
      ? null
      : await this.readCachedAnalyticsInsight(input.schoolId, scopeKey, reportDate);

    if (cached) {
      return {
        summary: cached.summary,
        suggestion: cached.suggestion,
        reportSummary: cached.reportSummary,
        source: cached.source,
        generatedAt: cached.generatedAt,
        reportDate: cached.reportDate,
        classId: null,
        className: cached.className,
        isCached: true,
      };
    }

    const generatedAt = new Date().toISOString();
    const generated = await this.generateAnalyticsInsightWithArk({
      gradeName: input.gradeName,
      className: undefined,
      dateRangeLabel: input.dateRangeLabel,
      totalScore: input.totalScore,
      averageScore: input.averageScore,
      activeDays: input.activeDays,
      positiveRuleCount: input.positiveRuleCount,
      negativeRuleCount: input.negativeRuleCount,
      gradeTrend: input.gradeTrend,
      ruleDistribution: input.ruleDistribution,
      subjectDistribution: input.subjectDistribution,
      topClasses: input.topClasses,
      riskStudents: input.riskStudents,
      fallbackSummary: input.fallbackSummary,
      fallbackSuggestion: input.fallbackSuggestion,
      fallbackReportSummary: input.fallbackReportSummary,
      academicFacts: null,
    });

    await this.writeCachedAnalyticsInsight(input.schoolId, scopeKey, {
      summary: generated.summary,
      suggestion: generated.suggestion,
      reportSummary: generated.reportSummary,
      source: generated.source,
      generatedAt,
      reportDate,
      classId: 0,
      className: input.gradeName ?? '全部班级',
    });

    return {
      summary: generated.summary,
      suggestion: generated.suggestion,
      reportSummary: generated.reportSummary,
      source: generated.source,
      generatedAt,
      reportDate,
      classId: null,
      className: input.gradeName ?? '全部班级',
      isCached: false,
    };
  }

  private async generateAnalyticsInsightWithArk(input: {
    gradeName?: string;
    className?: string;
    dateRangeLabel: string;
    totalScore: number;
    averageScore: number;
    activeDays: number;
    positiveRuleCount: number;
    negativeRuleCount: number;
    gradeTrend: Array<{ name: string; value: number }>;
    ruleDistribution: Array<{ name: string; value: number }>;
    subjectDistribution: Array<{ name: string; value: number }>;
    topClasses: Array<{ id: number | null; name: string; currentScoreTotal: number }>;
    riskStudents: Array<{
      studentId: number;
      studentName: string;
      className: string;
      positiveCount: number;
      negativeCount: number;
      scoreDelta: number;
      riskLevel: string;
      reason: string;
    }>;
    fallbackSummary: string;
    fallbackSuggestion: string;
    fallbackReportSummary: string;
    academicFacts: Record<string, unknown> | null;
  }) {
    const apiKey = this.configService.get<string>('ARK_API_KEY');
    const apiUrl = this.configService.get<string>('ARK_API_URL') || 'https://ark.cn-beijing.volces.com/api/v3/responses';
    const model = this.configService.get<string>('ARK_MODEL') || 'deepseek-v3-2-251201';
    const timeoutMs = Number(this.configService.get<string>('ARK_TIMEOUT_MS') || 30000);

    if (!apiKey) {
      return {
        summary: input.fallbackSummary,
        suggestion: input.fallbackSuggestion,
        reportSummary: input.fallbackReportSummary,
        source: 'fallback' as const,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          stream: false,
          input: [
            {
              role: 'system',
              content: [
                {
                  type: 'input_text',
                  text: [
                    '你是学校数据分析助手。',
                    '你只能依据提供的数据输出校级/班级学情洞察，不夸大，不凭空推断。',
                    '请严格输出 JSON，字段只有 summary、suggestion、reportSummary，且都必须为字符串。',
                    'summary 控制在 220 字以内，suggestion 控制在 160 字以内，reportSummary 控制在 360 字以内。',
                    'summary 必须包含：统计范围、关键数据、主要变化或风险。',
                    'suggestion 必须是可执行动作，至少 2 条动作意图（可写在一句中），并标明优先关注对象。',
                    'reportSummary 需要能直接用于校务汇报：先结论，再依据，再行动建议。',
                    '若 academicFacts.latestImportedExamLabel 存在：说明最近一次教务全科成绩导入快照；须在 summary/reportSummary/suggestion 中同步提及学业侧的要点，但必须严格遵从 academicFacts 数字，禁止臆造分值或名单。',
                  ].join(' '),
                },
              ],
            },
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: JSON.stringify(
                    {
                      scope: {
                        gradeName: input.gradeName || null,
                        className: input.className || null,
                        dateRange: input.dateRangeLabel,
                      },
                      totalScore: input.totalScore,
                      averageScore: input.averageScore,
                      activeDays: input.activeDays,
                      positiveRuleCount: input.positiveRuleCount,
                      negativeRuleCount: input.negativeRuleCount,
                      gradeTrend: input.gradeTrend,
                      ruleDistribution: input.ruleDistribution,
                      subjectDistribution: input.subjectDistribution,
                      topClasses: input.topClasses,
                      riskStudents: input.riskStudents,
                      academicFacts: input.academicFacts ?? {
                        hint: '无教务最近一次全科快照或尚未聚合',
                      },
                    },
                    null,
                    2,
                  ),
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ark API 请求失败: ${response.status}`);
      }

      const payload = (await response.json()) as {
        output_text?: string;
        output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
      };
      const outputText =
        payload.output_text?.trim() ||
        payload.output
          ?.flatMap((item) => item.content ?? [])
          .map((item) => item.text ?? '')
          .join('\n')
          .trim() ||
        '';
      const parsed = this.parseInsightJson(outputText, input.fallbackSummary, input.fallbackSuggestion, input.fallbackReportSummary);
      return {
        summary: parsed.summary,
        suggestion: parsed.suggestion,
        reportSummary: parsed.reportSummary,
        source: 'ark' as const,
      };
    } catch {
      return {
        summary: input.fallbackSummary,
        suggestion: input.fallbackSuggestion,
        reportSummary: input.fallbackReportSummary,
        source: 'fallback' as const,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseInsightJson(text: string, fallbackSummary: string, fallbackSuggestion: string, fallbackReportSummary: string) {
    if (!text) {
      return { summary: fallbackSummary, suggestion: fallbackSuggestion, reportSummary: fallbackReportSummary };
    }

    const parse = (raw: string) => {
      const obj = JSON.parse(raw) as { summary?: string; suggestion?: string; reportSummary?: string };
      return {
        summary: obj.summary?.trim() || fallbackSummary,
        suggestion: obj.suggestion?.trim() || fallbackSuggestion,
        reportSummary: obj.reportSummary?.trim() || fallbackReportSummary,
      };
    };

    try {
      return parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return parse(match[0]);
        } catch {
          return { summary: fallbackSummary, suggestion: fallbackSuggestion, reportSummary: fallbackReportSummary };
        }
      }
      return { summary: fallbackSummary, suggestion: fallbackSuggestion, reportSummary: fallbackReportSummary };
    }
  }

  private resolveAcademicInsightRankDelta(
    classRankDelta: number | null | undefined,
    schoolRankDelta: number | null | undefined,
    curr: number | null,
    prev: number | null,
  ): number {
    const explicit = classRankDelta ?? schoolRankDelta;
    if (explicit !== null && explicit !== undefined && Number.isFinite(Number(explicit))) return Number(explicit);
    if (curr !== null && prev !== null) return Math.round(Number(curr) - Number(prev));
    return 0;
  }

  /** 对齐成绩导入侧的考试名展示格式 */
  private cleanImportedExamDisplayName(value: string) {
    const normalized = value.trim();
    if (!normalized) return normalized;
    const match = normalized.match(/^(.*?(?:成绩汇总|考生成绩汇总))\s*[-—–:：]+\s*(.+)$/);
    return match?.[2]?.trim() || normalized;
  }

  /**
   * 单机班级最近一次（及上一场同年级）教务全科导入摘要，供 analytics AI 与 fallback 文本拼接。
   */
  private async loadClassAcademicFactsForInsights(
    schoolId: bigint,
    classId: bigint,
  ): Promise<{ summaryLine: string; structured: Record<string, unknown> } | null> {
    const exams = await this.prisma.academicExam.findMany({
      where: {
        schoolId,
        records: {
          some: {
            classId,
            subjectCode: 'total',
            score: { not: null },
          },
        },
      },
      orderBy: [{ examDate: 'desc' }, { id: 'desc' }],
      take: 8,
      select: {
        id: true,
        name: true,
        importedAt: true,
        gradeName: true,
      },
    });

    const latestExam = exams[0];
    if (!latestExam) return null;

    const latestExamGradeLabel = latestExam.gradeName ?? null;
    const previousExamEntry =
      exams.slice(1).find((exam) => !latestExamGradeLabel || exam.gradeName === latestExamGradeLabel) ??
      null;

    const latestTotals = await this.prisma.academicScoreRecord.findMany({
      where: {
        schoolId,
        classId,
        examId: latestExam.id,
        subjectCode: 'total',
        score: { not: null },
      },
      select: {
        studentId: true,
        score: true,
        classRankDelta: true,
        schoolRankDelta: true,
      },
    });

    let previousTotals = [] as Array<{
      studentId: bigint;
      score: { toString(): string } | null;
      classRankDelta: number | null;
      schoolRankDelta: number | null;
    }>;
    if (previousExamEntry) {
      previousTotals = await this.prisma.academicScoreRecord.findMany({
        where: {
          schoolId,
          classId,
          examId: previousExamEntry.id,
          subjectCode: 'total',
          score: { not: null },
        },
        select: {
          studentId: true,
          score: true,
          classRankDelta: true,
          schoolRankDelta: true,
        },
      });
    }

    const prevByStudent = new Map(
      previousTotals.map((row) => [
        row.studentId.toString(),
        {
          score: row.score !== null ? Number(row.score) : null,
          classRankDelta: row.classRankDelta,
          schoolRankDelta: row.schoolRankDelta,
        },
      ]),
    );

    let progressCount = 0;
    let declineCount = 0;

    let sumScore = 0;
    for (const row of latestTotals) {
      const curr = row.score !== null ? Number(row.score) : null;
      if (curr !== null) sumScore += curr;
      const prevRow = prevByStudent.get(row.studentId.toString());
      const prevScore = prevRow?.score ?? null;
      const delta = this.resolveAcademicInsightRankDelta(
        row.classRankDelta,
        row.schoolRankDelta,
        curr,
        prevScore,
      );
      if (delta > 0) progressCount += 1;
      if (delta < 0) declineCount += 1;
    }

    const participantCountLatest = latestTotals.length;
    const classAvg =
      participantCountLatest > 0 ? Math.round((sumScore / participantCountLatest) * 10) / 10 : 0;

    const latestImportedExamLabel = this.cleanImportedExamDisplayName(latestExam.name);

    const summaryLine =
      `${latestImportedExamLabel}，本班参考 ${participantCountLatest} 人，班均总分约 ${classAvg}；` +
      `配对上一场「${previousExamEntry ? this.cleanImportedExamDisplayName(previousExamEntry.name) : '无'}」粗略计进步 ${progressCount}、退步 ${declineCount} 人次（Δ 取自导入名次/分数差额）。`;

    const structured = {
      latestImportedExamLabel,
      latestImportedAt: latestExam.importedAt.toISOString(),
      previousImportedExamLabel: previousExamEntry
        ? this.cleanImportedExamDisplayName(previousExamEntry.name)
        : null,
      participantCountLatest,
      classAverageTotalScoreLatest: classAvg,
      estimatedProgressStudentCount: progressCount,
      estimatedDeclineStudentCount: declineCount,
      dataSource:
        '教务导入的全科总分行（subjectCode=total），与课堂积分、评价记录非同一数据源；不得将人均积分直接等同卷面分。',
    };

    return { summaryLine, structured };
  }

  private getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resolveAnalyticsDateRange(startDate?: string, endDate?: string) {
    const today = this.getLocalDateString();
    const resolvedStartDate = startDate?.trim() || this.shiftDateString(today, -29);
    const resolvedEndDate = endDate?.trim() || today;
    const orderedStart = resolvedStartDate <= resolvedEndDate ? resolvedStartDate : resolvedEndDate;
    const orderedEnd = resolvedStartDate <= resolvedEndDate ? resolvedEndDate : resolvedStartDate;
    return {
      startDate: orderedStart,
      endDate: orderedEnd,
      startAt: new Date(`${orderedStart}T00:00:00.000Z`),
      endAtExclusive: new Date(`${this.shiftDateString(orderedEnd, 1)}T00:00:00.000Z`),
      label: `${orderedStart} 至 ${orderedEnd}`,
      key: `${orderedStart}_${orderedEnd}`,
    };
  }

  private shiftDateString(date: string, offsetDays: number) {
    const base = new Date(`${date}T00:00:00.000Z`);
    base.setUTCDate(base.getUTCDate() + offsetDays);
    const year = base.getUTCFullYear();
    const month = String(base.getUTCMonth() + 1).padStart(2, '0');
    const day = String(base.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private expandAnalyticsSubjectCodes(subjectCodes: string[]): string[] {
    return Array.from(
      new Set(
        subjectCodes
          .map((code) => code.trim())
          .filter(Boolean)
          .flatMap((code) => [...(ANALYTICS_SUBJECT_COMPATIBILITY[code] ?? [code])]),
      ),
    );
  }

  private subjectCodesOverlap(left: string, right: string): boolean {
    const a = new Set(this.expandAnalyticsSubjectCodes([left]));
    const b = new Set(this.expandAnalyticsSubjectCodes([right]));
    for (const code of a) {
      if (b.has(code)) return true;
    }
    return false;
  }

  private recordMatchesAnalyticsSubject(
    record: {
      subjectCode: string | null;
      rule: { subjectCode: string | null; moduleType: ModuleType };
    },
    filterSubject: string,
  ): boolean {
    const rule = record.rule;
    if (rule.moduleType === ModuleType.subject && rule.subjectCode?.trim()) {
      return this.subjectCodesOverlap(rule.subjectCode, filterSubject);
    }
    const explicit = record.subjectCode?.trim();
    if (explicit) {
      return this.subjectCodesOverlap(explicit, filterSubject);
    }
    return false;
  }

  private ensureSubjectAnalyticsScope(user: AuthUser, classId: number | undefined, subjectCode: string | undefined): void {
    const sub = subjectCode?.trim();
    if (!sub) return;
    if (!classId) {
      throw new BadRequestException('单科统计需同时指定班级');
    }
    if (user.roleCode !== 'subject_teacher') {
      return;
    }
    const ok = user.classAssignments.some((assignment) => {
      if (assignment.roleInClass !== 'subject_teacher') return false;
      if (toNumber(assignment.classId) !== classId) return false;
      const ac = (assignment.subjectCode ?? '').trim();
      if (!ac) return false;
      return this.subjectCodesOverlap(ac, sub);
    });
    if (!ok) {
      throw new ForbiddenException('无权查看该班级该学科的积分分析');
    }
  }

  /** 缓存分区键：班级维度必须带上日期区间；任课单科再加 subject 后缀 */
  private buildAnalyticsScopeKey(
    classId: number | null,
    gradeName?: string,
    dateRangeKey?: string,
    subjectCode?: string,
  ) {
    const sub = subjectCode?.trim();
    const subjectSuffix = sub ? `-subj-${sub.replace(/[^a-zA-Z0-9_-]/g, '')}` : '';
    const cid = classId != null ? Number(classId) : NaN;
    if (Number.isFinite(cid) && cid > 0) {
      const base = dateRangeKey ? `class-${cid}-${dateRangeKey}` : `class-${cid}`;
      return `${base}${subjectSuffix}`;
    }
    const scope = gradeName ? `global-grade-${gradeName}` : 'global-all';
    return dateRangeKey ? `${scope}-${dateRangeKey}` : scope;
  }

  private getAnalyticsInsightCachePath(schoolId: number, scopeKey: string, reportDate: string) {
    return resolve(process.cwd(), '.cache', 'ai-class-insights', String(schoolId), `${scopeKey}-${reportDate}.json`);
  }

  private async readCachedAnalyticsInsight(schoolId: number, scopeKey: string, reportDate: string) {
    try {
      const content = await readFile(this.getAnalyticsInsightCachePath(schoolId, scopeKey, reportDate), 'utf8');
      return JSON.parse(content) as CachedAnalyticsInsight;
    } catch {
      return null;
    }
  }

  private async writeCachedAnalyticsInsight(schoolId: number, scopeKey: string, payload: CachedAnalyticsInsight) {
    const filePath = this.getAnalyticsInsightCachePath(schoolId, scopeKey, payload.reportDate);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
  }

  private normalizePetStages(body: PetUpsertDto) {
    const stages = [...body.stages]
      .map((stage) => ({
        stageNo: Number(stage.stageNo),
        levelNo: Number(stage.levelNo),
        name: stage.name.trim(),
        imageUrl: stage.imageUrl.trim(),
        needScoreTotal: Number(stage.needScoreTotal),
        animationKey: stage.animationKey?.trim() || 'pet-level-up',
      }))
      .sort((left, right) => left.stageNo - right.stageNo);

    if (stages.length !== 10) {
      throw new BadRequestException('请完整配置 10 个等级阶段图片');
    }

    stages.forEach((stage, index) => {
      const expected = index + 1;
      if (stage.stageNo !== expected || stage.levelNo !== expected) {
        throw new BadRequestException('萌宠阶段必须从 1 到 10 依次配置');
      }
      if (!stage.name) {
        throw new BadRequestException(`请填写 Lv.${expected} 阶段名称`);
      }
      if (!stage.imageUrl) {
        throw new BadRequestException(`请上传 Lv.${expected} 阶段图片`);
      }
      if (index > 0 && stage.needScoreTotal < stages[index - 1].needScoreTotal) {
        throw new BadRequestException('阶段所需累计积分必须递增');
      }
    });

    return stages;
  }

  private resolveCoverUrl(body: PetUpsertDto, stages: ReturnType<AdminInsightsService['normalizePetStages']>) {
    return body.coverUrl?.trim() || stages.find((stage) => stage.stageNo === 1)?.imageUrl || stages[0]?.imageUrl;
  }

  private normalizeVisiblePetCategory(category: string | undefined) {
    const normalized = normalizePetCategory(category || 'star');
    if (!VISIBLE_PET_CATEGORIES.includes(normalized)) {
      throw new BadRequestException('萌宠分类只允许选择星宠或十二生肖');
    }
    return normalized;
  }

  private ensureCanManagePets(roleCode: string) {
    if (!['super_admin', 'school_admin', 'moral_admin'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权维护萌宠图鉴');
    }
  }

  private async getAccessibleClassIds(user: Awaited<ReturnType<AuthService['getAuthUserFromAuthorization']>>) {
    if (['super_admin', 'school_admin', 'academic_admin', 'moral_admin'].includes(user.roleCode)) {
      return null;
    }
    return [...user.scopes.map((scope) => scope.classId), ...user.classAssignments.map((assignment) => assignment.classId)]
      .map((classId) => toNumber(classId))
      .filter((item): item is number => item !== null);
  }
}
