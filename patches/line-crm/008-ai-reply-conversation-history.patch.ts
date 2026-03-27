/**
 * PATCH 008: AI自動応答 — 直近の会話履歴を含める
 *
 * ファイル: apps/worker/src/services/ai-reply.ts
 *          apps/worker/src/routes/webhook.ts (AI呼び出し部分)
 * 重要度: 🟢 FEATURE (UX改善)
 *
 * 問題:
 *   現在のAI応答は単発（ユーザーの最新メッセージのみ送信）。
 *   「さっきの件だけど」のような文脈依存の会話に対応できない。
 *
 * 修正:
 *   messages_log から直近5件の会話履歴を取得してClaude APIに渡す。
 *   D1のクエリコストは最小限（1クエリ、LIMIT 5）。
 */

// === ai-reply.ts generateAiReply() を以下に置換 ===

export async function generateAiReply(
  userMessage: string,
  apiKey: string,
  friendName?: string | null,
  recentHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string | null> {
  if (!apiKey) return null;

  try {
    // 会話履歴を構築（最大5ターン + 最新メッセージ）
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (recentHistory && recentHistory.length > 0) {
      messages.push(...recentHistory);
    }

    // 最新のユーザーメッセージを追加
    messages.push({
      role: 'user',
      content: friendName
        ? `${friendName}さんからのメッセージ: ${userMessage}`
        : userMessage,
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: MILK_CONTEXT,
        messages,
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as {
      content: { type: string; text: string }[];
    };
    return data.content?.[0]?.text || null;
  } catch (err) {
    console.error('AI reply error:', err);
    return null;
  }
}


// === webhook.ts AI呼び出し部分（L651-665）を以下に置換 ===

/*
    if (!matched && event.replyToken && anthropicKey) {
      try {
        // 直近5件の会話履歴を取得
        const historyRows = await db
          .prepare(
            `SELECT direction, content FROM messages_log
             WHERE friend_id = ? AND message_type = 'text'
             ORDER BY created_at DESC LIMIT 10`
          )
          .bind(friend.id)
          .all<{ direction: string; content: string }>();

        const recentHistory = historyRows.results
          .reverse()  // 古い順に並べ替え
          .slice(0, -1)  // 最新メッセージは generateAiReply 内で追加するので除外
          .map(row => ({
            role: (row.direction === 'incoming' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: row.content,
          }));

        const aiReply = await generateAiReply(
          incomingText,
          anthropicKey,
          friend.display_name,
          recentHistory.length > 0 ? recentHistory : undefined,
        );

        if (aiReply) {
          await lineClient.replyMessage(event.replyToken, [{ type: 'text', text: aiReply }]);
          // ... ログ記録 ...
          matched = true;
        }
      } catch (aiErr) {
        console.error('AI reply failed:', aiErr);
      }
    }
*/
