/**
 * PATCH 001: SQL Injection 修正 — auto_replies クエリ
 *
 * ファイル: apps/worker/src/routes/webhook.ts (L601-614)
 * 重要度: 🔴 CRITICAL (セキュリティ)
 *
 * 問題:
 *   lineAccountId が文字列結合でSQLに直接埋め込まれている。
 *   悪意あるLINEアカウント設定で任意のSQLを実行可能。
 *
 * 修正前:
 *   ```ts
 *   const autoReplies = await db
 *     .prepare(`SELECT * FROM auto_replies WHERE is_active = 1 AND (line_account_id IS NULL${lineAccountId ? ` OR line_account_id = '${lineAccountId}'` : ''}) ORDER BY created_at ASC`)
 *     .all<...>();
 *   ```
 *
 * 修正後:
 */

// === webhook.ts L601-614 を以下に置換 ===

// 自動返信チェック（このアカウントのルール + グローバルルールのみ）
// NOTE: Auto-replies use replyMessage (free, no quota) instead of pushMessage
const autoRepliesQuery = lineAccountId
  ? db.prepare(
      `SELECT * FROM auto_replies WHERE is_active = 1 AND (line_account_id IS NULL OR line_account_id = ?) ORDER BY priority ASC, created_at ASC`
    ).bind(lineAccountId)
  : db.prepare(
      `SELECT * FROM auto_replies WHERE is_active = 1 AND line_account_id IS NULL ORDER BY priority ASC, created_at ASC`
    );

const autoReplies = await autoRepliesQuery.all<{
  id: string;
  keyword: string;
  match_type: 'exact' | 'contains' | 'regex';
  response_type: string;
  response_content: string;
  is_active: number;
  priority: number;
  trigger_scenario_id: string | null;
  created_at: string;
}>();
