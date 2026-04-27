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
exports.RewardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const bigint_util_1 = require("../../common/utils/bigint.util");
const operation_log_service_1 = require("../operation-log/operation-log.service");
const realtime_service_1 = require("../realtime/realtime.service");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
let RewardsService = class RewardsService {
    constructor(prisma, authService, operationLogService, realtimeService) {
        this.prisma = prisma;
        this.authService = authService;
        this.operationLogService = operationLogService;
        this.realtimeService = realtimeService;
    }
    async list(authorization, query) {
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
                    id: (0, bigint_util_1.toNumber)(row.id),
                    schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
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
                id: (0, bigint_util_1.toNumber)(row.id),
                schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
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
    async create(authorization, body) {
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
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(created.id) } };
    }
    async update(authorization, id, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManageRewards(user.roleCode);
        const exists = await this.prisma.reward.findFirst({
            where: { id: BigInt(id), schoolId: user.schoolId, status: 'enabled' },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException('奖励不存在');
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
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(updated.id) } };
    }
    async uploadRewardAsset(authorization, file) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManageRewards(user.roleCode);
        if (!file) {
            throw new common_1.BadRequestException('请选择要上传的图片');
        }
        if (!file.mimetype.startsWith('image/')) {
            throw new common_1.BadRequestException('仅支持上传图片文件');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new common_1.BadRequestException('图片大小不能超过 5MB');
        }
        const uploadsDir = (0, node_path_1.resolve)(process.cwd(), 'public/uploads/rewards');
        await (0, promises_1.mkdir)(uploadsDir, { recursive: true });
        const extension = (0, node_path_1.extname)(file.originalname || '').toLowerCase() || '.png';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
        await (0, promises_1.writeFile)((0, node_path_1.resolve)(uploadsDir, fileName), file.buffer);
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
    async updateStatus(authorization, id, status) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManageRewards(user.roleCode);
        const reward = await this.prisma.reward.findFirst({
            where: {
                id: BigInt(id),
                schoolId: user.schoolId,
            },
        });
        if (!reward) {
            throw new common_1.NotFoundException('奖励不存在');
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
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(updated.id), status } };
    }
    async deleteReward(authorization, id) {
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
            throw new common_1.NotFoundException('奖励不存在');
        }
        if (reward._count.rewardOrders > 0) {
            throw new common_1.ForbiddenException('该奖励已有兑换记录，不能删除');
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
    async orders(authorization, query) {
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
        const filteredRows = ['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)
            ? rows
            : rows.filter((row) => this.authService.canAccessClass(user, row.classId));
        return {
            code: 0,
            message: 'ok',
            data: filteredRows.map((row) => ({
                ...row,
                id: (0, bigint_util_1.toNumber)(row.id),
                schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
                classId: (0, bigint_util_1.toNumber)(row.classId),
                studentId: (0, bigint_util_1.toNumber)(row.studentId),
                rewardId: (0, bigint_util_1.toNumber)(row.rewardId),
                operatorId: (0, bigint_util_1.toNumber)(row.operatorId),
                reward: {
                    ...row.reward,
                    id: (0, bigint_util_1.toNumber)(row.reward.id),
                    schoolId: (0, bigint_util_1.toNumber)(row.reward.schoolId),
                },
                student: {
                    id: (0, bigint_util_1.toNumber)(row.student.id),
                    classId: (0, bigint_util_1.toNumber)(row.student.classId),
                    name: row.student.name,
                    studentNo: row.student.studentNo,
                },
            })),
        };
    }
    async createOrder(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.authService.ensureCanAccessClass(user, body.classId);
        if (body.sourceTerminal === 'display' && user.roleCode !== 'homeroom_teacher') {
            throw new common_1.ForbiddenException('展示端兑换仅允许班主任执行');
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
                throw new common_1.NotFoundException('学生不存在');
            }
            const reward = await tx.reward.findFirst({
                where: {
                    id: BigInt(body.rewardId),
                    schoolId: user.schoolId,
                    status: 'enabled',
                },
            });
            if (!reward) {
                throw new common_1.NotFoundException('奖励不存在');
            }
            const profile = await tx.studentProfile.findUnique({
                where: { studentId: BigInt(body.studentId) },
            });
            if (!profile || profile.currentScore < reward.scoreCost) {
                throw new common_1.ForbiddenException('学生积分不足，无法兑换');
            }
            if (!reward.isInfiniteStock && reward.stockQty !== null && reward.stockQty <= 0) {
                throw new common_1.ForbiddenException('奖励库存不足');
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
                orderId: (0, bigint_util_1.toNumber)(order.id),
                rewardId: (0, bigint_util_1.toNumber)(reward.id),
                studentId: (0, bigint_util_1.toNumber)(student.id),
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
    ensureCanManageRewards(roleCode) {
        if (!['super_admin', 'school_admin', 'moral_admin'].includes(roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权维护奖励');
        }
    }
};
exports.RewardsService = RewardsService;
exports.RewardsService = RewardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        operation_log_service_1.OperationLogService,
        realtime_service_1.RealtimeService])
], RewardsService);
//# sourceMappingURL=rewards.service.js.map