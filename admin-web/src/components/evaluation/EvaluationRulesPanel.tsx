import { resolveSubjectLabel } from '../../constants/admin';
import type { ScoreRecord, ScoreRule } from '../../lib/api';
import { formatScoreDelta, formatScoreRecordLabel } from '../../utils/scoreRecordReverse';
import { ScoreRuleButton } from './ScoreRuleButton';

type EvaluationRulesPanelProps = {
  isSubjectTeacher: boolean;
  selectedRuleId: number | null;
  showMoreRules: boolean;
  setShowMoreRules: (value: boolean | ((prev: boolean) => boolean)) => void;
  sortedQuickRules: { add: ScoreRule[]; deduct: ScoreRule[] };
  quickAddRules: ScoreRule[];
  quickDeductRules: ScoreRule[];
  showAllQuickAdd: boolean;
  setShowAllQuickAdd: (value: boolean | ((prev: boolean) => boolean)) => void;
  showAllQuickDeduct: boolean;
  setShowAllQuickDeduct: (value: boolean | ((prev: boolean) => boolean)) => void;
  scoreTypeFilter: 'all' | 'add' | 'deduct';
  setScoreTypeFilter: (value: 'all' | 'add' | 'deduct') => void;
  sceneFilter: string;
  setSceneFilter: (value: string) => void;
  ruleKeyword: string;
  setRuleKeyword: (value: string) => void;
  sceneOptions: Array<{ value: string; label: string }>;
  recentRules: ScoreRule[];
  moreRules: ScoreRule[];
  selectedRule: ScoreRule | null;
  onRuleClick: (rule: ScoreRule) => void;
  recentScoreRecords?: ScoreRecord[];
  studentNameById?: (studentId: number) => string;
};

function formatRecordTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function EvaluationRulesPanel({
  isSubjectTeacher,
  selectedRuleId,
  showMoreRules,
  setShowMoreRules,
  sortedQuickRules,
  quickAddRules,
  quickDeductRules,
  showAllQuickAdd,
  setShowAllQuickAdd,
  showAllQuickDeduct,
  setShowAllQuickDeduct,
  scoreTypeFilter,
  setScoreTypeFilter,
  sceneFilter,
  setSceneFilter,
  ruleKeyword,
  setRuleKeyword,
  sceneOptions,
  recentRules,
  moreRules,
  selectedRule,
  onRuleClick,
  recentScoreRecords = [],
  studentNameById,
}: EvaluationRulesPanelProps) {
  return (
    <div className="ssm-rules-panel">
        <div className="ssm-more-panel">
          <div className="ssm-filter-bar">
            <div className="ssm-filter-chips">
              <button
                type="button"
                className={`ssm-filter-chip${scoreTypeFilter === 'add' ? ' active' : ''}`}
                onClick={() => setScoreTypeFilter('add')}
              >
                加分
              </button>
              <button
                type="button"
                className={`ssm-filter-chip${scoreTypeFilter === 'deduct' ? ' active' : ''}`}
                onClick={() => setScoreTypeFilter('deduct')}
              >
                扣分
              </button>
              <button
                type="button"
                className={`ssm-filter-chip${scoreTypeFilter === 'all' ? ' active' : ''}`}
                onClick={() => setScoreTypeFilter('all')}
              >
                全部
              </button>
            </div>
            <input
              className="ssm-rule-search"
              value={ruleKeyword}
              onChange={(event) => setRuleKeyword(event.target.value)}
              placeholder="搜索规则名称"
            />
          </div>

          <div className="ssm-filter-chips wrap">
            <button
              type="button"
              className={`ssm-filter-chip${sceneFilter === 'all' ? ' active' : ''}`}
              onClick={() => setSceneFilter('all')}
            >
              全部场景
            </button>
            {sceneOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`ssm-filter-chip${sceneFilter === item.value ? ' active' : ''}`}
                onClick={() => setSceneFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {recentRules.length > 0 ? (
            <div className="ssm-recent-rules">
              <span className="ssm-section-label">最近使用</span>
              <div className="ssm-filter-chips wrap">
                {recentRules.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`ssm-filter-chip${selectedRuleId === item.id ? ' active' : ''}`}
                    onClick={() => onRuleClick(item)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="ssm-rule-grid wide">
            {moreRules.map((item) => (
              <ScoreRuleButton
                key={item.id}
                rule={item}
                active={selectedRuleId === item.id}
                onClick={() => onRuleClick(item)}
                compact
              />
            ))}
            {moreRules.length === 0 ? <div className="ssm-empty">当前筛选条件下没有可用规则</div> : null}
          </div>
        </div>

      {selectedRule ? (
        <div className={`ssm-selected-preview ${selectedRule.scoreType === 'deduct' ? 'deduct' : 'add'}`}>
          <span className="ssm-selected-tag">已选规则</span>
          <div className="ssm-selected-main">
            <strong>{selectedRule.name}</strong>
            <em>
              {selectedRule.scoreType === 'deduct' ? '-' : '+'}
              {selectedRule.scoreValue} 分
            </em>
          </div>
          <p>{selectedRule.description || selectedRule.aiSummaryText || '点击上方规则并确认后即可提交。'}</p>
          {!isSubjectTeacher && selectedRule.subjectCode ? (
            <span className="ssm-selected-meta">学科 · {resolveSubjectLabel(selectedRule.subjectCode)}</span>
          ) : null}
        </div>
      ) : null}

      {recentScoreRecords.length > 0 ? (
        <div className="ssm-history">
          <div className="ssm-history-head">
            <strong>最近积分记录</strong>
            <span>最近 {Math.min(recentScoreRecords.length, 5)} 条</span>
          </div>
          <ul className="ssm-history-list">
            {recentScoreRecords.slice(0, 5).map((item) => (
              <li key={item.id} className={item.scoreDelta < 0 ? 'deduct' : 'add'}>
                <div className="ssm-history-main">
                  <strong>{formatScoreRecordLabel(item)}</strong>
                  <span>{formatRecordTime(item.createdAt)}</span>
                </div>
                <div className="ssm-history-side">
                  <em>{formatScoreDelta(item.scoreDelta)}</em>
                  {studentNameById && item.studentId ? (
                    <span>{studentNameById(item.studentId)}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
