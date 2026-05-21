import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleType, ScoreTarget, Sentiment } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ScoreRuleUpsertDto } from './dto/score-rule-upsert.dto';
import { ScoreRuleAiSuggestDto } from './dto/score-rule-ai-suggest.dto';
import { toNumber } from '@/common/utils/bigint.util';

const MODULE_LABELS: Record<string, string> = {
  general: '通用规则',
  subject: '学科规则',
};

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

const SCENE_LABELS: Record<string, string> = {
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

@Injectable()
export class ScoreRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async list(authorization: string | undefined, query: Record<string, string>) {
    const moduleType =
      query.moduleType === ModuleType.general || query.moduleType === ModuleType.subject
        ? query.moduleType
        : undefined;

    const rows = await this.prisma.scoreRule.findMany({
      where: {
        moduleType,
        scoreTarget: query.scoreTarget === 'student' || query.scoreTarget === 'class' ? query.scoreTarget : undefined,
        subjectCode: query.subjectCode || undefined,
        sceneCode: query.sceneCode || undefined,
        displayEnabled:
          query.displayEnabled === undefined ? undefined : query.displayEnabled === 'true',
        deletedAt: null,
      },
      orderBy: [{ moduleType: 'asc' }, { subjectCode: 'asc' }, { sceneCode: 'asc' }, { name: 'asc' }],
    });

    const filteredRows = await this.filterRowsForAuthorizedViewerContext(authorization, query, rows);

    return {
      code: 0,
      message: 'ok',
      data: filteredRows.map((row) => this.serializeRow(row)),
    };
  }

  async tree(authorization: string | undefined, query: Record<string, string>) {
    const moduleType =
      query.moduleType === ModuleType.general || query.moduleType === ModuleType.subject
        ? query.moduleType
        : undefined;

    const rows = await this.prisma.scoreRule.findMany({
      where: {
        moduleType,
        scoreTarget: query.scoreTarget === 'student' || query.scoreTarget === 'class' ? query.scoreTarget : undefined,
        subjectCode: query.subjectCode || undefined,
        sceneCode: query.sceneCode || undefined,
        displayEnabled:
          query.displayEnabled === undefined ? undefined : query.displayEnabled === 'true',
        adminEnabled: query.adminEnabled === undefined ? undefined : query.adminEnabled === 'true',
        isHighFrequency:
          query.isHighFrequency === undefined ? undefined : query.isHighFrequency === 'true',
        deletedAt: null,
      },
      orderBy: [{ moduleType: 'asc' }, { subjectCode: 'asc' }, { sceneCode: 'asc' }, { name: 'asc' }],
    });

    const filteredRows = await this.filterRowsForAuthorizedViewerContext(authorization, query, rows);
    const moduleMap = new Map<
      string,
      {
        moduleType: string;
        moduleLabel: string;
        count: number;
        subjects: Array<{
          subjectCode: string | null;
          subjectLabel: string;
          count: number;
          scenes: Array<{
            sceneCode: string;
            sceneLabel: string;
            count: number;
            rules: ReturnType<ScoreRulesService['serializeRow']>[];
          }>;
        }>;
      }
    >();

    for (const row of filteredRows) {
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
  }

  async create(authorization: string | undefined, body: ScoreRuleUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
      throw new ForbiddenException('当前角色无权维护积分规则');
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
        scoreTarget: payload.scoreTarget,
        scoreValue: payload.scoreValue,
        dimension: payload.dimension,
        tag: payload.tag,
        sentiment: payload.sentiment,
        aiSummaryText: payload.aiSummaryText,
        description: payload.description,
        allowedRoleCodes: this.serializeAllowedRoleCodes(payload.allowedRoleCodes),
        isHighFrequency: payload.isHighFrequency,
        displayEnabled: payload.displayEnabled,
        adminEnabled: payload.adminEnabled,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(created.id) } };
  }

  async aiSuggest(authorization: string | undefined, body: ScoreRuleAiSuggestDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
      throw new ForbiddenException('当前角色无权使用规则 AI 补全');
    }

    const fallback = this.buildFallbackSuggestion(body);
    const suggested = await this.generateRuleSuggestionWithArk(body, fallback);

    return {
      code: 0,
      message: 'ok',
      data: suggested,
    };
  }

  async detail(id: number) {
    const row = await this.prisma.scoreRule.findFirst({
      where: { id: BigInt(id), deletedAt: null },
    });

    if (!row) {
      throw new NotFoundException('积分规则不存在');
    }

    return {
      code: 0,
      message: 'ok',
      data: this.serializeRow(row),
    };
  }

  async update(authorization: string | undefined, id: number, body: ScoreRuleUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
      throw new ForbiddenException('当前角色无权维护积分规则');
    }
    const payload = this.normalizeUpsertBody(body);

    const exists = await this.prisma.scoreRule.findFirst({
      where: { id: BigInt(id), deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('积分规则不存在');
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
        scoreTarget: payload.scoreTarget,
        scoreValue: payload.scoreValue,
        dimension: payload.dimension,
        tag: payload.tag,
        sentiment: payload.sentiment,
        aiSummaryText: payload.aiSummaryText,
        description: payload.description,
        allowedRoleCodes: this.serializeAllowedRoleCodes(payload.allowedRoleCodes),
        isHighFrequency: payload.isHighFrequency,
        displayEnabled: payload.displayEnabled,
        adminEnabled: payload.adminEnabled,
        updatedBy: user.id,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(updated.id) } };
  }

  private serializeRow(row: {
    id: bigint;
    schoolId: bigint;
    semesterId: bigint;
    createdBy: bigint | null;
    updatedBy: bigint | null;
  } & Record<string, unknown>) {
    return {
      ...row,
      id: toNumber(row.id),
      schoolId: toNumber(row.schoolId),
      semesterId: toNumber(row.semesterId),
      createdBy: toNumber(row.createdBy),
      updatedBy: toNumber(row.updatedBy),
      allowedRoleCodes: this.authService.normalizeAllowedRoleCodes(row.allowedRoleCodes),
    };
  }

  private async filterRowsForAuthorizedViewerContext<
    T extends { moduleType: ModuleType; subjectCode: string | null; allowedRoleCodes?: unknown },
  >(
    authorization: string | undefined,
    query: Record<string, string>,
    rows: T[],
  ) {
    if (!authorization) {
      return rows;
    }

    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const roleFilteredRows = rows.filter((row) => this.authService.canUseRuleByRole(user, row));

    if (!query.classId) {
      return roleFilteredRows;
    }

    this.authService.ensureCanAccessClass(user, Number(query.classId));

    return roleFilteredRows.filter((row) => this.authService.canUseRuleForClass(user, Number(query.classId), row));
  }

  private buildFallbackSuggestion(body: ScoreRuleAiSuggestDto) {
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

  private normalizeUpsertBody(body: ScoreRuleUpsertDto) {
    const semesterId = Number(body.semesterId);
    const sceneCode = body.sceneCode?.trim();
    const code = body.code?.trim();
    const name = body.name?.trim();
    const subjectCode = body.moduleType === ModuleType.subject ? body.subjectCode?.trim() : undefined;
    const dimension = body.dimension?.trim() || this.resolveFallbackDimension(sceneCode, body.scoreType === 'add');
    const tag = body.tag?.trim() || undefined;
    const aiSummaryText = body.aiSummaryText?.trim() || undefined;
    const description = body.description?.trim() || undefined;
    const allowedRoleCodes = Array.from(
      new Set((body.allowedRoleCodes ?? []).map((item) => String(item).trim()).filter(Boolean)),
    );
    const scoreValue = Number(body.scoreValue);
    const sentiment = body.scoreType === 'deduct' ? Sentiment.negative : Sentiment.positive;
    const displayEnabled = body.displayEnabled ?? false;
    const adminEnabled = body.adminEnabled ?? true;

    if (!Number.isInteger(semesterId) || semesterId <= 0) {
      throw new BadRequestException('学期参数不合法');
    }
    if (!sceneCode) {
      throw new BadRequestException('应用场景不能为空');
    }
    if (!code) {
      throw new BadRequestException('规则编码不能为空');
    }
    if (!name) {
      throw new BadRequestException('规则名称不能为空');
    }
    if (!Number.isInteger(scoreValue) || scoreValue <= 0) {
      throw new BadRequestException('积分分值必须是大于 0 的整数');
    }
    if (body.moduleType === ModuleType.subject && !subjectCode) {
      throw new BadRequestException('学科类规则必须指定学科');
    }
    if (!displayEnabled && !adminEnabled) {
      throw new BadRequestException('请至少保留一个使用位置');
    }

    return {
      semesterId,
      moduleType: body.moduleType,
      subjectCode,
      sceneCode,
      code,
      name,
      scoreType: body.scoreType,
      scoreTarget: body.scoreTarget === 'class' ? ScoreTarget.class : ScoreTarget.student,
      scoreValue,
      dimension,
      tag,
      sentiment,
      aiSummaryText,
      description,
      allowedRoleCodes,
      isHighFrequency: body.isHighFrequency ?? false,
      displayEnabled,
      adminEnabled,
    };
  }

  private serializeAllowedRoleCodes(allowedRoleCodes: string[]) {
    return allowedRoleCodes.length > 0 ? JSON.stringify(allowedRoleCodes) : null;
  }

  private resolveFallbackDimension(sceneCode?: string, isPositive?: boolean) {
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

  private async generateRuleSuggestionWithArk(body: ScoreRuleAiSuggestDto, fallback: {
    dimension: string;
    tag: string;
    aiSummaryText: string;
    description: string;
  }) {
    const apiKey = this.configService.get<string>('ARK_API_KEY');
    const apiUrl = this.configService.get<string>('ARK_API_URL') || 'https://ark.cn-beijing.volces.com/api/v3/responses';
    const model = this.configService.get<string>('ARK_MODEL') || 'deepseek-v3-2-251201';
    const timeoutMs = Number(this.configService.get<string>('ARK_TIMEOUT_MS') || 30000);

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

      const payload = (await response.json()) as {
        output_text?: string;
        output?: Array<{ content?: Array<{ text?: string }> }>;
      };
      const text =
        payload.output_text?.trim() ||
        payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? '').join('\n').trim() ||
        '';

      return this.parseRuleSuggestion(text, fallback);
    } catch {
      return fallback;
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseRuleSuggestion(text: string, fallback: {
    dimension: string;
    tag: string;
    aiSummaryText: string;
    description: string;
  }) {
    if (!text) return fallback;

    const normalize = (obj: Partial<typeof fallback>) => ({
      dimension: obj.dimension?.trim() || fallback.dimension,
      tag: obj.tag?.trim() || fallback.tag,
      aiSummaryText: obj.aiSummaryText?.trim() || fallback.aiSummaryText,
      description: obj.description?.trim() || fallback.description,
    });

    try {
      return normalize(JSON.parse(text) as Partial<typeof fallback>);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return normalize(JSON.parse(match[0]) as Partial<typeof fallback>);
        } catch {
          return fallback;
        }
      }
      return fallback;
    }
  }
}
