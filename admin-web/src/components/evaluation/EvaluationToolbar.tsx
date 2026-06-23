import type { ClassGroupSummary, EvaluationMode, StudentSortKey } from './evaluationUtils';

const modeOptions: Array<{ value: EvaluationMode; label: string }> = [
  { value: 'single', label: '单人' },
  { value: 'batch', label: '批量' },
  { value: 'group', label: '小组' },
];

const sortOptions: Array<{ value: StudentSortKey; label: string }> = [
  { value: 'name-asc', label: '按姓名' },
  { value: 'score-desc', label: '按积分' },
];

type EvaluationToolbarProps = {
  keyword: string;
  onKeywordChange: (value: string) => void;
  sort: StudentSortKey;
  onSortChange: (value: StudentSortKey) => void;
  groupFilter: number | 'all';
  onGroupFilterChange: (value: number | 'all') => void;
  groups: ClassGroupSummary[];
  mode: EvaluationMode;
  onModeChange: (value: EvaluationMode) => void;
  selectedGroupId: number | null;
  onGroupIdChange: (value: number) => void;
  selectedCount: number;
  selectionEditing?: boolean;
  onSelectionEditingChange?: (value: boolean) => void;
  onOpenBatchScore: () => void;
  onOpenGroupScore: () => void;
  studentCount: number;
};

export function EvaluationToolbar({
  keyword,
  onKeywordChange,
  sort,
  onSortChange,
  groupFilter,
  onGroupFilterChange,
  groups,
  mode,
  onModeChange,
  selectedGroupId,
  onGroupIdChange,
  selectedCount,
  selectionEditing = false,
  onSelectionEditingChange,
  onOpenBatchScore,
  onOpenGroupScore,
  studentCount,
}: EvaluationToolbarProps) {
  return (
    <div className="evaluation-classroom-toolbar">
      <div className="evaluation-classroom-toolbar-row">
        <div className="search-box evaluation-classroom-search">
          <span className="s-icon">⌕</span>
          <input
            placeholder="搜索学生姓名"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
        </div>
        <div className="evaluation-classroom-segmented">
          {sortOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`evaluation-classroom-segment${sort === item.value ? ' active' : ''}`}
              onClick={() => onSortChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="evaluation-classroom-segmented">
          {modeOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`evaluation-classroom-segment${mode === item.value ? ' active' : ''}`}
              onClick={() => onModeChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="evaluation-classroom-count">共 {studentCount} 人</span>
      </div>
      <div className="evaluation-classroom-toolbar-row">
        <div className="security-chip-row evaluation-classroom-group-chips">
          <button
            type="button"
            className={`security-chip${groupFilter === 'all' ? ' active' : ''}`}
            onClick={() => onGroupFilterChange('all')}
          >
            全部小组
          </button>
          {groups.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`security-chip${groupFilter === item.groupNo ? ' active' : ''}`}
              onClick={() => onGroupFilterChange(item.groupNo)}
            >
              第{item.groupNo}组
            </button>
          ))}
        </div>
        {mode === 'group' ? (
          <div className="evaluation-classroom-group-actions">
            <select
              className="filter-select"
              value={selectedGroupId ?? ''}
              onChange={(event) => onGroupIdChange(Number(event.target.value))}
            >
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  第{item.groupNo}组 · {item.name} · {item.studentCount}人
                </option>
              ))}
            </select>
            <button type="button" className="toolbar-button" onClick={onOpenGroupScore} disabled={!selectedGroupId}>
              小组评分
            </button>
          </div>
        ) : null}
        {mode === 'batch' ? (
          <div className="evaluation-classroom-batch-actions">
            <button
              type="button"
              className={selectionEditing ? 'ghost-button' : 'toolbar-button'}
              onClick={() => onSelectionEditingChange?.(!selectionEditing)}
            >
              {selectionEditing ? '完成' : '编辑'}
            </button>
            <span>{selectionEditing ? `已选 ${selectedCount} 人` : '点击编辑后选择学生'}</span>
          </div>
        ) : null}
      </div>
      {mode === 'batch' && selectedCount > 0 ? (
        <div className="evaluation-batch-bar">
          <span>已选 {selectedCount} 人</span>
          <button type="button" className="toolbar-button" onClick={onOpenBatchScore}>
            批量评分
          </button>
        </div>
      ) : null}
    </div>
  );
}
