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
    if (!['super_admin', 'school_admin', 'moral_admin', 'grade_admin', 'homeroom_teacher'].includes(user.roleCode)) {
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
      select: { id: true },
    });
    if (!currentSemester) {
      throw new BadRequestException('请先配置当前学期，再导入成绩');
    }

    const duplicatedExam = await this.prisma.academicExam.findFirst({
      where: {
        schoolId: user.schoolId,
        semesterId: currentSemester.id,
        name: examName,
      },
      select: { id: true },
    });
    if (duplicatedExam) {
      throw new BadRequestException(`考试名称重复：${examName} 已导入`);
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
        const classroom = matchedClass ?? await this.resolveImportClass(tx, user, classes, gradeConfigs, className, gradeName);
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
          studentByName.get(`${classroom.id}:${this.normalizeText(name)}`);
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
          createdStudentCount += 1;
        }

        touchedClassIds.add(classroom.id.toString());
        subjects.forEach((subject) => {
          const subjectName = String(subject.subjectName ?? '').trim();
          if (!subjectName) return;
          rows.push({
            schoolId: user.schoolId,
            semesterId: currentSemester.id,
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
          semesterId: currentSemester.id,
          gradeName: String(body.gradeName ?? '').trim() || null,
          name: examName,
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
      orderBy: [{ importedAt: 'desc' }, { id: 'desc' }],
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
        importedAt: row.importedAt,
        recordCount: row._count.records,
      })),
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

    const rows = await this.prisma.academicScoreRecord.findMany({
      where: {
        schoolId: user.schoolId,
        ...(includeSubjects ? {} : { subjectCode: 'total' }),
        ...(query.classId ? { classId: BigInt(classId) } : classRestriction ? { classId: { in: classRestriction } } : {}),
        ...(query.examId && Number.isInteger(examId) && examId > 0 ? { examId: BigInt(examId) } : {}),
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
            importedAt: true,
          },
        },
      },
      orderBy: [{ exam: { importedAt: 'desc' } }, { classId: 'asc' }, { classRank: 'asc' }, { studentNo: 'asc' }],
      take: includeSubjects ? 20000 : 2000,
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
      orderBy: [{ exam: { importedAt: 'desc' } }, { subjectCode: 'asc' }],
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
      throw new BadRequestException(`班级 ${className} 不存在，请在成绩表中提供年级信息后再导入`);
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
    return match?.[2]?.trim() || normalized;
  }

  private getClassRestriction(user: Awaited<ReturnType<AuthService['getAuthUserFromAuthorization']>>) {
    if (['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
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
}
