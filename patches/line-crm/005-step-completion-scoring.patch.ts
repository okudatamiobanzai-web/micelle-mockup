/**
 * PATCH 005: ステップ完了時のスコアリングイベント発火
 *
 * ファイル: apps/worker/src/services/step-delivery.ts (processSingleDelivery)
 * 重要度: 🟡 MEDIUM (機能連携の改善)
 *
 * 問題:
 *   ステップ配信が完了（全ステップ送信済み）しても、
 *   スコアリングやイベントバスに通知されない。
 *   → L-stepの「シナリオ完了時にタグ付与/スコア加算」が動かない。
 *
 * 修正:
 *   processSingleDelivery() 内で completeFriendScenario() を呼ぶ箇所に
 *   fireEvent('scenario_completed', ...) を追加。
 *   各ステップ送信後にも fireEvent('step_delivered', ...) を追加。
 */

// === step-delivery.ts processSingleDelivery() に以下を追加 ===

// import { fireEvent } from './event-bus.js'; を追加

/*
  // ステップ送信後、イベント発火
  await fireEvent(db, 'step_delivered', {
    friendId: friend.id,
    eventData: {
      scenarioId: fs.scenario_id,
      stepOrder: currentStep.step_order,
      messageType: currentStep.message_type,
    },
  }, lineAccessToken, lineAccountId);

  // ... 既存のnextStep判定 ...

  if (!nextStep) {
    // シナリオ完了
    await completeFriendScenario(db, fs.id);

    // 完了イベント発火 → IF-THEN自動化、スコアリング、タグ付与に連携
    await fireEvent(db, 'scenario_completed', {
      friendId: friend.id,
      eventData: {
        scenarioId: fs.scenario_id,
        scenarioName: /* scenario name from DB */,
      },
    }, lineAccessToken, lineAccountId);
  }
*/

/**
 * 使用例: IF-THEN自動化でシナリオ完了時にタグ付与
 *
 * POST /api/automations
 * {
 *   "name": "シナリオ完了→VIPタグ",
 *   "triggerType": "scenario_completed",
 *   "conditions": { "scenarioId": "xxx" },
 *   "actions": [
 *     { "type": "add_tag", "tagId": "vip-tag-id" },
 *     { "type": "add_score", "value": 10 }
 *   ]
 * }
 */
