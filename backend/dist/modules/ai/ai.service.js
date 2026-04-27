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
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const bigint_util_1 = require("../../common/utils/bigint.util");
const operation_log_service_1 = require("../operation-log/operation-log.service");
const realtime_service_1 = require("../realtime/realtime.service");
let AiService = class AiService {
    constructor(prisma, authService, operationLogService, realtimeService, configService) {
        this.prisma = prisma;
        this.authService = authService;
        this.operationLogService = operationLogService;
        this.realtimeService = realtimeService;
        this.configService = configService;
    }
    async summary(authorization, studentId, periodType = 'weekly') {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        const student = await this.loadStudent(studentId);
        this.authService.ensureCanAccessClass(user, student.classId);
        const snapshot = await this.prisma.aiStudentSnapshot.findFirst({
            where: {
                studentId: BigInt(studentId),
                periodType,
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            code: 0,
            message: 'ok',
            data: snapshot ? this.serializeSnapshot(snapshot, studentId) : null,
        };
    }
    async generate(authorization, studentId, periodType = 'weekly') {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (!['homeroom_teacher', 'subject_teacher', 'school_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(user.roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权生成学情摘要');
        }
        const student = await this.loadStudent(studentId);
        this.authService.ensureCanAccessClass(user, student.classId);
        const scoreRecords = await this.prisma.scoreRecord.findMany({
            where: {
                studentId: BigInt(studentId),
            },
            include: {
                rule: {
                    select: {
                        name: true,
                        aiSummaryText: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: periodType === 'weekly' ? 50 : 200,
        });
        const teacherObservations = await this.prisma.teacherObservation.findMany({
            where: {
                studentId: BigInt(studentId),
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        const positiveSummary = this.buildSentimentSummary(scoreRecords, 'positive');
        const negativeSummary = this.buildSentimentSummary(scoreRecords, 'negative');
        const dimensionSummary = this.buildDimensionSummary(scoreRecords);
        const subjectSummary = this.buildSubjectSummary(scoreRecords);
        const sceneSummary = this.buildSceneSummary(scoreRecords);
        const trendSummary = this.buildTrendSummary(scoreRecords);
        const evidence = this.buildEvidence(scoreRecords);
        const fallbackSummary = this.buildAiSummary(student.name, periodType, positiveSummary, negativeSummary, dimensionSummary, subjectSummary, trendSummary);
        const fallbackSuggestion = this.buildAiSuggestion(positiveSummary, negativeSummary, dimensionSummary, subjectSummary, sceneSummary, trendSummary);
        const llmResult = await this.generateWithArk({
            studentName: student.name,
            className: student.className,
            periodType,
            positiveSummary,
            negativeSummary,
            dimensionSummary,
            subjectSummary,
            sceneSummary,
            trendSummary,
            evidence,
            teacherObservations: teacherObservations.map((item) => ({
                observationType: item.observationType,
                content: item.content,
                createdAt: item.createdAt.toISOString(),
            })),
            fallbackSummary,
            fallbackSuggestion,
        });
        const snapshotDate = new Date();
        const snapshot = await this.prisma.aiStudentSnapshot.create({
            data: {
                schoolId: student.schoolId,
                semesterId: student.semesterId,
                classId: student.classId,
                studentId: BigInt(studentId),
                snapshotDate,
                periodType: periodType,
                positiveSummary,
                negativeSummary,
                dimensionSummary,
                trendSummary: {
                    ...trendSummary,
                    subjectSummary,
                    sceneSummary,
                    evidence,
                },
                aiSummary: llmResult.aiSummary,
                aiSuggestion: llmResult.aiSuggestion,
                generatedBy: 'manual',
            },
        });
        const result = {
            code: 0,
            message: 'ok',
            data: {
                id: (0, bigint_util_1.toNumber)(snapshot.id),
                studentId,
                classId: Number(student.classId),
                periodType: snapshot.periodType,
                generatedBy: snapshot.generatedBy,
                positiveSummary,
                negativeSummary,
                dimensionSummary,
                trendSummary: {
                    ...trendSummary,
                    subjectSummary,
                    sceneSummary,
                    evidence,
                },
                aiSummary: llmResult.aiSummary,
                aiSuggestion: llmResult.aiSuggestion,
            },
        };
        await this.operationLogService.create({
            schoolId: student.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: 'admin',
            module: 'ai_student_snapshot',
            action: 'generate',
            targetType: 'student',
            targetId: BigInt(studentId),
            detail: {
                classId: Number(student.classId),
                periodType,
                snapshotId: result.data.id,
            },
        });
        this.realtimeService.emitAiSummaryGenerated(Number(student.classId), {
            classId: Number(student.classId),
            studentId,
            periodType,
            snapshotId: result.data.id,
        });
        return result;
    }
    async loadStudent(studentId) {
        const student = await this.prisma.student.findFirst({
            where: {
                id: BigInt(studentId),
                deletedAt: null,
                status: 'enabled',
            },
            include: {
                classroom: true,
            },
        });
        if (!student) {
            throw new common_1.NotFoundException('学生不存在');
        }
        return {
            id: student.id,
            schoolId: student.schoolId,
            classId: student.classId,
            className: student.classroom.name,
            semesterId: student.classroom.semesterId,
            name: student.name,
        };
    }
    serializeSnapshot(snapshot, studentId) {
        return {
            id: (0, bigint_util_1.toNumber)(snapshot.id) ?? 0,
            studentId,
            classId: (0, bigint_util_1.toNumber)(snapshot.classId) ?? 0,
            periodType: snapshot.periodType,
            snapshotDate: snapshot.snapshotDate,
            positiveSummary: snapshot.positiveSummary,
            negativeSummary: snapshot.negativeSummary,
            dimensionSummary: snapshot.dimensionSummary,
            trendSummary: snapshot.trendSummary,
            aiSummary: snapshot.aiSummary,
            aiSuggestion: snapshot.aiSuggestion,
        };
    }
    buildSentimentSummary(records, sentiment) {
        const targetRecords = records.filter((item) => item.sentiment === sentiment);
        return {
            count: targetRecords.length,
            scoreDelta: targetRecords.reduce((sum, item) => sum + item.scoreDelta, 0),
        };
    }
    buildDimensionSummary(records) {
        const counter = new Map();
        for (const item of records) {
            const dimension = item.dimension || item.tag || item.sceneCode || '未分类';
            const current = counter.get(dimension) ?? {
                dimension,
                count: 0,
                positiveCount: 0,
                negativeCount: 0,
            };
            current.count += 1;
            if (item.sentiment === 'positive')
                current.positiveCount += 1;
            if (item.sentiment === 'negative')
                current.negativeCount += 1;
            counter.set(dimension, current);
        }
        return [...counter.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }
    buildSubjectSummary(records) {
        const counter = new Map();
        for (const item of records) {
            const subject = item.subjectCode || '通用';
            const current = counter.get(subject) ?? {
                subject,
                count: 0,
                positiveCount: 0,
                negativeCount: 0,
            };
            current.count += 1;
            if (item.sentiment === 'positive')
                current.positiveCount += 1;
            if (item.sentiment === 'negative')
                current.negativeCount += 1;
            counter.set(subject, current);
        }
        return [...counter.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }
    buildSceneSummary(records) {
        const counter = new Map();
        for (const item of records) {
            const scene = item.sceneCode || '未标记';
            const current = counter.get(scene) ?? {
                scene,
                count: 0,
                positiveCount: 0,
                negativeCount: 0,
            };
            current.count += 1;
            if (item.sentiment === 'positive')
                current.positiveCount += 1;
            if (item.sentiment === 'negative')
                current.negativeCount += 1;
            counter.set(scene, current);
        }
        return [...counter.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }
    buildTrendSummary(records) {
        const totalScoreDelta = records.reduce((sum, item) => sum + item.scoreDelta, 0);
        const totalExpDelta = records.reduce((sum, item) => sum + (item.expDelta ?? 0), 0);
        const positiveCount = records.filter((item) => item.sentiment === 'positive').length;
        const recentWindow = records.slice(0, Math.min(10, records.length));
        const recentTrendScore = recentWindow.reduce((sum, item) => sum + item.scoreDelta, 0);
        return {
            totalScoreDelta,
            totalExpDelta,
            positiveRatio: records.length ? Number((positiveCount / records.length).toFixed(2)) : 0,
            recentTrend: recentTrendScore > 2 ? 'up' : recentTrendScore < -2 ? 'down' : 'flat',
            activeDays: new Set(records.map((item) => item.createdAt.toISOString().slice(0, 10))).size,
        };
    }
    buildEvidence(records) {
        return records.slice(0, 8).map((item) => ({
            date: item.createdAt.toISOString().slice(0, 10),
            subject: item.subjectCode || '通用',
            scene: item.sceneCode || '未标记',
            ruleName: item.rule.name,
            sentiment: item.sentiment,
            scoreDelta: item.scoreDelta,
            remark: item.remark,
            signal: item.rule.aiSummaryText || item.dimension || item.tag || item.sceneCode || item.rule.name,
        }));
    }
    buildAiSummary(studentName, periodType, positiveSummary, negativeSummary, dimensionSummary, subjectSummary, trendSummary) {
        const periodLabel = periodType === 'weekly' ? '本周' : '本月';
        const topDimension = dimensionSummary.length > 0 ? dimensionSummary[0].dimension : '暂未形成明显行为集中项';
        const topSubject = subjectSummary.length > 0 ? subjectSummary[0].subject : '通用场景';
        const trendText = trendSummary.recentTrend === 'up'
            ? '最近状态呈上升趋势'
            : trendSummary.recentTrend === 'down'
                ? '最近状态有回落迹象'
                : '最近整体较为平稳';
        return `${studentName}${periodLabel}累计正向表现${positiveSummary.count}次，负向表现${negativeSummary.count}次，积分净变化${trendSummary.totalScoreDelta}分。高频关注点集中在“${topDimension}”，主要发生在“${topSubject}”相关学习场景，${trendText}。`;
    }
    buildAiSuggestion(positiveSummary, negativeSummary, dimensionSummary, subjectSummary, sceneSummary, trendSummary) {
        if (negativeSummary.count > positiveSummary.count) {
            const topRiskDimension = dimensionSummary.find((item) => item.negativeCount > 0)?.dimension ?? '课堂学习';
            return `建议班主任优先围绕“${topRiskDimension}”制定一周内可执行的小目标，并结合课堂提醒与作业跟进做短周期复盘。`;
        }
        if (trendSummary.recentTrend === 'down') {
            const scene = sceneSummary.find((item) => item.negativeCount > 0)?.scene ?? '课堂';
            return `建议近期重点关注“${scene}”场景中的状态波动，补充即时正反馈，避免学生从阶段性松动转为持续下滑。`;
        }
        if (subjectSummary.length > 0) {
            return `建议继续强化“${subjectSummary[0].subject}”相关正向反馈，并把当前优势迁移到作业与测评等关键学习环节，帮助学生稳定输出。`;
        }
        return '建议继续积累课堂、作业和测评场景数据，保持教师观察记录与规则评价同步，便于后续形成更稳定的学情画像。';
    }
    async generateWithArk(input) {
        const apiKey = this.configService.get('ARK_API_KEY');
        const apiUrl = this.configService.get('ARK_API_URL') || 'https://ark.cn-beijing.volces.com/api/v3/responses';
        const model = this.configService.get('ARK_MODEL') || 'deepseek-v3-2-251201';
        const timeoutMs = Number(this.configService.get('ARK_TIMEOUT_MS') || 30000);
        if (!apiKey) {
            return {
                aiSummary: input.fallbackSummary,
                aiSuggestion: input.fallbackSuggestion,
            };
        }
        const periodLabel = input.periodType === 'weekly' ? '本周' : '本月';
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
                                        '你是校内学情分析助手。',
                                        '你只允许基于提供的数据进行判断，不夸大，不臆测。',
                                        '输出必须正式、克制、适合班主任与学校管理场景。',
                                        '请严格输出 JSON，字段只有 aiSummary 和 aiSuggestion，两个字段都必须是字符串。',
                                        'aiSummary 控制在 120 字以内，aiSuggestion 控制在 80 字以内。',
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
                                        studentName: input.studentName,
                                        className: input.className,
                                        period: periodLabel,
                                        metrics: {
                                            positiveSummary: input.positiveSummary,
                                            negativeSummary: input.negativeSummary,
                                            trendSummary: input.trendSummary,
                                        },
                                        dimensionSummary: input.dimensionSummary,
                                        subjectSummary: input.subjectSummary,
                                        sceneSummary: input.sceneSummary,
                                        evidence: input.evidence,
                                        teacherObservations: input.teacherObservations,
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
            const outputText = this.extractArkOutputText(payload);
            const parsed = this.parseArkOutput(outputText);
            return {
                aiSummary: parsed.aiSummary || input.fallbackSummary,
                aiSuggestion: parsed.aiSuggestion || input.fallbackSuggestion,
            };
        }
        catch {
            return {
                aiSummary: input.fallbackSummary,
                aiSuggestion: input.fallbackSuggestion,
            };
        }
        finally {
            clearTimeout(timeout);
        }
    }
    extractArkOutputText(payload) {
        if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
            return payload.output_text.trim();
        }
        const text = payload.output
            ?.flatMap((item) => item.content ?? [])
            .filter((item) => item.type === 'output_text' || item.type === 'text')
            .map((item) => item.text ?? '')
            .join('\n')
            .trim();
        return text || '';
    }
    parseArkOutput(text) {
        if (!text) {
            return {
                aiSummary: '',
                aiSuggestion: '',
            };
        }
        try {
            return JSON.parse(text);
        }
        catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) {
                return {
                    aiSummary: text.slice(0, 120),
                    aiSuggestion: '',
                };
            }
            try {
                return JSON.parse(match[0]);
            }
            catch {
                return {
                    aiSummary: text.slice(0, 120),
                    aiSuggestion: '',
                };
            }
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        operation_log_service_1.OperationLogService,
        realtime_service_1.RealtimeService,
        config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map