# LINE Harness ブラッシュアップパッチ一覧

milk-line-harness リポジトリに適用するパッチファイル群。
ステップ配信の精査と自動応答のブラッシュアップに基づく改善。

## 適用先リポジトリ
`okudatamiobanzai-web/milk-line-harness`

## パッチ一覧

### セキュリティ修正（最優先）

| # | ファイル | 対象 | 重要度 |
|---|---------|------|--------|
| 001 | `001-fix-sql-injection-auto-replies` | webhook.ts L605 | CRITICAL |

auto_replies クエリで `lineAccountId` が文字列結合でSQLに埋め込まれている。
パラメータバインドに修正。

### バグ修正

| # | ファイル | 対象 | 重要度 |
|---|---------|------|--------|
| 002 | `002-fix-delivery-window-consistency` | webhook.ts / step-delivery.ts | MEDIUM |
| 006 | `006-hardcoded-tag-id-cleanup` | webhook.ts L673 | MEDIUM |

- 002: 配信ウィンドウが webhook(21時) と cron(23時) で不一致 → 23時に統一
- 006: 初回問い合わせタグIDがハードコード → タグ名検索に変更

### 機能追加（ステップ配信）

| # | ファイル | 内容 | 重要度 |
|---|---------|------|--------|
| 004 | `004-add-score-conditions-to-step-branching` | score_above/below + form/link条件 | FEATURE |
| 005 | `005-step-completion-scoring` | シナリオ完了時にイベント発火 | MEDIUM |

- 004: 条件分岐に `score_above`, `score_below`, `form_submitted`, `link_clicked` を追加
- 005: ステップ送信/シナリオ完了時に `fireEvent()` を呼び、IF-THEN自動化・スコアリングと連携

### 機能追加（自動応答）

| # | ファイル | 内容 | 重要度 |
|---|---------|------|--------|
| 003 | `003-add-regex-match-and-priority` | regex + priority + シナリオ発火 | FEATURE |
| 007 | `007-ai-reply-add-micelle-context` | ミセル情報をAIコンテキストに追加 | MEDIUM |
| 008 | `008-ai-reply-conversation-history` | AI応答に会話履歴を含める | FEATURE |

- 003: SPECに記載済みの regex マッチタイプ実装、priority 順序制御、マッチ時のシナリオ自動発火
- 007: AI応答がミセル（共助プラットフォーム）について回答できるようコンテキスト追加
- 008: 直近5件の会話履歴をClaude APIに渡し、文脈を考慮した応答を生成

## DBマイグレーション（パッチ003に含まれる）

```sql
-- 010_auto_reply_enhance.sql
ALTER TABLE auto_replies ADD COLUMN priority INTEGER NOT NULL DEFAULT 100;
ALTER TABLE auto_replies ADD COLUMN trigger_scenario_id TEXT DEFAULT NULL;
```

## 適用手順

1. milk-line-harness リポジトリで新しいブランチを作成
2. 各パッチの内容に従ってソースコードを修正
3. マイグレーション 010 を実行: `npx wrangler d1 execute line-crm --file=packages/db/migrations/010_auto_reply_enhance.sql --remote`
4. テスト → デプロイ

## 優先順位

1. **001** (SQL injection) → 即時適用推奨
2. **002, 006** (バグ修正) → 次回デプロイで適用
3. **003, 004, 005, 007, 008** (機能追加) → 順次適用
