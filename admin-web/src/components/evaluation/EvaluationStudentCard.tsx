import type { KeyboardEvent } from 'react';
import type { AdminStudent } from '../../lib/api';
import type { EvaluationMode } from './evaluationUtils';

type EvaluationStudentCardProps = {
  student: AdminStudent;
  mode: EvaluationMode;
  selected: boolean;
  selectionEditing?: boolean;
  groupNo?: number;
  onClick: () => void;
  onToggleSelect?: () => void;
};

export function EvaluationStudentCard({
  student,
  mode,
  selected,
  selectionEditing = false,
  groupNo,
  onClick,
  onToggleSelect,
}: EvaluationStudentCardProps) {
  const isBatch = mode === 'batch';
  const isGroup = mode === 'group';

  function handleClick() {
    if (isBatch) {
      if (selectionEditing) onToggleSelect?.();
      return;
    }
    if (isGroup) return;
    onClick();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleClick();
  }

  return (
    <div
      role={isGroup ? undefined : 'button'}
      tabIndex={isGroup ? -1 : 0}
      className={`evaluation-student-card-compact${selected ? ' active' : ''}${isGroup ? ' readonly' : ''}${isBatch && selectionEditing ? ' selecting' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {isBatch && selectionEditing ? (
        <input
          type="checkbox"
          className="evaluation-student-card-compact-check"
          checked={selected}
          onChange={() => onToggleSelect?.()}
          onClick={(event) => event.stopPropagation()}
        />
      ) : null}
      {groupNo != null ? <span className="evaluation-student-card-compact-group">{groupNo}组</span> : null}
      <span className="evaluation-student-card-compact-name" title={student.name}>
        {student.name}
      </span>
      <span className="evaluation-student-card-compact-score">{student.currentScore}分</span>
    </div>
  );
}
