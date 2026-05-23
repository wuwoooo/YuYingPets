import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { toNumber } from '@/common/utils/bigint.util';

type AcademicImportSubject = {
  subjectName: string;
  score?: unknown;
  jointRank?: unknown;
  schoolRank?: unknown;
  schoolRankDelta?: unknown;
  classRank?: unknown;
  classRankDelta?: unknown;
};

type AcademicImportStudent = {
  studentNo?: unknown;
  name?: unknown;
  className?: unknown;
  subjects?: unknown;
};

type ImportClassRow = {
  id: bigint;
  semesterId: bigint;
  code: string;
  gradeCode: string;
  gradeName: string;
  name: string;
  sortOrder: number | null;
};

type StudentAcademicExamGroup = {
  examId: number;
  examName: string;
  gradeName: string | null;
  sourceFile: string | null;
  examDate: Date;
  periodLabel: string | null;
  importedAt: Date;
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    score: number | null;
    jointRank: number | null;
    schoolRank: number | null;
    schoolRankDelta: number | null;
    classRank: number | null;
    classRankDelta: number | null;
  }>;
};

type AcademicRecordQuery = Record<string, string | undefined>;

type SchoolGrowthExamItem = {
  id: number;
  name: string;
  gradeName: string | null;
  sourceFile: string | null;
  examDate: string;
  periodLabel: string | null;
  importedAt: string;
  recordCount: number;
};

type SchoolGrowthClassItem = {
  id: number;
  name: string;
  gradeName: string;
};

type SchoolGrowthStudentItem = {
  id: number;
  classId: number;
};

type SchoolGrowthScoreRow = {
  examId: number;
  classId: number;
  className: string;
  studentId: number;
  studentName: string;
  totalScore: number;
  schoolRankDelta: number | null;
  classRankDelta: number | null;
};

const SUBJECT_CODE_MAP: Record<string, string> = {
  语文: 'chinese',
  数学: 'math',
  英语: 'english',
  物理: 'physics',
  化学: 'chemistry',
  生物: 'biology',
  历史: 'history',
  地理: 'geography',
  道德与法治: 'politics',
  政治: 'politics',
  总分: 'total',
};

