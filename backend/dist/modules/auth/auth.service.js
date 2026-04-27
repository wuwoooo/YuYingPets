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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcryptjs_1 = require("bcryptjs");
const prisma_service_1 = require("../../prisma/prisma.service");
const bigint_util_1 = require("../../common/utils/bigint.util");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(dto) {
        const user = await this.prisma.user.findFirst({
            where: {
                username: dto.username,
                deletedAt: null,
                status: 'enabled',
            },
            include: {
                role: true,
                scopes: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('账号或密码错误');
        }
        const passwordMatched = user.passwordHash === dto.password ||
            (await (0, bcryptjs_1.compare)(dto.password, user.passwordHash).catch(() => false));
        if (!passwordMatched) {
            throw new common_1.UnauthorizedException('账号或密码错误');
        }
        const payload = {
            sub: (0, bigint_util_1.toNumber)(user.id),
            schoolId: (0, bigint_util_1.toNumber)(user.schoolId),
            username: user.username,
            roleCode: user.role.code,
            terminalType: dto.terminalType,
        };
        const token = await this.jwtService.signAsync(payload);
        return {
            code: 0,
            message: 'ok',
            data: {
                token,
                user: {
                    id: (0, bigint_util_1.toNumber)(user.id),
                    name: user.name,
                    roleCode: user.role.code,
                },
                scopes: user.scopes.map((scope) => ({
                    scopeType: scope.scopeType,
                    classId: (0, bigint_util_1.toNumber)(scope.classId),
                    gradeCode: scope.gradeCode,
                    subjectCode: scope.subjectCode,
                })),
            },
        };
    }
    async me(authorization) {
        const user = await this.getAuthUserFromAuthorization(authorization);
        return {
            code: 0,
            message: 'ok',
            data: {
                user: {
                    id: (0, bigint_util_1.toNumber)(user.id),
                    schoolId: (0, bigint_util_1.toNumber)(user.schoolId),
                    username: user.username,
                    name: user.name,
                    roleCode: user.roleCode,
                    roleName: user.roleName,
                },
                scopes: user.scopes.map((scope) => ({
                    scopeType: scope.scopeType,
                    classId: (0, bigint_util_1.toNumber)(scope.classId),
                    gradeCode: scope.gradeCode,
                    subjectCode: scope.subjectCode,
                })),
            },
        };
    }
    logout() {
        return { code: 0, message: 'ok', data: null };
    }
    async getAuthUserFromAuthorization(authorization) {
        if (!authorization) {
            throw new common_1.UnauthorizedException('缺少 Authorization');
        }
        const token = authorization.replace(/^Bearer\s+/i, '').trim();
        if (!token) {
            throw new common_1.UnauthorizedException('无效的 token');
        }
        const payload = await this.jwtService.verifyAsync(token);
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
            throw new common_1.UnauthorizedException('用户不存在或已禁用');
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
    canAccessClass(user, classId) {
        if (['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
            return true;
        }
        const targetClassId = typeof classId === 'bigint' ? classId : BigInt(classId);
        return user.scopes.some((scope) => scope.classId === targetClassId);
    }
    ensureCanAccessClass(user, classId) {
        if (!this.canAccessClass(user, classId)) {
            throw new common_1.ForbiddenException('无权访问当前班级');
        }
    }
    getSubjectCodesForClass(user, classId) {
        const targetClassId = typeof classId === 'bigint' ? classId : BigInt(classId);
        return Array.from(new Set(user.scopes
            .filter((scope) => scope.classId === targetClassId && scope.subjectCode)
            .map((scope) => scope.subjectCode)));
    }
    canUseRuleForClass(user, classId, rule) {
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
        return this.getSubjectCodesForClass(user, classId).includes(rule.subjectCode);
    }
    ensureCanUseRuleForClass(user, classId, rule) {
        if (!this.canUseRuleForClass(user, classId, rule)) {
            throw new common_1.ForbiddenException('无权使用当前积分规则');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map