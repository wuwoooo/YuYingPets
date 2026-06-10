import { Prisma } from '@prisma/client';

const NON_BEHAVIOR_SCENE_CODES = ['pet_deco'] as const;
const NON_BEHAVIOR_RULE_CODES = ['PET_DECO_CHANGE'] as const;
const NON_BEHAVIOR_DIMENSIONS = ['萌宠装扮'] as const;
const NON_BEHAVIOR_RULE_NAMES = ['更换萌宠装扮'] as const;
const NON_BEHAVIOR_REMARK_KEYWORDS = ['班级评价联动'] as const;

type ScoreRecordLike = {
  sceneCode?: string | null;
  dimension?: string | null;
  remark?: string | null;
  rule?: {
    sceneCode?: string | null;
    code?: string | null;
    dimension?: string | null;
    name?: string | null;
    scoreTarget?: string | null;
  } | null;
};

function normalized(value: string | null | undefined) {
  return String(value ?? '').trim();
}

function includesValue(values: readonly string[], value: string | null | undefined) {
  const target = normalized(value);
  return target.length > 0 && values.includes(target);
}

function includesKeyword(keywords: readonly string[], value: string | null | undefined) {
  const target = normalized(value);
  return target.length > 0 && keywords.some((keyword) => target.includes(keyword));
}

export function isNonBehaviorScoreRecord(record: ScoreRecordLike) {
  return (
    includesValue(NON_BEHAVIOR_SCENE_CODES, record.sceneCode) ||
    includesValue(NON_BEHAVIOR_SCENE_CODES, record.rule?.sceneCode) ||
    includesValue(NON_BEHAVIOR_RULE_CODES, record.rule?.code) ||
    includesValue(NON_BEHAVIOR_DIMENSIONS, record.dimension) ||
    includesValue(NON_BEHAVIOR_DIMENSIONS, record.rule?.dimension) ||
    includesValue(NON_BEHAVIOR_RULE_NAMES, record.rule?.name) ||
    normalized(record.rule?.scoreTarget) === 'class' ||
    includesKeyword(NON_BEHAVIOR_REMARK_KEYWORDS, record.remark)
  );
}

export function behaviorScoreRecordWhere(): Prisma.ScoreRecordWhereInput {
  return {
    NOT: {
      OR: [
        { sceneCode: { in: [...NON_BEHAVIOR_SCENE_CODES] } },
        { dimension: { in: [...NON_BEHAVIOR_DIMENSIONS] } },
        { rule: { is: { sceneCode: { in: [...NON_BEHAVIOR_SCENE_CODES] } } } },
        { rule: { is: { code: { in: [...NON_BEHAVIOR_RULE_CODES] } } } },
        { rule: { is: { dimension: { in: [...NON_BEHAVIOR_DIMENSIONS] } } } },
        { rule: { is: { name: { in: [...NON_BEHAVIOR_RULE_NAMES] } } } },
        { rule: { is: { scoreTarget: 'class' } } },
        ...NON_BEHAVIOR_REMARK_KEYWORDS.map((keyword) => ({
          remark: { contains: keyword },
        })),
      ],
    },
  };
}
