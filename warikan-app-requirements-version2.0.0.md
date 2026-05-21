# 割り勘アプリ v2.0.0 要求仕様 — Orchestrator → Coder / Reviewer

本文書はマルチエージェント開発フロー（CLAUDE.md §0 / agents/{orchestrator,coder,reviewer}.md）における
**オーケストレータが Coder と Reviewer に渡す公式要求仕様**である。
原典の改善案は `v2.0.0.md`、既存仕様（v1.1.0 で満たし済み）は `warikan-app-requirements.md` を参照する。

---

## 0. 全体方針

- ベースブランチ：`main`（v1.1.0 = tag `v1.1.0` がマージ済み）
- リリース目標：**v2.0.0**（UI/UX 構造を組み替えるためメジャーバンプ）
- ブランチ運用：各タスクごとに `feature/v2.x-<topic>` のテンポラリブランチを作成し PR で main へ統合する（マージ権限は Orchestrator のみ／本仕様でも踏襲）
- 既存の機能要件（`warikan-app-requirements.md` §3）は**すべて維持**する。本仕様は UI 構造の刷新が主、機能の追加・削除は限定的。
- CLAUDE.md §1〜§6 のガードレールを引き続き厳守（関数コンポーネント・PropTypes・key に index 不可・dangerouslySetInnerHTML 禁止・1ファイル300行を目安・@ エイリアス・テスト・i18n ja/en 完全 parity 等）。

---

## 1. 用語と前提

| 用語 | 意味（v1.1.0 既存） |
|---|---|
| `currentSession` | `useSessions().currentSession` で取得する現在開いているセッション |
| `patchSession(id, patch)` | 既存セッションへ部分マージで更新・LocalStorage 永続化 |
| `addMember(sessionId, name)` | 既存セッションへメンバー追加・永続化 |
| `removeMember(sessionId, memberId)` | 既存セッションからメンバー削除・永続化 |
| `useScreenRouter` | 簡易ルーター（state ベース）。現在 6 画面：home / newSession / session / paymentForm / directPayment / settlement |
| 設定 Card | v1.1.0 でセッション画面に追加した「冒険の設定」Card（端数モード／通貨切替）。本仕様で**廃止**する |
| TopBar | 画面上部のヘッダー。タイトル＋サブタイトル＋SegmentedToggle 群（言語／テーマ／ライト・ダーク／御者割／通貨）。本仕様で**設定トグル群を撤去**しタイトル＋ハンバーガーアイコンに簡素化する |
| Drawer | 画面右端からスライドインするオーバーレイパネル。背景はうっすら暗転、外側タップ／× ボタン／Esc キーで閉じる |

---

## 2. タスク分解

タスクは独立性を高めて並列化可能だが、依存関係に従う順序で 1 PR ずつ統合する想定。
推奨フェーズ順は §6 に記載。

### タスク #1：メンバー追加時の入力ボックス自動クリア

#### 概要
セッション画面のメンバー追加入力で、「追加」を押したあとも文字が残る／残らないが UI ごとにブレており、`v2.0.0.md` 項目1 で**追加成功後は必ず空にする**ことが求められた。

#### 要件
1. **対象画面**：v1.1.0 時点でメンバー追加入力を持つ全画面（`NewSessionScreen`、および本仕様タスク #2 で新設する `MembersScreen`）。
2. 「追加」ボタン押下／Enter キー押下時、空白除去後に名前が**非空**であれば `setDraftMember('')` 相当でテキストボックスを空にする。
3. 名前が空または空白のみの場合は、入力ボックスはそのまま（変更しない）。

#### 完了条件
- 名前を入力して追加 → 入力欄が空になり、追加されたメンバーがリストに現れる
- 連続して別名を追加できる（毎回空に戻る）
- 空白だけで追加を押しても無反応（既存挙動の維持）

---

### タスク #2：メンバー追加/管理を専用画面に分離

#### 概要
`v2.0.0.md` 項目2 の指示「セッション画面ではメンバー追加ボタンのみ、その先で専用画面に遷移」を実装。
ユーザー回答に基づき、**追加と削除を両方できる管理画面**として作る（単純な追加だけではない）。

#### 要件
1. 新画面 `MembersScreen` を `src/components/screens/MembersScreen.jsx` に新規作成。
2. ルーター（`src/hooks/useScreenRouter.js`）に `'members'` を追加し ScreenName 型と画面数コメントを更新（7 画面化）。
3. `App.jsx` に分岐と `goMembers` ハンドラを追加。
4. `SessionScreen.jsx` のメンバー Card は次のとおり改修：
   - メンバー一覧チップは引き続き表示（読み取り）。
   - 直下のテキスト入力＋「+仲間を追加」ボタンを**撤去**し、「**メンバー編集へ**」（仮ラベル）ボタンに置き換える。押下で `members` 画面へ遷移。
