import PropTypes from 'prop-types';

/**
 * アプリ上部バー（v2.0.0 改善案 #3）。
 * 設定 UI はすべて SettingsDrawer に集約され、ここではタイトル/サブタイトルと
 * ハンバーガーボタンのみを表示する。
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {() => void} props.onOpenMenu  ハンバーガー押下で Drawer を開く
 * @param {boolean} props.menuOpen        Drawer の現在状態（aria-expanded 用）
 */
function TopBar({ t, onOpenMenu, menuOpen }) {
  return (
    <header className="app-surface sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-start justify-between gap-3 px-4 py-3">
        <div>
          <h1 className="app-text text-lg font-bold">{t('app.title')}</h1>
          <p className="app-text-muted text-xs">{t('app.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t('menu.open')}
          aria-expanded={menuOpen}
          className="app-card app-surface-2 app-text border px-3 py-1.5 text-base"
        >
          ☰
        </button>
      </div>
    </header>
  );
}

TopBar.propTypes = {
  t: PropTypes.func.isRequired,
  onOpenMenu: PropTypes.func.isRequired,
  menuOpen: PropTypes.bool.isRequired,
};

export default TopBar;
