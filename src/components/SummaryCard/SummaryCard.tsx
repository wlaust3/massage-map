import { INTENSITIES } from '../../data/options';
import type { View } from '../../data/muscles';
import type { Params } from '../../i18n';
import { summaryRows, countSelected, type Selection, type SummaryRow } from '../../state/selection';
import { LevelBars } from '../common/Segmented';

type T = (key: string, params?: Params) => string;

interface Props {
  selection: Selection;
  t: T;
  /** bigger type for the full-screen hand-over view */
  large?: boolean;
  /** show the title and hint line */
  showHeading?: boolean;
}

function rowName(t: T, r: SummaryRow): string {
  const name = t(r.nameKey);
  return r.sides === 'both' ? `${name} · ${t('side.both')}` : t('muscle.withSide', { name, side: t(`side.${r.sides}`) });
}

/**
 * The masseuse's view: large, high-contrast, grouped by front / back. Pure presentational component (no hooks), and
 * user notes are rendered as React text children, so any markup in a note is shown literally and never executed.
 */
export function SummaryCard({ selection, t, large = false, showHeading = true }: Props) {
  const rows = summaryRows(selection);
  const empty = countSelected(selection) === 0;
  const groups: View[] = ['front', 'back'];
  return (
    <section className={`summary-card${large ? ' is-large' : ''}`} aria-label={t('summary.title')}>
      {showHeading && (
        <header className="summary-head">
          <h2>{t('summary.title')}</h2>
          <p>{t('summary.hint')}</p>
        </header>
      )}
      {empty && <p className="summary-empty">{t('summary.empty')}</p>}
      {groups.map((view) =>
        rows[view].length === 0 ? null : (
          <div key={view} className="summary-group">
            <h3>{t(`summary.${view}`)}</h3>
            <ul>
              {rows[view].map((r) => {
                const level = INTENSITIES.indexOf(r.entry.intensity) + 1;
                return (
                  <li key={r.key} className="summary-row">
                    <div className="summary-name">{rowName(t, r)}</div>
                    <div className="summary-meta">
                      <span className="chip chip-strong">
                        <LevelBars level={level} />
                        <span className="chip-label">{t('intensity.label')}{t('common.colon')}</span>
                        <b>{t(`intensity.${r.entry.intensity}`)}</b>
                      </span>
                      <span className="chip">
                        <span aria-hidden="true">⏱</span> <b>{t(`duration.${r.entry.duration}`)}</b>
                      </span>
                    </div>
                    {r.entry.note && (
                      <div className="summary-note">
                        <span className="note-icon" role="img" aria-label={t('summary.noteIcon')}>
                          ⚠
                        </span>
                        <span>
                          <b>{t('summary.note')}{t('common.colon')}</b>
                          <span className="note-text">{r.entry.note}</span>
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ),
      )}
    </section>
  );
}
