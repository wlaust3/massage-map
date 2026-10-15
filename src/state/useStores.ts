import { useCallback, useEffect, useReducer, useState } from 'react';
import { selectionReducer, type Selection } from './selection';
import { loadSelection, saveSelection } from './storage';
import { loadFavorites, saveFavorites, type Favorite } from './favorites';

/** Selection state persisted to localStorage (versioned schema). */
export function useSelection() {
  const [selection, dispatch] = useReducer(selectionReducer, undefined, (): Selection => loadSelection());
  useEffect(() => {
    saveSelection(selection);
  }, [selection]);
  return [selection, dispatch] as const;
}

/** Favorites list persisted to localStorage. `commit` returns false when the browser refused the write. */
export function useFavorites() {
  const [list, setList] = useState<Favorite[]>(() => loadFavorites());
  const commit = useCallback((next: Favorite[]): boolean => {
    setList(next);
    return saveFavorites(next);
  }, []);
  return { list, commit };
}
