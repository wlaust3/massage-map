import { useState, type Dispatch } from 'react';
import { DURATIONS, INTENSITIES, NOTE_MAX } from '../../data/options';
import { useI18n } from '../../i18n';
import { noteLength, selectedIds, type Action, type Selection } from '../../state/selection';
import { ConfirmDialog } from '../common/Dialog';
import { Select } from '../common/Select';
import { muscleLabel, musclePlain } from '../common/labels';

interface Props {
  selection: Selection;
  dispatch: Dispatch<Action>;
  onGoMap: () => void;
}

/** Per-selection intensity, duration and note, plus "set all" and "clear all". One compact row per pick. */
export function SettingsSheet({ selection, dispatch, onGoMap }: Props) {
  const { t } = useI18n();
  const ids = selectedIds(selection);
  const [noteOpen, setNoteOpen] = useState<ReadonlySet<string>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);

  const intensityOptions = INTENSITIES.map((v) => ({ value: v, label: t(`intensity.${v}`) }));
  const durationOptions = DURATIONS.map((v) => ({ value: v, label: t(`duration.short.${v}`) }));
  const toggleNote = (id: string) =>
    setNoteOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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
        <button type="button" className="btn btn-small btn-danger-outline" onClick={() => setConfirmClear(true)}>
          {t('picks.clearAll')}
        </button>
      </div>

      <div className="set-all" role="group" aria-label={t('picks.setAll')}>
        <span className="set-all-k">{t('picks.setAll')}</span>
        <Select
          label={t('intensity.label')}
          options={intensityOptions}
          value={null}
          onChange={(v) => dispatch({ type: 'applyAll', patch: { intensity: v } })}
        />
        <Select
          label={t('duration.label')}
          options={durationOptions}
          value={null}
          onChange={(v) => dispatch({ type: 'applyAll', patch: { duration: v } })}
        />
      </div>

      <ul className="pick-list">
        {ids.map((id) => {
          const e = selection[id];
          const name = muscleLabel(t, id);
          const showNote = noteOpen.has(id) || e.note !== '';
          return (
            <li key={id} className={`pick${e.duration === 'none' ? ' is-avoid' : ''}`}>
              <div className="pick-name">
                {name} <span className="pick-plain">{musclePlain(t, id)}</span>
              </div>
              <div className="pick-row">
                <Select
                  label={t('intensity.label')}
                  options={intensityOptions}
                  value={e.intensity}
                  onChange={(v) => dispatch({ type: 'update', id, patch: { intensity: v } })}
                />
                <Select
                  label={t('duration.label')}
                  options={durationOptions}
                  value={e.duration}
                  onChange={(v) => dispatch({ type: 'update', id, patch: { duration: v } })}
                />
                <button
                  type="button"
                  className="icon-btn icon-btn-small"
                  aria-pressed={showNote}
                  aria-label={t('note.label')}
                  disabled={e.note !== ''}
                  onClick={() => toggleNote(id)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-small icon-btn-danger"
                  onClick={() => dispatch({ type: 'remove', id })}
                  aria-label={t('picks.remove', { name })}
                >
                  ✕
                </button>
              </div>
              {showNote && (
                <div className="pick-note">
                  <textarea
                    value={e.note}
                    rows={2}
                    maxLength={NOTE_MAX /* the reducer also clamps, e.g. for pasted text */}
                    placeholder={t('note.placeholder')}
                    aria-label={t('note.label')}
                    onChange={(ev) => dispatch({ type: 'update', id, patch: { note: ev.target.value } })}
                    aria-describedby={`note-count-${id}`}
                  />
                  <div id={`note-count-${id}`} className="note-count" aria-live="polite">
                    <span>{t('note.counter', { count: noteLength(e.note), max: NOTE_MAX })}</span>
                    {(e.note.length >= NOTE_MAX || noteLength(e.note) >= NOTE_MAX) && <strong> · {t('note.limit', { max: NOTE_MAX })}</strong>}
                  </div>
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
