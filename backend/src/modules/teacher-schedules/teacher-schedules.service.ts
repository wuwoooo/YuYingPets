import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { hashSync } from 'bcryptjs';
import { pinyin } from 'pinyin-pro';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as XLSX from 'xlsx';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { toNumber } from '@/common/utils/bigint.util';
import { UpdateTeacherOccupancyRulesDto } from './dto/teacher-occupancy-rules.dto';

type ParsedSlot = {
  teacherName: string;
  weekday: number;
  periodNo: number;
  startTime: string;
  endTime: string;
  subject: string;
  className: string | null;
};

type MissingTeacherConfig = {
  teacherName: string;
  create: boolean;
  username?: string;
  password?: string;
  roleCode?: string;
};

type MissingClassConfig = {
  className: string;
  create: boolean;
  gradeName?: string;
  gradeCode?: string;
};

const TIME_RANGES = [
  '8:00～8:30',
  '8:45～9:25',
  '9:55～10:35',
  '10:50～11:30',
  '11:45～12:15',
  '14:10～14:50',
  '15:05～15:45',
  '16:00～16:40',
  '16:55～17:35',
  '19:10～19:50',
  '20:00～20:40',
  '20:50～21:30',
];

const WEEKDAY_LABELS = ['星期一', '星期二', '星期三', '星期四', '星期五'];
const TEACHER_ROLE_CODES = ['homeroom_teacher', 'subject_teacher'];
const SUBJECT_LABELS: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  geography: '地理',
  biology: '生物',
  history: '历史',
  politics: '政治',
  arts_it: '音美信综合',
  computer: '计算机',
  art: '美术',
  music: '音乐',
  pe: '体育',
};
const SUBJECT_CODE_BY_LABEL = new Map(Object.entries(SUBJECT_LABELS).map(([code, label]) => [label, code]));
const SUBJECT_ALIASES: Record<string, string> = {
  语: 'chinese',
  语文课: 'chinese',
  数: 'math',
  数学课: 'math',
  英: 'english',
  英语课: 'english',
  物: 'physics',
  物理课: 'physics',
  化: 'chemistry',
  化学课: 'chemistry',
  地: 'geography',
  地理课: 'geography',
  生: 'biology',
  生物课: 'biology',
  历: 'history',
  历史课: 'history',
  政: 'politics',
  政治课: 'politics',
  计算机: 'computer',
  计算机课: 'computer',
  信息: 'computer',
  信息课: 'computer',
  信息技术: 'computer',
  信息技术课: 'computer',
  微机: 'computer',
  微机课: 'computer',
  电脑: 'computer',
  电脑课: 'computer',
  美术: 'art',
  美术课: 'art',
  美: 'art',
  音乐: 'music',
  音乐课: 'music',
  音: 'music',
  体育课: 'pe',
  体: 'pe',
};
const DEFAULT_RESEARCH_RULES = [
  {
    name: '每日理科与政史地生教研',
    weekdays: [1, 2, 3, 4, 5],
    subjectCodes: ['math', 'physics', 'chemistry', 'politics', 'history', 'geography', 'biology'],
    startTime: '08:45',
    endTime: '09:25',
    remark: '每天固定教研时间',
  },
  {
    name: '每日语英教研',
    weekdays: [1, 2, 3, 4, 5],
    subjectCodes: ['chinese', 'english'],
    startTime: '09:55',
    endTime: '10:35',
    remark: '每天固定教研时间',
  },
  {
    name: '周三文科教研',
    weekdays: [3],
    subjectCodes: ['chinese', 'english', 'history', 'politics', 'geography'],
    startTime: '14:00',
    endTime: '17:30',
    remark: '每周固定教研时间',
  },
  {
    name: '周四理科教研',
    weekdays: [4],
    subjectCodes: ['math', 'physics', 'chemistry', 'biology'],
    startTime: '14:00',
    endTime: '17:30',
    remark: '每周固定教研时间',
  },
];

