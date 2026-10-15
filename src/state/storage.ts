import type { Lang } from '../i18n';
import { sanitizeSelection, type Selection } from './selection';

/** Minimal Storage interface so tests can pass an in-memory implementation. */
export interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const KEYS = {
  lang: 'mm.lang',
  selection: 'mm.selection',
  favorites: 'mm.favorites',
} as const;
export const SCHEMA_VERSION = 1;

export function defaultStore(): KV | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null; // access can throw when storage is blocked
  }
}

export function readJson(store: KV | null, key: string): unknown {
  if (!store) return undefined;
  try {
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

/** Returns false when the write failed (quota exceeded, blocked storage, ...). */
export function writeJson(store: KV | null, key: string, value: unknown): boolean {
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadLang(store: KV | null = defaultStore()): Lang | null {
  try {
    const v = store?.getItem(KEYS.lang);
    return v === 'en' || v === 'zh' ? v : null;
  } catch {
    return null;
  }
}
export function saveLang(lang: Lang, store: KV | null = defaultStore()): void {
  try {
    store?.setItem(KEYS.lang, lang);
  } catch {
    /* ignore */
  }
}

export function loadSelection(store: KV | null = defaultStore()): Selection {
  const raw = readJson(store, KEYS.selection) as { version?: unknown; items?: unknown } | undefined;
  if (!raw || raw.version !== SCHEMA_VERSION) return {};
  return sanitizeSelection(raw.items);
}
export function saveSelection(sel: Selection, store: KV | null = defaultStore()): boolean {
  return writeJson(store, KEYS.selection, { version: SCHEMA_VERSION, items: sel });
}
