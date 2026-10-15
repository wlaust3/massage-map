import { useI18n } from '../../i18n';
import type { Selection } from '../../state/selection';
import { Dialog } from '../common/Dialog';
import { LanguageToggle } from '../LanguageToggle/LanguageToggle';
import { SummaryCard } from './SummaryCard';

export function FullscreenSummary({ selection, onClose }: { selection: Selection; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Dialog title={t('summary.title')} titleId="fs-title" onClose={onClose} fullscreen className="dialog-fullscreen" hideTitle>
      <div className="fs-tools">
        <LanguageToggle />
        <button type="button" className="btn" onClick={onClose} data-autofocus>
          {t('summary.close')}
        </button>
      </div>
      <SummaryCard selection={selection} t={t} large />
    </Dialog>
  );
}