type ResearchRuleRow = {
  id: bigint;
  name: string;
  weekdays: unknown;
  subjectCodes: unknown;
  startTime: string;
  endTime: string;
  status: 'enabled' | 'disabled';
  remark: string | null;
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

@Injectable()
export class TeacherSchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async importFromXls(
    authorization: string | undefined,
    filePath?: string,
    file?: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    createMissingTeachers = false,
    creationRoleCode = 'subject_teacher',
    usernamePrefix = '',
    missingTeacherConfigsText?: string,
    missingClassConfigsText?: string,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureManagePermission(user.roleCode);
    await this.reconcilePendingSlots(user.schoolId);
    await this.reconcileClassBindings(user.schoolId);

    const resolvedPath = filePath?.trim() ? path.resolve(filePath) : path.resolve(process.cwd(), '../doc/课表.xls');
    const workbook = file
      ? XLSX.read(file.buffer, { type: 'buffer', raw: false, cellText: true, codepage: 936 })
      : (() => {
          if (!fs.existsSync(resolvedPath)) {
            throw new BadRequestException(`课表文件不存在: ${resolvedPath}`);
          }
          return XLSX.readFile(resolvedPath, { raw: false, cellText: true, codepage: 936 });
        })();
    const allSheets = workbook.SheetNames;
    const teacherSheets = allSheets.filter((sheetName) => !/^\d+\s*班$/.test(this.normalizeName(sheetName)));
    const parsed = teacherSheets.flatMap((sheetName) => this.parseTeacherSheet(workbook.Sheets[sheetName], sheetName));

    const teacherUsers = await this.prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        deletedAt: null,
        status: 'enabled',
        role: { code: { in: TEACHER_ROLE_CODES } },
      },
      include: { role: true },
    });
    const teacherMap = new Map(teacherUsers.map((item) => [this.normalizeName(item.name), item]));
    const teacherNamesInSheet = Array.from(new Set(parsed.map((item) => this.normalizeName(item.teacherName))));
    const missingTeacherNames = teacherNamesInSheet.filter((name) => !teacherMap.has(name));
    const missingTeacherConfigs = this.parseMissingTeacherConfigs(missingTeacherConfigsText);
    const existingUsernames = new Set(teacherUsers.map((item) => item.username.trim().toLowerCase()));
    const defaultUsernameMap = this.buildDefaultUsernameMap(missingTeacherNames, existingUsernames, usernamePrefix);
    const classes = await this.prisma.classroom.findMany({
      where: { schoolId: user.schoolId, deletedAt: null },
      select: { id: true, semesterId: true, code: true, gradeCode: true, gradeName: true, name: true, sortOrder: true },
    });
    const classMap = new Map(classes.map((item) => [this.normalizeClass(item.name), item.id]));
    const missingClassNames = Array.from(
      new Set(
        parsed
          .map((item) => item.className)
          .filter((item): item is string => Boolean(item))
          .filter((item) => !classMap.has(this.normalizeClass(item))),
      ),
    );

    if ((missingTeacherNames.length > 0 || missingClassNames.length > 0) && !createMissingTeachers) {
      return {
        code: 0,
        message: '需要确认',
        data: {
          needConfirmCreateTeachers: true,
          missingTeachers: missingTeacherNames.map((teacherName) => ({
            teacherName,
            defaultUsername: defaultUsernameMap.get(teacherName) ?? this.buildAutoUsername(teacherName, usernamePrefix),
            defaultPassword: '123456',
            defaultRoleCode: creationRoleCode === 'homeroom_teacher' ? 'homeroom_teacher' : 'subject_teacher',
          })),
          missingClasses: missingClassNames,
          sourceFile: file ? file.originalname : resolvedPath,
          teacherSheetCount: teacherSheets.length,
          parsedSlotCount: parsed.length,
          importedSlotCount: 0,
          matchedTeacherCount: 0,
        },
      };
    }

    const missingClassConfigs = this.parseMissingClassConfigs(missingClassConfigsText);
    let createdClassCount = 0;
    if (missingClassNames.length > 0 && createMissingTeachers) {
      createdClassCount = await this.createMissingClasses(user.schoolId, missingClassNames, missingClassConfigs, classes, classMap);
    }

    const roleMap = new Map(
      (
        await this.prisma.role.findMany({
          where: { schoolId: user.schoolId, code: { in: ['subject_teacher', 'homeroom_teacher'] } },
        })
      ).map((item) => [item.code, item]),
    );
    let createdTeacherCount = 0;
    if (missingTeacherNames.length > 0 && createMissingTeachers) {
      const dbUsernames = new Set(
        (
          await this.prisma.user.findMany({
            where: { schoolId: user.schoolId, deletedAt: null },
            select: { username: true },
          })
        ).map((item) => item.username.trim().toLowerCase()),
      );
      const configsByName = new Map(missingTeacherConfigs.map((item) => [this.normalizeName(item.teacherName), item]));
      for (const teacherName of missingTeacherNames) {
        const config = configsByName.get(this.normalizeName(teacherName));
        if (!config) {
          throw new BadRequestException(`缺少教师 ${teacherName} 的创建配置`);
        }
        if (!config.create) continue;
        const username = String(config.username ?? '').trim().toLowerCase();
        const password = String(config.password ?? '').trim();
        if (!username || !password) {
          throw new BadRequestException(`教师 ${teacherName} 的账号或密码不能为空`);
        }
        if (dbUsernames.has(username)) {
          throw new BadRequestException(`登录账号重复：${username} 已被占用`);
        }
        dbUsernames.add(username);
        const targetRoleCode = config.roleCode === 'homeroom_teacher' ? 'homeroom_teacher' : 'subject_teacher';
        const targetRole = roleMap.get(targetRoleCode);
        if (!targetRole) {
          throw new NotFoundException(`未找到角色 ${targetRoleCode}，无法创建教师账号`);
        }
        const created = await this.prisma.user.create({
          data: {
            schoolId: user.schoolId,
            roleId: targetRole.id,
            username,
            passwordHash: hashSync(password, 10),
            name: teacherName,
            status: 'enabled',
          },
        });
        teacherMap.set(this.normalizeName(created.name), { ...created, role: targetRole });
        createdTeacherCount += 1;
      }
    }

    for (const teacher of teacherMap.values()) {
      await this.ensureImportedTeacherScopes(teacher.id, teacher.role.code, parsed, teacher.name, classMap);
    }

    const rows = parsed
      .map((slot) => {
        const teacher = teacherMap.get(this.normalizeName(slot.teacherName));
        if (!teacher) return null;
        const classId = slot.className ? classMap.get(this.normalizeClass(slot.className)) ?? null : null;
        return {
          schoolId: user.schoolId,
          teacherId: teacher.id,
          classId,
          weekday: slot.weekday,
          periodNo: slot.periodNo,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: slot.subject,
          className: slot.className,
          sourceFile: file ? file.originalname : resolvedPath,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    const pendingRows = parsed
      .map((slot) => {
        const teacher = teacherMap.get(this.normalizeName(slot.teacherName));
        if (teacher) return null;
        const classId = slot.className ? classMap.get(this.normalizeClass(slot.className)) ?? null : null;
        return {
          schoolId: user.schoolId,
          classId,
          teacherName: slot.teacherName,
          weekday: slot.weekday,
          periodNo: slot.periodNo,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: slot.subject,
          className: slot.className,
          sourceFile: file ? file.originalname : resolvedPath,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    await this.prisma.teacherScheduleSlot.deleteMany({ where: { schoolId: user.schoolId } });
    await this.prisma.pendingTeacherScheduleSlot.deleteMany({ where: { schoolId: user.schoolId } });
    if (rows.length > 0) {
      await this.prisma.teacherScheduleSlot.createMany({ data: rows });
    }
    if (pendingRows.length > 0) {
      await this.prisma.pendingTeacherScheduleSlot.createMany({ data: pendingRows });
    }

    const matchedTeacherIds = new Set(rows.map((item) => String(item.teacherId)));
    return {
      code: 0,
      message: 'ok',
      data: {
        sourceFile: file ? file.originalname : resolvedPath,
        createdTeacherCount,
        createdClassCount,
        teacherSheetCount: teacherSheets.length,
        parsedSlotCount: parsed.length,
        importedSlotCount: rows.length,
        matchedTeacherCount: matchedTeacherIds.size,
        pendingSlotCount: pendingRows.length,
      },
    };
  }

  async liveStatus(authorization: string | undefined, at?: string, startAt?: string, endAt?: string) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureManagePermission(user.roleCode);
    await this.reconcilePendingSlots(user.schoolId);
    await this.reconcileClassBindings(user.schoolId);

    const hasRange = Boolean(startAt || endAt);
    if ((startAt && !endAt) || (!startAt && endAt)) {
      throw new BadRequestException('开始时间和结束时间必须同时填写');
    }
    const now = at ? new Date(at) : new Date();
    const rangeStart = startAt ? new Date(startAt) : null;
    const rangeEnd = endAt ? new Date(endAt) : null;
    if (!hasRange && Number.isNaN(now.getTime())) {
      throw new BadRequestException('时间参数无效');
    }
    if (hasRange && (!rangeStart || !rangeEnd || Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime()))) {
      throw new BadRequestException('时间段参数无效');
    }
    if (rangeStart && rangeEnd && rangeStart.getTime() > rangeEnd.getTime()) {
      throw new BadRequestException('开始时间不能晚于结束时间');
    }

    const weekday = hasRange ? this.toWeekday(rangeStart!) : this.toWeekday(now);
    const hhmm = hasRange ? this.toHHmm(rangeStart!) : this.toHHmm(now);

    const teachers = await this.prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        deletedAt: null,
        role: { code: { in: TEACHER_ROLE_CODES } },
      },
      include: { role: true, scopes: true },
      orderBy: [{ name: 'asc' }],
    });

    const weekdays = hasRange ? this.collectWeekdaysInRange(rangeStart!, rangeEnd!) : [weekday];
    const slots = await this.prisma.teacherScheduleSlot.findMany({
      where: { schoolId: user.schoolId, weekday: { in: weekdays } },
      orderBy: [{ weekday: 'asc' }, { periodNo: 'asc' }],
    });

    const currentSlotsByTeacher = new Map<string, (typeof slots)[number]>();
    for (const slot of slots) {
      const matches = hasRange
        ? this.slotOverlapsRange(slot, rangeStart!, rangeEnd!)
        : this.timeContains(slot.startTime, slot.endTime, hhmm);
      if (matches) {
        currentSlotsByTeacher.set(String(slot.teacherId), slot);
      }
    }

    const researchRules = await this.listEnabledResearchRules(user.schoolId, weekdays);
    const researchRuleByTeacher = new Map<string, ResearchRuleRow>();
    for (const teacher of teachers) {
      if (currentSlotsByTeacher.has(String(teacher.id))) continue;
      const subjectCode = this.getTeacherSubjectCode(teacher.scopes);
      if (!subjectCode) continue;
      const matchedRule = researchRules.find((rule) => {
        const subjectCodes = this.toStringArray(rule.subjectCodes);
        if (!subjectCodes.includes(subjectCode)) return false;
        return hasRange
          ? this.ruleOverlapsRange(rule, rangeStart!, rangeEnd!)
          : this.toNumberArray(rule.weekdays).includes(weekday) && this.timeContains(rule.startTime, rule.endTime, hhmm);
      });
      if (matchedRule) {
        researchRuleByTeacher.set(String(teacher.id), matchedRule);
      }
    }

    const rows = teachers.map((teacher) => {
      const current = currentSlotsByTeacher.get(String(teacher.id));
      const researchRule = researchRuleByTeacher.get(String(teacher.id));
      const teacherSubjectCode = this.getTeacherSubjectCode(teacher.scopes);
      const researchSubjectLabel = teacherSubjectCode ? SUBJECT_LABELS[teacherSubjectCode] ?? teacherSubjectCode : null;
      const researchLabel = researchRule && researchSubjectLabel ? `${researchSubjectLabel}组教研` : null;
      return {
        teacherId: toNumber(teacher.id),
        teacherName: teacher.name,
        roleCode: teacher.role.code,
        roleName: teacher.role.name,
        status: current || researchRule ? 'busy' : 'free',
        busyType: current ? 'class' : researchRule ? 'research' : null,
        currentClassName: current?.className ?? null,
        currentSubject: current?.subject ?? researchLabel,
        currentPeriodNo: current?.periodNo ?? null,
        startTime: current?.startTime ?? researchRule?.startTime ?? null,
        endTime: current?.endTime ?? researchRule?.endTime ?? null,
      };
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        at: hasRange ? null : now.toISOString(),
        startAt: rangeStart?.toISOString() ?? null,
        endAt: rangeEnd?.toISOString() ?? null,
        weekday,
        currentTime: hhmm,
        busyCount: rows.filter((item) => item.status === 'busy').length,
        freeCount: rows.filter((item) => item.status === 'free').length,
        rows,
      },
    };
  }

  async occupancyRules(authorization: string | undefined) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureManagePermission(user.roleCode);
    await this.ensureDefaultResearchRules(user.schoolId);
    const rows = await this.prisma.teacherOccupancyRule.findMany({
      where: { schoolId: user.schoolId, ruleType: 'research' },
      orderBy: [{ id: 'asc' }],
    });
    return {
      code: 0,
      message: 'ok',
      data: rows.map((row) => this.serializeResearchRule(row)),
    };
  }

  async updateOccupancyRules(authorization: string | undefined, body: UpdateTeacherOccupancyRulesDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureManagePermission(user.roleCode);
    const rules = body.rules ?? [];
    if (rules.length === 0) {
      throw new BadRequestException('至少需要保留一条教研规则');
    }
    for (const rule of rules) {
      if (!rule.name.trim()) throw new BadRequestException('规则名称不能为空');
      if (rule.weekdays.length === 0) throw new BadRequestException(`${rule.name} 至少需要选择一个星期`);
      if (rule.subjectCodes.length === 0) throw new BadRequestException(`${rule.name} 至少需要选择一个学科`);
      if (this.hmToMinutes(rule.startTime) >= this.hmToMinutes(rule.endTime)) {
        throw new BadRequestException(`${rule.name} 的开始时间必须早于结束时间`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.teacherOccupancyRule.deleteMany({ where: { schoolId: user.schoolId, ruleType: 'research' } });
      await tx.teacherOccupancyRule.createMany({
        data: rules.map((rule) => ({
          schoolId: user.schoolId,
          ruleType: 'research',
          name: rule.name.trim(),
          weekdays: Array.from(new Set(rule.weekdays)).sort(),
          subjectCodes: Array.from(new Set(rule.subjectCodes.map((item) => item.trim()).filter(Boolean))),
          startTime: this.normalizeHm(rule.startTime),
          endTime: this.normalizeHm(rule.endTime),
          status: rule.status ?? 'enabled',
          remark: rule.remark?.trim() || null,
        })),
      });
    });

    return this.occupancyRules(authorization);
  }

  async slots(authorization: string | undefined, teacherId?: number) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureManagePermission(user.roleCode);
    await this.reconcilePendingSlots(user.schoolId);
    await this.reconcileClassBindings(user.schoolId);

    const where = {
      schoolId: user.schoolId,
      ...(teacherId ? { teacherId: BigInt(teacherId) } : {}),
    };
    const slots = await this.prisma.teacherScheduleSlot.findMany({
      where,
      include: { teacher: { include: { role: true } } },
      orderBy: [{ teacherId: 'asc' }, { weekday: 'asc' }, { periodNo: 'asc' }],
    });
    const pendingSlots = teacherId
      ? []
      : await this.prisma.pendingTeacherScheduleSlot.findMany({
          where: { schoolId: user.schoolId },
          orderBy: [{ teacherName: 'asc' }, { weekday: 'asc' }, { periodNo: 'asc' }],
        });

    return {
      code: 0,
      message: 'ok',
      data: [
        ...slots.map((slot) => ({
          id: toNumber(slot.id),
          teacherId: toNumber(slot.teacherId),
          teacherName: slot.teacher.name,
          roleCode: slot.teacher.role.code,
          roleName: slot.teacher.role.name,
          weekday: slot.weekday,
          periodNo: slot.periodNo,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: slot.subject,
          className: slot.className,
          isPending: false,
        })),
        ...pendingSlots.map((slot) => ({
          id: toNumber(slot.id),
          teacherId: null,
          teacherName: slot.teacherName,
          roleCode: 'pending',
          roleName: '待关联',
          weekday: slot.weekday,
          periodNo: slot.periodNo,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: slot.subject,
          className: slot.className,
          isPending: true,
        })),
      ],
    };
  }

  private parseTeacherSheet(sheet: XLSX.WorkSheet, rawSheetName: string): ParsedSlot[] {
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, raw: false, defval: '' });
    if (!Array.isArray(rows) || rows.length < 28) return [];

    const dayHeaderRow = rows.findIndex((row) => WEEKDAY_LABELS.every((label, idx) => String(row[3 + idx] ?? '').trim() === label));
    if (dayHeaderRow < 0) return [];

    const teacherName = this.cleanTeacherName(rawSheetName);
    const result: ParsedSlot[] = [];

    for (let periodIndex = 0; periodIndex < 12; periodIndex += 1) {
      const subjectRow = dayHeaderRow + 1 + periodIndex * 2;
      const classRow = subjectRow + 1;
      const timeRange = TIME_RANGES[periodIndex];
      const [startTime, endTime] = timeRange.split('～');
      for (let dayOffset = 0; dayOffset < 5; dayOffset += 1) {
        const col = 3 + dayOffset;
        const subject = String(rows[subjectRow]?.[col] ?? '').trim();
        const classCell = String(rows[classRow]?.[col] ?? '').trim();
        const className = this.extractClassName(classCell);
        if (!subject) continue;
        result.push({
          teacherName,
          weekday: dayOffset + 1,
          periodNo: periodIndex + 1,
          startTime,
          endTime,
          subject,
          className,
        });
      }
    }

    return result;
  }

  private cleanTeacherName(name: string) {
    return name.replace(/\(\d+节\)$/, '').trim();
  }

  private extractClassName(classCell: string): string | null {
    const match = classCell.replace(/[()（）]/g, '').match(/\d+\s*班/);
    return match ? match[0].replace(/\s+/g, '') : null;
  }

  private normalizeClass(value: string) {
    return value.replace(/\s+/g, '').trim();
  }

  private normalizeName(value: string) {
    return value.replace(/\s+/g, '').trim();
  }

  private buildAutoUsername(name: string, prefix = '') {
    const safePrefix = (prefix || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 12);
    const pinyinText = pinyin(name, { toneType: 'none', type: 'array' })
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const fallback = name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toLowerCase() || 'teacher';
    return `${safePrefix}${pinyinText || fallback}`.slice(0, 24) || 'teacher';
  }

  private buildDefaultUsernameMap(names: string[], existingUsernames: Set<string>, prefix = '') {
    const used = new Set(existingUsernames);
    const result = new Map<string, string>();
    for (const name of names) {
      const base = this.buildAutoUsername(name, prefix);
      let candidate = base;
      let suffix = 2;
      while (used.has(candidate)) {
        candidate = `${base}${suffix}`;
        suffix += 1;
      }
      used.add(candidate);
      result.set(name, candidate);
    }
    return result;
  }

  private parseMissingTeacherConfigs(text?: string) {
    if (!text?.trim()) return [] as MissingTeacherConfig[];
    try {
      const parsed = JSON.parse(text) as MissingTeacherConfig[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      throw new BadRequestException('缺失教师配置格式错误');
    }
  }

  private parseMissingClassConfigs(text?: string) {
    if (!text?.trim()) return [] as MissingClassConfig[];
    try {
      const parsed = JSON.parse(text) as MissingClassConfig[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      throw new BadRequestException('缺失班级配置格式错误');
    }
  }

  private async createMissingClasses(
    schoolId: bigint,
    missingClassNames: string[],
    missingClassConfigs: MissingClassConfig[],
    classes: ImportClassRow[],
    classMap: Map<string, bigint>,
  ) {
    const configsByName = new Map(missingClassConfigs.map((item) => [this.normalizeClass(item.className), item]));
    const currentSemester = await this.prisma.semester.findFirst({
      where: { schoolId, isCurrent: true, status: 'enabled' },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    if (!currentSemester && missingClassConfigs.some((item) => item.create)) {
      throw new BadRequestException('请先配置当前学期，再创建缺失班级');
    }
    const gradeConfigs = await this.prisma.gradeConfig.findMany({
      where: { schoolId, deletedAt: null, status: 'enabled' },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: { code: true, name: true },
    });
    let createdCount = 0;
    for (const className of missingClassNames) {
      const config = configsByName.get(this.normalizeClass(className));
      if (!config?.create) continue;
      const gradeName = String(config.gradeName ?? '').trim();
      if (!gradeName) {
        throw new BadRequestException(`班级 ${className} 需要选择所属年级`);
      }
      const normalizedClassName = this.normalizeClass(className);
      if (classMap.has(normalizedClassName)) continue;
      const gradeCode = this.buildImportGradeCode(gradeName, classes, gradeConfigs, config.gradeCode);
      const code = this.buildImportClassCode(currentSemester!.id, gradeCode, className, classes);
      const sortOrder = this.buildImportClassSortOrder(gradeCode, classes);
      const created = await this.prisma.classroom.create({
        data: {
          schoolId,
          semesterId: currentSemester!.id,
          code,
          gradeCode,
          gradeName,
          name: className,
          displayStatus: 'enabled',
          sortOrder,
          status: 'enabled',
        },
        select: { id: true, semesterId: true, code: true, gradeCode: true, gradeName: true, name: true, sortOrder: true },
      });
      classes.push(created);
      classMap.set(normalizedClassName, created.id);
      createdCount += 1;
    }
    return createdCount;
  }

  private buildImportGradeCode(
    gradeName: string,
    classes: ImportClassRow[],
    gradeConfigs: Array<{ code: string; name: string }>,
    currentCode?: string,
  ) {
    if (currentCode?.trim()) return currentCode.trim();
    const matchedConfig = gradeConfigs.find((item) => item.name.trim() === gradeName);
    if (matchedConfig?.code) return matchedConfig.code;
    const matchedClass = classes.find((item) => item.gradeName.trim() === gradeName && item.gradeCode);
    if (matchedClass?.gradeCode) return matchedClass.gradeCode;
    const slug = gradeName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (slug) return `grade-${slug}`;
    const uniqueGradeCount = new Set(classes.map((item) => item.gradeName.trim()).filter(Boolean)).size + 1;
    return `grade-${String(uniqueGradeCount).padStart(2, '0')}`;
  }

  private buildImportClassCode(semesterId: bigint, gradeCode: string, className: string, classes: ImportClassRow[]) {
    const matched = classes.find((item) => item.name.trim() === className.trim() && item.code);
    if (matched?.code) return matched.code;
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

  private async ensureImportedTeacherScopes(
    userId: bigint,
    roleCode: string,
    parsedSlots: ParsedSlot[],
    teacherName: string,
    classMap: Map<string, bigint>,
  ) {
    const teacherKey = this.normalizeName(teacherName);
    const subjectScopeMap = new Map<string, { classId: bigint; subjectCode: string }>();
    for (const slot of parsedSlots) {
      if (this.normalizeName(slot.teacherName) !== teacherKey) continue;
      const classId = slot.className ? classMap.get(this.normalizeClass(slot.className)) : null;
      const subjectCode = this.normalizeSubjectCode(slot.subject);
      if (!classId || !subjectCode) continue;
      subjectScopeMap.set(`${classId}:${subjectCode}`, { classId, subjectCode });
    }
    const subjectScopes = Array.from(subjectScopeMap.values());
    const classIds = Array.from(new Set(subjectScopes.map((item) => item.classId.toString()))).map((item) => BigInt(item));
    const scopeRows = [
      ...(roleCode === 'homeroom_teacher'
        ? classIds.map((classId) => ({
            userId,
            scopeType: 'class_scope' as const,
            classId,
          }))
        : []),
      ...subjectScopes.map((item) => ({
        userId,
        scopeType: 'subject_class' as const,
        classId: item.classId,
        subjectCode: item.subjectCode,
      })),
    ];
    if (scopeRows.length === 0) return;
    const existingScopes = await this.prisma.userScope.findMany({
      where: { userId },
      select: { scopeType: true, classId: true, subjectCode: true },
    });
    const existingKeys = new Set(
      existingScopes.map((scope) => `${scope.scopeType}:${scope.classId?.toString() ?? ''}:${scope.subjectCode ?? ''}`),
    );
    const missingRows = scopeRows.filter((scope) => !existingKeys.has(this.buildUserScopeKey(scope)));
    if (missingRows.length === 0) return;
    const preciseSubjectClassIds = missingRows
      .filter(
        (scope) =>
          scope.scopeType === 'subject_class' &&
          'subjectCode' in scope &&
          ['computer', 'art', 'music'].includes(scope.subjectCode),
      )
      .map((scope) => scope.classId);
    if (preciseSubjectClassIds.length > 0) {
      await this.prisma.userScope.deleteMany({
        where: {
          userId,
          scopeType: 'subject_class',
          subjectCode: 'arts_it',
          classId: { in: Array.from(new Set(preciseSubjectClassIds.map((item) => item.toString()))).map((item) => BigInt(item)) },
        },
      });
    }
    await this.prisma.userScope.createMany({ data: missingRows });
  }

  private buildUserScopeKey(scope: { scopeType: string; classId?: bigint | null; subjectCode?: string | null }) {
    return `${scope.scopeType}:${scope.classId?.toString() ?? ''}:${scope.subjectCode ?? ''}`;
  }

  private normalizeSubjectCode(subject: string) {
    const normalized = subject.trim().replace(/\s+/g, '');
    if (!normalized) return null;
    if (SUBJECT_LABELS[normalized]) return normalized;
    const alias = SUBJECT_ALIASES[normalized];
    if (alias) return alias;
    const exactLabel = SUBJECT_CODE_BY_LABEL.get(normalized);
    if (exactLabel) return exactLabel;
    for (const [code, label] of Object.entries(SUBJECT_LABELS)) {
      if (normalized.includes(label)) return code;
    }
    return null;
  }

  private async reconcilePendingSlots(schoolId: bigint) {
    const pending = await this.prisma.pendingTeacherScheduleSlot.findMany({ where: { schoolId } });
    if (pending.length === 0) return;
    const teacherUsers = await this.prisma.user.findMany({
      where: {
        schoolId,
        deletedAt: null,
        status: 'enabled',
        role: { code: { in: TEACHER_ROLE_CODES } },
      },
      include: { role: true },
    });
    const teacherMap = new Map(teacherUsers.map((item) => [this.normalizeName(item.name), item]));
    const matched = pending
      .map((slot) => {
        const teacher = teacherMap.get(this.normalizeName(slot.teacherName));
        if (!teacher) return null;
        return {
          pendingId: slot.id,
          row: {
            schoolId,
            teacherId: teacher.id,
            classId: slot.classId,
            weekday: slot.weekday,
            periodNo: slot.periodNo,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: slot.subject,
            className: slot.className,
            sourceFile: slot.sourceFile,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    if (matched.length === 0) return;
    await this.prisma.teacherScheduleSlot.createMany({ data: matched.map((item) => item.row) });
    await this.prisma.pendingTeacherScheduleSlot.deleteMany({
      where: { id: { in: matched.map((item) => item.pendingId) } },
    });
  }

  private async reconcileClassBindings(schoolId: bigint) {
    const classes = await this.prisma.classroom.findMany({
      where: { schoolId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (classes.length === 0) return;
    const classMap = new Map(classes.map((item) => [this.normalizeClass(item.name), item.id]));

    const teacherSlots = await this.prisma.teacherScheduleSlot.findMany({
      where: { schoolId, classId: null, className: { not: null } },
      select: { id: true, className: true },
    });
    for (const slot of teacherSlots) {
      const classId = slot.className ? classMap.get(this.normalizeClass(slot.className)) : null;
      if (!classId) continue;
      await this.prisma.teacherScheduleSlot.update({
        where: { id: slot.id },
        data: { classId },
      });
    }

    const pendingSlots = await this.prisma.pendingTeacherScheduleSlot.findMany({
      where: { schoolId, classId: null, className: { not: null } },
      select: { id: true, className: true },
    });
    for (const slot of pendingSlots) {
      const classId = slot.className ? classMap.get(this.normalizeClass(slot.className)) : null;
      if (!classId) continue;
      await this.prisma.pendingTeacherScheduleSlot.update({
        where: { id: slot.id },
        data: { classId },
      });
    }
  }

  private async ensureDefaultResearchRules(schoolId: bigint) {
    const count = await this.prisma.teacherOccupancyRule.count({
      where: { schoolId, ruleType: 'research' },
    });
    if (count > 0) return;
    await this.prisma.teacherOccupancyRule.createMany({
      data: DEFAULT_RESEARCH_RULES.map((rule) => ({
        schoolId,
        ruleType: 'research',
        name: rule.name,
        weekdays: rule.weekdays,
        subjectCodes: rule.subjectCodes,
        startTime: rule.startTime,
        endTime: rule.endTime,
        status: 'enabled',
        remark: rule.remark,
      })),
    });
  }

  private async listEnabledResearchRules(schoolId: bigint, weekdays: number[]) {
    await this.ensureDefaultResearchRules(schoolId);
    const rows = await this.prisma.teacherOccupancyRule.findMany({
      where: {
        schoolId,
        ruleType: 'research',
        status: 'enabled',
      },
      orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
    });
    const weekdaySet = new Set(weekdays);
    return rows.filter((row) => this.toNumberArray(row.weekdays).some((weekday) => weekdaySet.has(weekday)));
  }

  private serializeResearchRule(row: ResearchRuleRow) {
    return {
      id: toNumber(row.id),
      name: row.name,
      weekdays: this.toNumberArray(row.weekdays),
      subjectCodes: this.toStringArray(row.subjectCodes),
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status,
      remark: row.remark,
    };
  }

  private getTeacherSubjectCode(scopes: Array<{ scopeType: string; subjectCode: string | null }>) {
    const subjectCodes = Array.from(
      new Set(
        scopes
          .filter((scope) => scope.scopeType === 'subject_class' && scope.subjectCode)
          .map((scope) => scope.subjectCode as string),
      ),
    );
    return subjectCodes[0] ?? null;
  }

  private toNumberArray(value: unknown) {
    return Array.isArray(value) ? value.map(Number).filter((item) => Number.isFinite(item)) : [];
  }

  private toStringArray(value: unknown) {
    return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  }

  private toWeekday(date: Date) {
    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) return -1;
    return weekday;
  }

  private collectWeekdaysInRange(start: Date, end: Date) {
    const weekdays = new Set<number>();
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);
    while (cursor.getTime() <= endDate.getTime()) {
      const weekday = this.toWeekday(cursor);
      if (weekday >= 1 && weekday <= 5) weekdays.add(weekday);
      cursor.setDate(cursor.getDate() + 1);
    }
    return weekdays.size > 0 ? Array.from(weekdays) : [-1];
  }

  private slotOverlapsRange(
    slot: {
      weekday: number;
      startTime: string;
      endTime: string;
    },
    start: Date,
    end: Date,
  ) {
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);
    while (cursor.getTime() <= endDate.getTime()) {
      if (this.toWeekday(cursor) === slot.weekday) {
        const slotStart = new Date(cursor);
        const [slotStartHour, slotStartMinute] = slot.startTime.split(':').map(Number);
        slotStart.setHours(slotStartHour, slotStartMinute, 0, 0);
        const slotEnd = new Date(cursor);
        const [slotEndHour, slotEndMinute] = slot.endTime.split(':').map(Number);
        slotEnd.setHours(slotEndHour, slotEndMinute, 0, 0);
        if (slotStart.getTime() <= end.getTime() && start.getTime() <= slotEnd.getTime()) {
          return true;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  }

  private ruleOverlapsRange(rule: { weekdays: unknown; startTime: string; endTime: string }, start: Date, end: Date) {
    const weekdays = new Set(this.toNumberArray(rule.weekdays));
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);
    while (cursor.getTime() <= endDate.getTime()) {
      if (weekdays.has(this.toWeekday(cursor))) {
        const ruleStart = new Date(cursor);
        const [startHour, startMinute] = rule.startTime.split(':').map(Number);
        ruleStart.setHours(startHour, startMinute, 0, 0);
        const ruleEnd = new Date(cursor);
        const [endHour, endMinute] = rule.endTime.split(':').map(Number);
        ruleEnd.setHours(endHour, endMinute, 0, 0);
        if (ruleStart.getTime() <= end.getTime() && start.getTime() <= ruleEnd.getTime()) {
          return true;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  }

  private hmToMinutes(value: string) {
    const [hour, minute] = value.split(':').map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return Number.NaN;
    return hour * 60 + minute;
  }

  private timeContains(startTime: string, endTime: string, targetTime: string) {
    const start = this.hmToMinutes(startTime);
    const end = this.hmToMinutes(endTime);
    const target = this.hmToMinutes(targetTime);
    return start <= target && target <= end;
  }

  private normalizeHm(value: string) {
    const [hour, minute] = value.split(':');
    return `${String(Number(hour)).padStart(2, '0')}:${String(Number(minute)).padStart(2, '0')}`;
  }

  private toHHmm(date: Date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private ensureManagePermission(roleCode: string) {
    if (!['super_admin', 'school_admin', 'moral_admin'].includes(roleCode)) {
      throw new ForbiddenException('无权访问教师课表管理');
    }
  }
}
