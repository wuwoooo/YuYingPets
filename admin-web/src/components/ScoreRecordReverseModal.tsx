import { useState } from 'react';
import { Modal } from './Modal';
import type { ClassScoreRecord, ScoreRecord } from '../lib/api';
import { formatScoreDelta, formatScoreRecordExtraRemark, formatScoreRecordLabel, formatScoreRecordOperator, formatScoreRecordTime } from '../utils/scoreRecordReverse';

type ReversibleScoreRecord = ScoreRecord | ClassScoreRecord;

type ScoreRecordReverseModalProps = {
  record: ReversibleScoreRecord;
  studentName: string;
  currentScore: number | null;
  onClose: () => void;
  onConfirm: (remark: string) => Promise<void>;
  targetLabel?: string;
  currentScoreLabel?: string;
  subtitle?: string;
  remarkPlaceholder?: string;
  negativeWarning?: string;
};

export function ScoreRecordReverseModal({
  record,
  studentName,
  currentScore,
  onClose,
  onConfirm,
  targetLabel = '评价对象',
  currentScoreLabel = '当前可用积分',
  subtitle = '撤销后该条评价作废，学生积分将按原分值反向调整。',
  remarkPlaceholder = '例如：选错学生、误触规则',
  negativeWarning = '撤销后可用积分将为负数，请确认后再操作。',
}: ScoreRecordReverseModalProps) {
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectedScore = currentScore == null ? null : currentScore - record.scoreDelta;
  const projectedNegative = projectedScore != null && projectedScore < 0;

  async function handleSubmit() {
    const trimmed = remark.trim();
    if (trimmed.length < 2) {
      setError('请填写至少 2 个字的撤销原因');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '撤销失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="撤销评价"
      subtitle={subtitle}
      onClose={() => {
        if (loading) return;
        onClose();
      }}
    >
      <div className="score-record-reverse-modal">
        <div className="score-record-reverse-summary">
          <div className="score-record-reverse-card">
            <span className="score-record-reverse-card__label">{targetLabel}</span>
            <div className="score-record-reverse-card__main">
              <strong>{studentName}</strong>
              <span className={`score-record-reverse-delta ${record.scoreDelta >= 0 ? 'add' : 'deduct'}`}>
                {formatScoreDelta(record.scoreDelta)}
              </span>
            </div>
            <p>{formatScoreRecordLabel(record)}</p>
          </div>

          <div className="score-record-reverse-card">
            <span className="score-record-reverse-card__label">积分影响</span>
            {currentScore == null ? (
              <strong className="score-record-reverse-score-unknown">{currentScoreLabel}未知</strong>
            ) : (
              <div className="score-record-reverse-score-flow">
                <span className="score-record-reverse-score-value">{currentScore}</span>
                <span className="score-record-reverse-score-arrow">→</span>
                <span className={`score-record-reverse-score-value after${projectedNegative ? ' negative' : ''}`}>
                  {projectedScore}
                </span>
                <span className="score-record-reverse-score-unit">分</span>
              </div>
            )}
            {projectedNegative ? (
              <p className="score-record-reverse-warning">{negativeWarning}</p>
            ) : null}
          </div>
        </div>

        <label className="score-record-reverse-remark">
          <span>撤销原因</span>
          <textarea
            className="score-record-reverse-textarea"
            value={remark}
            placeholder={remarkPlaceholder}
            rows={3}
            onChange={(event) => setRemark(event.target.value)}
          />
        </label>

        {error ? <div className="status-card error">{error}</div> : null}

        <div className="score-record-reverse-actions form-actions">
          <button type="button" className="ghost-button" disabled={loading} onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="score-record-reverse-confirm-button"
            disabled={loading}
            onClick={() => void handleSubmit()}
          >
            {loading ? '撤销中...' : '确认撤销'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

type ScoreRecordListItemProps = {
  record: ScoreRecord;
  studentName: string;
  showStudentName?: boolean;
  canReverse: boolean;
  onReverse?: () => void;
};

export function ScoreRecordListItem({
  record,
  studentName,
  showStudentName = false,
  canReverse,
  onReverse,
}: ScoreRecordListItemProps) {
  const isReversed = Boolean(record.reversedAt);
  const label = formatScoreRecordLabel(record);
  const operatorLabel = formatScoreRecordOperator(record);
  const extraRemark = formatScoreRecordExtraRemark(record, label);
  const showReverse = !isReversed && canReverse && onReverse;

  return (
    <div className={`mini-list-item score-record-list-item${isReversed ? ' score-record-item--reversed' : ''}`}>
      <div className="score-record-list-item__main">
        <div className="score-record-list-item__row">
          {showStudentName ? <span className="score-record-list-item__student">{studentName}</span> : null}
          <span className={`score-record-list-item__delta ${record.scoreDelta >= 0 ? 'add' : 'deduct'}`}>
            {formatScoreDelta(record.scoreDelta)}
          </span>
          <span className="score-record-list-item__label" title={label}>
            {label}
          </span>
          <span className="score-record-list-item__time">{formatScoreRecordTime(record.createdAt)}</span>
          <span className="score-record-list-item__operator" title={operatorLabel}>
            {operatorLabel}
          </span>
          {showReverse ? (
            <button type="button" className="score-record-reverse-button" onClick={onReverse}>
              撤销
            </button>
          ) : null}
          {isReversed ? <span className="score-record-reversed-tag">已撤销</span> : null}
        </div>
        {extraRemark ? <div className="score-record-list-item__remark">{extraRemark}</div> : null}
        {isReversed ? (
          <div className="score-record-list-item__remark score-record-list-item__remark--reversed">
            {record.reverseRemark || '无撤销原因'} · {record.reversedByName || '教师'} ·{' '}
            {record.reversedAt ? formatScoreRecordTime(record.reversedAt) : ''}
          </div>
        ) : null}
      </div>
    </div>
  );
}
