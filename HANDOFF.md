# HANDOFF — Lestbip!! 開発引き継ぎ

> このファイルは、まっさらな Claude Code セッションがこのプロジェクトの開発を同等レベルで再開するための引き継ぎ資料です。最終更新時点のタグは **v3.9.0**（main にマージ済み）、未マージの PR が 3 本あります（後述）。

---

## 0. まず読む（最重要・作業の進め方）

このプロジェクトはユーザーが指示 → こちらが実装 → **PR を作ってユーザーが手動マージ** → 「マージした！タグ切って！」→ こちらがタグ付け、というリズムで進んでいます。

### 標準フロー（1機能 = 1ブランチ = 1PR）
1. `git checkout main && git pull --ff-only origin main`
2. `git checkout -b feature/vX.Y.Z-<slug>`（命名は下記）
3. 実装
4. 検証: `npx vitest run` → `npx eslint .`（警告は `npx eslint . --fix`）→ `npm run build` を**必ず全部通す**
5. コミット（メッセージ末尾に `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`）
6. `git push -u origin <branch>`
7. **`gh` CLI は未インストール**。PR は作れないので、**PR 作成 URL（push 時に表示される `.../pull/new/<branch>`）＋ Title ＋ Body（Markdown）をチャットに出力**する。Body 末尾は `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
8. ユーザーが GitHub 上で手動マージ
9. ユーザーが「マージした！タグ切って！」と言う → `git fetch && git checkout main && git pull --ff-only` → `git tag -a vX.Y.Z <merge-sha> -m "..."` → `git push origin vX.Y.Z`

### バージョン/ブランチ命名
- 機能追加・機能改善は **マイナー昇格**（`v3.8.0` → `v3.9.0`）。ブランチ名にも版を入れる：`feature/v3.9.0-decimal-amounts`
- ユーザーがしばしば版を指定/訂正する（例: 提案 `v3.0.1` → ユーザー希望で `v3.1.0` に rename）。**版は提案しつつ、ユーザーの指定を優先**。rename する場合は `git branch -m`＋コミット `--amend`＋新ブランチ push＋旧リモートブランチ削除。
- ドキュメントのみの変更はタグ無しでよい（branch 例: `docs/readme-refresh`）。

### ユーザーの恒常ルール（厳守・原文）
- 「インターネット上にアップロードするような作業以外は原則、User許可を求めなくて良いものとする。曖昧なもののみ聞くこと。」
- 「マージリクエスト作成時は必ずテンポラリブランチを切ること」
- **マージはユーザーが行う**（こちらはマージしない）。

### 環境メモ
- 作業ディレクトリ: `/Users/hayashiraiki/ai-coding/lestbip`（git コマンドは毎回 `cd` してから。シェルの cwd が `/Users/hayashiraiki/ai-coding/peasp` にリセットされる癖がある）
- リモート: `https://github.com/Kuruki-alt/lestbip`
- 公開URL: https://kuruki-alt.github.io/lestbip/ （main push で `.github/workflows/deploy.yml` が lint→test→build→Pages 配信）
- マルチエージェント運用前提（`CLAUDE.md` と `agents/` に Orchestrator/Coder/Reviewer 定義）。コーディング規約も CLAUDE.md 準拠（flat ESLint、本番 sourcemap 無効、vendor チャンク分離、chunk 500KB 閾値）。

---

## 1. プロダクト概要

**Lestbip!!** = 旅の出費を山分けする割り勘 PWA 的 SPA。「誰が・何に・いくら使ったか」を記録し、最小送金で精算する。RPG 冒険トーン（テーマ・職業ドット絵アイコン）。

### 画面（7つ / `useScreenRouter` の簡易ルーター、react-router 不使用）
`home / newSession / session / members / paymentForm / directPayment / settlement`

- **Home**: 新規作成 CTA ＋ 履歴一覧（再開/削除）。勇者アイコンを大きく表示
- **NewSession**: 冒険名＋メンバーを集めて作成（追加後は入力欄クリア）
- **Session**: メンバー表示・「メンバー編集へ」ボタン・出費一覧・直接受け渡し一覧・山分けサマリ・URL共有
- **Members**: メンバー追加/削除の専用画面
- **PaymentForm**: 出費の追加/編集。**文章レイアウト**入力（後述）
- **DirectPayment**: 仲間どうしの返済記録＋「いいよ！」ボタン
- **Settlement**: 最小送金の詳細・端数引受の手動指定・全体御者割設定

### 設定（右上ハンバーガー → SettingsDrawer に集約）
テーマ系統 / ライト・ダーク / 言語 / 通貨 / 運転手の負担を軽減 / 端数処理。表示設定は LocalStorage 永続化。

