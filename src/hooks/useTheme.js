import { useCallback, useEffect, useState } from 'react';

/** @typedef {'simple' | 'pop'} ThemeFamily */
/** @typedef {'light' | 'dark'} ColorMode */

/**
 * テーマ管理フック（要件 §5.2 / CLAUDE.md §6）。
 * - colorMode: ライト/ダーク（Tailwind の dark クラスで実切替）
 * - family: シンプル/ポップ（data-theme 属性で系統切替）
 *
 * ワイヤーフレームのため永続化はせず state 保持のみ。
 *
 * @param {{ family?: ThemeFamily, colorMode?: ColorMode }} [init]
 */
export function useTheme(init = {}) {
  // 状態の形状: { family: 'simple'|'pop', colorMode: 'light'|'dark' }
  const [family, setFamily] = useState(init.family ?? 'simple');
  const [colorMode, setColorMode] = useState(init.colorMode ?? 'light');

  // ルート要素へ実際にクラス/属性を反映する副作用
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', colorMode === 'dark');
    root.setAttribute('data-theme', family);
  }, [family, colorMode]);

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleFamily = useCallback(() => {
    setFamily((prev) => (prev === 'simple' ? 'pop' : 'simple'));
  }, []);

  return {
    family,
    colorMode,
    toggleColorMode,
    toggleFamily,
    setFamily,
    setColorMode,
  };
}
