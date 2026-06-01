import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { PresentationGlyph } from '../PresentationGlyph';
import type { AdminStudent, ClassGroupSummary, Honor, HonorRecord, ScoreRecord } from '../../lib/api';
import { EvaluationRulesPanel } from './EvaluationRulesPanel';
import { HonorGrantPanel } from './HonorGrantPanel';
import type { ScoreModalTab, ScoreTarget } from './evaluationUtils';

type StudentScoreModalProps = {
  open: boolean;
  target: ScoreTarget | null;
  initialTab?: ScoreModalTab;
  students: AdminStudent[];
  groups: ClassGroupSummary[];
  classId: number;
  className: string;
  token: string;
  honors: Honor[];
  allowGrantHonors: boolean;
  isSubjectTeacher: boolean;
  honorRecords: HonorRecord[];
  honorsLoading: boolean;
  recentScoreRecords: ScoreRecord[];
  rulesPanelProps: Omit<
    ComponentProps<typeof EvaluationRulesPanel>,
    'recentScoreRecords' | 'studentNameById' | 'isSubjectTeacher'
  >;
  onClose: () => void;
  onHonorGranted?: () => void | Promise<void>;
};

type ModalHero = {
  kicker: string;
  title: string;
  subtitle: string;
  score?: number;
  initials?: string;
  chips?: string[];
};

function buildModalHero(
  target: ScoreTarget,
  students: AdminStudent[],
  groups: ClassGroupSummary[],
): ModalHero {
  if (target.type === 'single') {
    const student = students.find((item) => item.id === target.studentId);
    return {
      kicker: '单人评价',
      title: student?.name ?? '学生评价',
      subtitle: '选择规则后立即确认提交',
      score: student?.currentScore,
      initials: student?.name?.slice(0, 1) ?? '学',
    };
  }
  if (target.type === 'batch') {
    const selected = students.filter((item) => target.studentIds.includes(item.id));
    return {
      kicker: '批量评价',
      title: `已选 ${target.studentIds.length} 名学生`,
      subtitle: '将统一应用同一条积分规则',
      chips: selected.slice(0, 6).map((item) => item.name),
    };
  }
  const group = groups.find((item) => item.id === target.groupId);
  return {
    kicker: '小组评价',
    title: group ? `第 ${group.groupNo} 组 · ${group.name}` : '小组评价',
    subtitle: group ? `${group.studentCount} 人 · 组内合计 ${group.currentScoreTotal} 分` : '请选择评价规则',
    score: group?.currentScoreTotal,
    initials: group ? String(group.groupNo) : '组',
  };
}

export function StudentScoreModal({
  open,
  target,
  initialTab = 'score',
  students,
  groups,
  classId,
  className,
  token,
  honors,
  allowGrantHonors,
  isSubjectTeacher,
  honorRecords,
  honorsLoading,
  recentScoreRecords,
  rulesPanelProps,
  onClose,
  onHonorGranted,
}: StudentScoreModalProps) {
  const [activeTab, setActiveTab] = useState<ScoreModalTab>(initialTab);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [initialTab, open, target]);

  const hero = useMemo(() => {
    if (!target) {
      return { kicker: '学生评价', title: '学生评价', subtitle: '' };
    }
    return buildModalHero(target, students, groups);
  }, [groups, students, target]);

  const showHonorTab = allowGrantHonors && target?.type === 'single';
  const honorTarget =
    target?.type === 'single'
      ? {
          targetType: 'student' as const,
          classId,
          className,
          studentId: target.studentId,
          studentName: students.find((item) => item.id === target.studentId)?.name ?? '',
        }
      : null;

  if (!open || !target) return null;

  return (
    <div className="modal-backdrop student-score-modal-backdrop" onClick={onClose}>
      <div className="student-score-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="student-score-modal-hero">
          <div className="student-score-modal-hero-top">
            <button className="student-score-modal-close" type="button" onClick={onClose} aria-label="关闭弹窗">
              <PresentationGlyph name="close" className="modal-close-icon" />
            </button>
          </div>
          <div className="student-score-modal-hero-body">
            <div className="student-score-modal-hero-main">
              {hero.initials ? (
                <div className="student-score-modal-avatar" aria-hidden="true">
                  {hero.initials}
                </div>
              ) : null}
              <div className="student-score-modal-hero-copy">
                <span className="student-score-modal-kicker">{hero.kicker}</span>
                <h3>{hero.title}</h3>
                {hero.subtitle ? <p>{hero.subtitle}</p> : null}
                {hero.chips && hero.chips.length > 0 ? (
                  <div className="student-score-modal-chips">
                    {hero.chips.map((name) => (
                      <span key={name} className="student-score-modal-chip">
                        {name}
                      </span>
                    ))}
                    {target.type === 'batch' && target.studentIds.length > hero.chips.length ? (
                      <span className="student-score-modal-chip muted">
                        +{target.studentIds.length - hero.chips.length}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            {hero.score != null ? (
              <div className="student-score-modal-score-card">
                <span>当前积分</span>
                <strong>{hero.score}</strong>
              </div>
            ) : null}
          </div>
        </div>

        <div className="student-score-modal-tabs" role="tablist" aria-label="评价方式">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'score'}
            className={`student-score-modal-tab${activeTab === 'score' ? ' active' : ''}`}
            onClick={() => setActiveTab('score')}
          >
            积分加减
          </button>
          {showHonorTab ? (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'honor'}
              className={`student-score-modal-tab${activeTab === 'honor' ? ' active' : ''}`}
              onClick={() => setActiveTab('honor')}
            >
              颁发勋章
            </button>
          ) : null}
        </div>

        <div className="student-score-modal-body">
          {activeTab === 'score' ? (
            <EvaluationRulesPanel
              {...rulesPanelProps}
              isSubjectTeacher={isSubjectTeacher}
              recentScoreRecords={recentScoreRecords}
              studentNameById={(studentId) => students.find((item) => item.id === studentId)?.name ?? ''}
            />
          ) : null}

          {activeTab === 'honor' && showHonorTab && honorTarget ? (
            <HonorGrantPanel
              token={token}
              target={honorTarget}
              honors={honors}
              honorRecords={honorRecords}
              honorsLoading={honorsLoading}
              embedded
              onCancel={onClose}
              onGranted={onHonorGranted}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
