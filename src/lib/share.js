/**
 * share.js — URLシェア用エンコード/デコード（要件 §3.9 / §6）。
 *
 * セッション JSON を URL-safe な Base64 でクエリパラメータに格納する。
 * - encodeSessionToUrl: Session → URLパラメータ付き文字列
 * - decodeSessionFromUrl: URL or queryString → Session（失敗時は null）
 * クエリキーは `s`（簡潔性優先）。
 */

const QUERY_KEY = 's';

/** URL-safe Base64 へ変換 */
function toUrlSafe(b64) {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** URL-safe Base64 から標準 Base64 へ復元 */
function fromUrlSafe(u) {
  const replaced = u.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (replaced.length % 4)) % 4;
  return replaced + '='.repeat(pad);
}

/** UTF-8 を含む文字列を Base64 へ */
function btoaUtf8(str) {
  // unescape(encodeURIComponent(...)) パターンで UTF-8 → Latin-1 → btoa
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Base64 を UTF-8 文字列へ */
function atobUtf8(b64) {
  const bin = atob(b64);
  // Uint8Array.from で動的 index 書込みを回避（security/detect-object-injection 対策）
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * セッションを URL-safe Base64 文字列にエンコードする。
 * @param {import('./calculator').Session} session
 * @returns {string}
 */
export function encodeSession(session) {
  const json = JSON.stringify(session);
  return toUrlSafe(btoaUtf8(json));
}

/**
 * URL-safe Base64 文字列をセッションへデコードする。失敗時は null。
 * @param {string} encoded
 * @returns {import('./calculator').Session | null}
 */
export function decodeSession(encoded) {
  try {
    const json = atobUtf8(fromUrlSafe(encoded));
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object') return null;
    return obj;
  } catch {
    return null;
  }
}

/**
 * セッションをクエリパラメータ付き URL に組み立てる。
 * baseUrl 未指定時はカレントの origin + pathname を使う（ブラウザ環境）。
 * @param {import('./calculator').Session} session
 * @param {string} [baseUrl]
 * @returns {string}
 */
export function encodeSessionToUrl(session, baseUrl) {
  const encoded = encodeSession(session);
  const base =
    baseUrl ??
    (typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : '');
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}${QUERY_KEY}=${encoded}`;
}

/**
 * URL / クエリ文字列 / 単なるトークンのいずれからもセッションを復元する。
 * @param {string} input  URL / "?s=..." / トークン
 * @returns {import('./calculator').Session | null}
 */
export function decodeSessionFromUrl(input) {
  if (!input) return null;
  let token = input;
  const qIdx = input.indexOf('?');
  if (qIdx >= 0) {
    const params = new URLSearchParams(input.slice(qIdx + 1));
    const v = params.get(QUERY_KEY);
    if (!v) return null;
    token = v;
  } else if (input.includes('=')) {
    const params = new URLSearchParams(input);
    const v = params.get(QUERY_KEY);
    if (v) token = v;
  }
  return decodeSession(token);
}