5. `MembersScreen` の機能：
   - ヘッダ：戻るボタン（`onBack` → セッション画面）、タイトル「メンバー編集」。
   - 既存メンバーをリスト表示し、各行に削除ボタン（`removeMember` を呼ぶ）。
   - 末尾にテキスト入力＋「+仲間を追加」ボタン。Enter キーでも追加可。
   - 追加成功時、テキストボックスは自動クリア（タスク #1 と整合）。
   - 「保存して戻る」ボタンは**不要**（操作はライブ反映）。「戻る」のみ。

#### 完了条件
- セッション画面の「メンバー編集へ」ボタンから `MembersScreen` に遷移できる。
- `MembersScreen` で追加・削除した結果が LocalStorage に即時反映され、セッション画面に戻ると反映済みのチップが見える。
- 遷移グラフが閉路を保つ（home ⇄ newSession / session ⇄ members / session ⇄ paymentForm / session ⇄ directPayment / session ⇄ settlement）。

---

### タスク #3：ハンバーガーメニュー（右上 Drawer）導入

#### 概要
`v2.0.0.md` 項目3 の指示「以下のオプションをハンバーガーメニューにまとめる」を実装。
ユーザー回答により**右からスライドする Drawer 形式**を採用。
含めるオプション：テーマ選択／通貨設定／言語設定／運転手割設定（タスク #5 で名称変更）／冒険設定（端数計算）。

#### 要件
1. `TopBar.jsx` の改修：
   - 既存の SegmentedToggle 群（言語・テーマ系統・ライト・ダーク・御者割）と通貨プルダウンを **撤去**。
   - 右端にハンバーガーアイコンボタン（`☰`）を配置（モバイル右上に親指で届く位置）。タイトル／サブタイトルは保持。
   - ボタン押下で Drawer 開閉。
2. 新コンポーネント `src/components/layout/SettingsDrawer.jsx`：
   - `open` `onClose` `t` `lang` `currency` `themeFamily` `colorMode` `driverDiscount` `rounding` および各 onChange を props で受け取る。
   - 画面右端からスライドイン。背景はうっすら暗転（オーバーレイ）。**オーバーレイクリック／× ボタン／Esc キー**で閉じる。
   - 中身は項目ごとのフォームコントロール（`SegmentedToggle` または `<select>` の組み合わせ）：
     - 言語（ja / en）
     - テーマ系統（simple / pop）
     - ライト/ダーク
     - 通貨（JPY / USD / EUR / CAD）
     - 運転手の負担を軽減（あり / なし）※タスク #5 で名称確定
     - 端数処理（切捨 / 切上 / 四捨五入）
3. a11y：
   - ハンバーガーボタンは `aria-label`（i18n キー `menu.open`）と `aria-expanded` を持つ。
   - Drawer は `role="dialog"` `aria-modal="true"` `aria-labelledby` 等を付与。
   - フォーカストラップは Phase 2.4 でのスコープ外（無くてもアクセシビリティの致命的な瑕疵にはならないが、Esc 閉じと外側クリック閉じは必須）。
4. 既存の `useTheme` / `useI18n` / `useCurrency` / `useDriverDiscount` フックの API は変更しない。Drawer は値の表示と変更ハンドラを props で受け取るだけにする。

#### 完了条件
- 任意の画面でハンバーガーアイコンが右上に常時表示される。
- アイコン押下で Drawer が右からスライドイン、再押下／オーバーレイクリック／× ボタン／Esc キーで閉じる。
- Drawer 内の各コントロールを操作すると、対応する状態が即時アプリに反映される（タスク #4 の効果範囲どおり）。
- TopBar には設定トグル群が一切残っていない（タイトル＋ハンバーガーのみ）。

---

### タスク #4：設定の効果範囲を「現在のセッションを直接変更」に統一・セッション設定 Card を廃止

#### 概要
ユーザー回答により、ハンバーガー内の設定（通貨／端数処理等）は**現在のセッションを直接変更**する位置づけと確定。
これに伴い、v1.1.0 でセッション画面に追加した「冒険の設定」Card（端数モード／セッション内通貨）は**廃止**する（重複・分散の排除）。

