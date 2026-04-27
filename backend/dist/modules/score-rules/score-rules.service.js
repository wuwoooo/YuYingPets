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
exports.ScoreRulesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const auth_service_1 = require("../auth/auth.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const bigint_util_1 = require("../../common/utils/bigint.util");
const MODULE_LABELS = {
    general: '通用规则',
    subject: '学科规则',
};
const SUBJECT_LABELS = {
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
    pe: '体育',
};
const SCENE_LABELS = {
    attendance: '出勤',
    behavior: '行为规范',
    classroom: '课堂',
    competition: '竞赛',
    dictation: '听写默写',
    discipline: '纪律',
    equipment: '器材设备',
    exam: '测评',
    group: '小组合作',
    homework: '作业',
    presentation: '展讲',
    qa: '答疑互动',
    reading: '早读',
    recitation: '背诵',
    self_study: '自习',
    activity: '活动',
};
let ScoreRulesService = class ScoreRulesService {
    constructor(prisma, authService, configService) {
        this.prisma = prisma;
        this.authService = authService;
        this.configService = configService;
    }
    async list(authorization, query) {
        const moduleType = query.moduleType === client_1.ModuleType.general || query.moduleType === client_1.ModuleType.subject
            ? query.moduleType
            : undefined;
        const rows = await this.prisma.scoreRule.findMany({
            where: {
                moduleType,
                subjectCode: query.subjectCode || undefined,
                sceneCode: query.sceneCode || undefined,
                displayEnabled: query.displayEnabled === undefined ? undefined : query.displayEnabled === 'true',
                deletedAt: null,
            },
            orderBy: [{ moduleType: 'asc' }, { subjectCode: 'asc' }, { sceneCode: 'asc' }, { name: 'asc' }],
        });
        const filteredRows = await this.filterRowsForAuthorizedClassContext(authorization, query, rows);
        return {
            code: 0,
            message: 'ok',
            data: filteredRows.map((row) => this.serializeRow(row)),
        };
    }
    tree(query) {
        const moduleType = query.moduleType === client_1.ModuleType.general || query.moduleType === client_1.ModuleType.subject
            ? query.moduleType
            : undefined;
        return this.prisma.scoreRule.findMany({
            where: {
                moduleType,
                subjectCode: query.subjectCode || undefined,
                sceneCode: query.sceneCode || undefined,
                displayEnabled: query.displayEnabled === undefined ? undefined : query.displayEnabled === 'true',
                adminEnabled: query.adminEnabled === undefined ? undefined : query.adminEnabled === 'true',
                isHighFrequency: query.isHighFrequency === undefined ? undefined : query.isHighFrequency === 'true',
                deletedAt: null,
            },
            orderBy: [{ moduleType: 'asc' }, { subjectCode: 'asc' }, { sceneCode: 'asc' }, { name: 'asc' }],
        }).then((rows) => {
            const moduleMap = new Map();
            for (const row of rows) {
                const moduleKey = row.moduleType;
                const subjectKey = row.subjectCode ?? '__general__';
                const sceneKey = row.sceneCode;
                let moduleNode = moduleMap.get(moduleKey);
                if (!moduleNode) {
                    moduleNode = {
                        moduleType: row.moduleType,
                        moduleLabel: MODULE_LABELS[row.moduleType] ?? row.moduleType,
                        count: 0,
                        subjects: [],
                    };
                    moduleMap.set(moduleKey, moduleNode);
                }
                let subjectNode = moduleNode.subjects.find((item) => (item.subjectCode ?? '__general__') === subjectKey);
                if (!subjectNode) {
                    subjectNode = {
                        subjectCode: row.subjectCode,
                        subjectLabel: row.subjectCode ? SUBJECT_LABELS[row.subjectCode] ?? row.subjectCode : '通用',
                        count: 0,
                        scenes: [],
                    };
                    moduleNode.subjects.push(subjectNode);
                }
                let sceneNode = subjectNode.scenes.find((item) => item.sceneCode === sceneKey);
                if (!sceneNode) {
                    sceneNode = {
                        sceneCode: row.sceneCode,
                        sceneLabel: SCENE_LABELS[row.sceneCode] ?? row.sceneCode,
                        count: 0,
                        rules: [],
                    };
                    subjectNode.scenes.push(sceneNode);
                }
                const serialized = this.serializeRow(row);
                sceneNode.rules.push(serialized);
                sceneNode.count += 1;
                subjectNode.count += 1;
                moduleNode.count += 1;
            }
            return {
                code: 0,
                message: 'ok',
                data: Array.from(moduleMap.values()),
            };
        });
    }
    async create(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (!['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权维护积分规则');
        }
        const payload = this.normalizeUpsertBody(body);
        const created = await this.prisma.scoreRule.create({
            data: {
                schoolId: user.schoolId,
                semesterId: BigInt(payload.semesterId),
                moduleType: payload.moduleType,
                subjectCode: payload.subjectCode,
                sceneCode: payload.sceneCode,
                code: payload.code,
                name: payload.name,
                scoreType: payload.scoreType,
                scoreValue: payload.scoreValue,
                dimension: payload.dimension,
                tag: payload.tag,
                sentiment: payload.sentiment,
                aiSummaryText: payload.aiSummaryText,
                description: payload.description,
                isHighFrequency: payload.isHighFrequency,
                displayEnabled: payload.displayEnabled,
                adminEnabled: payload.adminEnabled,
                createdBy: user.id,
                updatedBy: user.id,
            },
        });
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(created.id) } };
    }
    async aiSuggest(authorization, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (!['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权使用规则 AI 补全');
        }
        const fallback = this.buildFallbackSuggestion(body);
        const suggested = await this.generateRuleSuggestionWithArk(body, fallback);
        return {
            code: 0,
            message: 'ok',
            data: suggested,
        };
    }
    async detail(id) {
        const row = await this.prisma.scoreRule.findFirst({
            where: { id: BigInt(id), deletedAt: null },
        });
        if (!row) {
            throw new common_1.NotFoundException('积分规则不存在');
        }
        return {
            code: 0,
            message: 'ok',
            data: this.serializeRow(row),
        };
    }
    async update(authorization, id, body) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (!['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
            throw new common_1.ForbiddenException('当前角色无权维护积分规则');
        }
        const payload = this.normalizeUpsertBody(body);
        const exists = await this.prisma.scoreRule.findFirst({
            where: { id: BigInt(id), deletedAt: null },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException('积分规则不存在');
        }
        const updated = await this.prisma.scoreRule.update({
            where: { id: BigInt(id) },
            data: {
                semesterId: BigInt(payload.semesterId),
                moduleType: payload.moduleType,
                subjectCode: payload.subjectCode,
                sceneCode: payload.sceneCode,
                code: payload.code,
                name: payload.name,
                scoreType: payload.scoreType,
                scoreValue: payload.scoreValue,
                dimension: payload.dimension,
                tag: payload.tag,
                sentiment: payload.sentiment,
                aiSummaryText: payload.aiSummaryText,
                description: payload.description,
                isHighFrequency: payload.isHighFrequency,
                displayEnabled: payload.displayEnabled,
                adminEnabled: payload.adminEnabled,
                updatedBy: user.id,
            },
        });
        return { code: 0, message: 'ok', data: { id: (0, bigint_util_1.toNumber)(updated.id) } };
    }
    serializeRow(row) {
        return {
            ...row,
            id: (0, bigint_util_1.toNumber)(row.id),
            schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
            semesterId: (0, bigint_util_1.toNumber)(row.semesterId),
            createdBy: (0, bigint_util_1.toNumber)(row.createdBy),
            updatedBy: (0, bigint_util_1.toNumber)(row.updatedBy),
        };
    }
    async filterRowsForAuthorizedClassContext(authorization, query, rows) {
        if (!authorization || !query.classId) {
            return rows;
        }
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        this.authService.ensureCanAccessClass(user, Number(query.classId));
        if (['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
            return rows;
        }
        return rows.filter((row) => this.authService.canUseRuleForClass(user, Number(query.classId), row));
    }
    buildFallbackSuggestion(body) {
        const sceneLabel = body.sceneCode ? SCENE_LABELS[body.sceneCode] ?? body.sceneCode : '课堂';
        const subjectLabel = body.subjectCode ? SUBJECT_LABELS[body.subjectCode] ?? body.subjectCode : '通用';
        const isPositive = (body.sentiment ?? (body.scoreType === 'deduct' ? 'negative' : 'positive')) === 'positive';
        return {
            dimension: this.resolveFallbackDimension(body.sceneCode, isPositive),
            tag: isPositive ? '成长进步' : '重点提醒',
            aiSummaryText: `${subjectLabel}${sceneLabel}场景中的${body.name ?? '学习表现'}${isPositive ? '表现积极' : '需要及时提醒'}`,
            description: `适用于${subjectLabel}${sceneLabel}场景，教师在学生出现“${body.name ?? '对应行为'}”时使用，用于${isPositive ? '强化正向反馈' : '及时纠偏提醒'}。`,
        };
    }
    normalizeUpsertBody(body) {
        const semesterId = Number(body.semesterId);
        const sceneCode = body.sceneCode?.trim();
        const code = body.code?.trim();
        const name = body.name?.trim();
        const subjectCode = body.moduleType === client_1.ModuleType.subject ? body.subjectCode?.trim() : undefined;
        const dimension = body.dimension?.trim() || this.resolveFallbackDimension(sceneCode, body.scoreType === 'add');
        const tag = body.tag?.trim() || undefined;
        const aiSummaryText = body.aiSummaryText?.trim() || undefined;
        const description = body.description?.trim() || undefined;
        const scoreValue = Number(body.scoreValue);
        const sentiment = body.scoreType === 'deduct' ? client_1.Sentiment.negative : client_1.Sentiment.positive;
        const displayEnabled = body.displayEnabled ?? false;
        const adminEnabled = body.adminEnabled ?? true;
        if (!Number.isInteger(semesterId) || semesterId <= 0) {
            throw new common_1.BadRequestException('学期参数不合法');
        }
        if (!sceneCode) {
            throw new common_1.BadRequestException('应用场景不能为空');
        }
        if (!code) {
            throw new common_1.BadRequestException('规则编码不能为空');
        }
        if (!name) {
            throw new common_1.BadRequestException('规则名称不能为空');
        }
        if (!Number.isInteger(scoreValue) || scoreValue <= 0) {
            throw new common_1.BadRequestException('积分分值必须是大于 0 的整数');
        }
        if (body.moduleType === client_1.ModuleType.subject && !subjectCode) {
            throw new common_1.BadRequestException('学科类规则必须指定学科');
        }
        if (!displayEnabled && !adminEnabled) {
            throw new common_1.BadRequestException('请至少保留一个使用位置');
        }
        return {
            semesterId,
            moduleType: body.moduleType,
            subjectCode,
            sceneCode,
            code,
            name,
            scoreType: body.scoreType,
            scoreValue,
            dimension,
            tag,
            sentiment,
            aiSummaryText,
            description,
            isHighFrequency: body.isHighFrequency ?? false,
            displayEnabled,
            adminEnabled,
        };
    }
    resolveFallbackDimension(sceneCode, isPositive) {
        switch (sceneCode) {
            case 'homework':
                return '作业管理';
            case 'exam':
            case 'dictation':
            case 'recitation':
                return '学业成绩';
            case 'attendance':
                return '出勤习惯';
            case 'discipline':
            case 'behavior':
                return '课堂纪律';
            default:
                return isPositive ? '课堂学习' : '自我管理';
        }
    }
    async generateRuleSuggestionWithArk(body, fallback) {
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
                                        '你是学校积分规则语义标注助手。',
                                        '请基于给定规则信息，为规则补全 dimension、tag、aiSummaryText、description。',
                                        '输出必须是 JSON，字段仅包含 dimension、tag、aiSummaryText、description，且都是字符串。',
                                        '用词需适合学校管理后台，简洁、明确、可执行。',
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
            return this.parseRuleSuggestion(text, fallback);
        }
        catch {
            return fallback;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    parseRuleSuggestion(text, fallback) {
        if (!text)
            return fallback;
        const normalize = (obj) => ({
            dimension: obj.dimension?.trim() || fallback.dimension,
            tag: obj.tag?.trim() || fallback.tag,
            aiSummaryText: obj.aiSummaryText?.trim() || fallback.aiSummaryText,
            description: obj.description?.trim() || fallback.description,
        });
        try {
            return normalize(JSON.parse(text));
        }
        catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    return normalize(JSON.parse(match[0]));
                }
                catch {
                    return fallback;
                }
            }
            return fallback;
        }
    }
};
exports.ScoreRulesService = ScoreRulesService;
exports.ScoreRulesService = ScoreRulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        config_1.ConfigService])
], ScoreRulesService);
//# sourceMappingURL=score-rules.service.js.map