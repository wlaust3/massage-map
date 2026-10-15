import { useCallback, useEffect, useMemo, useState } from 'react';
import { BodyMap } from './components/BodyMap/BodyMap';
import { FavoritesDialog } from './components/Favorites/FavoritesDialog';
import { LanguageToggle } from './components/LanguageToggle/LanguageToggle';
import { SettingsSheet } from './components/SettingsSheet/SettingsSheet';
import { ShareSheet } from './components/ShareSheet/ShareSheet';
import { SharedError, SharedView } from './components/SharedView/SharedView';
import { FullscreenSummary } from './components/SummaryCard/FullscreenSummary';
import { SummaryCard } from './components/SummaryCard/SummaryCard';
import { Segmented } from './components/common/Segmented';
import { muscleLabel } from './components/common/labels';
import { MUSCLE_BY_ID, regionsInView, type View } from './data/muscles';
import { REGION_IDS, regionNameKey } from './data/regions';
import { LanguageProvider, useI18n } from './i18n';
import { decodeHash, looksLikeShareHash } from './share/codec';
import { countSelected, isSelected, regionState } from './state/selection';
import { useFavorites, useSelection } from './state/useStores';

type Tab = 'map' | 'picks' | 'summary';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    mq.addEventListener('change', on);
    on();
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

function Planner() {
  const { t } = useI18n();
  const [selection, dispatch] = useSelection();
  const favs = useFavorites();
  const wide = useMediaQuery('(min-width: 760px)');
  const [tab, setTab] = useState<Tab>('map');
  const [view, setView] = useState<View>('front');
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState<null | 'fav' | 'share' | 'full'>(null);
  const count = countSelected(selection);
  const selectedSet = useMemo(() => new Set(Object.keys(selection)), [selection]);

  // On wide screens the map and settings share one screen.
  const activeTab: Tab = wide && tab === 'picks' ? 'map' : tab;
  const tabs: Tab[] = wide ? ['map', 'summary'] : ['map', 'picks', 'summary'];

  const flip = useCallback(() => setView((v) => (v === 'front' ? 'back' : 'front')), []);

  const onTap = (id: string | null) => {
    if (!id || !MUSCLE_BY_ID.has(id)) return setMessage(t('map.nothingHere'));
    const name = muscleLabel(t, id);
    setMessage(t(isSelected(selection, id) ? 'map.removed' : 'map.selected', { name }));
    dispatch({ type: 'toggle', id });
  };

  const regions = regionsInView(view, REGION_IDS);
  const stateLabel = (s: 'none' | 'partial' | 'all') => t(`region.state.${s}`);

  const mapPanel = (
    <section className="panel map-panel" aria-label={t('tab.map')}>
      <Segmented
        label={t('view.toggleLabel')}
        className="view-toggle"
        value={view}
        onChange={setView}
        options={[
          { value: 'front', label: t('view.front') },
          { value: 'back', label: t('view.back') },
        ]}
      />
      <p className="muted small map-help">{t('map.instructions')}</p>
      <BodyMap view={view} selected={selectedSet} onTap={onTap} onSwipe={flip} />
      <p className="map-message" role="status" aria-live="polite">
        {message}
      </p>
      <h2 className="regions-title">{t('regions.title')}</h2>
      <p className="muted small">{t('regions.hint')}</p>
      <div className="chips" role="group" aria-label={t('regions.title')}>
        {regions.map((r) => {
          const s = regionState(selection, r, view);
          const name = t(regionNameKey(r));
          return (
            <button
              key={r}
              type="button"
              className={`chip-btn state-${s}`}
              aria-pressed={s === 'all' ? true : s === 'partial' ? 'mixed' : false}
              onClick={() => {
                dispatch({ type: 'toggleRegion', region: r, view });
                setMessage('');
              }}
            >
              <span className="chip-mark" aria-hidden="true">
                {s === 'all' ? '✓' : s === 'partial' ? '–' : '+'}
              </span>
              {name}
              <span className="sr-only">, {stateLabel(s)}</span>
            </button>
          );
        })}
      </div>
      {count > 0 && !wide && (
        <div className="next-bar">
          <span>{t('picks.selectedBar', { count })}</span>
          <button type="button" className="btn btn-primary" onClick={() => setTab('picks')}>
            {t('picks.edit')} →
          </button>
        </div>
      )}
    </section>
  );

  const picksPanel = <SettingsSheet selection={selection} dispatch={dispatch} onGoMap={() => setTab('map')} />;

  const summaryPanel = (
    <>
      <div className="btn-row summary-actions">
        <button type="button" className="btn btn-primary" onClick={() => setDialog('full')} disabled={count === 0}>
          {t('summary.fullscreen')}
        </button>
        <button type="button" className="btn" onClick={() => setDialog('share')} disabled={count === 0}>
          {t('share.open')}
        </button>
        <button type="button" className="btn" onClick={() => setDialog('fav')}>
          ★ {t('fav.open')}
        </button>
      </div>
      <SummaryCard selection={selection} t={t} />
    </>
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>{t('app.title')}</h1>
        <div className="header-actions">
          <button type="button" className="btn" onClick={() => setDialog('fav')}>
            <span aria-hidden="true">★</span> {t('fav.open')}
          </button>
          <LanguageToggle />
        </div>
      </header>
      <main className={`content${wide && activeTab === 'map' ? ' two-col' : ''}`}>
        {activeTab === 'map' && mapPanel}
        {activeTab === 'map' && wide && picksPanel}
        {activeTab === 'picks' && picksPanel}
        {activeTab === 'summary' && summaryPanel}
      </main>
      <nav className="tabbar" aria-label={t('tab.nav')}>
        {tabs.map((id) => (
          <button
            key={id}
            type="button"
            className="tab"
            aria-current={activeTab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
          >
            {t(`tab.${id}`)}
            {id === 'picks' && count > 0 && <span className="badge-count">{count}</span>}
          </button>
        ))}
      </nav>
      {dialog === 'fav' && (
        <FavoritesDialog
          favorites={favs.list}
          commit={favs.commit}
          selection={selection}
          onClose={() => setDialog(null)}
          onLoad={(sel, name) => {
            dispatch({ type: 'replace', selection: sel });
            setMessage(t('fav.loaded', { name }));
            setDialog(null);
          }}
        />
      )}
      {dialog === 'share' && <ShareSheet selection={selection} onClose={() => setDialog(null)} />}
      {dialog === 'full' && <FullscreenSummary selection={selection} onClose={() => setDialog(null)} />}
    </div>
  );
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const shared = useMemo(() => (looksLikeShareHash(hash) ? decodeHash(hash) : null), [hash]);
  if (shared) {
    if (!shared.ok) return <SharedError />;
    return (
      <LanguageProvider key={hash} initial={shared.lang} persist={false}>
        <SharedView plan={shared} />
      </LanguageProvider>
    );
  }
  return (
    <LanguageProvider>
      <Planner />
    </LanguageProvider>
  );
}
