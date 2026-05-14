import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hashSync } from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthUser } from '@/common/auth/auth-user.interface';
import { toNumber } from '@/common/utils/bigint.util';

const SUBJECT_RULE_COMPATIBILITY: Record<string, string[]> = {
  computer: ['computer', 'arts_it'],
  art: ['art', 'arts_it'],
  music: ['music', 'arts_it'],
  pe: ['pe', 'arts_it'],
};

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
          const passwordMatched =
            candidate.passwordHash === dto.password ||
            (await compare(dto.password, candidate.passwordHash).catch(() => false));
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

  async changePassword(authorization: string | undefined, dto: ChangePasswordDto) {
    const user = await this.getAuthUserFromAuthorization(authorization);
    const currentUser = await this.prisma.user.findFirst({
      where: {
        id: user.id,
        schoolId: user.schoolId,
        deletedAt: null,
        status: 'enabled',
      },
      select: { id: true, passwordHash: true },
    });

    if (!currentUser) {
      throw new UnauthorizedException('用户不存在或已禁用');
    }

    const passwordMatched =
      currentUser.passwordHash === dto.currentPassword ||
      (await compare(dto.currentPassword, currentUser.passwordHash).catch(() => false));
    if (!passwordMatched) {
      throw new UnauthorizedException('当前密码错误');
    }

    await this.prisma.user.update({
      where: { id: currentUser.id },
      data: { passwordHash: hashSync(dto.newPassword, 10) },
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

    const payload = await this.jwtService.verifyAsync<{
      sub: number;
      schoolId: number;
      roleCode: string;
    }>(token);

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
      dutyTags: this.normalizeDutyTags(user.dutyTags),
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
    if (['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
      return true;
    }

    const targetClassId = typeof classId === 'bigint' ? classId : BigInt(classId);
    return (
      user.scopes.some((scope) => scope.classId === targetClassId) ||
      user.classAssignments.some((assignment) => assignment.classId === targetClassId)
    );
  }

  ensureCanAccessClass(user: AuthUser, classId: bigint | number) {
    if (!this.canAccessClass(user, classId)) {
      throw new ForbiddenException('无权访问当前班级');
    }
  }

  async ensureIsHomeroomOfClass(user: AuthUser, classId: bigint | number) {
    if (['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
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
        user.scopes
          .filter((scope) => scope.classId === targetClassId && scope.subjectCode)
          .map((scope) => scope.subjectCode as string),
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
    rule: { moduleType?: unknown; subjectCode?: unknown },
  ) {
    if (['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
      return true;
    }

    if (!this.canAccessClass(user, classId)) {
      return false;
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
    rule: { moduleType?: unknown; subjectCode?: unknown },
  ) {
    if (!this.canUseRuleForClass(user, classId, rule)) {
      throw new ForbiddenException('无权使用当前积分规则');
    }
  }

  private normalizeDutyTags(value: unknown) {
    const rawItems = Array.isArray(value)
      ? value
      : String(value ?? '').split(/[,，;；、/／|]+/);
    return Array.from(new Set(rawItems.map((item) => String(item).trim()).filter(Boolean)));
  }
}
