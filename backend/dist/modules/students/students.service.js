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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const bigint_util_1 = require("../../common/utils/bigint.util");
const operation_log_service_1 = require("../operation-log/operation-log.service");
const realtime_service_1 = require("../realtime/realtime.service");
const pet_growth_util_1 = require("../../common/utils/pet-growth.util");
let StudentsService = class StudentsService {
    constructor(prisma, authService, operationLogService, realtimeService) {
        this.prisma = prisma;
        this.authService = authService;
        this.operationLogService = operationLogService;
        this.realtimeService = realtimeService;
    }
    async list(authorization, query) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (query.classId) {
            this.authService.ensureCanAccessClass(user, Number(query.classId));
        }
        const rows = await this.prisma.student.findMany({
            where: {
                schoolId: user.schoolId,
                classId: query.classId ? BigInt(query.classId) : undefined,
                deletedAt: null,
                status: 'enabled',
            },
            include: {
                school: {
                    select: {
                        petGrowthThresholds: true,
                    },
                },
                classroom: true,
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
            orderBy: [{ classId: 'asc' }, { studentNo: 'asc' }],
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
                schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
                classId: (0, bigint_util_1.toNumber)(row.classId),
                studentNo: row.studentNo,
                name: row.name,
                gender: row.gender,
                avatarUrl: row.avatarUrl,
                className: row.classroom.name,
                currentScore: row.profile?.currentScore ?? 0,
                totalScore: row.profile?.totalScore ?? 0,
                currentPetLevel: row.profile?.currentPetLevel ?? 1,
                pet: row.studentPet
                    ? {
                        id: (0, bigint_util_1.toNumber)(row.studentPet.pet.id),
                        name: row.studentPet.pet.name,
                        coverUrl: row.studentPet.pet.coverUrl,
                        currentStageNo: row.studentPet.currentStageNo,
                        currentImageUrl: row.studentPet.pet.stages.find((stage) => stage.stageNo === row.studentPet.currentStageNo)
                            ?.imageUrl ?? row.studentPet.pet.coverUrl,
                        currentLevel: row.studentPet.currentLevel,
                        totalScore: row.studentPet.totalScore,
                    }
                    : null,
            })),
        };
    }
    async detail(authorization, id) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        const row = await this.prisma.student.findFirst({
            where: {
                id: BigInt(id),
                schoolId: user.schoolId,
                deletedAt: null,
            },
            include: {
                school: {
                    select: {
                        petGrowthThresholds: true,
                    },
                },
                classroom: true,
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
                    },
                },
                teacherObservations: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!row) {
            throw new common_1.NotFoundException('学生不存在');
        }
        this.authService.ensureCanAccessClass(user, row.classId);
        const petGrowthThresholds = (0, pet_growth_util_1.normalizePetGrowthThresholds)(row.school.petGrowthThresholds);
        return {
            code: 0,
            message: 'ok',
            data: {
                id: (0, bigint_util_1.toNumber)(row.id),
                schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
                classId: (0, bigint_util_1.toNumber)(row.classId),
                className: row.classroom.name,
                studentNo: row.studentNo,
                name: row.name,
                gender: row.gender,
                avatarUrl: row.avatarUrl,
                profile: row.profile
                    ? {
                        currentScore: row.profile.currentScore,
                        totalScore: row.profile.totalScore,
                        currentPetLevel: row.profile.currentPetLevel,
                        rewardsCount: row.profile.rewardsCount,
                        honorsCount: row.profile.honorsCount,
                        positiveCount7d: row.profile.positiveCount7d,
                        negativeCount7d: row.profile.negativeCount7d,
                    }
                    : null,
                group: row.groupRel?.classGroup
                    ? {
                        id: (0, bigint_util_1.toNumber)(row.groupRel.classGroup.id),
                        name: row.groupRel.classGroup.name,
                        groupNo: row.groupRel.classGroup.groupNo,
                    }
                    : null,
                pet: row.studentPet
                    ? {
                        id: (0, bigint_util_1.toNumber)(row.studentPet.id),
                        petId: (0, bigint_util_1.toNumber)(row.studentPet.pet.id),
                        name: row.studentPet.pet.name,
                        coverUrl: row.studentPet.pet.coverUrl,
                        currentLevel: row.studentPet.currentLevel,
                        currentStageNo: row.studentPet.currentStageNo,
                        totalScore: row.studentPet.totalScore,
                        stages: row.studentPet.pet.stages.map((stage) => ({
                            id: (0, bigint_util_1.toNumber)(stage.id),
                            stageNo: stage.stageNo,
                            levelNo: stage.levelNo,
                            name: stage.name,
                            imageUrl: stage.imageUrl,
                            needScoreTotal: (0, pet_growth_util_1.resolveStageNeedScoreTotal)(stage.stageNo, stage.needScoreTotal, petGrowthThresholds),
                        })),
                    }
                    : null,
                teacherObservations: row.teacherObservations.map((item) => ({
                    id: (0, bigint_util_1.toNumber)(item.id),
                    teacherId: (0, bigint_util_1.toNumber)(item.teacherId),
                    observationType: item.observationType,
                    content: item.content,
                    createdAt: item.createdAt,
                })),
            },
        };
    }
    async import(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        const classId = Number(body.classId);
        this.authService.ensureCanAccessClass(user, classId);
        if (!['homeroom_teacher', 'school_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(user.roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权导入学生');
        }
        const students = Array.isArray(body.students) ? body.students : [];
        const result = await this.prisma.$transaction(async (tx) => {
            const createdIds = [];
            for (const item of students) {
                const student = await tx.student.create({
                    data: {
                        schoolId: user.schoolId,
                        classId: BigInt(classId),
                        studentNo: String(item.studentNo),
                        name: String(item.name),
                        gender: item.gender ? String(item.gender) : null,
                        avatarUrl: item.avatarUrl ? String(item.avatarUrl) : null,
                        status: 'enabled',
                    },
                });
                await tx.studentProfile.create({
                    data: {
                        studentId: student.id,
                        classId: BigInt(classId),
                    },
                });
                createdIds.push(Number(student.id));
            }
            return {
                createdCount: createdIds.length,
                studentIds: createdIds,
            };
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: 'admin',
            module: 'student',
            action: 'import',
            targetType: 'class',
            targetId: BigInt(classId),
            detail: {
                classId,
                createdCount: result.createdCount,
            },
        });
        return { code: 0, message: 'ok', data: result };
    }
    async adoptPet(authorization, studentId, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.authService.ensureCanAccessClass(user, body.classId);
        if (user.roleCode !== 'homeroom_teacher') {
            throw new common_1.ForbiddenException('当前角色无权执行萌宠领养');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const student = await tx.student.findFirst({
                where: {
                    id: BigInt(studentId),
                    classId: BigInt(body.classId),
                    schoolId: user.schoolId,
                    deletedAt: null,
                    status: 'enabled',
                },
                include: {
                    profile: true,
                    studentPet: {
                        include: {
                            pet: true,
                        },
                    },
                },
            });
            if (!student) {
                throw new common_1.NotFoundException('学生不存在');
            }
            const pet = await tx.pet.findFirst({
                where: {
                    schoolId: user.schoolId,
                    code: body.petCode,
                    status: 'enabled',
                },
                include: {
                    stages: {
                        orderBy: { stageNo: 'asc' },
                    },
                },
            });
            if (!pet) {
                throw new common_1.NotFoundException('萌宠图鉴中不存在该萌宠');
            }
            const thresholds = (0, pet_growth_util_1.normalizePetGrowthThresholds)((await tx.school.findUnique({
                where: { id: user.schoolId },
                select: { petGrowthThresholds: true },
            }))?.petGrowthThresholds);
            const initialTotalScore = student.profile?.totalScore ?? 0;
            const matchedStage = (0, pet_growth_util_1.resolveMatchedPetStage)(pet.stages, initialTotalScore, thresholds);
            const currentLevel = matchedStage?.levelNo ?? 1;
            const currentStageNo = matchedStage?.stageNo ?? 1;
            const studentPet = await tx.studentPet.upsert({
                where: { studentId: BigInt(studentId) },
                update: {
                    petId: pet.id,
                    currentLevel,
                    currentStageNo,
                    totalScore: initialTotalScore,
                    unlockedAt: new Date(),
                    adoptedBy: user.id,
                    status: 'enabled',
                },
                create: {
                    studentId: BigInt(studentId),
                    petId: pet.id,
                    currentLevel,
                    currentStageNo,
                    totalScore: initialTotalScore,
                    unlockedAt: new Date(),
                    adoptedBy: user.id,
                    status: 'enabled',
                },
            });
            await tx.studentProfile.upsert({
                where: { studentId: BigInt(studentId) },
                update: {
                    currentPetLevel: currentLevel,
                },
                create: {
                    studentId: BigInt(studentId),
                    classId: BigInt(body.classId),
                    currentPetLevel: currentLevel,
                },
            });
            return {
                studentId,
                studentName: student.name,
                petId: (0, bigint_util_1.toNumber)(pet.id),
                petCode: pet.code,
                petName: pet.name,
                coverUrl: pet.coverUrl,
                studentPetId: (0, bigint_util_1.toNumber)(studentPet.id),
            };
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: body.sourceTerminal ?? 'display',
            module: 'student_pet',
            action: 'adopt',
            targetType: 'student',
            targetId: BigInt(studentId),
            detail: {
                classId: body.classId,
                petCode: body.petCode,
                petName: result.petName,
            },
        });
        this.realtimeService.emitClassStudentChanged(body.classId, {
            classId: body.classId,
            studentId,
            petCode: body.petCode,
            petName: result.petName,
            operatorName: user.name,
            sourceTerminal: body.sourceTerminal ?? 'display',
        });
        return { code: 0, message: 'ok', data: result };
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        operation_log_service_1.OperationLogService,
        realtime_service_1.RealtimeService])
], StudentsService);
//# sourceMappingURL=students.service.js.map