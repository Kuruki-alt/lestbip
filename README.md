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
https://kuruki-alt.github.io/lestbip/ （v1.0.0 デプロイ後に公開予定。`.github/workflows/deploy.yml` が main への push を契機に自動ビルド・配信）

---

## 開発（v1.0.0 ワイヤーフレーム）

中忠実度・クリック遷移ありのワイヤーフレームを Vite + React + Tailwind で実装。6画面（ホーム／新規セッション／セッション／支払い記録／個人間支払い／精算結果）、テーマ（妖精の泉・草原ステージのピクセル・密林の天蓋ダーク）、言語（ja/en）、御者割（10km/1%）、4通貨（JPY/USD/EUR/CAD）。割り勘計算・最小送金・LocalStorage・URLシェアは未実装（`src/lib/` に独立モジュール雛形）。

```bash
npm install
npm run dev      # http://127.0.0.1:5173/
npm run lint     # ESLint (flat config / CLAUDE.md §4)
npm run build    # 本番ビルド
```

