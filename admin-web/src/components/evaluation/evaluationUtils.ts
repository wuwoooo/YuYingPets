import type { AdminStudent, ClassGroupSummary, ScoreRule } from '../../lib/api';

export type { ClassGroupSummary };
export type EvaluationMode = 'single' | 'batch' | 'group';
export type StudentSortKey = 'score-desc' | 'name-asc';
export type ScoreModalTab = 'score' | 'honor';

export type ScoreTarget =
  | { type: 'single'; studentId: number }
  | { type: 'batch'; studentIds: number[] }
  | { type: 'group'; groupId: number };

export const STUDENT_MANAGEMENT_RULE_CODE_PREFIX = 'MORAL_';

export function isStudentManagementRule(rule: Pick<ScoreRule, 'code'>) {
  return rule.code.startsWith(STUDENT_MANAGEMENT_RULE_CODE_PREFIX);
}

function matchesSceneFilter(sceneFilter: string, rule: ScoreRule) {
  if (sceneFilter === 'all') return true;
  if (sceneFilter === 'moral') return isStudentManagementRule(rule);
  return rule.sceneCode === sceneFilter;
}

const subjectRuleCompatibility: Record<string, string[]> = {
  computer: ['computer', 'arts_it'],
  art: ['art', 'arts_it'],
  music: ['music', 'arts_it'],
  pe: ['pe', 'arts_it'],
};

export function expandRuleSubjectCodes(subjectCodes: string[]) {
  return Array.from(
    new Set(subjectCodes.flatMap((subjectCode) => subjectRuleCompatibility[subjectCode] ?? [subjectCode])),
  );
}

export function canUseSubjectRule(subjectCodes: string[], ruleSubjectCode?: string | null) {
  if (!ruleSubjectCode) return false;
  return expandRuleSubjectCodes(subjectCodes).includes(ruleSubjectCode);
}

export function subjectFilterMatchesRule(subjectFilter: string, ruleSubjectCode?: string | null) {
  if (subjectFilter === 'all') return true;
  if (!ruleSubjectCode) return false;
  return expandRuleSubjectCodes([subjectFilter]).includes(ruleSubjectCode);
}

export function buildStudentGroupMap(groups: ClassGroupSummary[]) {
  const map = new Map<number, { groupNo: number; groupName: string }>();
  groups.forEach((group) => {
    group.students.forEach((student) => {
      map.set(student.id, { groupNo: group.groupNo, groupName: group.name });
    });
  });
  return map;
}

export function filterAndSortStudents(
  students: AdminStudent[],
  options: {
    keyword: string;
    groupFilter: number | 'all';
    sort: StudentSortKey;
    groups: ClassGroupSummary[];
  },
) {
  const groupMap = buildStudentGroupMap(options.groups);
  let rows = [...students];

  const keyword = options.keyword.trim().toLowerCase();
  if (keyword) {
    rows = rows.filter((item) => item.name.toLowerCase().includes(keyword));
  }

  if (options.groupFilter !== 'all') {
    rows = rows.filter((item) => groupMap.get(item.id)?.groupNo === options.groupFilter);
  }

  rows.sort((left, right) => {
    if (options.sort === 'name-asc') {
      return left.name.localeCompare(right.name, 'zh-CN');
    }
    return right.currentScore - left.currentScore || left.name.localeCompare(right.name, 'zh-CN');
  });

  return rows;
}

export function filterStudentRules(
  rules: ScoreRule[],
  options: {
    selectedClassId: number | null;
    subjectCodesByClass: Map<number, string[]>;
    subjectFilter: string;
    scoreTypeFilter: 'quick' | 'all' | 'add' | 'deduct';
    sceneFilter: string;
    ruleKeyword: string;
    roleCode?: string | null;
  },
) {
  const currentSubjectCodes = options.selectedClassId
    ? options.subjectCodesByClass.get(options.selectedClassId) ?? []
    : [];

  return rules.filter((item) => {
    if (item.scoreTarget !== 'student') return false;
    if (!item.adminEnabled) return false;
    if (options.scoreTypeFilter !== 'all' && options.scoreTypeFilter !== 'quick' && item.scoreType !== options.scoreTypeFilter) return false;
    if (options.scoreTypeFilter !== 'quick' && !matchesSceneFilter(options.sceneFilter, item)) return false;
    if (item.moduleType === 'subject' && !subjectFilterMatchesRule(options.subjectFilter, item.subjectCode)) {
      return false;
    }
    if (options.ruleKeyword.trim()) {
      const keyword = options.ruleKeyword.trim().toLowerCase();
      const haystack = [item.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
}

export function buildSortedQuickRules(highFrequencyRules: ScoreRule[], recentRuleIds: number[]) {
  const recentRuleOrder = new Map<number, number>();
  recentRuleIds.forEach((id, index) => recentRuleOrder.set(id, index));

  const quickRules = highFrequencyRules.slice().sort((left, right) => {
    const leftRecent = recentRuleOrder.get(left.id);
    const rightRecent = recentRuleOrder.get(right.id);
    if (leftRecent !== undefined || rightRecent !== undefined) {
      if (leftRecent === undefined) return 1;
      if (rightRecent === undefined) return -1;
      return leftRecent - rightRecent;
    }

    if (left.highFrequencyRank !== undefined && right.highFrequencyRank !== undefined) {
      if (left.highFrequencyRank !== right.highFrequencyRank) {
        return left.highFrequencyRank - right.highFrequencyRank;
      }
    } else if (left.highFrequencyRank !== undefined) {
      return -1;
    } else if (right.highFrequencyRank !== undefined) {
      return 1;
    }

    return Math.abs(right.scoreValue) - Math.abs(left.scoreValue) || left.name.localeCompare(right.name, 'zh-CN');
  });

  return {
    add: quickRules.filter((item) => item.scoreType === 'add'),
    deduct: quickRules.filter((item) => item.scoreType === 'deduct'),
  };
}
