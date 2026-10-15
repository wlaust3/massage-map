import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import en from './en.json';
import zh from './zh.json';
import { loadLang, saveLang } from '../state/storage';

export const LANGS = ['en', 'zh'] as const;
export type Lang = (typeof LANGS)[number];
export type TKey = keyof typeof en;
export type Params = Record<string, string | number>;
export type TFn = (key: TKey, params?: Params) => string;

export const dictionaries: Record<Lang, Record<string, string>> = { en, zh };

export const isLang = (v: unknown): v is Lang => v === 'en' || v === 'zh';

/** Dynamic keys (muscle / region / duration names) are built from data, so accept any string. */
export function translate(lang: Lang, key: string, params?: Params): string {
  const raw = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

export const makeT =
  (lang: Lang) =>
  (key: string, params?: Params): string =>
    translate(lang, key, params);

export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'zh' : 'en');

export function detectLang(): Lang {
  const stored = loadLang();
  if (stored) return stored;
  const nav = typeof navigator !== 'undefined' ? navigator.language || '' : '';
  return nav.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Params) => string;
}
const LangContext = createContext<Ctx | null>(null);

export function LanguageProvider({
  children,
  initial,
  persist = true,
}: {
  children: ReactNode;
  initial?: Lang;
  /** Shared (read-only) views choose their own language and must not overwrite the user's saved preference. */
  persist?: boolean;
}) {
  const [lang, setLangState] = useState<Lang>(() => initial ?? detectLang());
  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      if (persist) saveLang(l);
    },
    [persist],
  );
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
    document.title = translate(lang, 'app.title');
  }, [lang]);
  const value = useMemo<Ctx>(() => ({ lang, setLang, t: makeT(lang) }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useI18n must be used inside <LanguageProvider>');
  return ctx;
}
