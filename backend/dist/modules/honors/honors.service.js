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
exports.HonorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const bigint_util_1 = require("../../common/utils/bigint.util");
const operation_log_service_1 = require("../operation-log/operation-log.service");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
let HonorsService = class HonorsService {
    constructor(prisma, authService, operationLogService) {
        this.prisma = prisma;
        this.authService = authService;
        this.operationLogService = operationLogService;
    }
    async list(authorization, query) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        const includeDisabled = query.includeDisabled === 'true';
        if (includeDisabled) {
            this.ensureCanManageHonors(user.roleCode);
        }
        const rows = await this.prisma.honor.findMany({
            where: {
                schoolId: user.schoolId,
                status: includeDisabled ? undefined : 'enabled',
            },
            include: {
                honorRecords: {
                    orderBy: { grantedAt: 'desc' },
                    take: 1,
                },
                _count: {
                    select: {
                        honorRecords: true,
                    },
                },
            },
            orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        });
        return {
            code: 0,
            message: 'ok',
            data: rows.map((row) => ({
                id: (0, bigint_util_1.toNumber)(row.id),
                schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
                code: row.code,
                name: row.name,
                category: row.category,
                iconUrl: row.iconUrl,
                description: row.description,
                conditionType: row.conditionType,
                conditionConfig: row.conditionConfig,
                status: row.status,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                grantedCount: row._count.honorRecords,
                lastGrantedAt: row.honorRecords[0]?.grantedAt ?? null,
            })),
        };
    }
    async create(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManageHonors(user.roleCode);
        const iconUrl = (body.iconUrl ?? '').trim();
        if (!iconUrl) {
            throw new common_1.BadRequestException('请先上传勋章图片');
        }
        if (!iconUrl.startsWith('/uploads/honors/')) {
            throw new common_1.BadRequestException('勋章图片必须通过后台上传');
        }
        const created = await this.prisma.honor.create({
            data: {
                schoolId: user.schoolId,
                code: body.code,
                name: body.name,
                category: body.category,
                iconUrl,
                description: body.description,
                conditionType: body.conditionType,
                conditionConfig: body.conditionConfig,
            },
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: 'admin',
            module: 'honor',
            action: 'create',
            targetType: 'honor',
            targetId: created.id,
            detail: {
                code: body.code,
                name: body.name,
                category: body.category,
            },
        });
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(created.id) } };
    }
    async update(authorization, id, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManageHonors(user.roleCode);
        const iconUrl = (body.iconUrl ?? '').trim();
        if (!iconUrl) {
            throw new common_1.BadRequestException('请先上传勋章图片');
        }
        if (!iconUrl.startsWith('/uploads/honors/')) {
            throw new common_1.BadRequestException('勋章图片必须通过后台上传');
        }
        const exists = await this.prisma.honor.findFirst({
            where: {
                id: BigInt(id),
                schoolId: user.schoolId,
            },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException('荣誉不存在');
        }
        const updated = await this.prisma.honor.update({
            where: { id: BigInt(id) },
            data: {
                code: body.code,
                name: body.name,
                category: body.category,
                iconUrl,
                description: body.description,
                conditionType: body.conditionType,
                conditionConfig: body.conditionConfig,
            },
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: 'admin',
            module: 'honor',
            action: 'update',
            targetType: 'honor',
            targetId: updated.id,
            detail: {
                code: body.code,
                name: body.name,
                category: body.category,
            },
        });
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(updated.id) } };
    }
    async uploadHonorAsset(authorization, file) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManageHonors(user.roleCode);
        if (!file) {
            throw new common_1.BadRequestException('请选择要上传的图片');
        }
        if (!file.mimetype.startsWith('image/')) {
            throw new common_1.BadRequestException('仅支持上传图片文件');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new common_1.BadRequestException('图片大小不能超过 5MB');
        }
        const uploadsDir = (0, node_path_1.resolve)(process.cwd(), 'public/uploads/honors');
        await (0, promises_1.mkdir)(uploadsDir, { recursive: true });
        const extension = (0, node_path_1.extname)(file.originalname || '').toLowerCase() || '.png';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
        await (0, promises_1.writeFile)((0, node_path_1.resolve)(uploadsDir, fileName), file.buffer);
        return {
            code: 0,
            message: 'ok',
            data: {
                url: `/uploads/honors/${fileName}`,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
            },
        };
    }
    async updateStatus(authorization, id, status) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManageHonors(user.roleCode);
        const honor = await this.prisma.honor.findFirst({
            where: {
                id: BigInt(id),
                schoolId: user.schoolId,
            },
        });
        if (!honor) {
            throw new common_1.NotFoundException('荣誉不存在');
        }
        const updated = await this.prisma.honor.update({
            where: { id: BigInt(id) },
            data: { status },
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: 'admin',
            module: 'honor',
            action: 'status_update',
            targetType: 'honor',
            targetId: updated.id,
            detail: {
                code: honor.code,
                name: honor.name,
                status,
            },
        });
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(updated.id), status } };
    }
    async records(authorization, query) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (query.classId) {
            this.authService.ensureCanAccessClass(user, Number(query.classId));
        }
        const rows = await this.prisma.honorRecord.findMany({
            where: {
                schoolId: user.schoolId,
                honorId: query.honorId ? BigInt(query.honorId) : undefined,
                targetType: query.targetType || undefined,
                classId: query.classId ? BigInt(query.classId) : undefined,
                studentId: query.studentId ? BigInt(query.studentId) : undefined,
            },
            include: {
                honor: true,
                classroom: true,
                student: true,
                grantedByUser: true,
            },
            orderBy: { grantedAt: 'desc' },
            take: 200,
        });
        const filteredRows = ['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)
            ? rows
            : rows.filter((row) => this.authService.canAccessClass(user, row.classId));
        return {
            code: 0,
            message: 'ok',
            data: filteredRows.map((row) => ({
                id: (0, bigint_util_1.toNumber)(row.id),
                honorId: (0, bigint_util_1.toNumber)(row.honorId),
                honorName: row.honor.name,
                targetType: row.targetType,
                targetId: (0, bigint_util_1.toNumber)(row.targetId),
                schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
                classId: (0, bigint_util_1.toNumber)(row.classId),
                className: row.classroom.name,
                studentId: row.studentId ? (0, bigint_util_1.toNumber)(row.studentId) : null,
                studentName: row.student?.name ?? null,
                grantedBy: row.grantedBy ? (0, bigint_util_1.toNumber)(row.grantedBy) : null,
                grantedByName: row.grantedByUser?.name ?? null,
                grantedAt: row.grantedAt,
                remark: row.remark,
                createdAt: row.createdAt,
            })),
        };
    }
    async createRecord(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanGrantHonors(user.roleCode);
        this.authService.ensureCanAccessClass(user, body.classId);
        const result = await this.prisma.$transaction(async (tx) => {
            const honor = await tx.honor.findFirst({
                where: {
                    id: BigInt(body.honorId),
                    schoolId: user.schoolId,
                    status: 'enabled',
                },
            });
            if (!honor) {
                throw new common_1.NotFoundException('荣誉不存在或已停用');
            }
            const classroom = await tx.classroom.findFirst({
                where: {
                    id: BigInt(body.classId),
                    schoolId: user.schoolId,
                    status: 'enabled',
                },
            });
            if (!classroom) {
                throw new common_1.NotFoundException('班级不存在');
            }
            let studentId = null;
            if (body.targetType === 'student') {
                const student = await tx.student.findFirst({
                    where: {
                        id: BigInt(body.targetId),
                        classId: BigInt(body.classId),
                        schoolId: user.schoolId,
                        status: 'enabled',
                        deletedAt: null,
                    },
                });
                if (!student) {
                    throw new common_1.NotFoundException('学生不存在');
                }
                studentId = student.id;
            }
            else {
                if (body.targetId !== body.classId) {
                    throw new common_1.BadRequestException('班级荣誉的 targetId 必须等于 classId');
                }
            }
            const record = await tx.honorRecord.create({
                data: {
                    honorId: honor.id,
                    targetType: body.targetType,
                    targetId: BigInt(body.targetId),
                    schoolId: user.schoolId,
                    classId: BigInt(body.classId),
                    studentId,
                    grantedBy: user.id,
                    grantedAt: new Date(),
                    remark: body.remark,
                },
            });
            if (studentId) {
                await tx.studentProfile.upsert({
                    where: { studentId },
                    create: {
                        studentId,
                        classId: BigInt(body.classId),
                        honorsCount: 1,
                    },
                    update: {
                        honorsCount: { increment: 1 },
                    },
                });
            }
            return {
                recordId: (0, bigint_util_1.toNumber)(record.id),
                honorId: (0, bigint_util_1.toNumber)(honor.id),
                targetType: body.targetType,
                targetId: body.targetId,
                classId: body.classId,
                studentId: studentId ? (0, bigint_util_1.toNumber)(studentId) : null,
            };
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: 'admin',
            module: 'honor',
            action: 'grant',
            targetType: body.targetType,
            targetId: BigInt(body.targetId),
            detail: {
                honorId: body.honorId,
                classId: body.classId,
                targetType: body.targetType,
                remark: body.remark ?? null,
            },
        });
        return { code: 0, message: 'ok', data: result };
    }
    ensureCanManageHonors(roleCode) {
        if (!['super_admin', 'school_admin', 'moral_admin'].includes(roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权维护荣誉');
        }
    }
    ensureCanGrantHonors(roleCode) {
        if (!['homeroom_teacher', 'subject_teacher', 'school_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权发放荣誉');
        }
    }
};
exports.HonorsService = HonorsService;
exports.HonorsService = HonorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        operation_log_service_1.OperationLogService])
], HonorsService);
//# sourceMappingURL=honors.service.js.map