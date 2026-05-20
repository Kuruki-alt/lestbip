/**
 * Vitest setup — Node 25 のネイティブ localStorage スタブが jsdom と
 * 競合して round-trip しないため、テスト用に Map ベースの実装を window に注入する。
 * 本番（ブラウザ）には一切影響しない。
 */
const store = new Map();
const ls = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => {
    store.set(k, String(v));
  },
  removeItem: (k) => {
    store.delete(k);
  },
  clear: () => {
    store.clear();
  },
  key: (i) => Array.from(store.keys()).at(i) ?? null,
  get length() {
    return store.size;
  },
};

Object.defineProperty(globalThis.window, 'localStorage', {
  value: ls,
  configurable: true,
  writable: true,
});
