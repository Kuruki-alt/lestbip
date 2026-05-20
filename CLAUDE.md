# Claude Code ガードレール — React / Vite / JavaScript

> このファイルはプロジェクトルートに配置し、Claude Code が参照する規約集です。
> ここに定義されたルールは **すべての実装・修正・リファクタリングで必ず遵守** してください。

---

## 0. マルチエージェント開発フロー

> このセクションはオーケストレータ（統率者）専用の行動規範です。
> サブエージェント（dev-* / reviewer-*）はセクション 1 以降のガードレールに従って実装・レビューを行ってください。
> Gitリポジトリへのマージ権限は、Orchestratorのみが持ち、他のCoder及びReviewerはその権限を持ちません。

### エージェント構成

| ロール | 人数 | 識別子 |
|---|---|---|
| オーケストレータ（統率者） | 1 | `orchestrator` |
| 開発エージェント | 3 | `dev-1` / `dev-2` / `dev-3` |
| レビューエージェント | 3 | `reviewer-1` / `reviewer-2` / `reviewer-3` |

### 全体フロー

```
[オーケストレータ]
    │
    ├─ タスク分解 & 仕様策定
    │
    ▼
[開発フェーズ] ─ dev-1, dev-2, dev-3 を並列起動
    │  全員が同一要件でコードを実装
    │  完了後、3案をオーケストレータへ返却
    │
    ▼
[採択フェーズ] ─ オーケストレータが最善案を1つ選定
    │
    ▼
[レビューループ] ─ reviewer-1, reviewer-2, reviewer-3 を並列起動
    │  全員OKになるまでループ（上限30回）
    │
    ├─ 全員OK → 完成物を確定
    └─ 30回超過 & 過半数OK → 非満場一致レポートとともに完成物を渡す
```

---

### フェーズ 0-1：タスク分解（オーケストレータ）

開発開始前に以下を必ず行うこと。

1. ユーザー要件を読み込み、**機能単位のタスクリスト**を作成する。
2. 各タスクに対して以下を明文化する。
   - 実装する機能の説明
   - 受け入れ条件（Acceptance Criteria）
   - 使用技術の制約（本プロジェクトは React / Vite / JavaScript）
3. タスクリストを確定させてから開発フェーズへ進む。

---

### フェーズ 0-2：開発フェーズ（dev-1 / dev-2 / dev-3）

**起動条件**：オーケストレータがタスクを確定させた後、3エージェントを同時並列で起動する。

各開発エージェントへの共通指示テンプレート：

```
あなたは React / Vite / JavaScript の開発担当エージェントです。
以下の仕様および本 CLAUDE.md のセクション 1〜6 のガードレールに厳密に従い、
独立してコードを実装してください。

【仕様】
{orchestrator がここに仕様を挿入}

【受け入れ条件】
{orchestrator がここに受け入れ条件を挿入}

【出力フォーマット】
## 実装案（{dev-1 / dev-2 / dev-3}）
### ファイル構成
（ツリー形式で記載）

### コード
（ファイルごとにコードブロックで記載）

### 実装の意図・工夫点
（箇条書きで記載）
```

3エージェント全員が実装を完了したらオーケストレータへ結果を返す。

---

### フェーズ 0-3：最善案採択（オーケストレータ）

以下の観点で3案を比較し、**1案を採択**する。

| 観点 | 説明 |
|---|---|
| 可読性 | コードが明快で保守しやすいか |
| パフォーマンス | 不要な再レンダリングや非効率な処理がないか |
| 拡張性 | 機能追加に対応しやすい設計か |
| 仕様準拠 | 受け入れ条件をすべて満たしているか |
| ガードレール遵守 | 本 CLAUDE.md のルールに違反していないか |

採択結果は以下の形式でまとめること。

```
## 採択結果
- 採択案：{dev-X}
- 採択理由：（簡潔に）
- 不採択案の主な問題点：（dev-Y: ..., dev-Z: ...）
```

採択案のコードをそのままレビューフェーズへ渡す。

---

### フェーズ 0-4：レビューループ（reviewer-1 / reviewer-2 / reviewer-3）

**起動条件**：採択案が確定した後、3エージェントを同時並列で起動する。

各レビューエージェントへの共通指示テンプレート：

