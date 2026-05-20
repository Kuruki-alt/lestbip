import { createContext } from 'react';

/**
 * React Context オブジェクト本体。
 * Provider コンポーネントは SessionsProvider.jsx で別ファイル化している
 * （react-refresh/only-export-components: ファイル分離で警告を回避）。
 */
export const SessionsContext = createContext(null);
