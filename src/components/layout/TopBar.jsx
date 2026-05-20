import PropTypes from 'prop-types';
import { useCallback, useMemo } from 'react';
import SegmentedToggle from '@/components/ui/SegmentedToggle';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

/**
 * アプリ上部バー。タイトルとテーマ/言語切替UIを表示。
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {'ja'|'en'} props.lang
 * @param {(v: string) => void} props.onLangChange
 * @param {'simple'|'pop'} props.themeFamily
 * @param {(v: string) => void} props.onThemeFamilyChange
 * @param {'light'|'dark'} props.colorMode
 * @param {(v: string) => void} props.onColorModeChange
 * @param {'off'|'on'} props.driverDiscount 御者割（運転手割）の有効状態
 * @param {(v: string) => void} props.onDriverDiscountChange
 * @param {import('@/lib/currency').CurrencyCode} props.currency 表示通貨
 * @param {(v: string) => void} props.onCurrencyChange
 */
function TopBar({
  t,
  lang,
  onLangChange,
  themeFamily,
  onThemeFamilyChange,
  colorMode,
  onColorModeChange,
  driverDiscount,
  onDriverDiscountChange,
  currency,
  onCurrencyChange,
}) {
  const langOptions = useMemo(
    () => [
      { value: 'ja', label: '日本語' },
      { value: 'en', label: 'EN' },
    ],
    [],
  );

  const familyOptions = useMemo(
    () => [
      { value: 'simple', label: t('theme.simple') },
      { value: 'pop', label: t('theme.pop') },
    ],
    [t],
  );

  const modeOptions = useMemo(
    () => [
      { value: 'light', label: t('theme.light') },
      { value: 'dark', label: t('theme.dark') },
    ],
    [t],
  );

  const driverOptions = useMemo(
    () => [
      { value: 'off', label: t('driver.off') },
      { value: 'on', label: t('driver.on') },
    ],
    [t],
  );

  const currencyOptions = useMemo(
    () =>
      SUPPORTED_CURRENCIES.map((c) => ({
        code: c.code,
        label: lang === 'en' ? c.labelEn : c.labelJa,
      })),
    [lang],
  );

  const handleCurrencyChange = useCallback(
    /** @param {React.ChangeEvent<HTMLSelectElement>} e */
    (e) => onCurrencyChange(e.target.value),
    [onCurrencyChange],
  );

  return (
    <header className="app-surface sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-3">
        <div>
          <h1 className="app-text text-lg font-bold">{t('app.title')}</h1>
          <p className="app-text-muted text-xs">{t('app.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedToggle
            label={t('lang.label')}
            options={langOptions}
            value={lang}
            onChange={onLangChange}
          />
          <SegmentedToggle
            label={t('theme.label')}
            options={familyOptions}
            value={themeFamily}
            onChange={onThemeFamilyChange}
          />
          <SegmentedToggle
            label={t('theme.label')}
            options={modeOptions}
            value={colorMode}
            onChange={onColorModeChange}
          />
          <SegmentedToggle
            label={t('driver.label')}
            options={driverOptions}
            value={driverDiscount}
            onChange={onDriverDiscountChange}
          />
          <label className="inline-flex items-center gap-1.5 text-xs">
            <span className="app-text-muted">{t('currency.label')}</span>
            <select
              aria-label={t('currency.label')}
              value={currency}
              onChange={handleCurrencyChange}
              className="app-card app-field border px-2 py-1 text-xs"
            >
              {currencyOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  );
}

TopBar.propTypes = {
  t: PropTypes.func.isRequired,
  lang: PropTypes.oneOf(['ja', 'en']).isRequired,
  onLangChange: PropTypes.func.isRequired,
  themeFamily: PropTypes.oneOf(['simple', 'pop']).isRequired,
  onThemeFamilyChange: PropTypes.func.isRequired,
  colorMode: PropTypes.oneOf(['light', 'dark']).isRequired,
  onColorModeChange: PropTypes.func.isRequired,
  driverDiscount: PropTypes.oneOf(['off', 'on']).isRequired,
  onDriverDiscountChange: PropTypes.func.isRequired,
  currency: PropTypes.oneOf(['JPY', 'USD', 'EUR', 'CAD']).isRequired,
  onCurrencyChange: PropTypes.func.isRequired,
};

export default TopBar;
