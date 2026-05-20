import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import security from 'eslint-plugin-security';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

// CLAUDE.md §4 のルール指針に準拠した flat config
export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,

  // 全 js/jsx 共通ルール（React / Hooks / a11y / security / prettier）
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      security,
      prettier,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...prettierConfig.rules,

      // CLAUDE.md §4 必須ルール
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': 'error',
      'no-console': 'warn',
      'security/detect-object-injection': 'warn',
      'react/no-danger': 'error',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/aria-props': 'error',

      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'prettier/prettier': 'warn',
    },
  },

  // import/no-cycle は src 配下のアプリコードにのみ適用する。
  // ルート設定ファイル（vite.config.js 等）まで解決対象にすると
  // eslint-plugin-import が vite の exports 制限で解決不能になり
  // lint 自体がクラッシュするため、対象を src/** に限定する。
  // @ エイリアスを解決させて循環依存検出を実効化（CLAUDE.md §1-4 / §4）。
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': {
        alias: {
          map: [['@', './src']],
          extensions: ['.js', '.jsx', '.json'],
        },
        node: { extensions: ['.js', '.jsx'] },
      },
    },
    rules: {
      'import/no-cycle': 'error',
    },
  },
];