### 対応
- 言語: **日本語 / English のみ**（`src/i18n/ja.json` `en.json`、外部 i18n ライブラリ不使用。ja/en の**キー parity を必ず保つ**）
- 通貨: JPY / USD / EUR / CAD。**円は整数、それ以外は小数2桁（セント）**まで入力・計算対応

---

## 2. 「いいよ！」ボタンの計算ルール（最重要・何度も改修した箇所）

立替えた人が特定の相手に「**この額(Y)だけ払えば完済でいいよ**」と免除する機能。仕様の原典は `iiyo.md`。実装は `src/lib/calculator.js` の `calculateSettlement` 内、directPayments ループ。

データモデル: 直接受け渡し `{ fromId, toId, amount, waived? }`。`from`=渡す/免除される債務者、`to`=受け取る/立替えた人。`waived:true` が「いいよ！」。

### 現行ルール（v3.6.0 で確定、決して安易に変えない）
1. **Y を実支払いとして計上**（Y = `min(入力額, from の現在の負債 D)` でクランプ）: `paid[from]+=Y, burdens[to]+=Y`
2. **from を完済に**: 転送後に残る負債を `burdens[from]` から外す → from の net = 0 → **最小送金（見通し）から消える**
3. **残債は from・to を除く「他の債務者(net<0)」が等分肩代わり**（`burdens` に加算）。→ **立替えた to は損をしない**
4. 他に債務者がいなければ立替えた to が暗黙的にかぶる（net が残る＝受取減）
5. `amount=0` も同ロジック（Y=0 → 残債全額を他の債務者へ）。from が黒字なら何もしない。

> 検証例（calculator.test.js）: A が 30,000 を立替・3人均等、B を「いいよ」3,000 → **A 10,000 / B 3,000(完済) / C 17,000**、見通しは「C → A 17,000」のみ。

### 改修の経緯（同じ轍を踏まないため）
- v3.0.0: waived は当初 from の net を 0 にするだけ（to/他に波及せず立替人が宙に浮く）
- v3.1.0: amount>0 のとき残債を「from 以外の全員(to 含む)」で等分 ← のち破棄
- v3.2.1: waived の amount>0 で Y を実支払い計上していなかった不具合（見通しに from が残る）を修正
- **v3.6.0**: `iiyo.md` 準拠に統一。残債は「**from・to を除く他の債務者**」が肩代わり（立替人は損しない）。← 現行
- 表示: SessionScreen の直接受け渡し一覧は「from → to ¥金額」の単一表示（v3.2.0 で ±表記を試したが v3.3.0 で撤回）。取り消し線なし。

---

## 3. 文章レイアウトの支払い入力（v3.5.0）

PaymentForm 上部の主要3入力を文章化。
- 日本語: **3行**「`[立替えた仲間] が` / `[出費名] に` / `[金額] 使った`」
- 英語: 1行インライン「`[payer] paid [total] for [name].`」
- i18n キー: `payment.sentenceP1/P2/P3`（ja=「が」「に」「使った」、en=「paid」「for」「.」）。lang により JSX 側で入力順を切替。

---

## 4. コード構成

```
src/
  App.jsx                      ルート。画面分岐・各 use* フック・Drawer 配線・?s= 取り込み
  components/
    layout/  AppLayout / TopBar(☰のみ) / SettingsDrawer(設定集約) / IconBackdrop(背景装飾)
    screens/ Home / NewSession / Session / Members / PaymentForm / DirectPayment / Settlement
    ui/      Button / Card / SegmentedToggle(self-start 付き) など
  hooks/     useSessions / useScreenRouter / useI18n / useTheme / useCurrency / useDriverDiscount
  lib/       calculator.js(割り勘エンジン・純粋関数) / adjustment.js / currency.js
             / share.js(Base64 URL) / storage.js(LocalStorage) / driverDiscount.js / ids.js / icons.js
  store/     sessionsReducer.js(純粋 reducer) / SessionsProvider.jsx / sessionsContextValue
  i18n/      ja.json / en.json（キー parity 必須）
  assets/icons/  職業アイコン透過PNG（yuusha/sensi/mahoutukai/souryo/yumitukai/sirhu/asobinin）
public/      favicon.png(勇者) / favicon.svg(旧・未使用) / icons.svg
```

