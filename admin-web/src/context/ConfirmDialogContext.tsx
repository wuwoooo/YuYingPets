import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { PresentationGlyph } from '../components/PresentationGlyph';

type ConfirmTone = 'default' | 'warning' | 'danger';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type AlertOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  tone?: ConfirmTone;
};

type DialogRequest =
  | {
      mode: 'confirm';
      title: string;
      message: string;
      confirmLabel: string;
      cancelLabel: string;
      tone: ConfirmTone;
      resolve: (value: boolean) => void;
    }
  | {
      mode: 'alert';
      title: string;
      message: string;
      confirmLabel: string;
      tone: ConfirmTone;
      resolve: () => void;
    };

type ConfirmDialogContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

function splitMessage(message: string) {
  return message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function ConfirmDialogView({
  dialog,
  onClose,
}: {
  dialog: DialogRequest;
  onClose: (confirmed: boolean) => void;
}) {
  const lines = splitMessage(dialog.message);
  const iconName = dialog.tone === 'default' ? 'check' : 'warning';

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="confirm-dialog-backdrop" onClick={() => onClose(false)}>
      <div
        className={`confirm-dialog-card confirm-dialog-card--${dialog.tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`confirm-dialog-icon confirm-dialog-icon--${dialog.tone}`}>
          <PresentationGlyph name={iconName} />
        </div>
        <div className="confirm-dialog-body">
          <h3 id="confirm-dialog-title" className="confirm-dialog-title">
            {dialog.title}
          </h3>
          <div className="confirm-dialog-message">
            {lines.map((line, index) => (
              <p key={`${index}-${line}`}>{line}</p>
            ))}
          </div>
        </div>
        <div className="confirm-dialog-actions">
          {dialog.mode === 'confirm' ? (
            <button type="button" className="btn btn-ghost" onClick={() => onClose(false)}>
              {dialog.cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={`btn ${dialog.tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            autoFocus
            onClick={() => onClose(true)}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const dialogRef = useRef<DialogRequest | null>(null);

  const closeDialog = useCallback((confirmed: boolean) => {
    const current = dialogRef.current;
    if (!current) return;
    dialogRef.current = null;
    setDialog(null);
    if (current.mode === 'confirm') {
      current.resolve(confirmed);
      return;
    }
    if (confirmed) {
      current.resolve();
    }
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const nextDialog: DialogRequest = {
        mode: 'confirm',
        title: options.title ?? '请确认',
        message: options.message,
        confirmLabel: options.confirmLabel ?? '确认',
        cancelLabel: options.cancelLabel ?? '取消',
        tone: options.tone ?? 'default',
        resolve,
      };
      dialogRef.current = nextDialog;
      setDialog(nextDialog);
    });
  }, []);

  const alert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      const nextDialog: DialogRequest = {
        mode: 'alert',
        title: options.title ?? '提示',
        message: options.message,
        confirmLabel: options.confirmLabel ?? '知道了',
        tone: options.tone ?? 'default',
        resolve,
      };
      dialogRef.current = nextDialog;
      setDialog(nextDialog);
    });
  }, []);

  const value = useMemo(() => ({ confirm, alert }), [alert, confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      {dialog ? <ConfirmDialogView dialog={dialog} onClose={closeDialog} /> : null}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog 必须在 ConfirmDialogProvider 内使用');
  }
  return context;
}
