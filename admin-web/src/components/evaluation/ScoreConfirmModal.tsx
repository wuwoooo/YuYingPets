import { PresentationGlyph } from '../PresentationGlyph';
import { resolveSubjectLabel } from '../../constants/admin';
import type { ScoreRule } from '../../lib/api';

const sceneLabelMap: Record<string, string> = {
  classroom: '课堂表现',
  homework: '作业完成',
  discipline: '纪律习惯',
  cleaning: '值日卫生',
  reading: '阅读成长',
  sports: '体育活动',
  exam: '考试测评',
  activity: '活动',
};

type ScoreConfirmModalProps = {
  rule: ScoreRule;
  targetTitle: string;
  targetSubtitle: string;
  confirmRemark: string;
  onRemarkChange: (value: string) => void;
  submitLoading: boolean;
  variant?: 'student' | 'class';
  onClose: () => void;
  onConfirm: () => void;
};

export function ScoreConfirmModal({
  rule,
  targetTitle,
  targetSubtitle,
  confirmRemark,
  onRemarkChange,
  submitLoading,
  variant = 'student',
  onClose,
  onConfirm,
}: ScoreConfirmModalProps) {
  const isDeduct = rule.scoreType === 'deduct';
  const scoreLabel = `${isDeduct ? '-' : '+'}${rule.scoreValue}`;

  return (
    <div className="modal-backdrop score-confirm-backdrop" onClick={onClose}>
      <div
        className={`score-confirm-modal ${isDeduct ? 'deduct' : 'add'}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="score-confirm-title"
      >
        <div className="score-confirm-hero">
          <button className="score-confirm-close" type="button" onClick={onClose} aria-label="关闭弹窗">
            <PresentationGlyph name="close" className="modal-close-icon" />
          </button>
          <div className="score-confirm-hero-main">
            <span className="score-confirm-kicker">{variant === 'class' ? '班级评价确认' : '学生评价确认'}</span>
            <h3 id="score-confirm-title">{isDeduct ? '确认扣分' : '确认加分'}</h3>
            <p>提交后将立即写入评价记录</p>
          </div>
          <div className={`score-confirm-score-badge ${isDeduct ? 'deduct' : 'add'}`}>
            <span>分值</span>
            <strong>{scoreLabel}</strong>
          </div>
        </div>

        <div className="score-confirm-body">
          <div className="score-confirm-cards">
            <section className="score-confirm-card">
              <span className="score-confirm-card-label">评价对象</span>
              <strong>{targetTitle}</strong>
              <p>{targetSubtitle}</p>
            </section>
            <section className={`score-confirm-card rule ${isDeduct ? 'deduct' : 'add'}`}>
              <span className="score-confirm-card-label">所选规则</span>
              <strong>{rule.name}</strong>
              <p>
                {sceneLabelMap[rule.sceneCode] ?? '通用场景'}
                {rule.subjectCode ? ` · ${resolveSubjectLabel(rule.subjectCode)}` : ' · 通用规则'}
              </p>
            </section>
          </div>

          <label className="score-confirm-remark">
            <span>备注（选填）</span>
            <textarea
              rows={3}
              value={confirmRemark}
              onChange={(event) => onRemarkChange(event.target.value)}
              placeholder="可填写课堂背景、补充说明或表扬内容"
            />
          </label>

          <div className="score-confirm-actions">
            <button type="button" className="ghost-button" onClick={onClose} disabled={submitLoading}>
              取消
            </button>
            <button
              type="button"
              className={`toolbar-button score-confirm-submit ${isDeduct ? 'deduct' : 'add'}`}
              onClick={onConfirm}
              disabled={submitLoading}
            >
              {submitLoading ? '提交中...' : isDeduct ? '确认扣分' : '确认加分'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
