# Lestbip!

Let's split the bill peacefully!
割り勘計算するアプリです。

### ざっくり機能概要

"誰が何に対していくら支払ったのか"を集計し、"最終的に誰にいくら払えば良いか"を計算します。

### ポイント

・割り込み支払いをどのタイミングであっても許容し、それを考慮して全体計算の再集計を行います。

### 対応

・言語: 日本語、英語、ドイツ語
・通貨: 円、ドル、カナダドル、ユーロ

# 目的
サブエージェントを使用したAIコーディング練習題材

# Github Pages
https://kuruki-alt.github.io/lestbip/ （main への push を契機に `.github/workflows/deploy.yml` が自動ビルド・配信）

---

## v1.1.0：機能要件フル実装

要件定義書（`warikan-app-requirements.md`）の §3 機能要件を通しでカバー。
Phase 1〜5 で段階的に v1.0.0 のワイヤーフレームから動作するアプリへ進化させた。

### 実装済み
- セッション管理：作成・履歴・再開（LocalStorage 永続化、要件§3.1）
- メンバー管理：作成時＋セッション中の後追加（§3.2）
- 支払い記録：追加・編集・削除（§3.3）／割り勘対象除外（§3.4）／均等＋固定金額（§3.5）
- 端数処理：切捨・切上・四捨五入をセッション設定で切替（§3.6）
- 差額調整：手動で負担者指定（§3.7、`lib/adjustment.js` 独立モジュール）
- 精算結果：最小送金リストをライブ算出（§3.8、貪欲法ヒューリスティック）
- URL シェア：Base64 でセッションをエンコード、`?s=...` で取り込み（§3.9）
- 4通貨対応：JPY/USD/EUR/CAD、セッション単位＋既定の二段階（§3.11、Intl.NumberFormat）
- テーマ：妖精の泉（シンプル）／草原ステージ＋ピクセルフォント（ポップ）／密林の天蓋（ダーク）、次回起動も維持（§5.2）
- 多言語：ja/en、冒険トーンの和訳（§5.4）
- オプション：御者割（10km/1%、全体＞個別、§7 将来拡張への独立モジュール化）
- 「いいよ！」：金額不問で完遂、🙆 バッジで履歴表示

### 技術構成
- Vite 5 + React 18 + Tailwind / CSS変数トークン化
- 状態管理：React Context + useReducer（純粋 reducer + 副作用フック分離）
- 永続化：LocalStorage（`storage.js` がキー別 CRUD と prefs 部分マージを提供）
- テスト：Vitest（lib/* と reducer の単体テストで 40 件）
- CI：lint → test → build → GitHub Pages デプロイ（`actions/deploy-pages@v4`）

### 開発コマンド
```bash
npm install
npm run dev      # http://127.0.0.1:5173/
npm run lint     # ESLint (flat config / CLAUDE.md §4)
npm test         # Vitest（src/**/__tests__/**.test.js）
npm run build    # 本番ビルド
```

### 未着手・将来検討
- §7：差額調整の自動割り当て（幹事自動負担／最少人数集中など）— `applyAdjustment` 戦略レジストリで追加余地あり
- UI 細部の磨き込み・E2E テスト