```
あなたは React / Vite / JavaScript のコードレビュー担当エージェントです。
以下のコードを、本 CLAUDE.md のセクション 1〜6 のガードレールおよび受け入れ条件に照らして
厳格にレビューし、判定を返してください。

【レビュー対象コード】
{orchestrator がここにコードを挿入}

【受け入れ条件】
{orchestrator がここに受け入れ条件を挿入}

【レビュー観点】（優先順）
1. バグ・ロジックエラーの有無
2. セキュリティリスク（XSS・環境変数の露出・認証など CLAUDE.md §3 参照）
3. パフォーマンス問題（不要なレンダリング・インライン関数など CLAUDE.md §2 参照）
4. コーディング規約（命名・構造・Hooks ルールなど CLAUDE.md §1 参照）
5. 受け入れ条件の充足
6. コミット前チェックリスト（CLAUDE.md §5）の全項目クリア

【出力フォーマット】
## レビュー結果（{reviewer-1 / reviewer-2 / reviewer-3}）
### 判定
OK / NG （どちらか一方を明記）

### 指摘事項
（NGの場合のみ。ファイル名・行番号・違反ルール・修正提案を箇条書きで記載）

### コメント
（任意。OK時の所見や改善提案など）
```

**ループ制御ルール**：

```
review_count = 0
MAX_LOOP = 30

while true:
    review_count += 1
    reviewer-1, reviewer-2, reviewer-3 を並列起動してレビューを実行

    ok_count = OK を返したレビュワーの数

    if ok_count == 3:
        → 全員OK：レビュー完了。完成物を確定する。
        break

    if review_count >= MAX_LOOP:
        if ok_count >= 2:
            → 上限超過・過半数OK：非満場一致レポートを作成して完成物を渡す。
        else:
            → 上限超過・過半数NG：ユーザーへ状況を報告し指示を仰ぐ。
        break

    → NGあり：指摘事項をまとめ、dev-1 へ修正を依頼する。
    修正完了後、次のループへ進む。
```

---

### フェーズ 0-5：修正対応（レビューループ内）

レビューでNGが出た場合の修正指示テンプレート：

```
## 修正依頼（ループ {N} 回目）

### 修正対象コード
{現在のコード}

### 指摘事項まとめ
{reviewer-1 の指摘}
{reviewer-2 の指摘}
{reviewer-3 の指摘}

上記すべての指摘を解消するようコードを修正してください。
修正箇所には // FIXED: コメントを付けること。
```

---

### フェーズ 0-6：完了報告（オーケストレータ）

**全員OK の場合**：

```
## 開発完了レポート

- ステータス：完了（全レビュワー承認）
- レビューループ回数：{N} 回
- 最終採択案：{dev-X}

### 最終成果物
{最終コード}
```

**上限超過・過半数OK の場合**：

```
## 開発完了レポート（非満場一致）

- ステータス：完了（満場一致には至らず）
- レビューループ回数：30回（上限到達）
- 承認：{ok_count} / 3

### 未解決の指摘事項
{NGを出し続けたレビュワーの最終指摘内容}

### オーケストレータ見解
{指摘が解消できなかった理由の分析}

### 最終成果物
{最終コード}
```

---

### オーケストレータの行動原則

- **並列実行の管理**：開発フェーズとレビューフェーズは必ず並列起動し、全エージェントの完了を待ってから次フェーズへ進む。
- **コンテキスト継承**：各エージェント起動時は、タスク仕様・受け入れ条件・現在のコードを必ず渡す。本 CLAUDE.md も参照先として明示すること。
- **判断の透明性**：採択・ループ制御・完了判断の根拠を必ずログとして残す。
- **ユーザーへの報告**：上限超過時および過半数NGで打開策がない場合はユーザーへ状況を報告し、次のアクションを確認する。

---

## 技術スタック

| 項目 | 採用技術 |
|------|----------|
| 言語 | JavaScript (ES2022+) |
| UIフレームワーク | React 18+ |
| ビルドツール | Vite 5+ |
| パッケージマネージャー | npm or pnpm |
| リンター | ESLint (flat config) |
| フォーマッター | Prettier |

---

## 1. コード品質・設計パターン

### 1-1. コンポーネント設計

```
# 禁止
- クラスコンポーネントの新規作成（既存の移行もしない限り触れない）
- コンポーネントファイル内に 300 行を超えるコードを書くこと（分割を検討する目安として捉え、超える場合は理由をコメントで明記すること）
- props のバケツリレー（3 階層以上の prop drilling）
- コンポーネントの中に別のコンポーネント定義をネストすること
- default export と named export を同一ファイルで混在させること

# 必須
- 関数コンポーネント + Hooks のみを使用すること
- 1 ファイル 1 コンポーネントを原則とすること
- Props には JSDoc または PropTypes でアノテーションを付けること
- コンポーネント名はパスカルケース（例: UserCard.jsx）
- ファイル名とコンポーネント名を一致させること
```

### 1-2. Hooks

