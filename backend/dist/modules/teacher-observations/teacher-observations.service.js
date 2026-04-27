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
exports.TeacherObservationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../auth/auth.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const operation_log_service_1 = require("../operation-log/operation-log.service");
const bigint_util_1 = require("../../common/utils/bigint.util");
let TeacherObservationsService = class TeacherObservationsService {
    constructor(prisma, authService, operationLogService, configService) {
        this.prisma = prisma;
        this.authService = authService;
        this.operationLogService = operationLogService;
        this.configService = configService;
    }
    async create(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (!['homeroom_teacher', 'subject_teacher', 'school_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(user.roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权记录教师观察');
        }
        this.authService.ensureCanAccessClass(user, body.classId);
        const student = await this.prisma.student.findFirst({
            where: {
                id: BigInt(body.studentId),
                classId: BigInt(body.classId),
                schoolId: user.schoolId,
                deletedAt: null,
                status: 'enabled',
            },
            select: {
                id: true,
                classId: true,
                name: true,
            },
        });
        if (!student) {
            throw new common_1.NotFoundException('学生不存在');
        }
        const created = await this.prisma.teacherObservation.create({
            data: {
                schoolId: user.schoolId,
                classId: BigInt(body.classId),
                studentId: BigInt(body.studentId),
                teacherId: user.id,
                observationType: body.observationType?.trim() || null,
                content: body.content.trim(),
            },
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: 'admin',
            module: 'teacher_observation',
            action: 'create',
            targetType: 'student',
            targetId: BigInt(body.studentId),
            detail: {
                classId: body.classId,
                observationType: body.observationType?.trim() || null,
            },
        });
        return {
            code: 0,
            message: 'ok',
            data: {
                id: (0, bigint_util_1.toNumber)(created.id),
            },
        };
    }
    async aiPolish(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (!['homeroom_teacher', 'subject_teacher', 'school_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(user.roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权使用观察润色');
        }
        const fallback = this.buildFallbackPolish(body);
        const polished = await this.generateWithArk(body, fallback);
        return {
            code: 0,
            message: 'ok',
            data: {
                content: polished,
            },
        };
    }
    buildFallbackPolish(body) {
        const prefix = [body.className, body.studentName, body.observationType].filter(Boolean).join(' · ');
        const normalized = body.content.replace(/\s+/g, ' ').trim();
        return prefix ? `${prefix}：${normalized}` : normalized;
    }
    async generateWithArk(body, fallback) {
        const apiKey = this.configService.get('ARK_API_KEY');
        const apiUrl = this.configService.get('ARK_API_URL') || 'https://ark.cn-beijing.volces.com/api/v3/responses';
        const model = this.configService.get('ARK_MODEL') || 'deepseek-v3-2-251201';
        const timeoutMs = Number(this.configService.get('ARK_TIMEOUT_MS') || 30000);
        if (!apiKey) {
            return fallback;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    stream: false,
                    input: [
                        {
                            role: 'system',
                            content: [
                                {
                                    type: 'input_text',
                                    text: [
                                        '你是学校教师观察记录助手。',
                                        '请把原始观察整理成简洁、正式、客观的教师观察文本。',
                                        '不要夸大，不做医学或心理诊断，不要输出标题。',
                                        '只输出润色后的正文，不要附加解释。',
                                    ].join(' '),
                                },
                            ],
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'input_text',
                                    text: JSON.stringify(body, null, 2),
                                },
                            ],
                        },
                    ],
                }),
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`Ark API 请求失败: ${response.status}`);
            }
            const payload = (await response.json());
            const text = payload.output_text?.trim() ||
                payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? '').join('\n').trim() ||
                '';
            return text || fallback;
        }
        catch {
            return fallback;
        }
        finally {
            clearTimeout(timeout);
        }
    }
};
exports.TeacherObservationsService = TeacherObservationsService;
exports.TeacherObservationsService = TeacherObservationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        operation_log_service_1.OperationLogService,
        config_1.ConfigService])
], TeacherObservationsService);
//# sourceMappingURL=teacher-observations.service.js.map