import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
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
        },
        scopes: user.scopes.map((scope) => ({
          scopeType: scope.scopeType,
          classId: toNumber(scope.classId),
          gradeCode: scope.gradeCode,
          subjectCode: scope.subjectCode,
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
        },
        scopes: user.scopes.map((scope) => ({
          scopeType: scope.scopeType,
          classId: toNumber(scope.classId),
          gradeCode: scope.gradeCode,
          subjectCode: scope.subjectCode,
        })),
      },
    };
  }

  logout() {
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
      scopes: user.scopes.map((scope) => ({
        scopeType: scope.scopeType,
        classId: scope.classId,
        gradeCode: scope.gradeCode,
        subjectCode: scope.subjectCode,
      })),
    };
  }

  canAccessClass(user: AuthUser, classId: bigint | number) {
    if (['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
      return true;
    }

    const targetClassId = typeof classId === 'bigint' ? classId : BigInt(classId);
    return user.scopes.some((scope) => scope.classId === targetClassId);
  }

  ensureCanAccessClass(user: AuthUser, classId: bigint | number) {
    if (!this.canAccessClass(user, classId)) {
      throw new ForbiddenException('无权访问当前班级');
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
}
