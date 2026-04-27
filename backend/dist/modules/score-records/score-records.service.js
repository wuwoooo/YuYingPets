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
exports.ScoreRecordsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const bigint_util_1 = require("../../common/utils/bigint.util");
const operation_log_service_1 = require("../operation-log/operation-log.service");
const realtime_service_1 = require("../realtime/realtime.service");
const pet_growth_util_1 = require("../../common/utils/pet-growth.util");
let ScoreRecordsService = class ScoreRecordsService {
    constructor(prisma, authService, operationLogService, realtimeService) {
        this.prisma = prisma;
        this.authService = authService;
        this.operationLogService = operationLogService;
        this.realtimeService = realtimeService;
    }
    async list(query) {
        const scoreRecordWhere = {
            classId: query.classId ? BigInt(query.classId) : undefined,
            studentId: query.studentId ? BigInt(query.studentId) : undefined,
            subjectCode: query.subjectCode || undefined,
        };
        const [scoreRows, rewardOrderRows] = await Promise.all([
            this.prisma.scoreRecord.findMany({
                where: scoreRecordWhere,
                include: {
                    rule: {
                        select: { name: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
            query.subjectCode
                ? Promise.resolve([])
                : this.prisma.rewardOrder.findMany({
                    where: {
                        classId: query.classId ? BigInt(query.classId) : undefined,
                        studentId: query.studentId ? BigInt(query.studentId) : undefined,
                    },
                    include: {
                        reward: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                }),
        ]);
        const scoreItems = scoreRows.map(({ rule, ...row }) => ({
            ...row,
            id: (0, bigint_util_1.toNumber)(row.id),
            schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
            semesterId: (0, bigint_util_1.toNumber)(row.semesterId),
            classId: (0, bigint_util_1.toNumber)(row.classId),
            studentId: (0, bigint_util_1.toNumber)(row.studentId),
            classGroupId: (0, bigint_util_1.toNumber)(row.classGroupId),
            ruleId: (0, bigint_util_1.toNumber)(row.ruleId),
            operatorId: (0, bigint_util_1.toNumber)(row.operatorId),
            ruleName: rule?.name ?? null,
        }));
        const rewardOrderItems = rewardOrderRows.map((row) => ({
            id: -Number(row.id),
            schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
            semesterId: null,
            classId: (0, bigint_util_1.toNumber)(row.classId),
            studentId: (0, bigint_util_1.toNumber)(row.studentId),
            classGroupId: null,
            ruleId: null,
            subjectCode: null,
            sceneCode: 'reward_redeem',
            dimension: '奖励兑换',
            tag: row.reward.name,
            sentiment: 'negative',
            scoreDelta: -Math.abs(row.scoreCost),
            remark: `兑换奖励：${row.reward.name}`,
            sourceTerminal: row.sourceTerminal,
            sourceRole: row.operatorRole,
            operatorId: (0, bigint_util_1.toNumber)(row.operatorId),
            operatorName: null,
            ruleName: `兑换奖励：${row.reward.name}`,
            createdAt: row.createdAt,
        }));
        const rows = [...scoreItems, ...rewardOrderItems]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 100);
        return {
            code: 0,
            message: 'ok',
            data: rows,
        };
    }
    async create(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanWriteScore(user.roleCode, body.sourceTerminal);
        this.authService.ensureCanAccessClass(user, body.classId);
        const result = await this.prisma.$transaction(async (tx) => {
            const target = await this.loadSingleTarget(tx, body.classId, body.studentId, body.ruleId);
            this.authService.ensureCanUseRuleForClass(user, body.classId, target.rule);
            const created = await this.createScoreRecordForStudent(tx, {
                schoolId: target.schoolId,
                semesterId: target.semesterId,
                classId: BigInt(body.classId),
                studentId: BigInt(body.studentId),
                classGroupId: target.classGroupId,
                rule: target.rule,
                operatorId: user.id,
                operatorName: user.name,
                sourceTerminal: body.sourceTerminal,
                sourceRole: user.roleCode,
                remark: body.remark,
            });
            return created;
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: body.sourceTerminal,
            module: 'score_record',
            action: 'create',
            targetType: 'student',
            targetId: BigInt(body.studentId),
            detail: {
                classId: body.classId,
                ruleId: body.ruleId,
                remark: body.remark,
            },
        });
        this.realtimeService.emitClassScoreChanged(body.classId, {
            classId: body.classId,
            studentIds: [body.studentId],
            sourceTerminal: body.sourceTerminal,
            operatorName: user.name,
            upgrades: result.petUpgrade.upgraded
                ? [
                    {
                        studentId: body.studentId,
                        beforeLevel: result.petUpgrade.beforeLevel,
                        afterLevel: result.petUpgrade.afterLevel,
                    },
                ]
                : [],
        });
        return { code: 0, message: 'ok', data: result };
    }
    async batch(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanWriteScore(user.roleCode, body.sourceTerminal);
        this.authService.ensureCanAccessClass(user, body.classId);
        const result = await this.prisma.$transaction(async (tx) => {
            const rule = await tx.scoreRule.findFirst({
                where: { id: BigInt(body.ruleId), deletedAt: null, status: 'enabled' },
            });
            if (!rule)
                throw new common_1.NotFoundException('积分规则不存在');
            this.authService.ensureCanUseRuleForClass(user, body.classId, rule);
            const batch = await tx.scoreRecordBatch.create({
                data: {
                    schoolId: user.schoolId,
                    classId: BigInt(body.classId),
                    actionType: 'batch',
                    ruleId: rule.id,
                    scoreDelta: this.resolveSignedValue(rule.scoreType, rule.scoreValue),
                    remark: body.remark,
                    sourceTerminal: body.sourceTerminal,
                    operatorId: user.id,
                },
            });
            const items = [];
            for (const studentId of body.studentIds) {
                const target = await this.loadSingleTarget(tx, body.classId, studentId, body.ruleId);
                const created = await this.createScoreRecordForStudent(tx, {
                    schoolId: target.schoolId,
                    semesterId: target.semesterId,
                    classId: BigInt(body.classId),
                    studentId: BigInt(studentId),
                    classGroupId: target.classGroupId,
                    rule: target.rule,
                    operatorId: user.id,
                    operatorName: user.name,
                    sourceTerminal: body.sourceTerminal,
                    sourceRole: user.roleCode,
                    remark: body.remark,
                });
                await tx.scoreRecordBatchItem.create({
                    data: {
                        batchId: batch.id,
                        scoreRecordId: BigInt(created.scoreRecordId),
                        studentId: BigInt(studentId),
                    },
                });
                items.push(created);
            }
            return {
                batchId: (0, bigint_util_1.toNumber)(batch.id),
                items,
            };
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: body.sourceTerminal,
            module: 'score_record',
            action: 'batch_create',
            targetType: 'class',
            targetId: BigInt(body.classId),
            detail: {
                classId: body.classId,
                ruleId: body.ruleId,
                studentIds: body.studentIds,
                remark: body.remark,
            },
        });
        this.realtimeService.emitClassScoreChanged(body.classId, {
            classId: body.classId,
            studentIds: body.studentIds,
            sourceTerminal: body.sourceTerminal,
            operatorName: user.name,
            batchId: result.batchId,
            upgrades: result.items
                .filter((item) => item.petUpgrade?.upgraded)
                .map((item) => ({
                studentId: item.studentProfile.studentId,
                beforeLevel: item.petUpgrade.beforeLevel,
                afterLevel: item.petUpgrade.afterLevel,
            })),
        });
        return { code: 0, message: 'ok', data: result };
    }
    async group(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanWriteScore(user.roleCode, body.sourceTerminal);
        this.authService.ensureCanAccessClass(user, body.classId);
        const members = await this.prisma.studentGroupRel.findMany({
            where: { classGroupId: BigInt(body.classGroupId) },
            select: { studentId: true },
        });
        const result = await this.batch(authorization, {
            classId: body.classId,
            studentIds: members.map((item) => Number(item.studentId)),
            ruleId: body.ruleId,
            remark: body.remark,
            sourceTerminal: body.sourceTerminal,
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: body.sourceTerminal,
            module: 'score_record',
            action: 'group_create',
            targetType: 'class_group',
            targetId: BigInt(body.classGroupId),
            detail: {
                classId: body.classId,
                classGroupId: body.classGroupId,
                ruleId: body.ruleId,
            },
        });
        return result;
    }
    reverse(id) {
        return { code: 0, message: 'ok', data: { id } };
    }
    ensureCanWriteScore(roleCode, sourceTerminal) {
        if (sourceTerminal === 'display' && roleCode === 'display_account') {
            throw new common_1.ForbiddenException('展示端账号不能执行加减分');
        }
        if (!['homeroom_teacher', 'subject_teacher', 'school_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权执行评价');
        }
    }
    resolveSignedValue(scoreType, value) {
        return scoreType === 'deduct' ? -Math.abs(value) : Math.abs(value);
    }
    async loadSingleTarget(tx, classId, studentId, ruleId) {
        const student = await tx.student.findFirst({
            where: {
                id: BigInt(studentId),
                classId: BigInt(classId),
                deletedAt: null,
                status: 'enabled',
            },
            include: {
                classroom: true,
                groupRel: true,
            },
        });
        if (!student)
            throw new common_1.NotFoundException('学生不存在');
        const rule = await tx.scoreRule.findFirst({
            where: {
                id: BigInt(ruleId),
                deletedAt: null,
                status: 'enabled',
            },
        });
        if (!rule)
            throw new common_1.NotFoundException('积分规则不存在');
        return {
            schoolId: student.schoolId,
            semesterId: student.classroom.semesterId,
            classGroupId: student.groupRel?.classGroupId ?? null,
            rule,
        };
    }
    async createScoreRecordForStudent(tx, params) {
        const scoreDelta = this.resolveSignedValue(params.rule.scoreType, params.rule.scoreValue);
        const profile = await tx.studentProfile.upsert({
            where: { studentId: params.studentId },
            create: {
                studentId: params.studentId,
                classId: params.classId,
                currentScore: scoreDelta,
                totalScore: Math.max(scoreDelta, 0),
                currentPetLevel: 1,
                lastScoreAt: new Date(),
            },
            update: {
                classId: params.classId,
                currentScore: { increment: scoreDelta },
                totalScore: { increment: Math.max(scoreDelta, 0) },
                positiveCount7d: params.rule.sentiment === 'positive' ? { increment: 1 } : undefined,
                negativeCount7d: params.rule.sentiment === 'negative' ? { increment: 1 } : undefined,
                lastScoreAt: new Date(),
            },
        });
        const record = await tx.scoreRecord.create({
            data: {
                schoolId: params.schoolId,
                semesterId: params.semesterId,
                classId: params.classId,
                studentId: params.studentId,
                classGroupId: params.classGroupId,
                ruleId: params.rule.id,
                subjectCode: params.rule.subjectCode,
                sceneCode: params.rule.sceneCode,
                dimension: params.rule.dimension,
                tag: params.rule.tag,
                sentiment: params.rule.sentiment,
                scoreDelta,
                remark: params.remark,
                sourceTerminal: params.sourceTerminal,
                sourceRole: params.sourceRole,
                operatorId: params.operatorId,
                operatorName: params.operatorName,
            },
        });
        const studentPet = await tx.studentPet.findUnique({
            where: { studentId: params.studentId },
            include: {
                student: {
                    select: {
                        school: {
                            select: {
                                petGrowthThresholds: true,
                            },
                        },
                    },
                },
                pet: { include: { stages: { orderBy: { stageNo: 'asc' } } } },
            },
        });
        let petUpgrade = { upgraded: false };
        if (studentPet) {
            const nextScore = studentPet.totalScore + Math.max(scoreDelta, 0);
            const thresholds = (0, pet_growth_util_1.normalizePetGrowthThresholds)(studentPet.student.school.petGrowthThresholds);
            const matchedStage = (0, pet_growth_util_1.resolveMatchedPetStage)(studentPet.pet.stages, nextScore, thresholds);
            if (matchedStage && matchedStage.levelNo > studentPet.currentLevel) {
                await tx.studentPet.update({
                    where: { id: studentPet.id },
                    data: {
                        totalScore: nextScore,
                        currentLevel: matchedStage.levelNo,
                        currentStageNo: matchedStage.stageNo,
                    },
                });
                await tx.studentProfile.update({
                    where: { studentId: params.studentId },
                    data: { currentPetLevel: matchedStage.levelNo },
                });
                await tx.petLevelLog.create({
                    data: {
                        studentPetId: studentPet.id,
                        studentId: params.studentId,
                        beforeLevel: studentPet.currentLevel,
                        afterLevel: matchedStage.levelNo,
                        beforeStageNo: studentPet.currentStageNo,
                        afterStageNo: matchedStage.stageNo,
                        triggerScoreRecordId: record.id,
                    },
                });
                petUpgrade = {
                    upgraded: true,
                    beforeLevel: studentPet.currentLevel,
                    afterLevel: matchedStage.levelNo,
                };
            }
            else {
                await tx.studentPet.update({
                    where: { id: studentPet.id },
                    data: {
                        totalScore: nextScore,
                    },
                });
            }
        }
        return {
            scoreRecordId: Number(record.id),
            studentProfile: {
                studentId: (0, bigint_util_1.toNumber)(params.studentId),
                currentScore: profile.currentScore,
                currentPetLevel: profile.currentPetLevel,
            },
            petUpgrade,
        };
    }
};
exports.ScoreRecordsService = ScoreRecordsService;
exports.ScoreRecordsService = ScoreRecordsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        operation_log_service_1.OperationLogService,
        realtime_service_1.RealtimeService])
], ScoreRecordsService);
//# sourceMappingURL=score-records.service.js.map