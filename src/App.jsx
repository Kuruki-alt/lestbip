import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import TopBar from '@/components/layout/TopBar';
import SettingsDrawer from '@/components/layout/SettingsDrawer';
import HomeScreen from '@/components/screens/HomeScreen';
import NewSessionScreen from '@/components/screens/NewSessionScreen';
import SessionScreen from '@/components/screens/SessionScreen';
import PaymentFormScreen from '@/components/screens/PaymentFormScreen';
import DirectPaymentScreen from '@/components/screens/DirectPaymentScreen';
import SettlementScreen from '@/components/screens/SettlementScreen';
import MembersScreen from '@/components/screens/MembersScreen';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { useScreenRouter } from '@/hooks/useScreenRouter';
import { useDriverDiscount } from '@/hooks/useDriverDiscount';
import { useCurrency } from '@/hooks/useCurrency';
import { useSessions } from '@/hooks/useSessions';
import { decodeSessionFromUrl, encodeSessionToUrl } from '@/lib/share';
import { loadPrefs, savePrefs } from '@/lib/storage';

/** 不正値（壊れた LocalStorage 等）を弾くためのホワイトリスト集 */
const VALID_LANGS = new Set(['ja', 'en']);
const VALID_FAMILY = new Set(['simple', 'pop']);
const VALID_COLOR = new Set(['light', 'dark']);
const VALID_CURRENCY = new Set(['JPY', 'USD', 'EUR', 'CAD']);

/** prefs から各フィールドを取り出してホワイトリスト検証する */
function pickPrefs(p) {
  const safe = p ?? {};
  return {
    lang: VALID_LANGS.has(safe.lang) ? safe.lang : 'ja',
    family: VALID_FAMILY.has(safe.family) ? safe.family : 'simple',
    colorMode: VALID_COLOR.has(safe.colorMode) ? safe.colorMode : 'light',
    currency: VALID_CURRENCY.has(safe.currency) ? safe.currency : 'JPY',
    driverDiscount:
      typeof safe.driverDiscount === 'boolean' ? safe.driverDiscount : false,
  };
}

/**
 * アプリのルート。
 * - useScreenRouter による簡易画面ルーティング（react-router 不使用）
 * - useTheme でライト/ダーク(class)・系統(data-theme)を実切替
 * - useI18n で日本語/英語ラベルを切替
 */
