import { useState } from 'react';

/** @typedef {import('@/lib/currency').CurrencyCode} CurrencyCode */

/**
 * 表示通貨を管理するフック（既定: JPY）。
 * ワイヤーフレームのため永続化はせず state 保持のみ。
 *
 * @param {CurrencyCode} [initial='JPY']
 * @returns {{ currency: CurrencyCode, setCurrency: (c: CurrencyCode) => void }}
 */
export function useCurrency(initial = 'JPY') {
  // 状態の形状: 'JPY' | 'USD' | 'EUR' | 'CAD'
  const [currency, setCurrency] = useState(initial);
  return { currency, setCurrency };
}