```
# 禁止
- useEffect 内で直接 async/await を使うこと（内部関数を定義して呼ぶこと）
- useEffect の依存配列を意図的に省略すること、または eslint-disable コメントで警告を抑制すること
  （マウント時1回だけ実行したい場合の空配列 [] は正当。ただしその意図をコメントで明記すること）
- 複数箇所で再利用されるロジック、または複雑な副作用ロジックをコンポーネント内に直接記述すること
- useState を過剰にネストした構造（オブジェクト深度 3 以上）で使うこと

# 必須
- 再利用されるロジック・複雑なロジックは src/hooks/ 配下にカスタム Hook として切り出すこと
- useEffect のクリーンアップ関数を必要な場合に必ず返すこと
- 依存配列は eslint-plugin-react-hooks の警告を 0 件にした状態を保つこと
```

### 1-3. 状態管理

```
# 禁止
- グローバル状態（Context / 外部ストア）にサーバーキャッシュデータを直接格納すること
  → サーバーデータは TanStack Query / SWR 等のキャッシュ層で管理すること
- Context の value に毎レンダリング生成されるオブジェクトリテラルを直接渡すこと
  → useMemo でメモ化すること

# 必須
- ローカル UI 状態は useState / useReducer で管理すること
- 複数コンポーネント間の共有状態は Context または専用ストアで管理すること
- 状態の初期値には明示的な型・形状コメントを付けること
```

### 1-4. ディレクトリ構造

```
src/
├── assets/          # 静的ファイル（画像・フォント）
├── components/      # 汎用UIコンポーネント
│   └── <ComponentName>/
│       ├── index.jsx
│       └── <ComponentName>.module.css
├── features/        # ドメイン単位の機能モジュール
│   └── <featureName>/
│       ├── components/
│       ├── hooks/
│       └── index.js  # 公開APIのみ re-export
├── hooks/           # グローバル共通カスタムHook
├── pages/           # ルートに対応するページコンポーネント
├── services/        # API通信層
├── store/           # グローバル状態
├── utils/           # 純粋関数ユーティリティ
└── main.jsx
```

```
# 禁止
- src/ 直下にコンポーネントファイルを直置きすること
- features/ をまたいだ直接 import（循環依存の温床）
  → features/ 間の依存は src/services/ や src/store/ 経由にすること
- ../../../ が 3 段以上になる相対パス
  → vite.config.js に alias を定義してパスエイリアスを使うこと（例: @/components/...）
```

### 1-5. 命名規則

| 対象 | 規則 | 例 |
|------|------|----|
| コンポーネント | PascalCase | `UserCard` |
| カスタムHook | camelCase + `use` prefix | `useUserData` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 関数・変数 | camelCase | `fetchUserList` |
| CSSモジュール | camelCase | `styles.cardWrapper` |
| イベントハンドラ | `handle` prefix | `handleSubmit` |

---

## 2. パフォーマンス

### 2-1. レンダリング最適化

```
# 禁止
- JSX 内でインライン関数・オブジェクトを都度生成すること（特にリスト）
  NG: <List onClick={() => doSomething()} />
  OK: const handleClick = useCallback(() => doSomething(), []);
- key に配列インデックスを使うこと（並び替え・追加削除がある場合）
  NG: items.map((item, i) => <Item key={i} />)
  OK: items.map(item => <Item key={item.id} />)
- 親の再レンダリングを無条件に全子へ伝播させること
  → React.memo / useMemo / useCallback を適切に使うこと

# 必須
- 大規模リストは仮想スクロール（react-window / react-virtual）を使うこと
- 画像には width / height 属性と loading="lazy" を設定すること
- コード分割: ページ単位で React.lazy + Suspense を使うこと
```

### 2-2. Vite ビルド最適化

```
# 禁止
- vite.config.js の build.rollupOptions.output.manualChunks を削除・コメントアウトすること
- node_modules 全体を 1 チャンクにバンドルすること
- 開発用依存（devDependencies）を dependencies に混入させること

# 必須
- サードパーティライブラリは manualChunks で vendor チャンクへ分離すること
- 環境変数は必ず import.meta.env 経由でアクセスし、process.env は使わないこと
- vite.config.js に以下を設定すること:
  build.sourcemap: 本番 false / ステージング true
  build.chunkSizeWarningLimit: 500 (KB)
```

### 2-3. 非同期・データフェッチ

```
# 禁止
- useEffect 内で毎レンダリング無条件に fetch を呼ぶこと
- Promise を握りつぶすこと（.catch() / try-catch なしの await）
- 同一データを複数コンポーネントが個別にフェッチすること
  → キャッシュ層（TanStack Query 等）で共有すること

# 必須
- ローディング・エラー・空状態の 3 状態を必ず UI に反映すること
- API リクエストは src/services/ に集約し、コンポーネントから直接 fetch を呼ばないこと
```

---

## 3. セキュリティ

### 3-1. XSS 対策

