/**
 * PATCH 004: ステップ配信 — スコア条件分岐の追加
 *
 * ファイル: apps/worker/src/services/step-delivery.ts (evaluateCondition)
 * 重要度: 🟢 FEATURE (スコアリング機能との連携不足)
 *
 * 問題:
 *   スコアリング機能（scoring_rules, friend_scores）は実装済みだが、
 *   ステップ配信の条件分岐で score を参照できない。
 *   L-step の「スコアに応じたシナリオ分岐」が再現できない。
 *
 * 追加する condition_type:
 *   - score_above: friendのスコアが指定値以上ならtrue
 *   - score_below: friendのスコアが指定値未満ならtrue
 *   - form_submitted: 指定フォームに回答済みならtrue
 *   - link_clicked: 指定トラッキングリンクをクリック済みならtrue
 */

// === step-delivery.ts evaluateCondition() に以下のcaseを追加 ===

/*
async function evaluateCondition(
  db: D1Database,
  friendId: string,
  step: { condition_type: string | null; condition_value: string | null },
): Promise<boolean> {
  if (!step.condition_type || !step.condition_value) return true;

  switch (step.condition_type) {
    // ... 既存の tag_exists, tag_not_exists, metadata_equals, metadata_not_equals ...

    case 'score_above': {
      const threshold = parseInt(step.condition_value, 10);
      if (isNaN(threshold)) return true;
      const friend = await db
        .prepare('SELECT score FROM friends WHERE id = ?')
        .bind(friendId)
        .first<{ score: number }>();
      return (friend?.score ?? 0) >= threshold;
    }

    case 'score_below': {
      const threshold = parseInt(step.condition_value, 10);
      if (isNaN(threshold)) return true;
      const friend = await db
        .prepare('SELECT score FROM friends WHERE id = ?')
        .bind(friendId)
        .first<{ score: number }>();
      return (friend?.score ?? 0) < threshold;
    }

    case 'form_submitted': {
      // condition_value = form_id
      const submission = await db
        .prepare('SELECT 1 FROM form_submissions WHERE friend_id = ? AND form_id = ? LIMIT 1')
        .bind(friendId, step.condition_value)
        .first();
      return !!submission;
    }

    case 'link_clicked': {
      // condition_value = tracked_link_id
      const click = await db
        .prepare('SELECT 1 FROM link_clicks WHERE friend_id = ? AND link_id = ? LIMIT 1')
        .bind(friendId, step.condition_value)
        .first();
      return !!click;
    }

    default:
      return true;
  }
}
*/