function App() {
  // 初回マウント時に LocalStorage から表示設定を読み込み、各 use* フックの
  // 初期値として渡す（要件 §5.2 末尾：テーマ等を次回も維持）。
  const initialPrefs = useMemo(() => pickPrefs(loadPrefs()), []);

  const { t, lang, setLang } = useI18n(initialPrefs.lang);
  const { family, colorMode, setFamily, setColorMode } = useTheme({
    family: initialPrefs.family,
    colorMode: initialPrefs.colorMode,
  });
  const { screen, editPaymentId, navigate } = useScreenRouter();
  // オプション機能のため既定は無効
  const { enabled: driverDiscount, setEnabled: setDriverDiscount } =
    useDriverDiscount(initialPrefs.driverDiscount);
  const { currency: defaultCurrency, setCurrency } = useCurrency(
    initialPrefs.currency,
  );

  // v2.0.0 改善案 #3: ハンバーガーから開く設定 Drawer の開閉状態
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // 設定が変わるたびに LocalStorage へ反映（部分マージ）。
  useEffect(() => {
    savePrefs({
      lang,
      family,
      colorMode,
      currency: defaultCurrency,
      driverDiscount,
    });
  }, [lang, family, colorMode, defaultCurrency, driverDiscount]);
  const {
    currentSession,
    openSession: storeOpenSession,
    closeSession,
    importSession,
    patchSession,
  } = useSessions();

  // 表示通貨: セッションが開いている時は session.currency、無ければ既定
  const displayCurrency = currentSession?.currency ?? defaultCurrency;

  const handleDriverDiscountChange = useCallback(
    /** @param {string} v 'on' | 'off' */
    (v) => setDriverDiscount(v === 'on'),
    [setDriverDiscount],
  );

  const goHome = useCallback(() => {
    closeSession();
    navigate('home');
  }, [closeSession, navigate]);
  const goNewSession = useCallback(() => navigate('newSession'), [navigate]);
  const goSession = useCallback(() => navigate('session'), [navigate]);
  const goSettlement = useCallback(() => navigate('settlement'), [navigate]);
  const goDirectPayment = useCallback(
    () => navigate('directPayment'),
    [navigate],
  );
  const goMembers = useCallback(() => navigate('members'), [navigate]);

  const openSession = useCallback(
    /** @param {string} id */
    (id) => {
      storeOpenSession(id);
      navigate('session');
    },
    [storeOpenSession, navigate],
  );

  const afterCreateSession = useCallback(() => navigate('session'), [navigate]);

  const editPayment = useCallback(
    /** @param {string|null} paymentId */
    (paymentId) => navigate('paymentForm', { editPaymentId: paymentId }),
    [navigate],
  );

  const handleShare = useCallback(async () => {
    if (!currentSession) return;
    const url = encodeSessionToUrl(currentSession);
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(url);
        window.alert(`${t('session.shareCopied')}\n${url}`);
        return;
      }
      // クリップボードAPIが使えない環境はURLをそのまま提示
      window.prompt(t('session.shareCopied'), url);
    } catch {
      window.prompt(t('session.shareError'), url);
    }
  }, [currentSession, t]);

  // 初回マウントで ?s=... を取り込んで新セッション化（id 衝突回避のため新規作成）。
  // URL は綺麗にする（リロード時の二重取り込みを防ぐ）。
  const importedRef = useRef(false);
  useEffect(() => {
    if (importedRef.current) return;
    importedRef.current = true;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('s');
    if (!token) return;
    const imported = decodeSessionFromUrl(`?s=${token}`);
    if (!imported) return;
    importSession(imported);
    navigate('session');
    const cleaned = new URL(window.location.href);
    cleaned.searchParams.delete('s');
    window.history.replaceState({}, '', cleaned.toString());
    // import / navigate は createCallback で安定。effect は一度きり走らせたい。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topBar = <TopBar t={t} onOpenMenu={openMenu} menuOpen={menuOpen} />;

  // Drawer ハンドラ：セッションが開いていれば現在セッションに直接反映、
  // 開いていなければ既定値（グローバル）に反映する（要件 §3.11 と整合）。
  const handleDrawerCurrency = useCallback(
    /** @param {string} v */
    (v) => {
      setCurrency(v);
      if (currentSession) {
        patchSession(currentSession.id, { currency: v });
      }
    },
    [setCurrency, currentSession, patchSession],
  );

  const handleDrawerRounding = useCallback(
    /** @param {string} v */
    (v) => {
      if (currentSession) {
        patchSession(currentSession.id, { rounding: v });
      }
    },
    [currentSession, patchSession],
  );

  const drawer = (
    <SettingsDrawer
      open={menuOpen}
      onClose={closeMenu}
      t={t}
      lang={lang}
      onLangChange={setLang}
      themeFamily={family}
      onThemeFamilyChange={setFamily}
      colorMode={colorMode}
      onColorModeChange={setColorMode}
      currency={displayCurrency}
      onCurrencyChange={handleDrawerCurrency}
      driverDiscount={driverDiscount ? 'on' : 'off'}
      onDriverDiscountChange={handleDriverDiscountChange}
      rounding={currentSession?.rounding ?? 'floor'}
      onRoundingChange={handleDrawerRounding}
    />
  );

  let body;
  if (screen === 'newSession') {
    body = (
      <NewSessionScreen
        t={t}
        defaultCurrency={defaultCurrency}
        onBack={goHome}
        onCreate={afterCreateSession}
      />
    );
  } else if (screen === 'session') {
    body = (
      <SessionScreen
        t={t}
        lang={lang}
        currency={displayCurrency}
        onBack={goHome}
        onEditPayment={editPayment}
        onAddDirectPayment={goDirectPayment}
        onEditMembers={goMembers}
        onViewSettlement={goSettlement}
        onShare={handleShare}
      />
    );
  } else if (screen === 'members') {
    body = <MembersScreen t={t} onBack={goSession} />;
  } else if (screen === 'paymentForm') {
    body = (
      <PaymentFormScreen
        t={t}
        editPaymentId={editPaymentId}
        driverDiscountEnabled={driverDiscount}
        onSave={goSession}
        onCancel={goSession}
      />
    );
  } else if (screen === 'directPayment') {
    body = (
      <DirectPaymentScreen
        t={t}
        onSave={goSession}
        onCancel={goSession}
        onWaive={goSession}
      />
    );
  } else if (screen === 'settlement') {
    body = (
      <SettlementScreen
        t={t}
        lang={lang}
        currency={displayCurrency}
        driverDiscountEnabled={driverDiscount}
        onBack={goSession}
      />
    );
  } else {
    body = (
      <HomeScreen
        t={t}
        onCreateSession={goNewSession}
        onOpenSession={openSession}
      />
    );
  }

  return (
    <>
      <AppLayout topBar={topBar}>{body}</AppLayout>
      {drawer}
    </>
  );
}

export default App;