#### 要件
1. `SessionScreen.jsx` から `Card`「冒険の設定」を**まるごと削除**。関連の `roundingOptions` `handleRoundingChange` `handleSessionCurrency` `currencyOptions` も削除。i18n キー `session.settings` `session.rounding*` は `SettingsDrawer` で再利用するため**残す**。
2. ハンバーガー（`SettingsDrawer`）の各設定が変更されたとき：
   - **現在開いているセッションがある場合**：
     - 通貨：`patchSession(currentSession.id, { currency })`
     - 端数処理：`patchSession(currentSession.id, { rounding })`
   - **セッションが開いていない場合（ホーム表示時など）**：
     - 通貨：`useCurrency().setCurrency` を経由（既定通貨として保存、Phase 5 の prefs 永続化に乗る）
     - 端数処理：表示のみ、**新規セッション作成時の既定**として保存（`useRoundingDefault` を新設、Phase 5 の `pickPrefs`/`savePrefs` に `rounding` を加える）
   - 言語／テーマ系統／ライトダーク／運転手割：従来どおりグローバル設定（prefs 永続化）。
3. 新規セッション作成時（`createSession`）の `opts.rounding` には、上記グローバル既定（prefs の `rounding`）を渡す。`App.jsx` から `NewSessionScreen` に `defaultRounding` プロパティを渡し、`createSession` 呼び出し時に使う。
4. 設定変更の即時反映：
   - 通貨切替後、表示中の `SessionScreen`／`SettlementScreen` の金額表記が即更新される。
   - 端数切替後、`calculateSettlement` が再実行され、差額・送金リストが即変動する。

#### 完了条件
- セッション画面に「冒険の設定」Card が無い。
- ハンバーガーで通貨を変更すると、現在のセッションの `session.currency` が更新される（LocalStorage を確認して反映済み）。
- ハンバーガーで端数を変更すると、現在のセッションの `session.rounding` が更新され、精算結果が即変わる。
- セッションが開いていない状態でハンバーガーから通貨／端数を変更し、その後に新規セッションを作成すると、その値が新セッションの初期値として使われる。

---

### タスク #5：オプション「御者割／運転手割」を「**運転手の負担を軽減**」に名称変更

#### 概要
`v2.0.0.md` 項目3 の指示と、ユーザー回答に基づき**新ラベルは「運転手の負担を軽減」**に確定。
これは i18n のラベル変更のみで、計算ロジック・データ構造（`session.driverDiscount` 等）は不変。

#### 要件
1. i18n（ja）の `driver.label` を「御者割」→「**運転手の負担を軽減**」に変更。
2. i18n（en）の `driver.label` を「Driver discount」→「**Reduce driver's share**」（または同等の明確な英文）に変更。
3. その他、ハンバーガー内の表記に合わせて補足キー（例：`driver.menuDescription`「移動距離に応じて運転手の負担を割引します」）を追加してもよい（任意）。
4. 内部用語・コード上の識別子（`useDriverDiscount` `driverDiscount` `coachmanId` `distanceKm` 等）・関数名・ファイル名は**変更しない**（外部表記のみ変更）。
5. 既存テスト・関数名は不変、追加テストは不要。

#### 完了条件
- ハンバーガーや関連 UI のラベルが新名称で表示される（ja/en）。
- 既存の御者割計算（`lib/calculator.js`、`lib/driverDiscount.js`）は挙動・テスト結果ともに不変。
- i18n の ja/en キー数 parity が維持される。

---

### タスク #6：アプリ名を「わりかん」→「**Lestbip!!**」へ統一

#### 概要
`v2.0.0.md` 項目4 の指示。アプリのブランド名を統一。

#### 要件
1. i18n（ja）`app.title` を「わりかん」→「**Lestbip!!**」に変更。
2. i18n（en）`app.title` を「Warikan」→「**Lestbip!!**」に変更。
3. `index.html` の `<title>` を「わりかん / Warikan」→「**Lestbip!!**」に変更。
4. サブタイトル（`app.subtitle`）は現状の冒険トーン文言を維持してよい（変更不要）。
5. `README.md` 冒頭の見出しは既に「Lestbip!」だが、本タスク完了後に必要なら整合（`!!` 表記に揃えるかは任意。README は人間向けなので強制しない）。

#### 完了条件
- ブラウザタブの title が `Lestbip!!`。
- アプリ上部のタイトルが `Lestbip!!`（ja/en どちらでも）。

---

## 3. データ・スキーマ変更

本リリースで**スキーマ変更は無し**。`session.currency` `session.rounding` `session.members` `session.payments` `session.directPayments` `session.driverDiscount` `session.manualDiffPayerId` はすべて v1.1.0 と同一構造。
LocalStorage の prefs に **`rounding` キーを追加**する（タスク #4）。`pickPrefs` のホワイトリスト検証に `rounding: 'floor'|'ceil'|'round'` を追加し、未設定時の既定は `'floor'`。

