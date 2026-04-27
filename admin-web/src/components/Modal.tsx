import type { ModalProps } from '../types/admin';
import { PresentationGlyph } from './PresentationGlyph';

export function Modal({ title, subtitle, onClose, children }: ModalProps) {
  const normalizedSubtitle = subtitle
    .replace(/提交后调用真实\s*`?\/[^`\s]+`?\s*接口/g, '请完善信息后提交')
    .replace(/提交后会直接调用真实\s*`?\/[^`\s]+`?\s*写接口/g, '请完善信息后保存')
    .replace(/一行一名学生，提交后会调用真实\s*`?\/[^`\s]+`?\s*接口/g, '支持批量导入学生档案')
    .replace(/admin-web 写接口联调/g, '')
    .trim();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-copy">
            <h3>{title}</h3>
            {normalizedSubtitle ? <p>{normalizedSubtitle}</p> : null}
          </div>
          <button className="modal-close-button" type="button" onClick={onClose} aria-label="关闭弹窗">
            <PresentationGlyph name="close" className="modal-close-icon" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
