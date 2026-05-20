/**
 * driverDiscount.js — 御者割（運転手割）の割引率ルール（独立モジュール）。
 *
 * 純粋関数のみ。御者割は「個別会計（各支払い）」と「全体支払い」の
 * 2 段階で指定でき、適用時は **全体の御者割が各支払いの御者割より優先**される。
 * （優先解決と実際の負担額算出は calculator.js の将来責務。
 *  本モジュールは距離→率の換算ルールのみを担う。）
 *
 * ルール: 移動距離 10km につき 1% 軽減。
 *
 * @param {number|string} km 移動距離（km）
 * @returns {number} 軽減率（パーセント, 0 以上の整数）
 */
export function distanceToDiscountPct(km) {
  const n = Number(km);
  if (!Number.isFinite(n) || n <= 0) {
    return 0;
  }
  return Math.floor(n / 10);
}
