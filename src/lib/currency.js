/**
 * currency.js — 多通貨対応（円・米ドル・ユーロ・カナダドル）。
 * Intl.NumberFormat を用いて言語ロケールに応じた書式で表示する。
 * JPY は小数なし、その他は小数 2 桁。
 *
 * @typedef {'JPY' | 'USD' | 'EUR' | 'CAD'} CurrencyCode
 */

/**
 * 対応通貨カタログ。プルダウンの選択肢として使用する。
 * @type {{ code: CurrencyCode, labelJa: string, labelEn: string }[]}
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'JPY', labelJa: '円 (¥)', labelEn: 'JPY (¥)' },
  { code: 'USD', labelJa: '米ドル ($)', labelEn: 'USD ($)' },
  { code: 'EUR', labelJa: 'ユーロ (€)', labelEn: 'EUR (€)' },
  { code: 'CAD', labelJa: 'カナダドル (CA$)', labelEn: 'CAD (CA$)' },
];

/** 動的プロパティアクセス（object injection）を避けるため Map で保持 */
const LANG_LOCALES = new Map([
  ['ja', 'ja-JP'],
  ['en', 'en-US'],
]);

/**
 * 通貨書式化。
 *
 * @param {number} amount       金額
 * @param {CurrencyCode} currency 通貨コード
 * @param {'ja'|'en'} lang        表示言語（ロケール選択用）
 * @returns {string} 例: "¥6,900" / "$6,900.00" / "€6,900.00" / "CA$6,900.00"
 */
export function formatAmount(amount, currency, lang) {
  const locale = LANG_LOCALES.get(lang) ?? 'ja-JP';
  const fractionDigits = currency === 'JPY' ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(amount);
}