### 重要モジュールの要点
- **calculator.js**: `calculateSettlement(session)` が中心。`allocatePayment`(均等＋固定額＋御者割) → directPayments 反映(通常/waived) → 端数差額 → net → `minimumTransfers`(貪欲法)。`applyRounding(value, mode, decimals)` は通貨桁数(JPY=0/他=2)で丸め、FP誤差は `toFixed(6)` 吸収。`currencyDecimals` を currency.js から import。
- **sessionsReducer.js**: `CREATE_SESSION / UPSERT_SESSION(共有URL重複防止・同id上書き) / OPEN/CLOSE / DELETE / RENAME / ADD_MEMBER / REMOVE_MEMBER / PATCH_SESSION`。`updatedAt` 降順ソート。
- **useSessions.js**: dispatch＋LocalStorage 永続化をまとめた公開 API。`importSession` は template の id を保持して UPSERT（共有しても複製されない、v3.1）。
- **share.js**: セッションを URL-safe Base64 で `?s=...` にエンコード/デコード。
- **currency.js**: `SUPPORTED_CURRENCIES` / `currencyDecimals` / `formatAmount`(Intl.NumberFormat)。
- **テーマ**: CSS 変数トークン（`app-bg/app-text/app-accent/...`）。3系統（妖精の泉=シンプル / 草原ステージ=ポップ+ピクセルフォント / 密林の天蓋=ダーク）。

---

## 5. 検証コマンド

```bash
cd /Users/hayashiraiki/ai-coding/lestbip
npm install
npm run dev      # http://127.0.0.1:5173/ （base は dev では '/'、build 時のみ '/lestbip/'）
npm run lint     # ESLint flat config（prettier 警告は --fix で解消）
npm test         # Vitest（現在 50 件）
npm run build    # 本番ビルド（GitHub Pages 用に base=/lestbip/）
```
- テストは `src/**/__tests__/**/*.test.{js,jsx}`。`calculator.test.js` が割り勘ロジックの要。
- 注意: 画像の透過は元データがチェッカー柄焼き込み＆alpha無しだったため、四辺からの flood fill で背景透過→トリム→256px 化して `src/assets/icons/` に置いている（元 `icons/` は未コミットのローカル素材）。

---

## 6. バージョン履歴（タグ済み）

- v1.0.0 ワイヤーフレーム / v1.1.0 機能要件フル実装（Phase1-5）
- v2.0.0 「Lestbip!!」改名・メンバー編集分離・設定をハンバーガー集約・「御者割」→「運転手の負担を軽減」
- v3.0.0〜 改修案（`v3.0.0.md`）対応:
  - v3.1.0 共有URL重複防止 / 文章入力・waived改修系
  - v3.2.0 直接受け渡し ±表記（→v3.3.0で撤回）/ v3.2.1 waived実支払い計上修正
  - v3.4.0 ドロワーのスライドアニメ
  - v3.5.0 支払い入力3行文章化
  - **v3.6.0 いいよ計算を iiyo.md 準拠に統一（現行ルール）**
  - v3.7.0 各画面に職業アイコン
  - v3.8.0 勇者favicon・タイトル横アイコン・背景散りばめ（IconBackdrop）
  - **v3.9.0 非円通貨の小数2桁入力・計算（最新マージ済み）**

---

## 7. 現在オープン中の PR（未マージ）

いずれも main 直系・独立。順不同でマージ可。

1. **`docs/readme-refresh`** — README を現行機能（〜v3.9.0）に全面刷新。誤記「ドイツ語対応」を ja/en に修正。タグ不要。
2. **`feature/v3.10.0-copyright-footer`** — 全ページ最下部に `© 2026 Kuruki-alt. All rights reserved.` を AppLayout のフッターで表示。マージ後 `v3.10.0` タグ予定。
3. **`docs/handoff-context`** — この HANDOFF.md（本ファイル）。タグ不要。

> マージ順が前後すると、後発 PR の base 差分は GitHub 側で自動整理される。`package.json` の `version` は `1.1.0` のまま（README/タグとは別管理。揃える指示があれば対応）。

---

## 8. 次にやりそうなこと / 注意点

- ユーザーは計算の正確性に敏感。`calculator.js` を触るときは必ず `calculator.test.js` を更新し、`iiyo.md` の本例と整合させる。
- UI 変更時はブラウザ確認をユーザーに依頼（こちらは dev サーバー起動＋配信検証までは可能、見た目の最終判断は人間）。
- アイコン/画像が「表示されない」と言われたら、まずデプロイ反映待ち or ブラウザキャッシュ（Cmd+Shift+R）を案内。コード→ビルド→dev配信の3段で実在を検証できる。
- 新しい改修依頼は `vX.Y.Z.md` や `iiyo.md` のような仕様メモで来ることが多い。まず読み、曖昧点だけ AskUserQuestion で確認してから着手。