既存ユーザーの LocalStorage（`lestbip/sessions/v1` `lestbip/prefs/v1`）は壊さない。`prefs` に新キーが無い場合は既定値で初期化される（既存の `pickPrefs` のフォールバックパターン）。

---

## 4. 非機能要件・遵守事項

- **CLAUDE.md §1〜§6 を全項目厳守**。違反は Reviewer の差戻し対象。
- ESLint：エラー 0／警告 0 を維持（既存ベースライン）。
- Vitest：既存 40 件を含め全テスト pass。新規追加コンポーネントに対するテストは強制しないが、reducer 改変や `pickPrefs` 拡張など純粋関数の変更は対応する単体テストを追記する。
- i18n：ja / en キー数 parity 完全一致。
- 通信なし／環境変数：`Press Start 2P` Google Fonts のみ既存外部依存。新規追加は原則行わない。
- a11y：ハンバーガー＋ Drawer の `aria-*` を §1-3 の jsx-a11y ルールに合致させる。
- 1 ファイル 300 行以内（超過時はサブコンポーネント分離）。

---

## 5. レビュー観点（Reviewer 用）

各 PR で次を確認すること（CLAUDE.md §0-4 の優先順）：

1. **バグ・ロジック**：
   - メンバー追加後の入力クリアが効くか
   - Drawer の開閉とキー操作（Esc／外側クリック／× ボタン）が正しく動くか
   - 設定変更が「現在セッションへ即反映」「セッション未開時は既定として保存」の両モードで正しく分岐するか
   - 端数モード変更で `calculateSettlement` の差額が即更新されるか
2. **セキュリティ**：dangerouslySetInnerHTML／eval なし、外部入力の安全な扱い、prefs の値はホワイトリスト検証されているか。
3. **パフォーマンス**：派生配列は `useMemo`、ハンドラは `useCallback`、Drawer のオーバーレイクリックハンドラがリスト内で生成されていないか。
4. **コーディング規約**：関数コンポーネント・PropTypes 完全・default export のみ・@ エイリアス使用・1ファイル300行・命名規則（`SettingsDrawer.jsx` は PascalCase でファイル名=コンポーネント名）。
5. **受け入れ条件**：本仕様の各タスク「完了条件」全項目を満たすか。
6. **§5 チェックリスト**：`npm run lint` `npm run build` `npm test` がすべて 0 エラーで通過。
7. **i18n parity**：`Object.keys(ja.json).length === Object.keys(en.json).length` かつキー集合一致。

---

## 6. フェーズ分け案（推奨）

各フェーズは独立した PR とし、テンポラリブランチ `feature/v2.x-*` を切る。

| Phase | ブランチ名 | 含むタスク |
|---|---|---|
| 2.1 | `feature/v2.1-app-name` | #6 アプリ名変更 + #1 入力クリア（小さい修正をまとめる） |
| 2.2 | `feature/v2.2-members-screen` | #2 メンバー画面分離 |
| 2.3 | `feature/v2.3-settings-drawer` | #3 ハンバーガー＋Drawer 導入（既存 TopBar トグル群は撤去）／#4 設定の効果範囲統一・Card 廃止／#5 名称変更 — UI 構造を一括でひっくり返すため一気に当てる |
| 2.4（任意） | `feature/v2.4-polish` | 細かい UX 調整・追加テスト・ドキュメント更新 |
| リリース | `release/v2.0.0` | `package.json` を 2.0.0 に bump、README 更新、タグ `v2.0.0` |

各 Phase の PR で：
- ブランチ作成 → 実装 → lint/test/build 通過 → PR
- Reviewer は §5 観点でレビュー
- 全観点 OK ならマージ → 次フェーズへ

---

## 7. 完了報告フォーマット（Coder → Reviewer / Orchestrator）

各 PR 終了時に次の項目を README コメントもしくは PR 本文に含めること（CLAUDE.md §0-6 と整合）。

- 含まれるタスク番号と概要
- 変更ファイル一覧
- `npm run lint` / `npm test` / `npm run build` の結果サマリ
- i18n ja/en parity 件数
- スクリーンショット（任意）

---

## 8. 未決事項・将来検討（v2.0.0 では着手しない）

- 差額調整の自動割り当て方式（幹事自動負担／最少人数集中）— `applyAdjustment` の戦略レジストリで将来追加
- セッションの編集ロック・読み取り専用共有
- 端数処理単位の柔軟化（10円単位丸めなど）
- E2E テスト（Playwright 等）の追加

---

*最終更新：2026-05-21 — v1.1.0 リリース直後・v2.0.0 改修要求として作成*
