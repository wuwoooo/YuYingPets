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
exports.ClassesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const bigint_util_1 = require("../../common/utils/bigint.util");
const operation_log_service_1 = require("../operation-log/operation-log.service");
const realtime_service_1 = require("../realtime/realtime.service");
let ClassesService = class ClassesService {
    constructor(prisma, authService, operationLogService, realtimeService) {
        this.prisma = prisma;
        this.authService = authService;
        this.operationLogService = operationLogService;
        this.realtimeService = realtimeService;
    }
    async list(authorization, query) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        const rows = await this.prisma.classroom.findMany({
            where: {
                schoolId: user.schoolId,
                gradeCode: query.gradeCode || undefined,
                deletedAt: null,
                status: 'enabled',
            },
            include: {
                homeroomTeacher: true,
                students: {
                    where: { deletedAt: null, status: 'enabled' },
                    select: { id: true },
                },
                studentProfiles: {
                    select: { currentScore: true, totalScore: true },
                },
            },
            orderBy: [{ gradeCode: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        });
        const filteredRows = ['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)
            ? rows
            : rows.filter((row) => this.authService.canAccessClass(user, row.id));
        return {
            code: 0,
            message: 'ok',
            data: filteredRows.map((row) => ({
                id: (0, bigint_util_1.toNumber)(row.id),
                schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
                semesterId: (0, bigint_util_1.toNumber)(row.semesterId),
                code: row.code,
                gradeCode: row.gradeCode,
                gradeName: row.gradeName,
                name: row.name,
                slogan: row.slogan,
                targetScore: row.targetScore,
                sortOrder: row.sortOrder,
                displayStatus: row.displayStatus,
                studentCount: row.students.length,
                currentScoreTotal: row.studentProfiles.reduce((sum, item) => sum + item.currentScore, 0),
                totalScoreTotal: row.studentProfiles.reduce((sum, item) => sum + item.totalScore, 0),
                homeroomTeacher: row.homeroomTeacher
                    ? {
                        id: (0, bigint_util_1.toNumber)(row.homeroomTeacher.id),
                        name: row.homeroomTeacher.name,
                        username: row.homeroomTeacher.username,
                    }
                    : null,
            })),
        };
    }
    async create(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManageClass(user.roleCode);
        const created = await this.prisma.classroom.create({
            data: {
                schoolId: user.schoolId,
                semesterId: BigInt(Number(body.semesterId)),
                code: String(body.code),
                gradeCode: String(body.gradeCode),
                gradeName: String(body.gradeName),
                name: String(body.name),
                homeroomTeacherId: body.homeroomTeacherId
                    ? BigInt(Number(body.homeroomTeacherId))
                    : null,
                slogan: body.slogan ? String(body.slogan) : null,
                targetScore: body.targetScore === undefined ? null : Number(body.targetScore),
                displayStatus: body.displayStatus ? String(body.displayStatus) : 'enabled',
                sortOrder: body.sortOrder === undefined ? null : Number(body.sortOrder),
                status: 'enabled',
            },
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: 'admin',
            module: 'class',
            action: 'create',
            targetType: 'class',
            targetId: created.id,
            detail: {
                code: String(body.code),
                name: String(body.name),
                gradeCode: String(body.gradeCode),
            },
        });
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(created.id) } };
    }
    async detail(authorization, id) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.authService.ensureCanAccessClass(user, id);
        const row = await this.prisma.classroom.findFirst({
            where: {
                id: BigInt(id),
                schoolId: user.schoolId,
                deletedAt: null,
            },
            include: {
                homeroomTeacher: true,
                semester: true,
                students: {
                    where: { deletedAt: null, status: 'enabled' },
                    include: {
                        profile: true,
                    },
                },
            },
        });
        if (!row) {
            throw new common_1.NotFoundException('班级不存在');
        }
        return {
            code: 0,
            message: 'ok',
            data: {
                id: (0, bigint_util_1.toNumber)(row.id),
                schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
                semesterId: (0, bigint_util_1.toNumber)(row.semesterId),
                code: row.code,
                gradeCode: row.gradeCode,
                gradeName: row.gradeName,
                name: row.name,
                slogan: row.slogan,
                targetScore: row.targetScore,
                sortOrder: row.sortOrder,
                displayStatus: row.displayStatus,
                semester: {
                    id: (0, bigint_util_1.toNumber)(row.semester.id),
                    name: row.semester.name,
                    isCurrent: row.semester.isCurrent,
                },
                homeroomTeacher: row.homeroomTeacher
                    ? {
                        id: (0, bigint_util_1.toNumber)(row.homeroomTeacher.id),
                        name: row.homeroomTeacher.name,
                        username: row.homeroomTeacher.username,
                    }
                    : null,
                studentCount: row.students.length,
                scoreSummary: {
                    currentScoreTotal: row.students.reduce((sum, item) => sum + (item.profile?.currentScore ?? 0), 0),
                    totalScoreTotal: row.students.reduce((sum, item) => sum + (item.profile?.totalScore ?? 0), 0),
                },
            },
        };
    }
    async update(authorization, id, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManageClass(user.roleCode);
        this.authService.ensureCanAccessClass(user, id);
        const exists = await this.prisma.classroom.findFirst({
            where: { id: BigInt(id), schoolId: user.schoolId, deletedAt: null },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException('班级不存在');
        }
        const updated = await this.prisma.classroom.update({
            where: { id: BigInt(id) },
            data: {
                semesterId: user.roleCode === 'homeroom_teacher'
                    ? undefined
                    : body.semesterId
                        ? BigInt(Number(body.semesterId))
                        : undefined,
                code: user.roleCode === 'homeroom_teacher' ? undefined : body.code ? String(body.code) : undefined,
                gradeCode: user.roleCode === 'homeroom_teacher' ? undefined : body.gradeCode ? String(body.gradeCode) : undefined,
                gradeName: user.roleCode === 'homeroom_teacher' ? undefined : body.gradeName ? String(body.gradeName) : undefined,
                name: user.roleCode === 'homeroom_teacher' ? undefined : body.name ? String(body.name) : undefined,
                homeroomTeacherId: user.roleCode === 'homeroom_teacher'
                    ? undefined
                    : body.homeroomTeacherId === undefined
                        ? undefined
                        : body.homeroomTeacherId
                            ? BigInt(Number(body.homeroomTeacherId))
                            : null,
                slogan: body.slogan === undefined ? undefined : body.slogan ? String(body.slogan) : null,
                targetScore: body.targetScore === undefined ? undefined : body.targetScore === null ? null : Number(body.targetScore),
                displayStatus: body.displayStatus === undefined ? undefined : String(body.displayStatus),
                sortOrder: user.roleCode === 'homeroom_teacher'
                    ? undefined
                    : body.sortOrder === undefined
                        ? undefined
                        : body.sortOrder === null
                            ? null
                            : Number(body.sortOrder),
            },
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: 'admin',
            module: 'class',
            action: 'update',
            targetType: 'class',
            targetId: updated.id,
            detail: {
                code: body.code === undefined ? null : String(body.code),
                name: body.name === undefined ? null : String(body.name),
            },
        });
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(updated.id) } };
    }
    async groups(authorization, id) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.authService.ensureCanAccessClass(user, id);
        const groups = await this.prisma.classGroup.findMany({
            where: { classId: BigInt(id), status: 'enabled' },
            include: {
                studentGroupRels: {
                    include: {
                        student: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ groupNo: 'asc' }, { id: 'asc' }],
        });
        return {
            code: 0,
            message: 'ok',
            data: groups.map((group) => ({
                id: (0, bigint_util_1.toNumber)(group.id),
                classId: (0, bigint_util_1.toNumber)(group.classId),
                groupNo: group.groupNo,
                name: group.name,
                studentCount: group.studentGroupRels.length,
                currentScoreTotal: group.studentGroupRels.reduce((sum, item) => sum + (item.student.profile?.currentScore ?? 0), 0),
                students: group.studentGroupRels.map((rel) => ({
                    id: (0, bigint_util_1.toNumber)(rel.student.id),
                    name: rel.student.name,
                    studentNo: rel.student.studentNo,
                    currentScore: rel.student.profile?.currentScore ?? 0,
                })),
            })),
        };
    }
    async updateGroups(authorization, id, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.ensureCanManageGroups(user.roleCode);
        this.authService.ensureCanAccessClass(user, id);
        const groups = Array.isArray(body.groups) ? body.groups : [];
        const classId = BigInt(id);
        const result = await this.prisma.$transaction(async (tx) => {
            const students = await tx.student.findMany({
                where: { classId, deletedAt: null, status: 'enabled' },
                select: { id: true },
            });
            const studentIds = new Set(students.map((item) => item.id.toString()));
            await tx.studentGroupRel.deleteMany({
                where: { student: { classId } },
            });
            const activeGroupIds = [];
            for (const item of groups) {
                const group = await tx.classGroup.upsert({
                    where: item.id ? { id: BigInt(Number(item.id)) } : { classId_groupNo: { classId, groupNo: Number(item.groupNo) } },
                    update: {
                        groupNo: Number(item.groupNo),
                        name: String(item.name),
                        status: 'enabled',
                    },
                    create: {
                        classId,
                        groupNo: Number(item.groupNo),
                        name: String(item.name),
                        status: 'enabled',
                    },
                });
                activeGroupIds.push(group.id);
                const groupStudentIds = Array.isArray(item.studentIds) ? item.studentIds : [];
                for (const studentId of groupStudentIds) {
                    const targetId = BigInt(Number(studentId));
                    if (!studentIds.has(targetId.toString())) {
                        throw new common_1.ForbiddenException('存在不属于当前班级的学生');
                    }
                    await tx.studentGroupRel.create({
                        data: {
                            studentId: targetId,
                            classGroupId: group.id,
                        },
                    });
                }
            }
            await tx.classGroup.updateMany({
                where: {
                    classId,
                    id: { notIn: activeGroupIds.length > 0 ? activeGroupIds : [0n] },
                },
                data: { status: 'disabled' },
            });
            return {
                groupCount: groups.length,
            };
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: user.roleCode === 'homeroom_teacher' ? 'display' : 'admin',
            module: 'class_group',
            action: 'update_members',
            targetType: 'class',
            targetId: classId,
            detail: {
                classId: id,
                groupCount: result.groupCount,
            },
        });
        this.realtimeService.emitClassGroupChanged(id, {
            classId: id,
            operatorName: user.name,
            groupCount: result.groupCount,
            sourceTerminal: user.roleCode === 'homeroom_teacher' ? 'display' : 'admin',
        });
        return { code: 0, message: 'ok', data: result };
    }
    ensureCanManageGroups(roleCode) {
        if (!['super_admin', 'school_admin', 'moral_admin', 'homeroom_teacher'].includes(roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权维护学生分组');
        }
    }
    ensureCanManageClass(roleCode) {
        if (!['super_admin', 'school_admin', 'moral_admin', 'homeroom_teacher'].includes(roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权维护班级');
        }
    }
};
exports.ClassesService = ClassesService;
exports.ClassesService = ClassesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        operation_log_service_1.OperationLogService,
        realtime_service_1.RealtimeService])
], ClassesService);
//# sourceMappingURL=classes.service.js.map