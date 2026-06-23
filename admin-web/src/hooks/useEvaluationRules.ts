import { useMemo, useState } from 'react';
import { ruleSceneOptions } from '../constants/admin';
import type { ScoreRule } from '../lib/api';
import {
  buildSortedQuickRules,
  filterStudentRules,
  isStudentManagementRule,
} from '../components/evaluation/evaluationUtils';

type UseEvaluationRulesOptions = {
  rules: ScoreRule[];
  selectedClassId: number | null;
  subjectCodesByClass: Map<number, string[]>;
  subjectFilter: string;
  roleCode?: string | null;
  initialScoreTypeFilter?: 'quick' | 'all' | 'add' | 'deduct';
};

export function useEvaluationRules({
  rules,
  selectedClassId,
  subjectCodesByClass,
  subjectFilter,
  roleCode,
  initialScoreTypeFilter = 'quick',
}: UseEvaluationRulesOptions) {
  const [scoreTypeFilter, setScoreTypeFilter] = useState<'quick' | 'all' | 'add' | 'deduct'>(initialScoreTypeFilter);
  const [sceneFilter, setSceneFilter] = useState<string>('all');
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [recentRuleIds, setRecentRuleIds] = useState<number[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [showMoreRules, setShowMoreRules] = useState(true);
  const [showAllQuickAdd, setShowAllQuickAdd] = useState(false);
  const [showAllQuickDeduct, setShowAllQuickDeduct] = useState(false);

  const availableRules = useMemo(
    () =>
      filterStudentRules(rules, {
        selectedClassId,
        subjectCodesByClass,
        subjectFilter,
        scoreTypeFilter,
        sceneFilter,
        ruleKeyword,
        roleCode,
      }),
    [ruleKeyword, roleCode, rules, sceneFilter, scoreTypeFilter, selectedClassId, subjectCodesByClass, subjectFilter],
  );

  const highFrequencyRules = useMemo(
    () =>
      availableRules
        .filter((item) => item.isHighFrequency)
        .sort((a, b) => Number(b.adminEnabled) - Number(a.adminEnabled)),
    [availableRules],
  );

  const recentRules = useMemo(
    () =>
      recentRuleIds
        .map((id) => availableRules.find((item) => item.id === id))
        .filter((item): item is ScoreRule => Boolean(item))
        .slice(0, 6),
    [availableRules, recentRuleIds],
  );

  const sceneOptions = useMemo(() => {
    const enabledRules = rules.filter((item) => item.adminEnabled);
    const sceneSet = new Set(enabledRules.map((item) => item.sceneCode).filter(Boolean));
    const options = ruleSceneOptions.filter((item) => sceneSet.has(item.value));
    if (enabledRules.some(isStudentManagementRule) && !options.some((item) => item.value === 'moral')) {
      const moralOption = ruleSceneOptions.find((item) => item.value === 'moral');
      if (moralOption) options.push(moralOption);
    }
    return options;
  }, [rules]);

  const sortedQuickRules = useMemo(
    () => buildSortedQuickRules(highFrequencyRules, recentRuleIds),
    [highFrequencyRules, recentRuleIds],
  );

  const quickAddRules = useMemo(
    () => (showAllQuickAdd ? sortedQuickRules.add : sortedQuickRules.add.slice(0, 9)),
    [showAllQuickAdd, sortedQuickRules.add],
  );

  const quickDeductRules = useMemo(
    () => (showAllQuickDeduct ? sortedQuickRules.deduct : sortedQuickRules.deduct.slice(0, 9)),
    [showAllQuickDeduct, sortedQuickRules.deduct],
  );

  const moreRules = useMemo(() => availableRules.slice(0, 200), [availableRules]);
  const selectedRule = availableRules.find((item) => item.id === selectedRuleId) ?? null;

  function handleRuleSelect(ruleId: number) {
    setSelectedRuleId(ruleId);
    setRecentRuleIds((prev) => [ruleId, ...prev.filter((item) => item !== ruleId)].slice(0, 8));
  }

  return {
    scoreTypeFilter,
    setScoreTypeFilter,
    sceneFilter,
    setSceneFilter,
    ruleKeyword,
    setRuleKeyword,
    recentRuleIds,
    selectedRuleId,
    setSelectedRuleId,
    showMoreRules,
    setShowMoreRules,
    showAllQuickAdd,
    setShowAllQuickAdd,
    showAllQuickDeduct,
    setShowAllQuickDeduct,
    availableRules,
    highFrequencyRules,
    recentRules,
    sceneOptions,
    sortedQuickRules,
    quickAddRules,
    quickDeductRules,
    moreRules,
    selectedRule,
    handleRuleSelect,
  };
}