@Injectable()
export class AcademicRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
  ) {}

  async import(authorization: string | undefined, body: Record<string, unknown>) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!['super_admin', 'school_admin', 'academic_admin', 'moral_admin', 'grade_admin', 'homeroom_teacher'].includes(user.roleCode)) {
      throw new ForbiddenException('当前角色无权导入成绩');
    }

    const examName = this.cleanExamName(String(body.examName ?? '').trim());
    if (!examName) {
      throw new BadRequestException('缺少考试名称');
    }

    const students = Array.isArray(body.students) ? (body.students as AcademicImportStudent[]) : [];
    if (!students.length) {
      throw new BadRequestException('请提供成绩数据');
    }

    const currentSemester = await this.prisma.semester.findFirst({
      where: { schoolId: user.schoolId, isCurrent: true, status: 'enabled' },
      orderBy: { id: 'desc' },
      select: { id: true, name: true },
    });
    if (!currentSemester) {
      throw new BadRequestException('请先配置当前学期，再导入成绩');
    }
    const requestedSemesterId = Number(body.semesterId);
    const targetSemester =
      Number.isInteger(requestedSemesterId) && requestedSemesterId > 0
        ? await this.prisma.semester.findFirst({
            where: { id: BigInt(requestedSemesterId), schoolId: user.schoolId, status: 'enabled' },
            select: { id: true, name: true },
          })
        : currentSemester;
    if (!targetSemester) {
      throw new BadRequestException('所选学期不存在或不可用');
    }
    const examDate = this.parseExamDate(body.examDate);
    const periodLabel =
      String(body.periodLabel ?? '').trim() ||
      this.inferAcademicPeriodLabel(`${examName} ${String(body.sourceFile ?? '')}`, examDate, targetSemester.name);

    const duplicatedExam = await this.prisma.academicExam.findFirst({
      where: {
        schoolId: user.schoolId,
        semesterId: targetSemester.id,
        name: examName,
        examDate,
      },
      select: { id: true },
    });
    if (duplicatedExam) {
      throw new BadRequestException(`考试重复：${examName}（${this.toDateOnly(examDate)}）已导入`);
    }

    const sameSemesterExams = await this.prisma.academicExam.findMany({
      where: {
        schoolId: user.schoolId,
        semesterId: targetSemester.id,
      },
      select: { id: true, name: true, examDate: true },
    });
    const duplicatedByCleanName = sameSemesterExams.find((item) => this.cleanExamName(item.name) === examName && this.toDateOnly(item.examDate) === this.toDateOnly(examDate));
    if (duplicatedByCleanName) {
      throw new BadRequestException(`考试重复：${examName}（${this.toDateOnly(examDate)}）已导入`);
    }

    const unmatched: Array<{ row: number; studentNo: string; name: string; className: string; reason: string }> = [];

    const result = await this.prisma.$transaction(async (tx) => {
      const classes = await tx.classroom.findMany({
        where: { schoolId: user.schoolId, deletedAt: null, status: 'enabled' },
        select: { id: true, semesterId: true, code: true, gradeCode: true, gradeName: true, name: true, sortOrder: true },
      });
      const gradeConfigs = await tx.gradeConfig.findMany({
        where: { schoolId: user.schoolId, deletedAt: null, status: 'enabled' },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: { code: true, name: true },
      });
      const existingStudents = await tx.student.findMany({
        where: { schoolId: user.schoolId, deletedAt: null, status: 'enabled' },
        select: { id: true, classId: true, studentNo: true, name: true },
      });
      const studentByNo = new Map(existingStudents.map((item) => [`${item.classId}:${this.normalizeText(item.studentNo)}`, item]));
      const studentByName = new Map(existingStudents.map((item) => [`${item.classId}:${this.normalizeText(item.name)}`, item]));
      const studentByGlobalNo = new Map(existingStudents.map((item) => [this.normalizeText(item.studentNo), item]));
      const rows: Prisma.AcademicScoreRecordCreateManyInput[] = [];
      const touchedClassIds = new Set<string>();
      const createdClassIds = new Set<string>();
      let createdClassCount = 0;
      let createdStudentCount = 0;

      for (const [index, item] of students.entries()) {
        const studentNo = String(item.studentNo ?? '').trim();
        const name = String(item.name ?? '').trim();
        const className = String(item.className ?? '').trim();
        const subjects = Array.isArray(item.subjects) ? (item.subjects as AcademicImportSubject[]) : [];
        if (!studentNo || !name || !className || !subjects.length) {
          unmatched.push({ row: index + 1, studentNo, name, className, reason: '缺少准考证号、姓名、班级或科目成绩' });
          continue;
        }

        const gradeName = String(body.gradeName ?? '').trim() || this.extractGradeName(className);
        const matchedClass = this.findImportClass(classes, className, gradeName);
        const classroom = matchedClass ?? await this.resolveImportClass(tx, user, classes, gradeConfigs, className, gradeName, targetSemester.id);
        if (!matchedClass) {
          createdClassCount += 1;
          createdClassIds.add(classroom.id.toString());
        }
        if (matchedClass && !createdClassIds.has(classroom.id.toString()) && !this.authService.canAccessClass(user, classroom.id)) {
          unmatched.push({ row: index + 1, studentNo, name, className, reason: '无权导入该班级成绩' });
          continue;
        }

        let student =
          studentByNo.get(`${classroom.id}:${this.normalizeText(studentNo)}`) ??
          studentByName.get(`${classroom.id}:${this.normalizeText(name)}`) ??
          studentByGlobalNo.get(this.normalizeText(studentNo));
        if (!student) {
          student = await tx.student.create({
            data: {
              schoolId: user.schoolId,
              classId: classroom.id,
              studentNo,
              name,
              status: 'enabled',
            },
            select: { id: true, classId: true, studentNo: true, name: true },
          });
          await tx.studentProfile.create({
            data: {
              studentId: student.id,
              classId: classroom.id,
            },
          });
          studentByNo.set(`${classroom.id}:${this.normalizeText(studentNo)}`, student);
          studentByName.set(`${classroom.id}:${this.normalizeText(name)}`, student);
          studentByGlobalNo.set(this.normalizeText(studentNo), student);
          createdStudentCount += 1;
        }

        touchedClassIds.add(classroom.id.toString());
        subjects.forEach((subject) => {
          const subjectName = String(subject.subjectName ?? '').trim();
          if (!subjectName) return;
          rows.push({
            schoolId: user.schoolId,
            semesterId: targetSemester.id,
            examId: BigInt(0),
            classId: classroom.id,
            studentId: student.id,
            studentNo,
            studentName: name,
            className,
            subjectCode: SUBJECT_CODE_MAP[subjectName] ?? this.buildSubjectCode(subjectName),
            subjectName,
            score: this.toDecimal(subject.score),
            jointRank: this.toInteger(subject.jointRank),
            schoolRank: this.toInteger(subject.schoolRank),
            schoolRankDelta: this.toInteger(subject.schoolRankDelta),
            classRank: this.toInteger(subject.classRank),
            classRankDelta: this.toInteger(subject.classRankDelta),
          });
        });
      }

      if (!rows.length) {
        throw new BadRequestException({
          message: '没有匹配到可导入的成绩记录',
          unmatched,
        });
      }

      const exam = await tx.academicExam.create({
        data: {
          schoolId: user.schoolId,
          semesterId: targetSemester.id,
          gradeName: String(body.gradeName ?? '').trim() || null,
          name: examName,
          examDate,
          periodLabel,
          sourceFile: String(body.sourceFile ?? '').trim() || null,
          importedBy: user.id,
          importedByName: user.name,
        },
      });

      await tx.academicScoreRecord.createMany({
        data: rows.map((row) => ({ ...row, examId: exam.id })),
        skipDuplicates: true,
      });

      return {
        examId: Number(exam.id),
        importedStudentCount: new Set(rows.map((row) => row.studentId.toString())).size,
        importedRecordCount: rows.length,
        classCount: touchedClassIds.size,
        createdClassCount,
        createdStudentCount,
      };
    }, { maxWait: 10000, timeout: 120000 });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'academic',
      action: 'import',
      targetType: 'exam',
      targetId: BigInt(result.examId),
      detail: {
        examName,
        examDate: this.toDateOnly(examDate),
        periodLabel,
        sourceFile: String(body.sourceFile ?? '').trim() || null,
        classCount: result.classCount,
        createdClassCount: result.createdClassCount,
        createdStudentCount: result.createdStudentCount,
        importedStudentCount: result.importedStudentCount,
        importedRecordCount: result.importedRecordCount,
        unmatchedCount: unmatched.length,
      },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        ...result,
        unmatchedCount: unmatched.length,
        unmatched: unmatched.slice(0, 50),
      },
    };
  }

  async exams(authorization: string | undefined) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const classRestriction = this.getClassRestriction(user);

    const rows = await this.prisma.academicExam.findMany({
      where: {
        schoolId: user.schoolId,
        ...(classRestriction
          ? {
              records: {
                some: {
                  classId: { in: classRestriction },
                },
              },
            }
          : {}),
      },
      include: {
        _count: {
          select: { records: true },
        },
      },
      orderBy: [{ examDate: 'desc' }, { id: 'desc' }],
      take: 50,
    });

    return {
      code: 0,
      message: 'ok',
      data: rows.map((row) => ({
        id: toNumber(row.id),
        name: this.cleanExamName(row.name),
        gradeName: row.gradeName,
        sourceFile: row.sourceFile,
        examDate: row.examDate,
        periodLabel: row.periodLabel,
        importedAt: row.importedAt,
        recordCount: row._count.records,
      })),
    };
  }

  async updateExam(authorization: string | undefined, examId: number, body: Record<string, unknown>) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!['super_admin', 'school_admin', 'academic_admin', 'moral_admin', 'grade_admin', 'homeroom_teacher'].includes(user.roleCode)) {
      throw new ForbiddenException('当前角色无权编辑考试信息');
    }
    if (!Number.isInteger(examId) || examId <= 0) {
      throw new BadRequestException('考试 ID 无效');
    }

    const exam = await this.prisma.academicExam.findFirst({
      where: { id: BigInt(examId), schoolId: user.schoolId },
      include: {
        records: {
          select: { classId: true },
          distinct: ['classId'],
        },
      },
    });
    if (!exam) {
      throw new NotFoundException('考试不存在');
    }

    const classRestriction = this.getClassRestriction(user);
    if (classRestriction) {
      const allowed = new Set(classRestriction.map((classId) => classId.toString()));
      const hasOutOfScopeClass = exam.records.some((record) => !allowed.has(record.classId.toString()));
      if (hasOutOfScopeClass) {
        throw new ForbiddenException('不能编辑包含其他班级成绩的考试批次');
      }
    }

    const examName = this.cleanExamName(String(body.examName ?? body.name ?? '').trim());
    if (!examName) {
      throw new BadRequestException('缺少考试名称');
    }
    const examDate = this.parseExamDate(body.examDate);
    const periodLabel =
      String(body.periodLabel ?? '').trim() ||
      this.inferAcademicPeriodLabel(`${examName} ${exam.sourceFile ?? ''}`, examDate, null);

    const sameDayExams = await this.prisma.academicExam.findMany({
      where: {
        schoolId: user.schoolId,
        semesterId: exam.semesterId,
        examDate,
        NOT: { id: exam.id },
      },
      select: { id: true, name: true },
    });
    const duplicated = sameDayExams.find((item) => this.cleanExamName(item.name) === examName);
    if (duplicated) {
      throw new BadRequestException(`考试重复：${examName}（${this.toDateOnly(examDate)}）已存在`);
    }

    const updated = await this.prisma.academicExam.update({
      where: { id: exam.id },
      data: {
        name: examName,
        examDate,
        periodLabel,
      },
      include: {
        _count: {
          select: { records: true },
        },
      },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'academic',
      action: 'update_exam',
      targetType: 'exam',
      targetId: exam.id,
      detail: {
        before: {
          examName: exam.name,
          examDate: this.toDateOnly(exam.examDate),
          periodLabel: exam.periodLabel,
        },
        after: {
          examName: updated.name,
          examDate: this.toDateOnly(updated.examDate),
          periodLabel: updated.periodLabel,
        },
      },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        id: toNumber(updated.id),
        name: this.cleanExamName(updated.name),
        gradeName: updated.gradeName,
        sourceFile: updated.sourceFile,
        examDate: updated.examDate,
        periodLabel: updated.periodLabel,
        importedAt: updated.importedAt,
        recordCount: updated._count.records,
      },
    };
  }

  async list(authorization: string | undefined, query: AcademicRecordQuery) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const classRestriction = this.getClassRestriction(user);
    const classId = Number(query.classId);
    const examId = Number(query.examId);
    const keyword = String(query.keyword ?? '').trim();
    const gradeName = String(query.gradeName ?? '').trim();
    const includeSubjects = query.includeSubjects === 'true';

    if (query.classId) {
      if (!Number.isInteger(classId) || classId <= 0) {
        throw new BadRequestException('班级筛选无效');
      }
      this.authService.ensureCanAccessClass(user, classId);
    }

    const hasExplicitExamId = query.examId && Number.isInteger(examId) && examId > 0;
    const scopedExamIds =
      !includeSubjects && !hasExplicitExamId
        ? (
            await this.prisma.academicExam.findMany({
              where: {
                schoolId: user.schoolId,
                ...(classRestriction
                  ? {
                      records: {
                        some: {
                          classId: { in: classRestriction },
                        },
                      },
                    }
                  : {}),
              },
              orderBy: [{ examDate: 'desc' }, { id: 'desc' }],
              take: 50,
              select: { id: true },
            })
          ).map((item) => item.id)
        : null;

    const rows = await this.prisma.academicScoreRecord.findMany({
      where: {
        schoolId: user.schoolId,
        ...(includeSubjects ? {} : { subjectCode: 'total' }),
        ...(query.classId ? { classId: BigInt(classId) } : classRestriction ? { classId: { in: classRestriction } } : {}),
        ...(hasExplicitExamId
          ? { examId: BigInt(examId) }
          : scopedExamIds
            ? { examId: { in: scopedExamIds } }
            : {}),
        ...(gradeName ? { classroom: { gradeName } } : {}),
        ...(keyword
          ? {
              OR: [
                { studentName: { contains: keyword } },
                { studentNo: { contains: keyword } },
                { className: { contains: keyword } },
                { exam: { name: { contains: keyword } } },
              ],
            }
          : {}),
      },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            gradeName: true,
            sourceFile: true,
            examDate: true,
            periodLabel: true,
            importedAt: true,
          },
        },
      },
      orderBy: [{ exam: { examDate: 'desc' } }, { classId: 'asc' }, { classRank: 'asc' }, { studentNo: 'asc' }],
      take: includeSubjects ? 20000 : 10000,
    });

    return {
      code: 0,
      message: 'ok',
      data: rows.map((record) => ({
        id: toNumber(record.id),
        examId: toNumber(record.examId),
        examName: this.cleanExamName(record.exam.name),
        examGradeName: record.exam.gradeName,
        sourceFile: record.exam.sourceFile,
        examDate: record.exam.examDate,
        periodLabel: record.exam.periodLabel,
        importedAt: record.exam.importedAt,
        classId: toNumber(record.classId),
        className: record.className,
        studentId: toNumber(record.studentId),
        studentNo: record.studentNo,
        studentName: record.studentName,
        subjectCode: record.subjectCode,
        subjectName: record.subjectName,
        totalScore: record.score === null ? null : Number(record.score),
        schoolRank: record.schoolRank,
        schoolRankDelta: record.schoolRankDelta,
        classRank: record.classRank,
        classRankDelta: record.classRankDelta,
      })),
    };
  }

  async studentRecords(authorization: string | undefined, studentId: number) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const student = await this.prisma.student.findFirst({
      where: { id: BigInt(studentId), schoolId: user.schoolId, deletedAt: null },
      select: { id: true, classId: true },
    });
    if (!student) {
      throw new NotFoundException('学生不存在');
    }
    this.authService.ensureCanAccessClass(user, student.classId);

    const records = await this.prisma.academicScoreRecord.findMany({
      where: { studentId: student.id, schoolId: user.schoolId },
      include: { exam: true },
      orderBy: [{ exam: { examDate: 'desc' } }, { subjectCode: 'asc' }],
      take: 120,
    });

    const grouped = new Map<string, StudentAcademicExamGroup>();

    records.forEach((record) => {
      const key = record.examId.toString();
      const current = grouped.get(key) ?? {
        examId: Number(record.examId),
        examName: this.cleanExamName(record.exam.name),
        gradeName: record.exam.gradeName,
        sourceFile: record.exam.sourceFile,
        examDate: record.exam.examDate,
        periodLabel: record.exam.periodLabel,
        importedAt: record.exam.importedAt,
        subjects: [],
      };
      current.subjects.push({
        subjectCode: record.subjectCode,
        subjectName: record.subjectName,
        score: record.score === null ? null : Number(record.score),
        jointRank: record.jointRank,
        schoolRank: record.schoolRank,
        schoolRankDelta: record.schoolRankDelta,
        classRank: record.classRank,
        classRankDelta: record.classRankDelta,
      });
      grouped.set(key, current);
    });

    return {
      code: 0,
      message: 'ok',
      data: Array.from(grouped.values()),
    };
  }

  /**
   * 教师工作台单科/趋势：服务端聚合单班数据，避免 includeSubjects 大报文拉到浏览器。
   * query: classId 必填；subjectCode 有值时聚合该科（默认最近一场含总分的考试）；examId 可锚定场次。
   */
  async deskOverview(authorization: string | undefined, query: Record<string, string>) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const classIdNum = Number(query.classId ?? '');
    if (!Number.isInteger(classIdNum) || classIdNum <= 0) {
      throw new BadRequestException('无效的 classId');
    }
    const classId = BigInt(classIdNum);
    this.authService.ensureCanAccessClass(user, classId);

    /** 本校该班曾经有总分记录的若干场考试（从新到旧，最多 6 场），趋势按时间早→晚返回 */
    const examsRecent = await this.prisma.academicExam.findMany({
      where: {
        schoolId: user.schoolId,
        records: {
          some: {
            classId,
            subjectCode: 'total',
            score: { not: null },
          },
        },
      },
      orderBy: [{ examDate: 'desc' }, { id: 'desc' }],
      take: 6,
      select: {
        id: true,
        name: true,
        examDate: true,
        periodLabel: true,
        importedAt: true,
        gradeName: true,
      },
    });

    /** 与同班学籍年级对齐，年级整场对标需要用到 */
    const classroomBench = await this.prisma.classroom.findFirst({
      where: { id: classId, schoolId: user.schoolId, deletedAt: null, status: 'enabled' },
      select: { gradeName: true },
    });

    const examTrends = [];
    for (const exam of [...examsRecent].reverse()) {
      const agg = await this.prisma.academicScoreRecord.aggregate({
        where: {
          schoolId: user.schoolId,
          classId,
          examId: exam.id,
          subjectCode: 'total',
          score: { not: null },
        },
        _avg: { score: true },
        _count: { id: true },
      });
      const avgNum = agg._avg.score !== null ? Math.round(Number(agg._avg.score) * 10) / 10 : 0;
      examTrends.push({
        examId: Number(exam.id),
        examName: this.cleanExamName(exam.name),
        examDate: exam.examDate,
        periodLabel: exam.periodLabel,
        importedAt: exam.importedAt,
        classAverageScore: avgNum,
        participantCount: agg._count.id,
      });
    }

    const rawSubjectCode = String(query.subjectCode ?? '').trim();
    let subjectFocus: {
      examId: number;
      examName: string;
      subjectCode: string;
      subjectName: string | null;
      averageScore: number;
      participantCount: number;
      sampleLow: Array<{
        studentId: number;
        studentName: string;
        score: number;
        classRank: number | null;
        classRankDelta: number | null;
      }>;
      sampleHigh: Array<{
        studentId: number;
        studentName: string;
        score: number;
        classRank: number | null;
        classRankDelta: number | null;
      }>;
    } | null = null;

    if (rawSubjectCode && rawSubjectCode !== 'total') {
      const requestedExamNum = Number(query.examId ?? '');
      let targetExam =
        examsRecent.find((exam) =>
          Number.isInteger(requestedExamNum) &&
          requestedExamNum > 0 &&
          Number(exam.id) === requestedExamNum,
        ) ??
        examsRecent[0] ??
        null;

      if (!targetExam && Number.isInteger(requestedExamNum) && requestedExamNum > 0) {
        const exists = await this.prisma.academicScoreRecord.count({
          where: {
            schoolId: user.schoolId,
            classId,
            examId: BigInt(requestedExamNum),
            subjectCode: rawSubjectCode,
            score: { not: null },
          },
        });
        if (exists > 0) {
          const extra = await this.prisma.academicExam.findFirst({
            where: { id: BigInt(requestedExamNum), schoolId: user.schoolId },
            select: {
              id: true,
              name: true,
              examDate: true,
              periodLabel: true,
              importedAt: true,
              gradeName: true,
            },
          });
          if (extra) targetExam = extra;
        }
      }

      if (targetExam) {
        const subAgg = await this.prisma.academicScoreRecord.aggregate({
          where: {
            schoolId: user.schoolId,
            classId,
            examId: targetExam.id,
            subjectCode: rawSubjectCode,
            score: { not: null },
          },
          _avg: { score: true },
          _count: { id: true },
        });

        const anyName = await this.prisma.academicScoreRecord.findFirst({
          where: {
            schoolId: user.schoolId,
            classId,
            examId: targetExam.id,
            subjectCode: rawSubjectCode,
            score: { not: null },
          },
          select: { subjectName: true },
        });

        const mapRow = (
          row: {
            studentId: bigint;
            studentName: string;
            score: Prisma.Decimal | null;
            classRank: number | null;
            classRankDelta: number | null;
          },
        ) => ({
          studentId: Number(row.studentId),
          studentName: row.studentName,
          score: row.score !== null ? Math.round(Number(row.score) * 10) / 10 : 0,
          classRank: row.classRank,
          classRankDelta: row.classRankDelta,
        });

        const [lowSel, highSel] = await Promise.all([
          this.prisma.academicScoreRecord.findMany({
            where: {
              schoolId: user.schoolId,
              classId,
              examId: targetExam.id,
              subjectCode: rawSubjectCode,
              score: { not: null },
            },
            orderBy: [{ score: 'asc' }, { studentId: 'asc' }],
            take: 5,
            select: {
              studentId: true,
              studentName: true,
              score: true,
              classRank: true,
              classRankDelta: true,
            },
          }),
          this.prisma.academicScoreRecord.findMany({
            where: {
              schoolId: user.schoolId,
              classId,
              examId: targetExam.id,
              subjectCode: rawSubjectCode,
              score: { not: null },
            },
            orderBy: [{ score: 'desc' }, { studentId: 'asc' }],
            take: 5,
            select: {
              studentId: true,
              studentName: true,
              score: true,
              classRank: true,
              classRankDelta: true,
            },
          }),
        ]);

        subjectFocus = {
          examId: Number(targetExam.id),
          examName: this.cleanExamName(targetExam.name),
          subjectCode: rawSubjectCode,
          subjectName: anyName?.subjectName ?? rawSubjectCode,
          averageScore: subAgg._avg.score !== null ? Math.round(Number(subAgg._avg.score) * 10) / 10 : 0,
          participantCount: subAgg._count.id,
          sampleLow: lowSel.map(mapRow),
          sampleHigh: highSel.map(mapRow),
        };
      }
    }

    /** 本场考试本校同学籍年级的全体参评学生加权均分（不随前端可见行裁剪），供教师与本班对照 */
    const requestedBenchExam = Number(query.examId ?? '');
    let benchmarkExam =
      examsRecent.find(
        (exam) =>
          Number.isInteger(requestedBenchExam) &&
          requestedBenchExam > 0 &&
          Number(exam.id) === requestedBenchExam,
      ) ??
      examsRecent[0] ??
      null;

    if (
      !benchmarkExam &&
      Number.isInteger(requestedBenchExam) &&
      requestedBenchExam > 0
    ) {
      const totalExistsForBench = await this.prisma.academicScoreRecord.count({
        where: {
          schoolId: user.schoolId,
          classId,
          examId: BigInt(requestedBenchExam),
          subjectCode: 'total',
          score: { not: null },
        },
      });
      if (totalExistsForBench > 0) {
        const extraBenchExam = await this.prisma.academicExam.findFirst({
          where: { id: BigInt(requestedBenchExam), schoolId: user.schoolId },
          select: {
            id: true,
            name: true,
            examDate: true,
            periodLabel: true,
            importedAt: true,
            gradeName: true,
          },
        });
        if (extraBenchExam) benchmarkExam = extraBenchExam;
      }
    }

    let gradeExamBenchmark:
      | {
          examId: number;
          gradeName: string;
          participantAverageScore: number;
          participantCount: number;
          distinctClassCount: number;
        }
      | null = null;

    const benchGradeLabel = classroomBench?.gradeName?.trim();
    if (benchmarkExam && benchGradeLabel) {
      const cohortWhere: Prisma.AcademicScoreRecordWhereInput = {
        schoolId: user.schoolId,
        examId: benchmarkExam.id,
        subjectCode: 'total',
        score: { not: null },
        classroom: {
          deletedAt: null,
          status: 'enabled',
          gradeName: benchGradeLabel,
        },
      };

      const [cohortAgg, classGroups] = await Promise.all([
        this.prisma.academicScoreRecord.aggregate({
          where: cohortWhere,
          _avg: { score: true },
          _count: { id: true },
        }),
        this.prisma.academicScoreRecord.groupBy({
          by: ['classId'],
          where: cohortWhere,
          _count: { id: true },
        }),
      ]);

      const avgWhole = cohortAgg._avg.score;
      const cohortN = cohortAgg._count.id;
      if (
        cohortN > 0 &&
        avgWhole !== null &&
        typeof classGroups?.length === 'number'
      ) {
        gradeExamBenchmark = {
          examId: Number(benchmarkExam.id),
          gradeName: benchGradeLabel,
          participantAverageScore: Math.round(Number(avgWhole) * 10) / 10,
          participantCount: cohortN,
          distinctClassCount: classGroups.length,
        };
      }
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        examTrends,
        subjectFocus,
        gradeExamBenchmark,
      },
    };
  }

  async schoolGrowth(authorization: string | undefined, query: Record<string, string>) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const classRestriction = this.getClassRestriction(user);
    const examId = Number(query.examId ?? '');
    const hasExplicitExamId = Number.isInteger(examId) && examId > 0;

    const [classrooms, students, examsRaw] = await Promise.all([
      this.prisma.classroom.findMany({
        where: {
          schoolId: user.schoolId,
          deletedAt: null,
          status: 'enabled',
          ...(classRestriction ? { id: { in: classRestriction } } : {}),
        },
        select: { id: true, name: true, gradeName: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.student.findMany({
        where: {
          schoolId: user.schoolId,
          deletedAt: null,
          status: 'enabled',
          ...(classRestriction ? { classId: { in: classRestriction } } : {}),
        },
        select: { id: true, classId: true },
      }),
      this.prisma.academicExam.findMany({
        where: {
          schoolId: user.schoolId,
          ...(classRestriction
            ? {
                records: {
                  some: {
                    classId: { in: classRestriction },
                    subjectCode: 'total',
                    score: { not: null },
                  },
                },
              }
            : {
                records: {
                  some: {
                    subjectCode: 'total',
                    score: { not: null },
                  },
                },
              }),
        },
        include: {
          _count: {
            select: { records: true },
          },
        },
        orderBy: [{ examDate: 'desc' }, { id: 'desc' }],
        take: 50,
      }),
    ]);

    const exams: SchoolGrowthExamItem[] = examsRaw.map((row) => ({
      id: Number(row.id),
      name: this.cleanExamName(row.name),
      gradeName: row.gradeName,
      sourceFile: row.sourceFile,
      examDate: row.examDate.toISOString(),
      periodLabel: row.periodLabel,
      importedAt: row.importedAt.toISOString(),
      recordCount: row._count.records,
    }));

    const focusExam =
      (hasExplicitExamId ? exams.find((item) => item.id === examId) : null) ??
      exams[0] ??
      null;

    if (!focusExam) {
      return {
        code: 0,
        message: 'ok',
        data: this.buildEmptySchoolGrowthSummary(),
      };
    }

    const comparableExams = focusExam.gradeName
      ? exams.filter((item) => item.gradeName === focusExam.gradeName)
      : exams;
    const focusExamIndex = comparableExams.findIndex((item) => item.id === focusExam.id);
    const previousExam = (focusExamIndex >= 0 ? comparableExams[focusExamIndex + 1] : null) ?? null;
    const trendExams = comparableExams.slice(0, 6);
    const relevantExamIds = Array.from(
      new Set(
        [focusExam.id, previousExam?.id, ...trendExams.map((item) => item.id)].filter(
          (value): value is number => typeof value === 'number' && Number.isInteger(value) && value > 0,
        ),
      ),
    );

    const classItems: SchoolGrowthClassItem[] = classrooms.map((item) => ({
      id: Number(item.id),
      name: item.name,
      gradeName: item.gradeName,
    }));
    const studentItems: SchoolGrowthStudentItem[] = students.map((item) => ({
      id: Number(item.id),
      classId: Number(item.classId),
    }));

    const rowsRaw = await this.prisma.academicScoreRecord.findMany({
      where: {
        schoolId: user.schoolId,
        subjectCode: 'total',
        score: { not: null },
        examId: { in: relevantExamIds.map((item) => BigInt(item)) },
        ...(classRestriction ? { classId: { in: classRestriction } } : {}),
      },
      select: {
        examId: true,
        classId: true,
        className: true,
        studentId: true,
        studentName: true,
        score: true,
        schoolRankDelta: true,
        classRankDelta: true,
      },
      orderBy: [{ examId: 'desc' }, { classId: 'asc' }, { studentId: 'asc' }],
    });

    const scoreRows: SchoolGrowthScoreRow[] = rowsRaw.map((row) => ({
      examId: Number(row.examId),
      classId: Number(row.classId),
      className: row.className,
      studentId: Number(row.studentId),
      studentName: row.studentName,
      totalScore: Math.round(Number(row.score) * 10) / 10,
      schoolRankDelta: row.schoolRankDelta,
      classRankDelta: row.classRankDelta,
    }));

    return {
      code: 0,
      message: 'ok',
      data: this.buildSchoolGrowthSummary(
        comparableExams,
        scoreRows,
        classItems,
        studentItems,
        focusExam.id,
      ),
    };
  }

  private async resolveImportClass(
    tx: Prisma.TransactionClient,
    user: Awaited<ReturnType<AuthService['getAuthUserFromAuthorization']>>,
    classes: ImportClassRow[],
    gradeConfigs: Array<{ code: string; name: string }>,
    className: string,
    gradeName?: string,
    targetSemesterId?: bigint,
  ) {
    const matched = this.findImportClass(classes, className, gradeName);
    if (matched) return matched;

    const normalizedGradeName = String(gradeName ?? '').trim();
    if (!normalizedGradeName) {
      throw new BadRequestException(`班级 ${className} 不存在，请在成绩表中提供年级信息后再导入`);
    }

    const targetSemester =
      targetSemesterId
        ? await tx.semester.findFirst({
            where: { id: targetSemesterId, schoolId: user.schoolId, status: 'enabled' },
            select: { id: true },
          })
        : await tx.semester.findFirst({
            where: { schoolId: user.schoolId, isCurrent: true, status: 'enabled' },
            orderBy: { id: 'desc' },
            select: { id: true },
          });
    if (!targetSemester) {
      throw new BadRequestException('请先配置当前学期，再创建缺失班级');
    }

    const gradeCode = this.buildImportGradeCode(normalizedGradeName, classes, gradeConfigs);
    const created = await tx.classroom.create({
      data: {
        schoolId: user.schoolId,
        semesterId: targetSemester.id,
        code: this.buildImportClassCode(targetSemester.id, gradeCode, className, classes),
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
    }

    classes.push(created);
    return created;
  }

  private findImportClass(classes: ImportClassRow[], className: string, gradeName?: string) {
    const normalizedClassName = this.normalizeImportName(className);
    const normalizedGradeName = this.normalizeImportName(gradeName ?? '');
    return classes.find((item) => {
      const classMatched =
        this.normalizeImportName(item.name) === normalizedClassName ||
        this.normalizeImportName(`${item.gradeName}${item.name}`) === normalizedClassName ||
        this.normalizeImportName(item.name.replace(item.gradeName, '')) === normalizedClassName;
      if (!classMatched) return false;
      return !normalizedGradeName || this.normalizeImportName(item.gradeName) === normalizedGradeName;
    }) ?? null;
  }

  private extractGradeName(className: string) {
    return className.match(/^(.*?年级)/)?.[1]?.trim() ?? '';
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

  private cleanExamName(value: string) {
    const normalized = value.trim();
    if (!normalized) return normalized;
    const match = normalized.match(/^(.*?(?:成绩汇总|考生成绩汇总))\s*[-—–:：]+\s*(.+)$/);
    return (match?.[2]?.trim() || normalized).replace(/^（[^）]*年级）\s*/, '').trim();
  }

  private getClassRestriction(user: Awaited<ReturnType<AuthService['getAuthUserFromAuthorization']>>) {
    if (['super_admin', 'school_admin', 'academic_admin', 'moral_admin'].includes(user.roleCode)) {
      return null;
    }
    const classIds = Array.from(
      new Set(
        user.scopes
          .map((scope) => scope.classId)
          .filter((classId): classId is bigint => typeof classId === 'bigint'),
      ),
    );
    return classIds.length ? classIds : [BigInt(-1)];
  }

  private normalizeText(value: string) {
    return value
      .replace(/\s+/g, '')
      .replace(/[（）]/g, '')
      .toLowerCase();
  }

  private buildEmptySchoolGrowthSummary(
    overrides?: Record<string, unknown>,
  ) {
    return {
      latestExam: null,
      previousExam: null,
      coverageRate: 0,
      participantCount: 0,
      averageScore: 0,
      progressCount: 0,
      declineCount: 0,
      riskCount: 0,
      growthIndex: 0,
      classSummaries: [],
      studentSignals: [],
      progressLeaders: [],
      riskStudents: [],
      quadrants: [
        { key: 'star', label: '高分进步', count: 0, tone: 'good' as const },
        { key: 'potential', label: '进步潜力', count: 0, tone: 'potential' as const },
        { key: 'quiet', label: '高分承压', count: 0, tone: 'watch' as const },
        { key: 'risk', label: '重点帮扶', count: 0, tone: 'risk' as const },
      ],
      trend: [],
      insight: {
        headline: '暂无可分析的学业成长数据。',
        suggestion: '导入考试成绩后，系统会自动形成班级成长、学生进退步和风险关注视图。',
        report: '当前学业成长数据尚未形成有效样本。',
      },
      ...overrides,
    };
  }

  private buildSchoolGrowthSummary(
    exams: SchoolGrowthExamItem[],
    scoreRows: SchoolGrowthScoreRow[],
    classes: SchoolGrowthClassItem[],
    students: SchoolGrowthStudentItem[],
    selectedExamId?: number | null,
  ) {
    if (!exams.length || !scoreRows.length) return this.buildEmptySchoolGrowthSummary();

    const focusExam = (selectedExamId ? exams.find((item) => item.id === selectedExamId) : null) ?? exams[0] ?? null;
    if (!focusExam) return this.buildEmptySchoolGrowthSummary();

    const latestRows = scoreRows.filter((row) => row.examId === focusExam.id);
    if (!latestRows.length) return this.buildEmptySchoolGrowthSummary({ latestExam: focusExam });

    const focusExamIndex = exams.findIndex((item) => item.id === focusExam.id);
    const previousExam = (focusExamIndex >= 0 ? exams[focusExamIndex + 1] : null) ?? null;
    const previousRows = previousExam ? scoreRows.filter((row) => row.examId === previousExam.id) : [];
    const previousByStudent = new Map(previousRows.map((row) => [row.studentId, row]));
    const classById = new Map(classes.map((item) => [item.id, item]));

    const averageScore = this.averageNumber(latestRows.map((row) => row.totalScore));

    const resolveRankDelta = (row: SchoolGrowthScoreRow, previous?: SchoolGrowthScoreRow) => {
      const explicit = row.classRankDelta ?? row.schoolRankDelta;
      if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit;
      if (previous) return Math.round(row.totalScore - previous.totalScore);
      return 0;
    };

    const pickQuadrant = (totalScore: number, scoreDelta: number, currentAverageScore: number) => {
      const highAcademic = totalScore >= currentAverageScore;
      const improving = scoreDelta >= 0;
      if (highAcademic && improving) return 'star' as const;
      if (!highAcademic && improving) return 'potential' as const;
      if (highAcademic && !improving) return 'quiet' as const;
      return 'risk' as const;
    };

    const signals = latestRows.map((row) => {
      const previous = previousByStudent.get(row.studentId);
      const rankDelta = resolveRankDelta(row, previous);
      const scoreDelta = previous ? Math.round((row.totalScore - previous.totalScore) * 10) / 10 : rankDelta;
      const quadrant = pickQuadrant(row.totalScore, scoreDelta, averageScore);
      const reason =
        quadrant === 'star'
          ? '总分高于均值，且较上次考试保持进步'
          : quadrant === 'potential'
            ? '本次有进步，仍有继续抬升空间'
            : quadrant === 'quiet'
              ? '总分仍在高位，但较上次考试回落'
              : '总分低于均值，且较上次考试退步';
      return {
        studentId: row.studentId,
        studentName: row.studentName,
        classId: row.classId,
        className: row.className,
        totalScore: row.totalScore,
        scoreDelta,
        rankDelta,
        quadrant,
        reason,
      };
    });

    const progressLeaders = [...signals]
      .filter((item) => item.rankDelta > 0 || item.scoreDelta > 0)
      .sort((left, right) => right.rankDelta - left.rankDelta || right.scoreDelta - left.scoreDelta || right.totalScore - left.totalScore)
      .slice(0, 8);
    const riskStudents = [...signals]
      .filter((item) => item.rankDelta < 0 || item.scoreDelta < 0)
      .sort((left, right) => left.rankDelta - right.rankDelta || left.scoreDelta - right.scoreDelta || left.totalScore - right.totalScore)
      .slice(0, 8);

    const progressCount = signals.filter((item) => item.rankDelta > 0 || item.scoreDelta > 0).length;
    const declineCount = signals.filter((item) => item.rankDelta < 0 || item.scoreDelta < 0).length;
    const latestGrade = focusExam.gradeName?.trim() ?? '';
    const coverageBase = latestGrade
      ? students.filter((student) => classById.get(student.classId)?.gradeName === latestGrade).length
      : students.length;
    const coverageRate = coverageBase ? Math.round((latestRows.length / coverageBase) * 100) : 0;

    const classSummaries = Array.from(
      latestRows.reduce((map, row) => {
        const current = map.get(row.classId) ?? {
          classId: row.classId,
          className: row.className,
          gradeName: classById.get(row.classId)?.gradeName ?? latestGrade ?? '未分年级',
          scores: [] as number[],
          progressCount: 0,
          declineCount: 0,
        };
        current.scores.push(row.totalScore);
        const rankDelta = resolveRankDelta(row, previousByStudent.get(row.studentId));
        if (rankDelta > 0) current.progressCount += 1;
        if (rankDelta < 0) current.declineCount += 1;
        map.set(row.classId, current);
        return map;
      }, new Map<number, { classId: number; className: string; gradeName: string; scores: number[]; progressCount: number; declineCount: number }>())
        .values(),
    )
      .map((item) => {
        const classAverage = this.averageNumber(item.scores);
        const progressRate = item.scores.length ? (item.progressCount / item.scores.length) * 100 : 0;
        const declineRate = item.scores.length ? (item.declineCount / item.scores.length) * 100 : 0;
        const growthIndex = Math.round(this.clampNumber(classAverage * 0.16 + progressRate * 0.52 - declineRate * 0.32, 0, 100));
        return {
          classId: item.classId,
          className: item.className,
          gradeName: item.gradeName,
          averageScore: classAverage,
          participantCount: item.scores.length,
          progressCount: item.progressCount,
          declineCount: item.declineCount,
          behaviorAverage: 0,
          growthIndex,
          riskLevel: declineRate >= 35 ? 'high' : declineRate >= 18 ? 'medium' : 'low',
        };
      })
      .sort((left, right) => right.growthIndex - left.growthIndex || right.averageScore - left.averageScore);

    const trend = exams
      .slice(0, 6)
      .map((exam) => {
        const rows = scoreRows.filter((row) => row.examId === exam.id);
        const examIndex = exams.findIndex((item) => item.id === exam.id);
        const examPrevious = examIndex >= 0 ? exams[examIndex + 1] ?? null : null;
        const examPreviousRows = examPrevious ? scoreRows.filter((row) => row.examId === examPrevious.id) : [];
        const examPreviousByStudent = new Map(examPreviousRows.map((row) => [row.studentId, row]));
        const progressRows = rows.filter((row) => resolveRankDelta(row, examPreviousByStudent.get(row.studentId)) > 0);
        const declineRows = rows.filter((row) => resolveRankDelta(row, examPreviousByStudent.get(row.studentId)) < 0);
        return {
          examId: exam.id,
          examName: exam.name,
          importedAt: exam.importedAt,
          averageScore: this.averageNumber(rows.map((row) => row.totalScore)),
          progressRate: rows.length ? Math.round((progressRows.length / rows.length) * 100) : 0,
          declineRate: rows.length ? Math.round((declineRows.length / rows.length) * 100) : 0,
          participantCount: rows.length,
        };
      })
      .reverse();

    const quadrantCounts = signals.reduce(
      (map, item) => {
        map[item.quadrant] += 1;
        return map;
      },
      { star: 0, potential: 0, quiet: 0, risk: 0 },
    );
    const quadrants = [
      { key: 'star', label: '高分进步', count: quadrantCounts.star, tone: 'good' as const },
      { key: 'potential', label: '进步潜力', count: quadrantCounts.potential, tone: 'potential' as const },
      { key: 'quiet', label: '高分承压', count: quadrantCounts.quiet, tone: 'watch' as const },
      { key: 'risk', label: '重点帮扶', count: quadrantCounts.risk, tone: 'risk' as const },
    ];

    const progressRate = latestRows.length ? Math.round((progressCount / latestRows.length) * 100) : 0;
    const declineRate = latestRows.length ? Math.round((declineCount / latestRows.length) * 100) : 0;
    const growthIndex = Math.round(this.clampNumber(averageScore * 0.12 + coverageRate * 0.22 + progressRate * 0.42 - declineRate * 0.24, 0, 100));
    const topClass = classSummaries[0];
    const riskClass = [...classSummaries].sort((left, right) => right.declineCount - left.declineCount || left.growthIndex - right.growthIndex)[0];

    return {
      latestExam: focusExam,
      previousExam,
      coverageRate,
      participantCount: latestRows.length,
      averageScore,
      progressCount,
      declineCount,
      riskCount: riskStudents.length,
      growthIndex,
      classSummaries,
      studentSignals: signals,
      progressLeaders,
      riskStudents,
      quadrants,
      trend,
      insight: {
        headline: `${focusExam.name} 已覆盖 ${latestRows.length} 名学生，学业成长指数 ${growthIndex}。`,
        suggestion: riskClass
          ? `建议优先关注 ${riskClass.className} 的退步学生，同时沉淀 ${topClass?.className ?? '标杆班级'} 的提分做法。`
          : '建议继续保持成绩导入节奏，并结合日常评价观察学业变化。',
        report: `本次考试均分 ${averageScore}，进步学生 ${progressCount} 人，退步预警 ${declineCount} 人，覆盖率 ${coverageRate}%。`,
      },
    };
  }

  private averageNumber(values: number[]) {
    if (!values.length) return 0;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }

  private clampNumber(value: number, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  }

  private buildSubjectCode(subjectName: string) {
    return `subject_${this.normalizeText(subjectName).replace(/[^\da-z\u4e00-\u9fa5]/g, '').slice(0, 20) || 'unknown'}`;
  }

  private toInteger(value: unknown) {
    if (value === null || value === undefined || value === '' || value === '-') return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return Math.trunc(numeric);
  }

  private toDecimal(value: unknown) {
    if (value === null || value === undefined || value === '' || value === '-') return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return new Prisma.Decimal(numeric);
  }

  private inferAcademicPeriodLabel(sourceText: string, examDate: Date, fallback: string | null) {
    const text = sourceText.replace(/\s+/g, '');
    const explicitTerm = text.match(/(20\d{2})\s*[-—–~至]\s*(20\d{2})学年.*?(上学期|下学期|第一学期|第二学期)/);
    if (explicitTerm) {
      const term = explicitTerm[3] === '上学期' || explicitTerm[3] === '第一学期' ? '上学期' : '下学期';
      return `${explicitTerm[1]}-${explicitTerm[2]}学年${term}`;
    }

    const schoolYear = text.match(/(20\d{2})\s*[-—–~至]\s*(20\d{2})学年/);
    const termByText =
      /上学期|第一学期|秋季学期|秋学期|秋期/.test(text)
        ? '上学期'
        : /下学期|第二学期|春季学期|春学期|春期/.test(text)
          ? '下学期'
          : null;
    if (schoolYear && termByText) {
      return `${schoolYear[1]}-${schoolYear[2]}学年${termByText}`;
    }

    const yearInText = text.match(/(20\d{2})年/);
    if (yearInText && termByText) {
      const year = Number(yearInText[1]);
      return termByText === '上学期'
        ? `${year}-${year + 1}学年上学期`
        : `${year - 1}-${year}学年下学期`;
    }

    const year = examDate.getUTCFullYear();
    const month = examDate.getUTCMonth() + 1;
    if (month >= 9 && month <= 12) return `${year}-${year + 1}学年上学期`;
    if (month === 1) return `${year - 1}-${year}学年上学期`;
    if (month >= 2 && month <= 7) return `${year - 1}-${year}学年下学期`;
    return fallback || null;
  }

  private parseExamDate(value: unknown) {
    const raw = String(value ?? '').trim();
    if (!raw) return this.dateOnly(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      throw new BadRequestException('考试日期格式应为 YYYY-MM-DD');
    }
    const parsed = new Date(`${raw}T00:00:00.000Z`);
    if (!Number.isFinite(parsed.getTime())) {
      throw new BadRequestException('考试日期无效');
    }
    return parsed;
  }

  private dateOnly(value: Date) {
    return new Date(`${value.toISOString().slice(0, 10)}T00:00:00.000Z`);
  }

  private toDateOnly(value: Date) {
    return value.toISOString().slice(0, 10);
  }
}
