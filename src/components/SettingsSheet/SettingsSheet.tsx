import { useState, type Dispatch } from 'react';
import { DURATIONS, INTENSITIES, NOTE_MAX } from '../../data/options';
import { useI18n } from '../../i18n';
import { noteLength, selectedIds, type Action, type Selection } from '../../state/selection';
import { ConfirmDialog } from '../common/Dialog';
import { LevelBars, Segmented } from '../common/Segmented';
import { muscleLabel } from '../common/labels';

interface Props {
  selection: Selection;
  dispatch: Dispatch<Action>;
  onGoMap: () => void;
}

/** Per-selection intensity, duration and note, plus "set all" and "clear all". */
export function SettingsSheet({ selection, dispatch, onGoMap }: Props) {
  const { t } = useI18n();
  const ids = selectedIds(selection);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const intensityOptions = INTENSITIES.map((v, i) => ({ value: v, label: t(`intensity.${v}`), extra: <LevelBars level={i + 1} /> }));
  const durationOptions = DURATIONS.map((v) => ({ value: v, label: t(`duration.${v}`) }));

  if (ids.length === 0) {
    return (
      <section className="panel" aria-labelledby="picks-title">
        <h2 id="picks-title">{t('picks.title', { count: 0 })}</h2>
        <p className="muted">{t('picks.empty')}</p>
        <button type="button" className="btn btn-primary" onClick={onGoMap}>
          {t('picks.goMap')}
        </button>
      </section>
    );
  }

  return (
    <section className="panel" aria-labelledby="picks-title">
      <div className="panel-head">
        <h2 id="picks-title">{t('picks.title', { count: ids.length })}</h2>
        <button type="button" className="btn btn-danger-outline" onClick={() => setConfirmClear(true)}>
          {t('picks.clearAll')}
        </button>
      </div>

      <div className="set-all">
        <h3>{t('picks.setAll')}</h3>
        <p className="muted small">{t('picks.setAllHint')}</p>
        <Segmented
          label={t('intensity.label')}
          options={intensityOptions}
          value={null}
          onChange={(v) => dispatch({ type: 'applyAll', patch: { intensity: v } })}
        />
        <Segmented
          label={t('duration.label')}
          options={durationOptions}
          value={null}
          onChange={(v) => dispatch({ type: 'applyAll', patch: { duration: v } })}
        />
      </div>

      <ul className="pick-list">
        {ids.map((id) => {
          const e = selection[id];
          const open = openId === id;
          const name = muscleLabel(t, id);
          return (
            <li key={id} className={`pick${open ? ' is-open' : ''}`}>
              <button
                type="button"
                className="pick-head"
                aria-expanded={open}
                aria-controls={`pick-body-${id}`}
                onClick={() => setOpenId(open ? null : id)}
              >
                <span className="pick-name">{name}</span>
                <span className="pick-summary">
                  {t(`intensity.${e.intensity}`)} · {t(`duration.${e.duration}`)}
                  {e.note && (
                    <span className="note-icon" role="img" aria-label={t('picks.hasNote')}>
                      {' '}
                      ⚠
                    </span>
                  )}
                </span>
                <span className="chev" aria-hidden="true">
                  {open ? '▲' : '▼'}
                </span>
              </button>
              {open && (
                <div id={`pick-body-${id}`} className="pick-body">
                  <Segmented
                              label={t('intensity.label')}
                    options={intensityOptions}
                    value={e.intensity}
                    onChange={(v) => dispatch({ type: 'update', id, patch: { intensity: v } })}
                  />
                  <Segmented
                    label={t('duration.label')}
                    options={durationOptions}
                    value={e.duration}
                    onChange={(v) => dispatch({ type: 'update', id, patch: { duration: v } })}
                  />
                  <label className="field">
                    <span className="seg-label">{t('note.label')}</span>
                    <textarea
                      value={e.note}
                      rows={3}
                      maxLength={NOTE_MAX /* the reducer also clamps, e.g. for pasted text */}
                      placeholder={t('note.placeholder')}
                      onChange={(ev) => dispatch({ type: 'update', id, patch: { note: ev.target.value } })}
                      aria-describedby={`note-count-${id}`}
                    />
                  </label>
                  <div id={`note-count-${id}`} className="note-count" aria-live="polite">
                    <span>{t('note.counter', { count: noteLength(e.note), max: NOTE_MAX })}</span>
                    {(e.note.length >= NOTE_MAX || noteLength(e.note) >= NOTE_MAX) && <strong> · {t('note.limit', { max: NOTE_MAX })}</strong>}
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger-outline"
                    onClick={() => dispatch({ type: 'remove', id })}
                    aria-label={t('picks.remove', { name })}
                  >
                    {t('picks.removeShort')}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {confirmClear && (
        <ConfirmDialog
          titleId="clear-title"
          title={t('picks.clearTitle')}
          body={t('picks.clearBody', { count: ids.length })}
          confirmLabel={t('picks.clearAll')}
          danger
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            dispatch({ type: 'clear' });
            setConfirmClear(false);
          }}
        />
      )}
    </section>
  );
}
