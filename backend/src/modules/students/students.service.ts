import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { toNumber } from '@/common/utils/bigint.util';
import { OperationLogService } from '../operation-log/operation-log.service';
import { StudentAdoptPetDto } from './dto/student-adopt-pet.dto';
import { RealtimeService } from '../realtime/realtime.service';
import {
  normalizePetGrowthThresholds,
  resolveMatchedPetStage,
  resolveStageNeedScoreTotal,
} from '@/common/utils/pet-growth.util';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async list(authorization: string | undefined, query: Record<string, string>) {
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

    const filteredRows =
      ['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)
        ? rows
        : rows.filter((row) => this.authService.canAccessClass(user, row.classId));

    return {
      code: 0,
      message: 'ok',
      data: filteredRows.map((row) => ({
        id: toNumber(row.id),
        schoolId: toNumber(row.schoolId),
        classId: toNumber(row.classId),
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
              id: toNumber(row.studentPet.pet.id),
              name: row.studentPet.pet.name,
              coverUrl: row.studentPet.pet.coverUrl,
              currentStageNo: row.studentPet.currentStageNo,
              currentImageUrl:
                row.studentPet.pet.stages.find((stage) => stage.stageNo === row.studentPet!.currentStageNo)
                  ?.imageUrl ?? row.studentPet.pet.coverUrl,
              currentLevel: row.studentPet.currentLevel,
              totalScore: row.studentPet.totalScore,
            }
          : null,
      })),
    };
  }

  async detail(authorization: string | undefined, id: number) {
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
      throw new NotFoundException('学生不存在');
    }

    this.authService.ensureCanAccessClass(user, row.classId);
    const petGrowthThresholds = normalizePetGrowthThresholds(row.school.petGrowthThresholds);

    return {
      code: 0,
      message: 'ok',
      data: {
        id: toNumber(row.id),
        schoolId: toNumber(row.schoolId),
        classId: toNumber(row.classId),
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
              id: toNumber(row.groupRel.classGroup.id),
              name: row.groupRel.classGroup.name,
              groupNo: row.groupRel.classGroup.groupNo,
            }
          : null,
        pet: row.studentPet
          ? {
              id: toNumber(row.studentPet.id),
              petId: toNumber(row.studentPet.pet.id),
              name: row.studentPet.pet.name,
              coverUrl: row.studentPet.pet.coverUrl,
              currentLevel: row.studentPet.currentLevel,
              currentStageNo: row.studentPet.currentStageNo,
              totalScore: row.studentPet.totalScore,
              stages: row.studentPet.pet.stages.map((stage) => ({
                id: toNumber(stage.id),
                stageNo: stage.stageNo,
                levelNo: stage.levelNo,
                name: stage.name,
                imageUrl: stage.imageUrl,
                needScoreTotal: resolveStageNeedScoreTotal(stage.stageNo, stage.needScoreTotal, petGrowthThresholds),
              })),
            }
          : null,
        teacherObservations: row.teacherObservations.map((item) => ({
          id: toNumber(item.id),
          teacherId: toNumber(item.teacherId),
          observationType: item.observationType,
          content: item.content,
          createdAt: item.createdAt,
        })),
      },
    };
  }

  async import(authorization: string | undefined, body: Record<string, unknown>) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const classId = Number(body.classId);
    this.authService.ensureCanAccessClass(user, classId);

    if (!['homeroom_teacher', 'school_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(user.roleCode)) {
      throw new ForbiddenException('当前角色无权导入学生');
    }

    const students = Array.isArray(body.students) ? body.students : [];

    const result = await this.prisma.$transaction(async (tx) => {
      const createdIds: number[] = [];

      for (const item of students as Array<Record<string, unknown>>) {
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

  async adoptPet(
    authorization: string | undefined,
    studentId: number,
    body: StudentAdoptPetDto,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.authService.ensureCanAccessClass(user, body.classId);

    if (user.roleCode !== 'homeroom_teacher') {
      throw new ForbiddenException('当前角色无权执行萌宠领养');
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
        throw new NotFoundException('学生不存在');
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
        throw new NotFoundException('萌宠图鉴中不存在该萌宠');
      }

      const thresholds = normalizePetGrowthThresholds(
        (await tx.school.findUnique({
          where: { id: user.schoolId },
          select: { petGrowthThresholds: true },
        }))?.petGrowthThresholds,
      );
      const initialTotalScore = student.profile?.totalScore ?? 0;
      const matchedStage = resolveMatchedPetStage(pet.stages, initialTotalScore, thresholds);
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
        petId: toNumber(pet.id),
        petCode: pet.code,
        petName: pet.name,
        coverUrl: pet.coverUrl,
        studentPetId: toNumber(studentPet.id),
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
}
