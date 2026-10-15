import { useState } from 'react';
import en from './i18n/en.json';
import zh from './i18n/zh.json';

const dictionaries = { en, zh } as const;
type Lang = keyof typeof dictionaries;

// Placeholder shell. See docs/MILESTONE-1.md for what to build.
export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const t = dictionaries[lang];
  return (
    <main style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1>{t['app.title']}</h1>
      <p>{t['app.tagline']}</p>
      <button
        type="button"
        style={{ minWidth: 44, minHeight: 44 }}
        onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
      >
        {t['lang.toggle']}
      </button>
    </main>
  );
}
