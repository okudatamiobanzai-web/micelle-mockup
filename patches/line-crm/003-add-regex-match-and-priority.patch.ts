/**
 * PATCH 003: 自動応答 — regex マッチ + priority 順序 + シナリオ発火
 *
 * ファイル: apps/worker/src/routes/webhook.ts (L616-645)
 *          apps/worker/src/index.ts (auto-reply CRUD)
 *          packages/db/migrations/010_auto_reply_enhance.sql (新規)
 * 重要度: 🟢 FEATURE (SPECに記載済み・未実装)
 *
 * 追加機能:
 *   1. regex マッチタイプ（SPECに "exact, contains, regex" と記載あり）
 *   2. priority カラムで自動応答の優先順位を制御
 *   3. trigger_scenario_id で自動応答マッチ時にシナリオ自動発火
 */

// === 新規マイグレーション: packages/db/migrations/010_auto_reply_enhance.sql ===
const MIGRATION_010 = `
-- 自動応答テーブルに priority と trigger_scenario_id を追加
ALTER TABLE auto_replies ADD COLUMN priority INTEGER NOT NULL DEFAULT 100;
ALTER TABLE auto_replies ADD COLUMN trigger_scenario_id TEXT DEFAULT NULL;

-- match_type は既存の 'exact' | 'contains' に 'regex' を追加
-- SQLite は CHECK 制約の ALTER に対応しないため、アプリ側でバリデーション
`;


// === webhook.ts L616-645 のマッチングロジックを以下に置換 ===

let matched = false;
for (const rule of autoReplies.results) {
  let isMatch = false;

  switch (rule.match_type) {
    case 'exact':
      isMatch = incomingText === rule.keyword;
      break;
    case 'contains':
      isMatch = incomingText.includes(rule.keyword);
      break;
    case 'regex':
      try {
        const regex = new RegExp(rule.keyword, 'i');
        isMatch = regex.test(incomingText);
      } catch {
        console.error(`Invalid regex in auto_reply ${rule.id}: ${rule.keyword}`);
        isMatch = false;
      }
      break;
    default:
      isMatch = incomingText.includes(rule.keyword);
  }

  if (isMatch) {
    try {
      // Expand template variables ({{name}}, {{uid}}, {{auth_url:CHANNEL_ID}})
      const expandedContent = expandVariables(
        rule.response_content,
        friend as { id: string; display_name: string | null; user_id: string | null },
        workerUrl,
      );
      const replyMsg = buildMessage(rule.response_type, expandedContent);
      await lineClient.replyMessage(event.replyToken, [replyMsg]);

      // 送信ログ
      const outLogId = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO messages_log (id, friend_id, direction, message_type, content, broadcast_id, scenario_step_id, created_at)
           VALUES (?, ?, 'outgoing', ?, ?, NULL, NULL, ?)`,
        )
        .bind(outLogId, friend.id, rule.response_type, rule.response_content, jstNow())
        .run();

      // シナリオ発火（trigger_scenario_id が設定されている場合）
      if (rule.trigger_scenario_id) {
        try {
          const alreadyEnrolled = await db
            .prepare('SELECT id FROM friend_scenarios WHERE friend_id = ? AND scenario_id = ?')
            .bind(friend.id, rule.trigger_scenario_id)
            .first();
          if (!alreadyEnrolled) {
            await enrollFriendInScenario(db, friend.id, rule.trigger_scenario_id);
          }
        } catch (enrollErr) {
          console.error('Auto-reply scenario trigger failed:', enrollErr);
        }
      }
    } catch (err) {
      console.error('Failed to send auto-reply', err);
    }

    matched = true;
    break;
  }
}


// === index.ts: POST /api/auto-replies の更新 ===
// body に priority と triggerScenarioId を追加

/*
app.post('/api/auto-replies', async (c) => {
  const body = await c.req.json<{
    keyword: string;
    matchType?: 'exact' | 'contains' | 'regex';  // ← regex 追加
    responseType?: 'text' | 'flex';
    responseContent: string;
    lineAccountId?: string;
    priority?: number;                             // ← 追加
    triggerScenarioId?: string;                    // ← 追加
  }>();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `INSERT INTO auto_replies (id, keyword, match_type, response_type, response_content, is_active, line_account_id, priority, trigger_scenario_id, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`
  ).bind(
    id,
    body.keyword,
    body.matchType ?? 'contains',
    body.responseType ?? 'text',
    body.responseContent,
    body.lineAccountId ?? null,
    body.priority ?? 100,
    body.triggerScenarioId ?? null,
    now,
  ).run();
  return c.json({ success: true, data: { id, keyword: body.keyword } }, 201);
});
*/
