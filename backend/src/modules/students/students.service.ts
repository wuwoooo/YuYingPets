import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

type ImportClassRow = {
  id: bigint;
  semesterId: bigint;
  code: string;
  gradeCode: string;
  gradeName: string;
  name: string;
  sortOrder: number | null;
};

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
    const page = Number(query.page);
    const pageSize = Number(query.pageSize);
    const shouldPaginate = Number.isInteger(page) && page > 0 && Number.isInteger(pageSize) && pageSize > 0;

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
      ...(shouldPaginate
        ? {
            skip: (page - 1) * pageSize,
            take: pageSize,
          }
        : {}),
    });

    const filteredRows =
      ['super_admin', 'school_admin', 'academic_admin', 'moral_admin'].includes(user.roleCode)
        ? rows
        : rows.filter((row) => this.authService.canAccessClass(user, row.classId));
    const latestAcademicByStudentId = await this.loadLatestAcademicSummaries(filteredRows.map((row) => row.id));

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
        latestAcademic: latestAcademicByStudentId.get(row.id.toString()) ?? null,
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

  private async loadLatestAcademicSummaries(studentIds: bigint[]) {
    const summaries = new Map<string, {
      examId: number;
      examName: string;
      examDate: Date;
      periodLabel: string | null;
      importedAt: Date;
      totalScore: number | null;
      schoolRank: number | null;
      schoolRankDelta: number | null;
      classRank: number | null;
      classRankDelta: number | null;
    }>();
    if (!studentIds.length) return summaries;

    const records = await this.prisma.academicScoreRecord.findMany({
      where: {
        studentId: { in: studentIds },
        subjectCode: 'total',
      },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            examDate: true,
            periodLabel: true,
            importedAt: true,
          },
        },
      },
      orderBy: [{ exam: { examDate: 'desc' } }, { id: 'desc' }],
    });

    records.forEach((record) => {
      const key = record.studentId.toString();
      if (summaries.has(key)) return;
      summaries.set(key, {
        examId: Number(record.examId),
        examName: this.cleanExamName(record.exam.name),
        examDate: record.exam.examDate,
        periodLabel: record.exam.periodLabel,
        importedAt: record.exam.importedAt,
        totalScore: record.score === null ? null : Number(record.score),
        schoolRank: record.schoolRank,
        schoolRankDelta: record.schoolRankDelta,
        classRank: record.classRank,
        classRankDelta: record.classRankDelta,
      });
    });

    return summaries;
  }

  private cleanExamName(value: string) {
    const normalized = value.trim();
    if (!normalized) return normalized;
    const match = normalized.match(/^(.*?(?:成绩汇总|考生成绩汇总))\s*[-—–:：]+\s*(.+)$/);
    return match?.[2]?.trim() || normalized;
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
    if (!['homeroom_teacher', 'school_admin', 'academic_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(user.roleCode)) {
      throw new ForbiddenException('当前角色无权导入学生');
    }

    const students = Array.isArray(body.students) ? body.students : [];
    if (!students.length) {
      throw new BadRequestException('请提供学生数据');
    }

    const fallbackClassId = Number(body.classId);
    const needsFallbackClass = (students as Array<Record<string, unknown>>).some((item) => !String(item.className ?? '').trim());
    if (needsFallbackClass) {
      if (!Number.isInteger(fallbackClassId) || fallbackClassId <= 0) {
        throw new BadRequestException('缺少导入班级，请选择目标班级或在表格中提供班级列');
      }
      this.authService.ensureCanAccessClass(user, fallbackClassId);
      if (user.roleCode === 'homeroom_teacher') {
        await this.authService.ensureIsHomeroomOfClass(user, fallbackClassId);
      }
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const createdIds: number[] = [];
        const updatedIds: number[] = [];
        const createdClassIds = new Set<string>();
        let createdClassCount = 0;
        let updatedCount = 0;
        let classChangedCount = 0;
        let unchangedCount = 0;
        const realtimeEvents: Array<{ classId: number; studentId: number }> = [];
        const classes = await tx.classroom.findMany({
          where: {
            schoolId: user.schoolId,
            deletedAt: null,
            status: 'enabled',
          },
          select: { id: true, semesterId: true, code: true, gradeCode: true, gradeName: true, name: true, sortOrder: true },
        });
        const gradeConfigs = await tx.gradeConfig.findMany({
          where: { schoolId: user.schoolId, deletedAt: null, status: 'enabled' },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: { code: true, name: true },
        });
        const fallbackClass = fallbackClassId > 0 ? classes.find((item) => item.id === BigInt(fallbackClassId)) : null;

        for (const item of students as Array<Record<string, unknown>>) {
          const studentNo = String(item.studentNo ?? '').trim();
          const name = String(item.name ?? '').trim();
          if (!studentNo || !name) {
            throw new BadRequestException('学生数据缺少准考证号或姓名');
          }

          const importedClassName = String(item.className ?? '').trim();
          const importedGradeName = String(item.gradeName ?? '').trim();
          const matchedImportClass = importedClassName
            ? this.findImportClass(classes, importedClassName, importedGradeName || fallbackClass?.gradeName)
            : null;
          let createdClass = false;
          const resolvedClass = importedClassName
            ? matchedImportClass ?? await this.resolveImportClass(tx, user, classes, gradeConfigs, importedClassName, importedGradeName || fallbackClass?.gradeName)
            : fallbackClass;

          if (!resolvedClass) {
            throw new BadRequestException(`学生 ${name} 缺少有效班级`);
          }

          if (importedClassName && !matchedImportClass) {
            createdClass = true;
            createdClassCount += 1;
            createdClassIds.add(resolvedClass.id.toString());
          }

          if (!createdClass && !createdClassIds.has(resolvedClass.id.toString())) {
            this.authService.ensureCanAccessClass(user, resolvedClass.id);
            if (user.roleCode === 'homeroom_teacher') {
              await this.authService.ensureIsHomeroomOfClass(user, resolvedClass.id);
            }
          }

          const nextGender = item.gender ? String(item.gender) : null;
          const nextAvatarUrl = item.avatarUrl ? String(item.avatarUrl) : null;
          const existingStudents = await tx.student.findMany({
            where: {
              schoolId: user.schoolId,
              studentNo,
              deletedAt: null,
            },
            select: {
              id: true,
              classId: true,
              name: true,
              gender: true,
              avatarUrl: true,
            },
          });
          if (existingStudents.length > 1) {
            throw new BadRequestException(`准考证号重复：${studentNo} 在系统中存在多条记录，请先清理历史数据`);
          }

          const existingStudent = existingStudents[0] ?? null;

          if (!existingStudent) {
            const student = await tx.student.create({
              data: {
                schoolId: user.schoolId,
                classId: resolvedClass.id,
                studentNo,
                name,
                gender: nextGender,
                avatarUrl: nextAvatarUrl,
                status: 'enabled',
              },
            });

            await tx.studentProfile.create({
              data: {
                studentId: student.id,
                classId: resolvedClass.id,
              },
            });

            createdIds.push(Number(student.id));
            realtimeEvents.push({
              classId: Number(resolvedClass.id),
              studentId: Number(student.id),
            });
            continue;
          }

          this.authService.ensureCanAccessClass(user, existingStudent.classId);
          if (user.roleCode === 'homeroom_teacher') {
            await this.authService.ensureIsHomeroomOfClass(user, existingStudent.classId);
          }

          const classChanged = existingStudent.classId !== resolvedClass.id;
          const profileChanged =
            existingStudent.name !== name ||
            existingStudent.gender !== nextGender ||
            existingStudent.avatarUrl !== nextAvatarUrl;

          if (!classChanged && !profileChanged) {
            unchangedCount += 1;
            continue;
          }

          await tx.student.update({
            where: { id: existingStudent.id },
            data: {
              classId: resolvedClass.id,
              name,
              gender: nextGender,
              avatarUrl: nextAvatarUrl,
              status: 'enabled',
            },
          });

          await tx.studentProfile.updateMany({
            where: { studentId: existingStudent.id },
            data: { classId: resolvedClass.id },
          });

          if (classChanged) {
            await tx.studentGroupRel.deleteMany({
              where: { studentId: existingStudent.id },
            });
            classChangedCount += 1;
            realtimeEvents.push({
              classId: Number(existingStudent.classId),
              studentId: Number(existingStudent.id),
            });
          }

          updatedCount += 1;
          updatedIds.push(Number(existingStudent.id));
          realtimeEvents.push({
            classId: Number(resolvedClass.id),
            studentId: Number(existingStudent.id),
          });
        }

        return {
          createdCount: createdIds.length,
          updatedCount,
          classChangedCount,
          unchangedCount,
          createdClassCount,
          studentIds: createdIds,
          updatedStudentIds: updatedIds,
          realtimeEvents,
        };
      },
      {
        maxWait: 10000,
        timeout: 120000,
      },
    );

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'student',
      action: 'import',
      targetType: needsFallbackClass ? 'class' : 'school',
      targetId: needsFallbackClass ? BigInt(fallbackClassId) : user.schoolId,
      detail: {
        classId: needsFallbackClass ? fallbackClassId : null,
        createdCount: result.createdCount,
        updatedCount: result.updatedCount,
        classChangedCount: result.classChangedCount,
        unchangedCount: result.unchangedCount,
        createdClassCount: result.createdClassCount,
      },
    });

    result.realtimeEvents.forEach((event) => {
      this.realtimeService.emitClassStudentChanged(event.classId, {
        studentId: event.studentId,
        type: 'student_updated',
      });
    });

    const { realtimeEvents: _realtimeEvents, ...responseData } = result;

    return { code: 0, message: 'ok', data: responseData };
  }

  async update(authorization: string | undefined, id: number, body: Record<string, unknown>) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!['homeroom_teacher', 'school_admin', 'academic_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(user.roleCode)) {
      throw new ForbiddenException('当前角色无权编辑学生');
    }

    const classId = Number(body.classId);
    const studentNo = String(body.studentNo ?? '').trim();
    const name = String(body.name ?? '').trim();
    const gender = String(body.gender ?? '').trim();
    const avatarUrl = String(body.avatarUrl ?? '').trim();

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('学生 ID 无效');
    }
    if (!Number.isInteger(classId) || classId <= 0) {
      throw new BadRequestException('请先选择学生所在班级');
    }
    if (!studentNo || !name) {
      throw new BadRequestException('请填写完整的准考证号和姓名');
    }

    const existing = await this.prisma.student.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
        deletedAt: null,
      },
      select: {
        id: true,
        classId: true,
      },
    });
    if (!existing) {
      throw new NotFoundException('学生不存在');
    }

    this.authService.ensureCanAccessClass(user, existing.classId);
    this.authService.ensureCanAccessClass(user, classId);
    if (user.roleCode === 'homeroom_teacher') {
      await this.authService.ensureIsHomeroomOfClass(user, existing.classId);
      await this.authService.ensureIsHomeroomOfClass(user, classId);
    }

    const targetClass = await this.prisma.classroom.findFirst({
      where: {
        id: BigInt(classId),
        schoolId: user.schoolId,
        deletedAt: null,
        status: 'enabled',
      },
      select: { id: true },
    });
    if (!targetClass) {
      throw new BadRequestException('目标班级不存在或已停用');
    }

    const duplicated = await this.prisma.student.findFirst({
      where: {
        id: { not: BigInt(id) },
        schoolId: user.schoolId,
        classId: BigInt(classId),
        studentNo,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (duplicated) {
      throw new BadRequestException(`准考证号重复：${studentNo} 已存在于目标班级`);
    }

    const oldClassId = existing.classId;
    const nextClassId = BigInt(classId);
    const classChanged = oldClassId !== nextClassId;

    await this.prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: BigInt(id) },
        data: {
          classId: nextClassId,
          studentNo,
          name,
          gender: gender || null,
          avatarUrl: avatarUrl || null,
        },
      });

      await tx.studentProfile.updateMany({
        where: { studentId: BigInt(id) },
        data: { classId: nextClassId },
      });

      if (classChanged) {
        await tx.studentGroupRel.deleteMany({
          where: { studentId: BigInt(id) },
        });
      }
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'student',
      action: 'update',
      targetType: 'student',
      targetId: BigInt(id),
      detail: {
        classId,
        oldClassId: toNumber(oldClassId),
        studentNo,
        name,
      },
    });

    this.realtimeService.emitClassStudentChanged(classId, {
      studentId: id,
      type: 'student_updated',
    });
    if (classChanged) {
      this.realtimeService.emitClassStudentChanged(Number(oldClassId), {
        studentId: id,
        type: 'student_updated',
      });
    }

    return { code: 0, message: 'ok', data: { id } };
  }

  private async resolveImportClass(
    tx: Prisma.TransactionClient,
    user: Awaited<ReturnType<AuthService['getAuthUserFromAuthorization']>>,
    classes: ImportClassRow[],
    gradeConfigs: Array<{ code: string; name: string }>,
    className: string,
    gradeName?: string,
  ) {
    const matched = this.findImportClass(classes, className, gradeName);
    if (matched) return matched;

    const normalizedGradeName = String(gradeName ?? '').trim();
    if (!normalizedGradeName) {
      throw new BadRequestException(`班级 ${className} 不存在，请在表格中提供年级后再导入`);
    }

    const currentSemester = await tx.semester.findFirst({
      where: { schoolId: user.schoolId, isCurrent: true, status: 'enabled' },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    if (!currentSemester) {
      throw new BadRequestException('请先配置当前学期，再创建缺失班级');
    }

    const gradeCode = this.buildImportGradeCode(normalizedGradeName, classes, gradeConfigs);
    const created = await tx.classroom.create({
      data: {
        schoolId: user.schoolId,
        semesterId: currentSemester.id,
        code: this.buildImportClassCode(currentSemester.id, gradeCode, className, classes),
        gradeCode,
        gradeName: normalizedGradeName,
        name: className,
        homeroomTeacherId: user.roleCode === 'homeroom_teacher' ? user.id : null,
        displayStatus: 'enabled',
        sortOrder: this.buildImportClassSortOrder(gradeCode, classes),
        status: 'enabled',
      },
      select: { id: true, semesterId: true, code: true, gradeCode: true, gradeName: true, name: true, sortOrder: true },
    });

    if (user.roleCode === 'homeroom_teacher') {
      await tx.userScope.create({
        data: {
          userId: user.id,
          scopeType: 'class_scope',
          classId: created.id,
        },
      });
      await tx.teacherClassAssignment.create({
        data: {
          schoolId: user.schoolId,
          teacherId: user.id,
          classId: created.id,
          roleInClass: 'homeroom',
          isPrimary: true,
          status: 'enabled',
        },
      });
    }

    classes.push(created);
    return created;
  }

  private findImportClass(classes: ImportClassRow[], className: string, gradeName?: string) {
    const normalizedClassName = this.normalizeImportName(className);
    const normalizedGradeName = this.normalizeImportName(gradeName ?? '');
    return classes.find((item) => {
      const classMatched = this.normalizeImportName(item.name) === normalizedClassName;
      if (!classMatched) return false;
      return !normalizedGradeName || this.normalizeImportName(item.gradeName) === normalizedGradeName;
    }) ?? null;
  }

  private normalizeImportName(value: string) {
    return value.trim().toLowerCase().replace(/[\s()（）_-]+/g, '');
  }

  private buildImportGradeCode(
    gradeName: string,
    classes: ImportClassRow[],
    gradeConfigs: Array<{ code: string; name: string }>,
  ) {
    const matchedConfig = gradeConfigs.find((item) => this.normalizeImportName(item.name) === this.normalizeImportName(gradeName));
    if (matchedConfig?.code) return matchedConfig.code;
    const matchedClass = classes.find((item) => this.normalizeImportName(item.gradeName) === this.normalizeImportName(gradeName) && item.gradeCode);
    if (matchedClass?.gradeCode) return matchedClass.gradeCode;
    const uniqueGradeCount = new Set(classes.map((item) => item.gradeName.trim()).filter(Boolean)).size + 1;
    return `grade-${String(uniqueGradeCount).padStart(2, '0')}`;
  }

  private buildImportClassCode(semesterId: bigint, gradeCode: string, className: string, classes: ImportClassRow[]) {
    const siblingCount = classes.filter((item) => item.gradeCode === gradeCode).length + 1;
    const slug = className
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `cls-${semesterId}-${gradeCode}-${slug || `class-${String(siblingCount).padStart(2, '0')}`}`;
  }

  private buildImportClassSortOrder(gradeCode: string, classes: ImportClassRow[]) {
    const sameGradeOrders = classes
      .filter((item) => item.gradeCode === gradeCode)
      .map((item) => item.sortOrder)
      .filter((value): value is number => typeof value === 'number');
    return sameGradeOrders.length > 0
      ? Math.max(...sameGradeOrders) + 1
      : classes.filter((item) => item.gradeCode === gradeCode).length + 1;
  }

  async adoptPet(
    authorization: string | undefined,
    studentId: number,
    body: StudentAdoptPetDto,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.authService.ensureCanAccessClass(user, body.classId);

    if (
      !['homeroom_teacher', 'school_admin', 'academic_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(
        user.roleCode,
      )
    ) {
      throw new ForbiddenException('当前角色无权执行萌宠领养');
    }
    if (user.roleCode === 'homeroom_teacher') {
      await this.authService.ensureIsHomeroomOfClass(user, body.classId);
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
          category: { in: ['star', 'zodiac'] },
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

  async resetPet(authorization: string | undefined, studentId: number) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (
      !['homeroom_teacher', 'school_admin', 'academic_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(
        user.roleCode,
      )
    ) {
      throw new ForbiddenException('当前角色无权重置学生萌宠');
    }

    if (!Number.isInteger(studentId) || studentId <= 0) {
      throw new BadRequestException('学生 ID 无效');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.findFirst({
        where: {
          id: BigInt(studentId),
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

      this.authService.ensureCanAccessClass(user, student.classId);
      if (user.roleCode === 'homeroom_teacher') {
        await this.authService.ensureIsHomeroomOfClass(user, student.classId);
      }

      if (!student.studentPet) {
        throw new BadRequestException('该学生尚未领取萌宠');
      }

      if (student.studentPet.currentLevel !== 1) {
        throw new BadRequestException('仅萌宠等级为 1 时可重置为未领取');
      }

      const petName = student.studentPet.pet.name;
      const petCode = student.studentPet.pet.code;

      await tx.petLevelLog.deleteMany({
        where: { studentId: BigInt(studentId) },
      });
      await tx.studentPet.delete({
        where: { studentId: BigInt(studentId) },
      });
      if (student.profile) {
        await tx.studentProfile.update({
          where: { studentId: BigInt(studentId) },
          data: { currentPetLevel: 1 },
        });
      }

      return {
        studentId,
        studentName: student.name,
        classId: Number(student.classId),
        petName,
        petCode,
      };
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'student_pet',
      action: 'reset',
      targetType: 'student',
      targetId: BigInt(studentId),
      detail: {
        classId: result.classId,
        petCode: result.petCode,
        petName: result.petName,
      },
    });

    this.realtimeService.emitClassStudentChanged(result.classId, {
      classId: result.classId,
      studentId,
      type: 'student_pet_reset',
      operatorName: user.name,
    });

    return { code: 0, message: 'ok', data: result };
  }
}
