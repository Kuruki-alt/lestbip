import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/  (CLAUDE.md §1-4 / §2-2 準拠)
//
// GitHub Pages（Project Pages）配信用に build 時のみ base を `/lestbip/` に設定する。
// dev サーバ・preview 時はルート `/` のまま動作する。
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/lestbip/' : '/',
  resolve: {
    alias: {
      // パスエイリアス: @/components/... 形式で参照する
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 本番ソースマップ無効（CLAUDE.md §2-2）
    sourcemap: false,
    // チャンクサイズ警告閾値 500KB（CLAUDE.md §2-2）
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // サードパーティを vendor チャンクへ分離（CLAUDE.md §2-2）
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
}));
