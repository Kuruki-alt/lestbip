import { useCallback, useMemo, useState } from 'react';
import ja from '@/i18n/ja.json';
import en from '@/i18n/en.json';

/** @typedef {'ja' | 'en'} Lang */

// JSON 辞書を Map 化し、動的プロパティアクセス（object injection）を回避
const DICTIONARIES = new Map([
  ['ja', new Map(Object.entries(ja))],
  ['en', new Map(Object.entries(en))],
]);

/**
 * 簡易 i18n フック（外部ライブラリ不使用 / 要件 §5.4）。
 * 言語 state と翻訳関数 t を返す。
 *
 * @param {Lang} [initialLang='ja'] 初期言語
 * @returns {{ lang: Lang, setLang: (l: Lang) => void, toggleLang: () => void, t: (key: string) => string }}
 */
export function useI18n(initialLang = 'ja') {
  // 状態の形状: 'ja' | 'en'（UI言語）
  const [lang, setLang] = useState(initialLang);

  const dict = useMemo(
    () => DICTIONARIES.get(lang) ?? DICTIONARIES.get('ja'),
    [lang],
  );

  const t = useCallback(
    /** @param {string} key */
    (key) => dict.get(key) ?? key,
    [dict],
  );

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'ja' ? 'en' : 'ja'));
  }, []);

  return { lang, setLang, toggleLang, t };
}
