/**
 * storage.js — LocalStorage 永続化（要件 §3.1 / §3.10 / §6）。
 *
 * セッション一覧を 1 つのキー（lestbip/sessions/v1）に JSON 配列で保存し、
 * 個別の load / save / delete を提供する。テーマ・言語・通貨・御者割の
 * 表示設定は別キー（lestbip/prefs/v1）で扱う。
 *
 * SSR や localStorage 不在環境でも安全に no-op になるようガードする。
 */

const SESSIONS_KEY = 'lestbip/sessions/v1';
const PREFS_KEY = 'lestbip/prefs/v1';

/** localStorage が利用可能か（SSR / プライベートモード対策） */
function safeStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const k = '__lestbip_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 文字列を JSON.parse し、配列以外なら [] を返す */
function parseSessionArray(raw) {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * 保存済みセッション一覧を読み込む（updatedAt 降順）。
 * @returns {import('./calculator').Session[]}
 */
export function loadSessions() {
  const ls = safeStorage();
  if (!ls) return [];
  const list = parseSessionArray(ls.getItem(SESSIONS_KEY));
  return list.sort((a, b) => {
    const at = String(a?.updatedAt ?? '');
    const bt = String(b?.updatedAt ?? '');
    return bt.localeCompare(at);
  });
}

/**
 * 1 セッションを読み込む。存在しない場合は null。
 * @param {string} id
 * @returns {import('./calculator').Session | null}
 */
export function loadSession(id) {
  if (!id) return null;
  return loadSessions().find((s) => s?.id === id) ?? null;
}

/**
 * セッションを保存（id 一致なら更新、なければ追加）。
 * 戻り値は保存後の全件配列。
 *
 * @param {import('./calculator').Session} session
 * @returns {import('./calculator').Session[]}
 */
export function saveSession(session) {
  const ls = safeStorage();
  if (!ls || !session?.id) return loadSessions();
  const list = parseSessionArray(ls.getItem(SESSIONS_KEY));
  const stamped = {
    ...session,
    updatedAt: new Date().toISOString(),
  };
  const idx = list.findIndex((s) => s?.id === session.id);
  if (idx >= 0) list.splice(idx, 1, stamped);
  else list.push(stamped);
  ls.setItem(SESSIONS_KEY, JSON.stringify(list));
  return list;
}

/**
 * セッションを削除。
 * @param {string} id
 * @returns {import('./calculator').Session[]}
 */
export function deleteSession(id) {
  const ls = safeStorage();
  if (!ls || !id) return loadSessions();
  const list = parseSessionArray(ls.getItem(SESSIONS_KEY)).filter(
    (s) => s?.id !== id,
  );
  ls.setItem(SESSIONS_KEY, JSON.stringify(list));
  return list;
}

/**
 * 表示設定（テーマ・言語・通貨等）を保存・読込する。
 * @returns {Record<string, unknown>}
 */
export function loadPrefs() {
  const ls = safeStorage();
  if (!ls) return {};
  try {
    const v = JSON.parse(ls.getItem(PREFS_KEY) ?? '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

/**
 * 表示設定を保存（部分マージ）。
 * @param {Record<string, unknown>} patch
 */
export function savePrefs(patch) {
  const ls = safeStorage();
  if (!ls || !patch) return;
  const cur = loadPrefs();
  ls.setItem(PREFS_KEY, JSON.stringify({ ...cur, ...patch }));
}
