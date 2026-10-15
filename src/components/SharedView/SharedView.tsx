import { useState } from 'react';
import { useI18n, translate } from '../../i18n';
import type { SharedPlan } from '../../share/codec';
import { BodyMap } from '../BodyMap/BodyMap';
import { LanguageToggle } from '../LanguageToggle/LanguageToggle';
import { SummaryCard } from '../SummaryCard/SummaryCard';
import { FullscreenSummary } from '../SummaryCard/FullscreenSummary';

/** Leave the shared view and go to the editable app. */
export function leaveSharedView(): void {
  history.replaceState(null, '', window.location.pathname + window.location.search);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/** Read-only view opened from a share link: no editing controls, no way to change the selection. */
export function SharedView({ plan }: { plan: SharedPlan }) {
  const { t } = useI18n();
  const [full, setFull] = useState(false);
  const selected = new Set(Object.keys(plan.selection));
  return (
    <div className="app">
      <header className="app-header">
        <h1>{t('app.title')}</h1>
        <div className="header-actions">
          <LanguageToggle />
        </div>
      </header>
      <main className="content shared">
        <p className="badge" role="status">
          {t('shared.badge')}
        </p>
        <SummaryCard selection={plan.selection} t={t} />
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={() => setFull(true)}>
            {t('summary.fullscreen')}
          </button>
        </div>
        <section className="panel" aria-labelledby="shared-maps">
          <h2 id="shared-maps">{t('shared.mapsTitle')}</h2>
          <div className="shared-maps">
            {(['front', 'back'] as const).map((v) => (
              <figure key={v}>
                <BodyMap view={v} selected={selected} readOnly />
                <figcaption>{t(`view.${v}`)}</figcaption>
              </figure>
            ))}
          </div>
        </section>
        <div className="btn-row">
          <button type="button" className="btn" onClick={leaveSharedView}>
            {t('shared.makeOwn')}
          </button>
        </div>
      </main>
      {full && <FullscreenSummary selection={plan.selection} onClose={() => setFull(false)} />}
    </div>
  );
}

/** Friendly error for a broken link. The language of the sender is unknown, so both languages are shown. */
export function SharedError() {
  return (
    <div className="app">
      <main className="content error-view" role="alert">
        {(['en', 'zh'] as const).map((l) => (
          <section key={l} lang={l === 'zh' ? 'zh-Hans' : 'en'}>
            <h1>{translate(l, 'error.badLink.title')}</h1>
            <p>{translate(l, 'error.badLink.body')}</p>
          </section>
        ))}
        <button type="button" className="btn btn-primary" onClick={leaveSharedView}>
          {translate('en', 'error.openApp')} / {translate('zh', 'error.openApp')}
        </button>
      </main>
    </div>
  );
}