```
# 禁止（最重要）
- dangerouslySetInnerHTML の使用
  → どうしても必要な場合は DOMPurify でサニタイズしてから渡すこと。
    使用箇所には必ず理由・サニタイズ方法・レビュー承認者をコメントで明記し、セキュリティレビューを必須とすること
- eval() / new Function() / setTimeout(string) の使用
- ユーザー入力値を直接 href / src / style 属性に渡すこと

# 必須
- 外部からのテキストはすべてテキストノードとして扱うこと（{variable} で埋め込む）
- URL を動的生成する場合は encodeURIComponent を使うこと
```

### 3-2. 認証・認可

```
# 禁止
- アクセストークン・APIキー・シークレットをソースコードにハードコードすること
- 認証トークンを localStorage に保存すること（XSS で盗取可能）
  → httpOnly; Secure; SameSite=Strict（または Lax）属性をすべて付与した Cookie を使うこと
- クライアントサイドのみで認可チェックを完結させること
  → サーバーサイドでも必ず検証すること

# 必須
- 環境変数（.env）はリポジトリにコミットしないこと（.gitignore に記載必須）
- VITE_ prefix が付く環境変数はクライアントに公開されることを常に意識すること
- シークレット系の値は VITE_ prefix を付けず、サーバーサイドのみで扱うこと
```

### 3-3. 依存関係

```
# 禁止
- npm audit で High / Critical の脆弱性があるまま本番リリースすること
- メンテナンスが停止したライブラリを新規採用すること
- CDN 経由の外部スクリプトを Subresource Integrity (SRI) なしで読み込むこと

# 必須
- 依存追加時は必ず npm audit を実行すること。CI では npm audit --audit-level=high を必須ステップとして設定し、High / Critical がある場合はビルドを自動ブロックすること
- package-lock.json（または pnpm-lock.yaml）を必ずコミットすること
- 定期的（月次）に npm outdated を実行しメジャーバージョンアップを検討すること
```

### 3-4. フォーム・入力値

```
# 禁止
- バリデーションをクライアントのみで完結させること
- エラーメッセージにスタックトレース・内部情報を表示すること

# 必須
- フォームライブラリ（React Hook Form 等）を使いバリデーションスキーマを明示すること
- ファイルアップロードは MIME タイプ・拡張子・サイズを検証すること
```

---

## 4. ESLint / Prettier 設定指針

Claude Code が新規セットアップする際は以下のパッケージを導入すること。

```bash
npm install -D eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks \
  eslint-plugin-react-refresh eslint-plugin-jsx-a11y \
  eslint-plugin-import eslint-plugin-security \
  prettier eslint-config-prettier eslint-plugin-prettier
```

`eslint.config.js`（flat config）には最低限以下のルールを有効にすること。

| ルール | 設定値 | 目的 |
|--------|--------|------|
| `react-hooks/rules-of-hooks` | error | Hooks の呼び出し順保証 |
| `react-hooks/exhaustive-deps` | warn | 依存配列の抜け検出 |
| `no-unused-vars` | error | 未使用変数の排除 |
| `no-console` | warn | console.log の本番混入防止 |
| `import/no-cycle` | error | 循環依存の禁止 |
| `security/detect-object-injection` | warn | プロパティインジェクション検出 |
| `react/no-danger` | error | dangerouslySetInnerHTML 使用禁止 |
| `jsx-a11y/alt-text` | error | img に alt 属性を必須化 |
| `jsx-a11y/interactive-supports-focus` | error | インタラクティブ要素のフォーカス保証 |
| `jsx-a11y/aria-props` | error | 不正な ARIA 属性の禁止 |

---

## 5. コミット前チェックリスト

Claude Code がコードを生成・修正した後、以下をすべて確認してから完了とすること。

- [ ] `npm run lint` がエラー 0 件で通過する
- [ ] `npm run build` がエラーなく完了する
- [ ] 新規コンポーネントは本ドキュメントのディレクトリ規則に従っている
- [ ] dangerouslySetInnerHTML / eval を使用していない
- [ ] ハードコードされたシークレットがない
- [ ] key に index を使用していない（動的リストの場合）
- [ ] 非同期処理にエラーハンドリングがある
- [ ] ローディング・エラー・空状態の UI が実装されている

---

## 6. 禁止ライブラリ

以下は代替手段があるため、新規採用を禁止する。

| 禁止 | 理由 | 代替 |
|------|------|------|
| `moment.js` | バンドルサイズ肥大 | `date-fns` / `dayjs` |
| `lodash`（CommonJS版） | tree-shaking 非対応 | `lodash-es`（ESM版）または native |
| `jQuery` | React の DOM 管理と競合 | React APIs |
| `axios` | 原則 native fetch / `ky` を優先。interceptor・タイムアウト・キャンセルが必要な場合は採用を検討してよい |  `ky` / native fetch |

---

*最終更新: 2026-05-18 — マルチエージェント開発フロー追加*
