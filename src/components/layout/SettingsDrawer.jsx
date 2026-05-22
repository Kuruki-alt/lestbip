import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SegmentedToggle from '@/components/ui/SegmentedToggle';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

/**
 * 設定 Drawer（右端からスライドイン、v2.0.0 改善案 #3）。
 * 言語/テーマ系統/ライト・ダーク/通貨/運転手の負担を軽減/端数処理
 * を一箇所に集約する（ハンバーガーメニュー本体）。
 *
 * 開閉は親が管理する（open / onClose）。
 * Esc キー押下・オーバーレイクリック・× ボタンでも閉じる。
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(key: string) => string} props.t
 * @param {'ja'|'en'} props.lang
 * @param {(v: string) => void} props.onLangChange
 * @param {'simple'|'pop'} props.themeFamily
 * @param {(v: string) => void} props.onThemeFamilyChange
 * @param {'light'|'dark'} props.colorMode
 * @param {(v: string) => void} props.onColorModeChange
 * @param {import('@/lib/currency').CurrencyCode} props.currency
 * @param {(v: string) => void} props.onCurrencyChange
 * @param {'off'|'on'} props.driverDiscount
 * @param {(v: string) => void} props.onDriverDiscountChange
 * @param {'floor'|'ceil'|'round'} props.rounding
 * @param {(v: string) => void} props.onRoundingChange
 */
function SettingsDrawer({
  open,
  onClose,
  t,
  lang,
  onLangChange,
  themeFamily,
  onThemeFamilyChange,
  colorMode,
  onColorModeChange,
  currency,
  onCurrencyChange,
  driverDiscount,
  onDriverDiscountChange,
  rounding,
  onRoundingChange,
}) {
  // open=DOM 上の存在 / visible=スライド表示状態 を分離し、開閉アニメを実現する。
  // 開く時: マウント → 次フレームで visible=true でスライドイン。
  // 閉じる時: visible=false でスライドアウト → transitionend でアンマウント。
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // 2 フレーム待ってから可視化（初回レイアウトと同フレームだと transition が走らない）
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true)),
      );
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    return undefined;
  }, [open]);

  const handleTransitionEnd = useCallback(
    /** @param {React.TransitionEvent<HTMLElement>} e */
    (e) => {
      // パネルのスライド（transform）完了かつ閉状態のときだけアンマウント
      if (e.propertyName === 'transform' && !open) {
        setMounted(false);
      }
    },
    [open],
  );

  // Esc キーで閉じる
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

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

  const roundingOptions = useMemo(
    () => [
      { value: 'floor', label: t('session.roundingFloor') },
      { value: 'ceil', label: t('session.roundingCeil') },
      { value: 'round', label: t('session.roundingRound') },
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

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-drawer-title"
      className="fixed inset-0 z-50"
    >
      {/* オーバーレイ（クリックで閉じる、フェード） */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('menu.close')}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* パネル本体（右からスライド） */}
      <aside
        onTransitionEnd={handleTransitionEnd}
        className={`app-surface absolute right-0 top-0 flex h-full w-[min(85%,360px)] flex-col gap-4 overflow-y-auto border-l p-5 shadow-xl transition-transform duration-300 ease-out will-change-transform ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2
            id="settings-drawer-title"
            className="app-text text-base font-bold"
          >
            {t('menu.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('menu.close')}
            className="app-text-muted text-xl"
          >
            ×
          </button>
        </div>

        <section className="flex flex-col gap-1.5 text-sm">
          <span className="app-text font-semibold">{t('lang.label')}</span>
          <SegmentedToggle
            label={t('lang.label')}
            options={langOptions}
            value={lang}
            onChange={onLangChange}
          />
        </section>

        <section className="flex flex-col gap-1.5 text-sm">
          <span className="app-text font-semibold">{t('theme.label')}</span>
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
        </section>

        <section className="flex flex-col gap-1.5 text-sm">
          <span className="app-text font-semibold">{t('currency.label')}</span>
          <select
            aria-label={t('currency.label')}
            value={currency}
            onChange={handleCurrencyChange}
            className="app-card app-field border px-3 py-2"
          >
            {currencyOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
        </section>

        <section className="flex flex-col gap-1.5 text-sm">
          <span className="app-text font-semibold">{t('driver.label')}</span>
          <SegmentedToggle
            label={t('driver.label')}
            options={driverOptions}
            value={driverDiscount}
            onChange={onDriverDiscountChange}
          />
        </section>

        <section className="flex flex-col gap-1.5 text-sm">
          <span className="app-text font-semibold">
            {t('session.rounding')}
          </span>
          <SegmentedToggle
            label={t('session.rounding')}
            options={roundingOptions}
            value={rounding}
            onChange={onRoundingChange}
          />
        </section>
      </aside>
    </div>
  );
}

SettingsDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  lang: PropTypes.oneOf(['ja', 'en']).isRequired,
  onLangChange: PropTypes.func.isRequired,
  themeFamily: PropTypes.oneOf(['simple', 'pop']).isRequired,
  onThemeFamilyChange: PropTypes.func.isRequired,
  colorMode: PropTypes.oneOf(['light', 'dark']).isRequired,
  onColorModeChange: PropTypes.func.isRequired,
  currency: PropTypes.oneOf(['JPY', 'USD', 'EUR', 'CAD']).isRequired,
  onCurrencyChange: PropTypes.func.isRequired,
  driverDiscount: PropTypes.oneOf(['off', 'on']).isRequired,
  onDriverDiscountChange: PropTypes.func.isRequired,
  rounding: PropTypes.oneOf(['floor', 'ceil', 'round']).isRequired,
  onRoundingChange: PropTypes.func.isRequired,
};

export default SettingsDrawer;
