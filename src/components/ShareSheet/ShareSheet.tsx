import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { buildShareUrl } from '../../share/codec';
import { makeQr, type QrResult } from '../../share/qr';
import { countSelected, type Selection } from '../../state/selection';
import { Dialog } from '../common/Dialog';

export function ShareSheet({ selection, onClose }: { selection: Selection; onClose: () => void }) {
  const { t, lang } = useI18n();
  const empty = countSelected(selection) === 0;
  const url = useMemo(() => (empty ? '' : buildShareUrl(selection, lang, window.location.href)), [selection, lang, empty]);
  const [qr, setQr] = useState<QrResult | null>(null);
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    let cancelled = false;
    setQr(null);
    if (url) {
      makeQr(url).then((r) => {
        if (!cancelled) setQr(r);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied('ok');
    } catch {
      // fallback for browsers without the async clipboard API
      input.current?.focus();
      input.current?.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      setCopied(ok ? 'ok' : 'fail');
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: t('app.title'), url });
    } catch {
      /* user cancelled the share sheet */
    }
  };

  return (
    <Dialog title={t('share.title')} titleId="share-title" onClose={onClose}>
      {empty ? (
        <p className="muted">{t('share.empty')}</p>
      ) : (
        <>
          <p>{t('share.intro')}</p>
          <p className="muted small">{t('share.langNote', { language: t(`lang.name.${lang}`) })}</p>
          <div className="qr-box">
            {!qr && <p className="muted" role="status">{t('share.generating')}</p>}
            {qr?.ok && (
              <svg
                className="qr"
                viewBox={`-4 -4 ${qr.size + 8} ${qr.size + 8}`}
                role="img"
                aria-label={t('share.qrLabel')}
                shapeRendering="crispEdges"
              >
                <rect x="-4" y="-4" width={qr.size + 8} height={qr.size + 8} fill="#fff" />
                <path d={qr.path} fill="#000" />
              </svg>
            )}
            {qr && !qr.ok && (
              <p className="msg msg-error" role="alert">
                {t('share.tooLarge')}
              </p>
            )}
          </div>
          {qr?.ok && !qr.dense && <p className="muted small">{t('share.qrHint')}</p>}
          {qr?.ok && qr.dense && (
            <p className="msg msg-warn" role="alert">
              <span aria-hidden="true">⚠ </span>
              {t('share.warnLarge')}
            </p>
          )}
          <label className="field">
            <span className="seg-label">{t('share.link')}</span>
            <input ref={input} type="text" readOnly value={url} onFocus={(e) => e.currentTarget.select()} dir="ltr" />
          </label>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={copy} data-autofocus>
              {t('share.copy')}
            </button>
            {canShare && (
              <button type="button" className="btn" onClick={nativeShare}>
                {t('share.native')}
              </button>
            )}
          </div>
          <p className="msg" role="status">
            {copied === 'ok' ? t('share.copied') : copied === 'fail' ? t('share.copyFailed') : ''}
          </p>
          <p className="muted small">{t('share.privacy')}</p>
        </>
      )}
    </Dialog>
  );
}
