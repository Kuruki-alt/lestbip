# Lestbip!!

**Let's split the bill peacefully!** — 仲間との旅の出費を、まるっと山分けする割り勘アプリ。

「誰が・何に・いくら使ったか」を記録し、「最終的に誰が誰にいくら払えばいいか」を最小送金で算出します。RPG 風の冒険トーン（テーマ・職業アイコン）で、割り勘をちょっと楽しく。

🔗 **公開URL:** https://kuruki-alt.github.io/lestbip/
（`main` への push を契機に `.github/workflows/deploy.yml` が lint → test → build → GitHub Pages へ自動配信）

---

## 主な機能

### セッション（冒険）管理
- 新規作成・履歴からの再開・削除（すべて LocalStorage に永続化）
- メンバーは作成時に加えて、専用の**メンバー編集画面**でいつでも追加・削除

### 支払いの記録
- 「**[立替えた仲間] が [出費] に [金額] 使った**」の文章レイアウトで直感的に入力
- 追加・編集・削除
- 割り勘対象からの**除外**（その出費に関係ない人を外す）
- **均等割り＋固定額指定**（特定の人だけ金額を固定し、残りを均等割り）
- 端数処理（切り捨て / 切り上げ / 四捨五入）をセッション単位で選択

### 精算（山分け）
- **最小送金リスト**をライブ算出（貪欲法ヒューリスティック）
- 端数差額を引き受ける人を手動指定（`lib/adjustment.js`）

### 仲間どうしの直接の受け渡し
- 「A → B に ¥X」の返済を記録し、全体精算から差し引き
- **「いいよ！」ボタン**（後述）で“完済扱い”の免除を表現

### 共有
- セッションを Base64 で URL に載せて共有（`?s=...`）
- 同じセッションを**複数回開いても複製されない**（ID 一致で上書き取り込み）

### 設定（右上ハンバーガーメニューに集約）
- テーマ（系統 / ライト・ダーク） / 言語 / 通貨 / 運転手の負担を軽減 / 端数処理
- 表示設定は次回起動時も維持

---

## 「いいよ！」ボタンの計算ルール

立替えた人が特定の相手に「**この額だけ払えば完済でいいよ**」と免除する機能です。

- 免除された人は入力額（Y）だけ負担し、**完済として精算リストから消えます**
- 払わなかった残額（本来の負担 − Y）は、**立替えた人ではなく、残りの債務者が等分で肩代わり**します（立替えた人が損をしない）
- 他に債務者がいない場合のみ、立替えた人がかぶります
- 金額未入力（Y=0）の場合は、本来の負担を丸ごと他の債務者が肩代わり

> 例：A が 3 人分 30,000 円を立替（各 10,000 円）。B を「いいよ！」3,000 円にすると → **A 10,000 / B 3,000（完済） / C 17,000**

---

## 対応言語・通貨

- **言語:** 日本語 / English（外部 i18n ライブラリ不使用、`src/i18n/*.json`）
- **通貨:** 円 (JPY) / 米ドル (USD) / ユーロ (EUR) / カナダドル (CAD)
  - 円は整数、**それ以外は小数 2 桁（セント）**まで入力・計算に対応
  - セッション単位＋既定値の二段階（`Intl.NumberFormat` で表示）

---

## テーマ & アイコン

- 3 テーマ：妖精の泉（シンプル）/ 草原ステージ（ポップ・ピクセルフォント）/ 密林の天蓋（ダーク）。CSS 変数でトークン化
- 各画面に RPG 職業のドット絵アイコンを配置（勇者・戦士・魔法使い・僧侶・弓使い・シーフ・遊び人）
- ヘッダーのアプリ名横に勇者アイコン、ブラウザタブの favicon も勇者
- 各ページ背景に職業アイコンを薄く散りばめた装飾レイヤー

---

## 技術構成

- **Vite 5 + React 18 + Tailwind CSS**（CSS 変数でテーマトークン化）
- **状態管理:** React Context + useReducer（純粋 reducer と副作用フックを分離）
- **永続化:** LocalStorage（`lib/storage.js` がキー別 CRUD と prefs 部分マージを提供）
- **割り勘エンジン:** `lib/calculator.js`（純粋関数。割り勘・御者割・直接受け渡し・最小送金を独立実装）
- **テスト:** Vitest（`lib/*` と reducer の単体テスト 50 件）
- **CI/CD:** lint → test → build → GitHub Pages デプロイ（`actions/deploy-pages@v4`）

### ディレクトリ概要
```
src/
  components/
    layout/    AppLayout / TopBar / SettingsDrawer / IconBackdrop
    screens/   Home / NewSession / Session / Members / PaymentForm / DirectPayment / Settlement
    ui/        Button / Card / SegmentedToggle など
  hooks/       useSessions / useScreenRouter / useI18n / useTheme / useCurrency / useDriverDiscount
  lib/         calculator / adjustment / currency / share / storage / driverDiscount / ids
  store/       sessionsReducer / SessionsProvider
  i18n/        ja.json / en.json
  assets/icons/ 職業アイコン（透過 PNG）
```

---

## 開発コマンド

```bash
npm install
npm run dev      # http://127.0.0.1:5173/
npm run lint     # ESLint (flat config)
npm test         # Vitest（src/**/__tests__/**.test.js）
npm run build    # 本番ビルド
npm run preview  # ビルド成果物のプレビュー
```

---

## バージョンハイライト

- **v1.x** — 要件 §3 の機能要件をフル実装（セッション/メンバー/支払い/端数/差額調整/最小送金/URL共有/4通貨/テーマ/多言語/御者割）
- **v2.0.0** — アプリ名を「Lestbip!!」に統一。メンバー編集を専用画面へ分離。設定を右上ハンバーガーメニューに集約。「御者割」→「運転手の負担を軽減」に改名
- **v3.1** — 共有 URL でセッションが複製されない（ID 一致で上書き取り込み）
- **v3.2** — 支払い画面を文章レイアウト化。「いいよ！」を完済扱いに
- **v3.4** — ハンバーガーメニューにスライド開閉アニメーション
- **v3.5** — 支払い入力を 3 行の文章レイアウトに
- **v3.6** — 「いいよ！」の残債を**他の債務者が肩代わり**するルールに統一（立替人は損をしない）
- **v3.7** — 各画面に RPG 職業アイコンを配置
- **v3.8** — 勇者の favicon・タイトル横アイコン・背景の散りばめ装飾
- **v3.9** — 円以外の通貨で**小数 2 桁（セント）**の入力・計算に対応

---

## 目的

サブエージェント（Orchestrator / Coder / Reviewer）を用いた AI コーディングの練習題材。
