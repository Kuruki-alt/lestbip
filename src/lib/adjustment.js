/**
 * adjustment.js — 差額調整ロジック（独立モジュール / 要件 §3.7 / §7）。
 *
 * 端数処理後の差額（roundingDiff）を、ユーザーが指定した1名のメンバーへ
 * 押し付ける「手動方式」を提供する。将来的に「幹事自動負担」「最少人数集中」
 * 等の方式へ拡張できるよう、戦略は独立関数として保つ。
 *
 * @typedef {'manual'|'auto'} AdjustmentStrategy
 */

/**
 * 手動方式：指定メンバーの net 残高に diff を加算する。
 *
 * @param {Record<string, number>} net   memberId → 残高
 * @param {number} diff                  端数差額（正/負）
 * @param {string} payerId               差額を引き受けるメンバーID
 * @returns {Record<string, number>}     差額反映後の新しい net（破壊しない）
 */
export function applyManualAdjustment(net, diff, payerId) {
  if (!net || !payerId || !(payerId in net)) return { ...(net ?? {}) };
  // Map 経由で動的キー書込みを回避（security/detect-object-injection 対策）
  const m = new Map(Object.entries(net));
  const raw = m.get(payerId);
  const cur = Number.isFinite(raw) ? raw : 0;
  m.set(payerId, Math.round((cur - diff) * 100) / 100);
  return Object.fromEntries(m);
}

/**
 * 戦略レジストリ。calculator から独立して切替可能にしておく。
 * 現状は manual のみ。auto 系（幹事自動・最少人数集中など）は将来追加。
 */
const STRATEGIES = new Map([
  [
    'manual',
    /** @param {Record<string, number>} net @param {number} diff @param {{ payerId?: string }} opts */
    (net, diff, opts) => applyManualAdjustment(net, diff, opts?.payerId),
  ],
]);

/**
 * 戦略を選択して差額調整を適用する。未対応戦略は no-op（net をそのまま返す）。
 *
 * @param {AdjustmentStrategy} strategy
 * @param {Record<string, number>} net
 * @param {number} diff
 * @param {{ payerId?: string }} [opts]
 */
export function applyAdjustment(strategy, net, diff, opts = {}) {
  const fn = STRATEGIES.get(strategy);
  if (!fn) return { ...(net ?? {}) };
  return fn(net, diff, opts);
}
