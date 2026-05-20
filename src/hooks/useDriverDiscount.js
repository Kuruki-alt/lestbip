import { useCallback, useState } from 'react';

/**
 * 御者割（運転手割）オプションの有効/無効を管理するフック。
 *
 * - オプション機能のため初期値は無効（false）。
 * - 有効時のみ、御者（運転した仲間）と移動距離に応じて
 *   10km につき 1% 御者の負担を軽減する（計算本体は calculator.js の将来責務）。
 *
 * ワイヤーフレームのため永続化はせず state 保持のみ。
 *
 * @param {boolean} [initialEnabled=false] 初期の有効状態（既定: 無効）
 * @returns {{ enabled: boolean, setEnabled: (v: boolean) => void, toggle: () => void }}
 */
export function useDriverDiscount(initialEnabled = false) {
  // 状態の形状: boolean（御者割が有効かどうか）
  const [enabled, setEnabled] = useState(initialEnabled);

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  return { enabled, setEnabled, toggle };
}
