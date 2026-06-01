import type { ScoreRule } from '../../lib/api';

type ScoreRuleButtonProps = {
  rule: ScoreRule;
  active?: boolean;
  onClick: () => void;
  compact?: boolean;
};

export function ScoreRuleButton({ rule, active = false, onClick, compact = false }: ScoreRuleButtonProps) {
  const isDeduct = rule.scoreType === 'deduct';
  const scoreLabel = `${isDeduct ? '-' : '+'}${rule.scoreValue}`;

  return (
    <button
      type="button"
      className={`ssm-rule-btn ${isDeduct ? 'deduct' : 'add'}${active ? ' active' : ''}${compact ? ' compact' : ''}`}
      onClick={onClick}
    >
      <span className="ssm-rule-btn-name">{rule.name}</span>
      <span className="ssm-rule-btn-score">{scoreLabel}</span>
    </button>
  );
}
