"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminInsightsService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const operation_log_service_1 = require("../operation-log/operation-log.service");
const bigint_util_1 = require("../../common/utils/bigint.util");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
let AdminInsightsService = class AdminInsightsService {
    constructor(prisma, authService, operationLogService, configService) {
        this.prisma = prisma;
        this.authService = authService;
        this.operationLogService = operationLogService;
        this.configService = configService;
    }
    async analytics(authorization, filters) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        const accessibleClassIds = await this.getAccessibleClassIds(user);
        const classWhere = {
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
            },
            orderBy: [{ gradeCode: 'asc' }, { code: 'asc' }],
        });
        const resolvedClassIds = classes.map((item) => item.id);
        const hasClassScope = resolvedClassIds.length > 0;
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
                },
                include: {
                    rule: true,
                    classroom: true,
                    student: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 2000,
            }),
        ]);
        const sumClassScore = (studentsOfClass) => studentsOfClass.reduce((sum, student) => sum + (student.profile?.currentScore ?? 0), 0);
        const totalScore = classes.reduce((sum, classroom) => sum + sumClassScore(classroom.students), 0);
        const positiveRuleCount = scoreRecords.filter((item) => item.sentiment === 'positive').length;
        const averageScore = students.length > 0
            ? Math.round(students.reduce((sum, student) => sum + (student.profile?.currentScore ?? 0), 0) / students.length)
            : 0;
        const activeDays = new Set(scoreRecords.map((item) => item.createdAt.toISOString().slice(0, 10))).size;
        const gradeTrend = Array.from(classes.reduce((map, item) => {
            const currentScore = sumClassScore(item.students);
            map.set(item.gradeName, (map.get(item.gradeName) ?? 0) + currentScore);
            return map;
        }, new Map())).map(([name, value]) => ({ name, value }));
        const ruleDistribution = Array.from(scoreRecords.reduce((map, item) => {
            const key = item.dimension || item.rule.dimension || item.sceneCode || '未分类';
            map.set(key, (map.get(key) ?? 0) + 1);
            return map;
        }, new Map()))
            .sort((left, right) => right[1] - left[1])
            .slice(0, 6)
            .map(([name, value]) => ({ name, value }));
        const subjectDistribution = Array.from(scoreRecords.reduce((map, item) => {
            const key = item.subjectCode || '通用';
            map.set(key, (map.get(key) ?? 0) + 1);
            return map;
        }, new Map()))
            .sort((left, right) => right[1] - left[1])
            .slice(0, 6)
            .map(([name, value]) => ({ name, value }));
        const topClasses = classes
            .map((item) => ({
            id: (0, bigint_util_1.toNumber)(item.id),
            name: item.name,
            currentScoreTotal: sumClassScore(item.students),
        }))
            .sort((left, right) => right.currentScoreTotal - left.currentScoreTotal)
            .slice(0, 8);
        const heatMapRows = ['早读', '上午', '午后', '晚辅'];
        const heatMapCols = ['一', '二', '三', '四', '五'];
        const heatMap = heatMapRows.map((rowName, rowIndex) => ({
            row: rowName,
            values: heatMapCols.map((_, colIndex) => {
                const count = scoreRecords.filter((record) => {
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
        const riskStudentMap = scoreRecords.reduce((map, item) => {
            const studentId = (0, bigint_util_1.toNumber)(item.studentId) ?? 0;
            const current = map.get(studentId) ?? {
                studentId,
                studentName: item.student.name,
                className: item.classroom.name,
                positiveCount: 0,
                negativeCount: 0,
                scoreDelta: 0,
            };
            current.scoreDelta += item.scoreDelta;
            if (item.sentiment === 'positive')
                current.positiveCount += 1;
            if (item.sentiment === 'negative')
                current.negativeCount += 1;
            map.set(studentId, current);
            return map;
        }, new Map());
        const riskStudents = Array.from(riskStudentMap.values())
            .map((item) => ({
            ...item,
            riskLevel: item.negativeCount >= 6 || item.scoreDelta <= -8
                ? 'high'
                : item.negativeCount >= 3 || item.scoreDelta < 0
                    ? 'medium'
                    : 'low',
            reason: item.negativeCount >= 6 || item.scoreDelta <= -8
                ? '近期负向事件偏多，积分回落明显'
                : item.negativeCount >= 3
                    ? '近阶段负向信号有聚集趋势'
                    : '已有零散负向信号，建议持续观察',
        }))
            .filter((item) => item.negativeCount > 0)
            .sort((left, right) => right.negativeCount - left.negativeCount || left.scoreDelta - right.scoreDelta)
            .slice(0, 6);
        const scopedClass = filters?.classId
            ? classes.find((item) => ((0, bigint_util_1.toNumber)(item.id) ?? 0) === filters.classId)
            : null;
        const fallbackSummary = this.buildAnalyticsSummary({
            gradeName: filters?.gradeName,
            className: scopedClass?.name,
            totalScore,
            averageScore,
            activeDays,
            ruleDistribution,
            subjectDistribution,
            topClasses,
            riskStudents,
        });
        const fallbackSuggestion = this.buildAnalyticsSuggestion({
            activeDays,
            subjectDistribution,
            ruleDistribution,
            riskStudents,
        });
        const fallbackReportSummary = this.buildAnalyticsReportSummary({
            gradeName: filters?.gradeName,
            className: scopedClass?.name,
            totalScore,
            averageScore,
            activeDays,
            ruleDistribution,
            subjectDistribution,
            riskStudents,
        });
        const aiInsight = scopedClass
            ? await this.resolveClassAnalyticsInsight({
                schoolId: (0, bigint_util_1.toNumber)(user.schoolId) ?? 0,
                classId: filters?.classId ?? ((0, bigint_util_1.toNumber)(scopedClass.id) ?? 0),
                className: scopedClass.name,
                gradeName: scopedClass.gradeName,
                regenerateAi: Boolean(filters?.regenerateAi),
                totalScore,
                averageScore,
                activeDays,
                gradeTrend,
                ruleDistribution,
                subjectDistribution,
                topClasses,
                riskStudents,
                fallbackSummary,
                fallbackSuggestion,
                fallbackReportSummary,
            })
            : await this.resolveGlobalAnalyticsInsight({
                schoolId: (0, bigint_util_1.toNumber)(user.schoolId) ?? 0,
                gradeName: filters?.gradeName,
                regenerateAi: Boolean(filters?.regenerateAi),
                totalScore,
                averageScore,
                activeDays,
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
                averageScore,
                activeDays,
                gradeTrend,
                ruleDistribution,
                subjectDistribution,
                topClasses,
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
    async analyticsReportStatus(authorization, classId, gradeName) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (!classId) {
            const cached = await this.readCachedAnalyticsInsight((0, bigint_util_1.toNumber)(user.schoolId) ?? 0, this.buildAnalyticsScopeKey(null, gradeName), this.getLocalDateString());
            return {
                code: 0,
                message: 'ok',
                data: {
                    hasTodayReport: Boolean(cached),
                    classId: null,
                    className: null,
                    reportDate: cached?.reportDate ?? this.getLocalDateString(),
                    generatedAt: cached?.generatedAt ?? null,
                    source: cached?.source ?? null,
                },
            };
        }
        const accessibleClassIds = await this.getAccessibleClassIds(user);
        if (accessibleClassIds !== null && !accessibleClassIds.includes(classId)) {
            throw new common_1.ForbiddenException('当前角色无权访问该班级');
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
            throw new common_1.NotFoundException('班级不存在');
        }
        const cached = await this.readCachedAnalyticsInsight((0, bigint_util_1.toNumber)(user.schoolId) ?? 0, this.buildAnalyticsScopeKey(classId), this.getLocalDateString());
        return {
            code: 0,
            message: 'ok',
            data: {
                hasTodayReport: Boolean(cached),
                classId,
                className: classroom.name,
                reportDate: cached?.reportDate ?? this.getLocalDateString(),
                generatedAt: cached?.generatedAt ?? null,
                source: cached?.source ?? null,
            },
        };
    }
    async listPets(authorization, category) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        const accessibleClassIds = await this.getAccessibleClassIds(user);
        const pets = await this.prisma.pet.findMany({
            where: {
                schoolId: user.schoolId,
                ...(category && category !== 'all' ? { category } : {}),
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
        });
        const filtered = pets
            .map((pet) => {
            const studentPets = accessibleClassIds === null
                ? pet.studentPets
                : pet.studentPets.filter((item) => accessibleClassIds.includes((0, bigint_util_1.toNumber)(item.student.classId) ?? -1));
            return {
                id: (0, bigint_util_1.toNumber)(pet.id),
                schoolId: (0, bigint_util_1.toNumber)(pet.schoolId),
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
                    needScoreTotal: stage.needScoreTotal,
                    animationKey: stage.animationKey,
                })),
            };
        })
            .filter((pet) => accessibleClassIds === null || pet.bindCount > 0 || ['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode));
        return { code: 0, message: 'ok', data: filtered };
    }
    async createPet(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManagePets(user.roleCode);
        const normalizedStages = this.normalizePetStages(body);
        const created = await this.prisma.$transaction(async (tx) => {
            const pet = await tx.pet.create({
                data: {
                    schoolId: user.schoolId,
                    code: body.code,
                    name: body.name,
                    category: body.category,
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
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(created.id) } };
    }
    async updatePet(authorization, id, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManagePets(user.roleCode);
        const normalizedStages = this.normalizePetStages(body);
        const exists = await this.prisma.pet.findFirst({
            where: {
                id: BigInt(id),
                schoolId: user.schoolId,
                status: 'enabled',
            },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException('萌宠不存在');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const pet = await tx.pet.update({
                where: { id: BigInt(id) },
                data: {
                    code: body.code,
                    name: body.name,
                    category: body.category,
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
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(updated.id) } };
    }
    async updatePetStatus(authorization, id, status) {
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
            throw new common_1.NotFoundException('萌宠不存在');
        }
        if (pet.sourceType === 'system' && status === 'disabled') {
            throw new common_1.ForbiddenException('系统图鉴不允许停用');
        }
        if (pet.sourceType === 'custom' && status === 'disabled' && pet._count.studentPets > 0) {
            throw new common_1.ForbiddenException('该自定义萌宠已有学生绑定，不能直接停用');
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
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(updated.id), status } };
    }
    async deletePet(authorization, id) {
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
            throw new common_1.NotFoundException('萌宠不存在');
        }
        if (pet.sourceType === 'system') {
            throw new common_1.ForbiddenException('系统图鉴不允许删除');
        }
        if (pet._count.studentPets > 0) {
            throw new common_1.ForbiddenException('该萌宠已有学生绑定，不能删除');
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
    async uploadPetAsset(authorization, file) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManagePets(user.roleCode);
        if (!file) {
            throw new common_1.BadRequestException('请选择要上传的图片');
        }
        if (!file.mimetype.startsWith('image/')) {
            throw new common_1.BadRequestException('仅支持上传图片文件');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new common_1.BadRequestException('图片大小不能超过 5MB');
        }
        const uploadsDir = (0, node_path_1.resolve)(process.cwd(), 'public/uploads/pets');
        await (0, promises_1.mkdir)(uploadsDir, { recursive: true });
        const extension = (0, node_path_1.extname)(file.originalname || '').toLowerCase() || '.png';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
        await (0, promises_1.writeFile)((0, node_path_1.resolve)(uploadsDir, fileName), file.buffer);
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
    buildAnalyticsSummary(input) {
        const scopeLabel = input.className ? `${input.className}` : input.gradeName ? `${input.gradeName}` : '当前筛选范围';
        if (input.totalScore === 0 && input.averageScore === 0 && input.activeDays === 0) {
            return `${scopeLabel}当前暂无有效积分与评价记录，班级学情数据尚未形成，暂时不能据此输出趋势判断。`;
        }
        const topRule = input.ruleDistribution[0]?.name ?? '未分类';
        const topSubject = input.subjectDistribution[0]?.name ?? '通用';
        const riskCount = input.riskStudents.length;
        return `${scopeLabel}累计积分 ${input.totalScore} 分，人均积分 ${input.averageScore} 分，近阶段共有 ${input.activeDays} 个活跃评价日。当前高频行为维度集中在“${topRule}”，主要发生在“${topSubject}”相关学习场景，需重点关注 ${riskCount} 名存在负向聚集信号的学生。`;
    }
    buildAnalyticsSuggestion(input) {
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
    buildAnalyticsReportSummary(input) {
        const scopeLabel = input.className ? `${input.className}` : input.gradeName ? `${input.gradeName}` : '全校';
        if (input.totalScore === 0 && input.averageScore === 0 && input.activeDays === 0) {
            return `${scopeLabel}当前暂无有效积分与评价记录，系统暂不输出趋势性结论。建议先完成班级日常评价数据采集后再生成汇报摘要。`;
        }
        const topRule = input.ruleDistribution[0]?.name ?? '未分类';
        const topSubject = input.subjectDistribution[0]?.name ?? '通用';
        const highRiskStudents = input.riskStudents.filter((item) => item.riskLevel === 'high').slice(0, 3);
        const riskLine = highRiskStudents.length > 0
            ? `需要重点关注的学生包括${highRiskStudents.map((item) => `${item.className}${item.studentName}`).join('、')}。`
            : '当前未发现高风险学生聚集现象。';
        return `${scopeLabel}当前累计积分为 ${input.totalScore} 分，人均积分 ${input.averageScore} 分，近阶段共有 ${input.activeDays} 个活跃评价日。行为记录主要集中在“${topRule}”维度，学科事件以“${topSubject}”为主。${riskLine}整体上，当前数据能够支撑学校开展阶段性汇报与班级跟进。`;
    }
    async resolveClassAnalyticsInsight(input) {
        const reportDate = this.getLocalDateString();
        if (input.totalScore === 0 && input.averageScore === 0 && input.activeDays === 0) {
            return {
                summary: input.fallbackSummary,
                suggestion: input.fallbackSuggestion,
                reportSummary: input.fallbackReportSummary,
                source: 'fallback',
                generatedAt: null,
                reportDate,
                classId: input.classId,
                className: input.className,
                isCached: false,
            };
        }
        const cached = input.regenerateAi
            ? null
            : await this.readCachedAnalyticsInsight(input.schoolId, this.buildAnalyticsScopeKey(input.classId), reportDate);
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
            totalScore: input.totalScore,
            averageScore: input.averageScore,
            activeDays: input.activeDays,
            gradeTrend: input.gradeTrend,
            ruleDistribution: input.ruleDistribution,
            subjectDistribution: input.subjectDistribution,
            topClasses: input.topClasses,
            riskStudents: input.riskStudents,
            fallbackSummary: input.fallbackSummary,
            fallbackSuggestion: input.fallbackSuggestion,
            fallbackReportSummary: input.fallbackReportSummary,
        });
        await this.writeCachedAnalyticsInsight(input.schoolId, this.buildAnalyticsScopeKey(input.classId), {
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
    async resolveGlobalAnalyticsInsight(input) {
        const reportDate = this.getLocalDateString();
        const scopeKey = this.buildAnalyticsScopeKey(null, input.gradeName);
        if (input.totalScore === 0 && input.averageScore === 0 && input.activeDays === 0) {
            return {
                summary: input.fallbackSummary,
                suggestion: input.fallbackSuggestion,
                reportSummary: input.fallbackReportSummary,
                source: 'fallback',
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
            totalScore: input.totalScore,
            averageScore: input.averageScore,
            activeDays: input.activeDays,
            gradeTrend: input.gradeTrend,
            ruleDistribution: input.ruleDistribution,
            subjectDistribution: input.subjectDistribution,
            topClasses: input.topClasses,
            riskStudents: input.riskStudents,
            fallbackSummary: input.fallbackSummary,
            fallbackSuggestion: input.fallbackSuggestion,
            fallbackReportSummary: input.fallbackReportSummary,
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
    async generateAnalyticsInsightWithArk(input) {
        const apiKey = this.configService.get('ARK_API_KEY');
        const apiUrl = this.configService.get('ARK_API_URL') || 'https://ark.cn-beijing.volces.com/api/v3/responses';
        const model = this.configService.get('ARK_MODEL') || 'deepseek-v3-2-251201';
        const timeoutMs = Number(this.configService.get('ARK_TIMEOUT_MS') || 30000);
        if (!apiKey) {
            return {
                summary: input.fallbackSummary,
                suggestion: input.fallbackSuggestion,
                reportSummary: input.fallbackReportSummary,
                source: 'fallback',
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
                                        'summary 控制在 140 字以内，suggestion 控制在 90 字以内，reportSummary 控制在 220 字以内。',
                                    ].join(' '),
                                },
                            ],
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'input_text',
                                    text: JSON.stringify({
                                        scope: {
                                            gradeName: input.gradeName || null,
                                            className: input.className || null,
                                        },
                                        totalScore: input.totalScore,
                                        averageScore: input.averageScore,
                                        activeDays: input.activeDays,
                                        gradeTrend: input.gradeTrend,
                                        ruleDistribution: input.ruleDistribution,
                                        subjectDistribution: input.subjectDistribution,
                                        topClasses: input.topClasses,
                                        riskStudents: input.riskStudents,
                                    }, null, 2),
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
            const payload = (await response.json());
            const outputText = payload.output_text?.trim() ||
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
                source: 'ark',
            };
        }
        catch {
            return {
                summary: input.fallbackSummary,
                suggestion: input.fallbackSuggestion,
                reportSummary: input.fallbackReportSummary,
                source: 'fallback',
            };
        }
        finally {
            clearTimeout(timeout);
        }
    }
    parseInsightJson(text, fallbackSummary, fallbackSuggestion, fallbackReportSummary) {
        if (!text) {
            return { summary: fallbackSummary, suggestion: fallbackSuggestion, reportSummary: fallbackReportSummary };
        }
        const parse = (raw) => {
            const obj = JSON.parse(raw);
            return {
                summary: obj.summary?.trim() || fallbackSummary,
                suggestion: obj.suggestion?.trim() || fallbackSuggestion,
                reportSummary: obj.reportSummary?.trim() || fallbackReportSummary,
            };
        };
        try {
            return parse(text);
        }
        catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    return parse(match[0]);
                }
                catch {
                    return { summary: fallbackSummary, suggestion: fallbackSuggestion, reportSummary: fallbackReportSummary };
                }
            }
            return { summary: fallbackSummary, suggestion: fallbackSuggestion, reportSummary: fallbackReportSummary };
        }
    }
    getLocalDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    buildAnalyticsScopeKey(classId, gradeName) {
        if (classId)
            return `class-${classId}`;
        return gradeName ? `global-grade-${gradeName}` : 'global-all';
    }
    getAnalyticsInsightCachePath(schoolId, scopeKey, reportDate) {
        return (0, node_path_1.resolve)(process.cwd(), '.cache', 'ai-class-insights', String(schoolId), `${scopeKey}-${reportDate}.json`);
    }
    async readCachedAnalyticsInsight(schoolId, scopeKey, reportDate) {
        try {
            const content = await (0, promises_1.readFile)(this.getAnalyticsInsightCachePath(schoolId, scopeKey, reportDate), 'utf8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    async writeCachedAnalyticsInsight(schoolId, scopeKey, payload) {
        const filePath = this.getAnalyticsInsightCachePath(schoolId, scopeKey, payload.reportDate);
        await (0, promises_1.mkdir)((0, node_path_1.dirname)(filePath), { recursive: true });
        await (0, promises_1.writeFile)(filePath, JSON.stringify(payload, null, 2), 'utf8');
    }
    normalizePetStages(body) {
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
            throw new common_1.BadRequestException('请完整配置 10 个等级阶段图片');
        }
        stages.forEach((stage, index) => {
            const expected = index + 1;
            if (stage.stageNo !== expected || stage.levelNo !== expected) {
                throw new common_1.BadRequestException('萌宠阶段必须从 1 到 10 依次配置');
            }
            if (!stage.name) {
                throw new common_1.BadRequestException(`请填写 Lv.${expected} 阶段名称`);
            }
            if (!stage.imageUrl) {
                throw new common_1.BadRequestException(`请上传 Lv.${expected} 阶段图片`);
            }
            if (index > 0 && stage.needScoreTotal < stages[index - 1].needScoreTotal) {
                throw new common_1.BadRequestException('阶段所需累计积分必须递增');
            }
        });
        return stages;
    }
    resolveCoverUrl(body, stages) {
        return body.coverUrl?.trim() || stages.find((stage) => stage.stageNo === 1)?.imageUrl || stages[0]?.imageUrl;
    }
    ensureCanManagePets(roleCode) {
        if (!['super_admin', 'school_admin', 'moral_admin'].includes(roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权维护萌宠图鉴');
        }
    }
    async getAccessibleClassIds(user) {
        if (['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
            return null;
        }
        return user.scopes
            .map((scope) => (0, bigint_util_1.toNumber)(scope.classId))
            .filter((item) => item !== null);
    }
};
exports.AdminInsightsService = AdminInsightsService;
exports.AdminInsightsService = AdminInsightsService = __decorate([
    (0, common_2.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        operation_log_service_1.OperationLogService,
        config_1.ConfigService])
], AdminInsightsService);
//# sourceMappingURL=admin-insights.service.js.map