import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n';

let openCount = 0;
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** covers the whole screen and requests browser full-screen where available */
  fullscreen?: boolean;
  /** extra class on the panel */
  className?: string;
  titleId: string;
  /** hide the visible heading (still used as the accessible name) */
  hideTitle?: boolean;
}

/** Accessible modal: focus moves in, Tab is trapped, Escape closes, focus returns to the opener. */
export function Dialog({ title, onClose, children, fullscreen, className = '', titleId, hideTitle }: Props) {
  const { t } = useI18n();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    openCount += 1;
    document.body.classList.add('modal-open');
    const el = panel.current;
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? el)?.focus();
    if (fullscreen && el && typeof el.requestFullscreen === 'function') {
      el.requestFullscreen().catch(() => undefined); // optional polish; the overlay already fills the screen
    }
    return () => {
      openCount -= 1;
      if (openCount <= 0) document.body.classList.remove('modal-open');
      if (document.fullscreenElement && fullscreen) document.exitFullscreen?.().catch(() => undefined);
      opener?.focus?.();
    };
  }, [fullscreen]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (e.key !== 'Tab' || !panel.current) return;
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className={`dialog-backdrop${fullscreen ? ' is-fullscreen' : ''}`}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget && !fullscreen) onCloseRef.current();
      }}
    >
      <div
        ref={panel}
        className={`dialog-panel ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="dialog-head">
          <h2 id={titleId} className={hideTitle ? 'sr-only' : undefined}>
            {title}
          </h2>
          <button type="button" className="btn dialog-close" onClick={onClose} aria-label={t('common.close')}>
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="dialog-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmProps {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  titleId: string;
}

export function ConfirmDialog({ title, body, confirmLabel, danger, onConfirm, onCancel, titleId }: ConfirmProps) {
  const { t } = useI18n();
  return (
    <Dialog title={title} titleId={titleId} onClose={onCancel} className="dialog-small">
      <p className="dialog-text">{body}</p>
      <div className="btn-row">
        <button type="button" className="btn" onClick={onCancel} data-autofocus>
          {t('common.cancel')}
        </button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
