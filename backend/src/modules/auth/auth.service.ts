import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hashSync } from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ProjectionLoginDto } from './dto/projection-login.dto';
import { AuthUser } from '@/common/auth/auth-user.interface';
import { toNumber } from '@/common/utils/bigint.util';

const SUBJECT_RULE_COMPATIBILITY: Record<string, string[]> = {
  computer: ['computer', 'arts_it'],
  art: ['art', 'arts_it'],
  music: ['music', 'arts_it'],
  pe: ['pe', 'arts_it'],
};

const DUTY_TAG_ROLE_MAP: Array<{ keywords: string[]; roleCode: string }> = [
  { keywords: ['班主任'], roleCode: 'homeroom_teacher' },
  { keywords: ['教务', '教务处', '考务'], roleCode: 'academic_admin' },
  { keywords: ['德育', '德育处'], roleCode: 'moral_admin' },
  { keywords: ['校长', '副校长', '学校领导', '领导'], roleCode: 'school_admin' },
];

const DISPLAY_ADMIN_ROLE_CODES = ['super_admin', 'school_admin', 'academic_admin', 'moral_admin'];
const DISPLAY_OPERATOR_ROLE_CODES = [...DISPLAY_ADMIN_ROLE_CODES, 'homeroom_teacher', 'subject_teacher'];
const PROJECTION_TOKEN_EXPIRES_IN = '3650d';
const COMMON_WEAK_PASSWORDS = new Set([
  '123456',
  '12345678',
  '123456789',
  '111111',
  '000000',
  '666666',
  '888888',
  'password',
  'qwerty',
  'abc123',
  'admin',
]);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const loginAccount = dto.username.trim();
    const candidateUsers = await this.prisma.user.findMany({
      where: {
        OR: [{ username: loginAccount }, { phone: loginAccount }],
        deletedAt: null,
        status: 'enabled',
      },
      include: {
        role: true,
        scopes: true,
        teacherClassAssignments: {
          where: { status: 'enabled' },
        },
      },
      orderBy: [{ username: 'asc' }, { id: 'asc' }],
    });

    if (candidateUsers.length === 0) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const user = (
      await Promise.all(
        candidateUsers.map(async (candidate) => {
          const passwordMatched = await compare(dto.password, candidate.passwordHash).catch(() => false);
          return passwordMatched ? candidate : null;
        }),
      )
    ).find((candidate) => candidate !== null);

    if (!user) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const payload = {
      sub: toNumber(user.id),
      schoolId: toNumber(user.schoolId),
      username: user.username,
      roleCode: user.role.code,
      terminalType: dto.terminalType,
    };

    const token = await this.jwtService.signAsync(payload);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        token,
        user: {
          id: toNumber(user.id),
          name: user.name,
          roleCode: user.role.code,
          roleName: user.role.name,
          dutyTags: this.normalizeDutyTags(user.dutyTags),
          passwordChangeRequired: user.passwordChangeRequired,
        },
        scopes: user.scopes.map((scope) => ({
          scopeType: scope.scopeType,
          classId: toNumber(scope.classId),
          gradeCode: scope.gradeCode,
          subjectCode: scope.subjectCode,
        })),
        classAssignments: user.teacherClassAssignments.map((assignment) => ({
          classId: toNumber(assignment.classId),
          roleInClass: assignment.roleInClass,
          subjectCode: assignment.subjectCode,
          isPrimary: assignment.isPrimary,
        })),
      },
    };
  }

  async projectionLogin(dto: ProjectionLoginDto) {
    const username = dto.username.trim();
    const password = dto.password.trim();
    if (!username || !password) {
      throw new UnauthorizedException('请输入投屏账号和密码');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        status: 'enabled',
        passwordChangeRequired: false,
        role: {
          code: { in: DISPLAY_ADMIN_ROLE_CODES },
        },
      },
      include: {
        role: true,
        scopes: true,
        teacherClassAssignments: {
          where: { status: 'enabled' },
        },
      },
      orderBy: { id: 'asc' },
    });

    if (!user) {
      throw new UnauthorizedException('未找到可用于投屏的校级账号');
    }

    const payload = {
      sub: toNumber(user.id),
      schoolId: toNumber(user.schoolId),
      username: user.username,
      roleCode: user.role.code,
      terminalType: 'projection',
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: PROJECTION_TOKEN_EXPIRES_IN,
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        token,
        user: {
          id: toNumber(user.id),
          name: user.name,
          roleCode: user.role.code,
          roleName: user.role.name,
          dutyTags: this.normalizeDutyTags(user.dutyTags),
          passwordChangeRequired: false,
        },
        scopes: user.scopes.map((scope) => ({
          scopeType: scope.scopeType,
          classId: toNumber(scope.classId),
          gradeCode: scope.gradeCode,
          subjectCode: scope.subjectCode,
        })),
        classAssignments: user.teacherClassAssignments.map((assignment) => ({
          classId: toNumber(assignment.classId),
          roleInClass: assignment.roleInClass,
          subjectCode: assignment.subjectCode,
          isPrimary: assignment.isPrimary,
        })),
      },
    };
  }

  async me(authorization?: string) {
    const user = await this.getAuthUserFromAuthorization(authorization);
    return {
      code: 0,
      message: 'ok',
      data: {
        user: {
          id: toNumber(user.id),
          schoolId: toNumber(user.schoolId),
          username: user.username,
          name: user.name,
          roleCode: user.roleCode,
          roleName: user.roleName,
          dutyTags: user.dutyTags,
          passwordChangeRequired: user.passwordChangeRequired,
        },
        scopes: user.scopes.map((scope) => ({
          scopeType: scope.scopeType,
          classId: toNumber(scope.classId),
          gradeCode: scope.gradeCode,
          subjectCode: scope.subjectCode,
        })),
        classAssignments: user.classAssignments.map((assignment) => ({
          classId: toNumber(assignment.classId),
          roleInClass: assignment.roleInClass,
          subjectCode: assignment.subjectCode,
          isPrimary: assignment.isPrimary,
        })),
      },
    };
  }

  logout() {
    return { code: 0, message: 'ok', data: null };
  }

  private getWeakPasswordReason(
    password: string,
    user: { username: string; name: string; phone: string | null },
  ) {
    const normalized = password.trim();
    const normalizedLower = normalized.toLowerCase();
    const phone = String(user.phone ?? '').replace(/\D/g, '');
    if (COMMON_WEAK_PASSWORDS.has(normalizedLower)) return '常见弱口令';
    if (normalizedLower === user.username.trim().toLowerCase()) return '不能与用户名相同';
    if (normalized === user.name.trim()) return '不能与姓名相同';
    if (phone && normalized === phone) return '不能与手机号相同';
    if (phone.length >= 6 && normalized === phone.slice(-6)) return '不能使用手机号后 6 位';
    if (phone.length >= 8 && normalized === phone.slice(-8)) return '不能使用手机号后 8 位';
    return null;
  }

  async changePassword(authorization: string | undefined, dto: ChangePasswordDto) {
    const user = await this.getAuthUserFromAuthorization(authorization);
    const currentUser = await this.prisma.user.findFirst({
      where: {
        id: user.id,
        schoolId: user.schoolId,
        deletedAt: null,
        status: 'enabled',
      },
      select: { id: true, passwordHash: true, username: true, name: true, phone: true },
    });

    if (!currentUser) {
      throw new UnauthorizedException('用户不存在或已禁用');
    }

    const passwordMatched = await compare(dto.currentPassword, currentUser.passwordHash).catch(() => false);
    if (!passwordMatched) {
      throw new UnauthorizedException('当前密码错误');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('新密码不能与当前密码相同');
    }
    const weakPasswordReason = this.getWeakPasswordReason(dto.newPassword, currentUser);
    if (weakPasswordReason) {
      throw new BadRequestException(`新密码过于简单：${weakPasswordReason}`);
    }

    await this.prisma.user.update({
      where: { id: currentUser.id },
      data: {
        passwordHash: hashSync(dto.newPassword, 10),
        passwordChangeRequired: false,
      },
    });

    return { code: 0, message: 'ok', data: null };
  }

  async getAuthUserFromAuthorization(authorization?: string): Promise<AuthUser> {
    if (!authorization) {
      throw new UnauthorizedException('缺少 Authorization');
    }

    const token = authorization.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('无效的 token');
    }

    let payload: {
      sub: number;
      schoolId: number;
      roleCode: string;
      terminalType?: string;
    };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('无效的 token');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: BigInt(payload.sub),
        deletedAt: null,
        status: 'enabled',
      },
      include: {
        role: true,
        scopes: true,
        teacherClassAssignments: {
          where: { status: 'enabled' },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在或已禁用');
    }

    return {
      id: user.id,
      schoolId: user.schoolId,
      username: user.username,
      name: user.name,
      roleCode: user.role.code,
      roleName: user.role.name,
      terminalType: payload.terminalType,
      dutyTags: this.normalizeDutyTags(user.dutyTags),
      passwordChangeRequired: user.passwordChangeRequired,
      scopes: user.scopes.map((scope) => ({
        scopeType: scope.scopeType,
        classId: scope.classId,
        gradeCode: scope.gradeCode,
        subjectCode: scope.subjectCode,
      })),
      classAssignments: user.teacherClassAssignments.map((assignment) => ({
        classId: assignment.classId,
        roleInClass: assignment.roleInClass,
        subjectCode: assignment.subjectCode,
        isPrimary: assignment.isPrimary,
      })),
    };
  }

  canAccessClass(user: AuthUser, classId: bigint | number) {
    if (this.hasAnyRole(user, DISPLAY_ADMIN_ROLE_CODES)) {
      return true;
    }

    const targetClassId = typeof classId === 'bigint' ? classId : BigInt(classId);
    return (
      user.scopes.some((scope) => scope.classId === targetClassId) ||
      user.classAssignments.some((assignment) => assignment.classId === targetClassId)
    );
  }

  /** 返回当前用户可访问的班级 ID；管理员返回 null 表示不限；无权限时返回 [-1] 以保证查询为空 */
  getAccessibleClassIds(user: AuthUser): bigint[] | null {
    if (this.hasAnyRole(user, DISPLAY_ADMIN_ROLE_CODES)) {
      return null;
    }

    const classIds = Array.from(
      new Set([
        ...user.scopes
          .map((scope) => scope.classId)
          .filter((classId): classId is bigint => typeof classId === 'bigint'),
        ...user.classAssignments.map((assignment) => assignment.classId),
      ]),
    );
    return classIds.length ? classIds : [BigInt(-1)];
  }

  ensureCanAccessClass(user: AuthUser, classId: bigint | number) {
    if (!this.canAccessClass(user, classId)) {
      throw new ForbiddenException('无权访问当前班级');
    }
  }

  async ensureIsHomeroomOfClass(user: AuthUser, classId: bigint | number) {
    if (this.hasAnyRole(user, DISPLAY_ADMIN_ROLE_CODES)) {
      return;
    }

    const targetClassId = typeof classId === 'bigint' ? classId : BigInt(classId);
    const matchedAssignment = user.classAssignments.some(
      (assignment) =>
        assignment.classId === targetClassId &&
        ['homeroom', 'co_homeroom'].includes(assignment.roleInClass),
    );
    if (matchedAssignment) {
      return;
    }

    const matchedClassroom = await this.prisma.classroom.findFirst({
      where: {
        id: targetClassId,
        schoolId: user.schoolId,
        homeroomTeacherId: user.id,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!matchedClassroom) {
      throw new ForbiddenException('仅当前班级班主任可执行此操作');
    }
  }

  getSubjectCodesForClass(user: AuthUser, classId: bigint | number) {
    const targetClassId = typeof classId === 'bigint' ? classId : BigInt(classId);
    return Array.from(
      new Set(
        [
          ...user.scopes
            .filter((scope) => scope.classId === targetClassId && scope.subjectCode)
            .map((scope) => scope.subjectCode as string),
          ...user.classAssignments
            .filter(
              (assignment) =>
                assignment.classId === targetClassId &&
                assignment.roleInClass === 'subject_teacher' &&
                assignment.subjectCode,
            )
            .map((assignment) => assignment.subjectCode as string),
        ],
      ),
    );
  }

  getRuleSubjectCodesForClass(user: AuthUser, classId: bigint | number) {
    return Array.from(
      new Set(
        this.getSubjectCodesForClass(user, classId).flatMap((subjectCode) => SUBJECT_RULE_COMPATIBILITY[subjectCode] ?? [subjectCode]),
      ),
    );
  }

  canUseRuleForClass(
    user: AuthUser,
    classId: bigint | number,
    rule: { moduleType?: unknown; subjectCode?: unknown; allowedRoleCodes?: unknown },
  ) {
    if (!this.canUseRuleByRole(user, rule)) {
      return false;
    }

    if (this.hasAnyRole(user, DISPLAY_ADMIN_ROLE_CODES)) {
      return true;
    }

    if (!this.canAccessClass(user, classId)) {
      return false;
    }

    if (this.hasHomeroomRoleForClass(user, classId)) {
      return true;
    }

    if (rule.moduleType === 'general') {
      return true;
    }

    if (typeof rule.subjectCode !== 'string' || !rule.subjectCode) {
      return false;
    }

    return this.getRuleSubjectCodesForClass(user, classId).includes(rule.subjectCode);
  }

  ensureCanUseRuleForClass(
    user: AuthUser,
    classId: bigint | number,
    rule: { moduleType?: unknown; subjectCode?: unknown; allowedRoleCodes?: unknown },
  ) {
    if (!this.canUseRuleForClass(user, classId, rule)) {
      throw new ForbiddenException('无权使用当前积分规则');
    }
  }

  canUseRuleByRole(user: AuthUser, rule: { allowedRoleCodes?: unknown }) {
    const allowedRoleCodes = this.normalizeAllowedRoleCodes(rule.allowedRoleCodes);
    if (allowedRoleCodes.length === 0) {
      return true;
    }

    const effectiveRoles = new Set(this.getEffectiveRoleCodes(user));
    return allowedRoleCodes.some((roleCode) => effectiveRoles.has(roleCode));
  }

  normalizeAllowedRoleCodes(value: unknown) {
    if (Array.isArray(value)) {
      return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return Array.from(new Set(parsed.map((item) => String(item).trim()).filter(Boolean)));
        }
      } catch {
        // ignore invalid JSON and fallback to delimited parsing
      }
      return Array.from(new Set(trimmed.split(/[,，;；|]/).map((item) => item.trim()).filter(Boolean)));
    }

    return [];
  }

  private normalizeDutyTags(value: unknown) {
    const rawItems = Array.isArray(value)
      ? value
      : String(value ?? '').split(/[,，;；、/／|]+/);
    return Array.from(new Set(rawItems.map((item) => String(item).trim()).filter(Boolean)));
  }

  getEffectiveRoleCodes(user: AuthUser) {
    const roleCodes = new Set<string>([user.roleCode]);
    for (const tag of user.dutyTags) {
      for (const { keywords, roleCode } of DUTY_TAG_ROLE_MAP) {
        if (keywords.some((keyword) => tag.includes(keyword))) {
          roleCodes.add(roleCode);
        }
      }
    }
    for (const assignment of user.classAssignments) {
      if (assignment.roleInClass === 'subject_teacher') {
        roleCodes.add('subject_teacher');
      }
      if (['homeroom', 'co_homeroom'].includes(assignment.roleInClass)) {
        roleCodes.add('homeroom_teacher');
      }
    }
    return Array.from(roleCodes);
  }

  hasAnyRole(user: AuthUser, roleCodes: string[]) {
    const effectiveRoleCodes = this.getEffectiveRoleCodes(user);
    return roleCodes.some((roleCode) => effectiveRoleCodes.includes(roleCode));
  }

  canManageAllDisplays(user: AuthUser) {
    return this.hasAnyRole(user, DISPLAY_ADMIN_ROLE_CODES);
  }

  canInitializeDisplayTerminal(user: AuthUser) {
    return this.hasAnyRole(user, [...DISPLAY_ADMIN_ROLE_CODES, 'homeroom_teacher']);
  }

  /** 系统管理员可绕过「一班级一终端」限制，用于线上测试大屏 */
  canOverrideClassDisplayBinding(user: AuthUser) {
    return user.roleCode === 'super_admin';
  }

  canOperateDisplay(user: AuthUser) {
    return this.hasAnyRole(user, DISPLAY_OPERATOR_ROLE_CODES);
  }

  private hasHomeroomRoleForClass(user: AuthUser, classId: bigint | number) {
    const targetClassId = typeof classId === 'bigint' ? classId : BigInt(classId);
    return user.classAssignments.some(
      (assignment) =>
        assignment.classId === targetClassId &&
        ['homeroom', 'co_homeroom'].includes(assignment.roleInClass),
    );
  }
}
