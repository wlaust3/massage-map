import { otherLang, useI18n } from '../../i18n';

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  const next = otherLang(lang);
  return (
    <button
      type="button"
      className="btn lang-toggle"
      onClick={() => setLang(next)}
      aria-label={t('lang.toggleLabel')}
      lang={next === 'zh' ? 'zh-Hans' : 'en'}
    >
      {t('lang.toggle')}
    </button>
  );
}
