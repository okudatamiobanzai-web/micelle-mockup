/**
 * PATCH 006: ハードコードされたタグIDの解消
 *
 * ファイル: apps/worker/src/routes/webhook.ts (L673, L679-680)
 * 重要度: 🟡 MEDIUM (保守性・移植性)
 *
 * 問題:
 *   初回問い合わせタグIDが `78eb85f3-6786-424d-aa46-0944488854b9` として
 *   ハードコードされている。
 *   → 別環境にデプロイすると動かない
 *   → タグ名変更時にコード修正が必要
 *
 * 修正方針:
 *   タグ名でルックアップし、存在しなければ自動作成する。
 *   タグ名は環境変数 or 定数で管理。
 */

// === webhook.ts L672-715 を以下に置換 ===

const FIRST_TIMER_TAG_NAME = '初回問い合わせ';
const firstTimerKeywords = [
  '利用方法', '使い方', '初めて', 'はじめて', '見学',
  'ドロップイン', '始め', '利用したい', '行きたい', '行ってみたい',
  'どんなところ', 'どんな場所', '雰囲気', '入り方', '入口',
  'チェックイン', 'アプリ', 'いいオフィス',
];

const isFirstTimer = firstTimerKeywords.some(kw => incomingText.includes(kw));
if (isFirstTimer) {
  try {
    // タグ名で検索（ハードコードされたIDに依存しない）
    let ftTag = await db
      .prepare('SELECT id FROM tags WHERE name = ?')
      .bind(FIRST_TIMER_TAG_NAME)
      .first<{ id: string }>();

    // 存在しなければ自動作成
    if (!ftTag) {
      const newTagId = crypto.randomUUID();
      await db.prepare('INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)')
        .bind(newTagId, FIRST_TIMER_TAG_NAME, '#3B82F6', jstNow()).run();
      ftTag = { id: newTagId };
    }

    const existingFtTag = await db
      .prepare('SELECT 1 FROM friend_tags WHERE friend_id = ? AND tag_id = ?')
      .bind(friend.id, ftTag.id)
      .first();

    if (!existingFtTag) {
      await db
        .prepare('INSERT OR IGNORE INTO friend_tags (friend_id, tag_id) VALUES (?, ?)')
        .bind(friend.id, ftTag.id)
        .run();

      // tag_added トリガーのシナリオに登録
      const tagScenarios = await db
        .prepare("SELECT id FROM scenarios WHERE trigger_type = 'tag_added' AND trigger_tag_id = ? AND is_active = 1")
        .bind(ftTag.id)
        .all<{ id: string }>();

      for (const ts of tagScenarios.results) {
        const alreadyEnrolled = await db
          .prepare('SELECT id FROM friend_scenarios WHERE friend_id = ? AND scenario_id = ?')
          .bind(friend.id, ts.id)
          .first();
        if (!alreadyEnrolled) {
          await enrollFriendInScenario(db, friend.id, ts.id);
        }
      }
    }
  } catch (ftErr) {
    console.error('First-timer tag error:', ftErr);
  }
}
