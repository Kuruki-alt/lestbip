/**
 * ids.js — セッション/メンバー/支払い等のID生成ユーティリティ。
 * crypto.randomUUID が使えればそれを優先、フォールバックは時刻+乱数。
 */

/** @param {string} [prefix] */
export function genId(prefix = 'x') {
  try {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
    }
  } catch {
    // crypto がない/壊れている環境はフォールバックへ
  }
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${t}${r}`;
}
