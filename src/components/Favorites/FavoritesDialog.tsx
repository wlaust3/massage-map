import { useState } from 'react';
import { FAVORITE_NAME_MAX } from '../../data/options';
import { useI18n } from '../../i18n';
import {
  addFavorite,
  deleteFavorite,
  hasUnsavedChanges,
  loadFavorite,
  renameFavorite,
  type FavError,
  type Favorite,
} from '../../state/favorites';
import { countSelected, type Selection } from '../../state/selection';
import { ConfirmDialog, Dialog } from '../common/Dialog';

interface Props {
  favorites: readonly Favorite[];
  commit: (next: Favorite[]) => boolean;
  selection: Selection;
  /** replace the current selection with the favorite's routine */
  onLoad: (selection: Selection, name: string) => void;
  onClose: () => void;
}

const errKey = (e: FavError) => (e === 'emptyName' ? 'fav.err.emptyName' : e === 'emptySelection' ? 'fav.err.emptySelection' : 'fav.err.storage');

export function FavoritesDialog({ favorites, commit, selection, onLoad, onClose }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Favorite | null>(null);
  const [confirmLoad, setConfirmLoad] = useState<Favorite | null>(null);

  const save = () => {
    setStatus(null);
    const r = addFavorite(favorites, name, selection);
    if (!r.ok) return setError(t(errKey(r.error)));
    const stored = commit(r.value);
    const saved = r.value[r.value.length - 1];
    setName('');
    if (!stored) return setError(t('fav.err.storage'));
    setError(null);
    setStatus(t('fav.saved', { name: saved.name }));
  };

  const doLoad = (f: Favorite) => {
    const r = loadFavorite(favorites, f.id);
    if (!r.ok) return;
    onLoad(r.value, f.name);
  };

  const requestLoad = (f: Favorite) => {
    if (hasUnsavedChanges(favorites, selection)) setConfirmLoad(f);
    else doLoad(f);
  };

  const finishRename = () => {
    if (!renaming) return;
    const r = renameFavorite(favorites, renaming.id, renaming.value);
    if (!r.ok) return setRenameError(t(errKey(r.error)));
    if (!commit(r.value)) setError(t('fav.err.storage'));
    setRenaming(null);
    setRenameError(null);
  };

  return (
    <Dialog title={t('fav.title')} titleId="fav-title" onClose={onClose}>
      <form
        className="fav-save"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <h3>{t('fav.saveTitle')}</h3>
        <label className="field">
          <span className="seg-label">{t('fav.nameLabel')}</span>
          <input
            type="text"
            value={name}
            maxLength={FAVORITE_NAME_MAX}
            placeholder={t('fav.namePlaceholder')}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby="fav-msg"
            autoComplete="off"
            dir="auto"
          />
        </label>
        <button type="submit" className="btn btn-primary">
          {t('fav.save')}
        </button>
        <p id="fav-msg" className={error ? 'msg msg-error' : 'msg'} role={error ? 'alert' : 'status'}>
          {error ?? status ?? ''}
        </p>
        {countSelected(selection) === 0 && <p className="muted small">{t('fav.err.emptySelection')}</p>}
      </form>

      <h3>{t('fav.list')}</h3>
      {favorites.length === 0 ? (
        <p className="muted">{t('fav.empty')}</p>
      ) : (
        <ul className="fav-list">
          {favorites.map((f) => (
            <li key={f.id} className="fav-item">
              {renaming?.id === f.id ? (
                <form
                  className="fav-rename"
                  onSubmit={(e) => {
                    e.preventDefault();
                    finishRename();
                  }}
                >
                  <label className="field">
                    <span className="seg-label">{t('fav.renameLabel', { name: f.name })}</span>
                    <input
                      type="text"
                      value={renaming.value}
                      maxLength={FAVORITE_NAME_MAX}
                      onChange={(e) => {
                        setRenaming({ id: f.id, value: e.target.value });
                        setRenameError(null);
                      }}
                      data-autofocus
                      dir="auto"
                      aria-invalid={renameError ? true : undefined}
                    />
                  </label>
                  {renameError && (
                    <p className="msg msg-error" role="alert">
                      {renameError}
                    </p>
                  )}
                  <div className="btn-row">
                    <button type="button" className="btn" onClick={() => setRenaming(null)}>
                      {t('common.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {t('fav.renameSave')}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="fav-info">
                    <span className="fav-name" dir="auto">
                      {f.name}
                    </span>
                    <span className="muted small">{t('fav.items', { count: countSelected(f.items) })}</span>
                  </div>
                  <div className="btn-row">
                    <button type="button" className="btn btn-primary" onClick={() => requestLoad(f)}>
                      {t('fav.load')}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setRenaming({ id: f.id, value: f.name });
                        setRenameError(null);
                      }}
                    >
                      {t('fav.rename')}
                    </button>
                    <button type="button" className="btn btn-danger-outline" onClick={() => setConfirmDelete(f)}>
                      {t('fav.delete')}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {confirmDelete && (
        <ConfirmDialog
          titleId="fav-del-title"
          title={t('fav.deleteTitle')}
          body={t('fav.deleteBody', { name: confirmDelete.name })}
          confirmLabel={t('fav.delete')}
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (!commit(deleteFavorite(favorites, confirmDelete.id))) setError(t('fav.err.storage'));
            setConfirmDelete(null);
          }}
        />
      )}
      {confirmLoad && (
        <ConfirmDialog
          titleId="fav-load-title"
          title={t('fav.loadTitle')}
          body={t('fav.loadBody', { name: confirmLoad.name })}
          confirmLabel={t('fav.loadConfirm')}
          onCancel={() => setConfirmLoad(null)}
          onConfirm={() => {
            doLoad(confirmLoad);
            setConfirmLoad(null);
          }}
        />
      )}
    </Dialog>
  );
}
