/**
 * PATCH 002: 配信ウィンドウの不整合修正
 *
 * ファイル: apps/worker/src/routes/webhook.ts (L174-179)
 *          apps/worker/src/services/step-delivery.ts (L48-67)
 * 重要度: 🟡 MEDIUM (配信タイミングバグ)
 *
 * 問題:
 *   webhook.ts の即時配信: 配信ウィンドウ = 9:00-21:00
 *   step-delivery.ts のCron配信: 配信ウィンドウ = 9:00-23:00
 *   → 21:00-23:00 の間に友だち追加すると、即時配信は翌朝に延期されるが
 *     Cronによるステップ配信は実行される不整合。
 *
 * 修正方針:
 *   step-delivery.ts の DEFAULT_END_HOUR = 23 に統一。
 *   webhook.ts の即時配信後のnext_delivery計算も23時まで許可。
 */

// === webhook.ts L174-179 を以下に置換 ===
// (即時配信後の次ステップスケジューリング)

const DELIVERY_END_HOUR = 23; // step-delivery.ts と統一

const nextDeliveryDate = new Date(Date.now() + 9 * 60 * 60_000);
nextDeliveryDate.setMinutes(nextDeliveryDate.getMinutes() + secondStep.delay_minutes);
// Enforce 9:00-23:00 JST delivery window (step-delivery.ts と統一)
const h = nextDeliveryDate.getUTCHours();
if (h < 9 || h >= DELIVERY_END_HOUR) {
  if (h >= DELIVERY_END_HOUR) nextDeliveryDate.setUTCDate(nextDeliveryDate.getUTCDate() + 1);
  nextDeliveryDate.setUTCHours(9, 0, 0, 0);
}


// === webhook.ts L700-706 も同様に修正 ===
// (初回問い合わせタグからのシナリオ登録)

// const h = nextDate.getUTCHours();
// if (h < 9 || h >= 21) { ... }
// ↓
// const h = nextDate.getUTCHours();
// if (h < 9 || h >= 23) { if (h >= 23) nextDate.setUTCDate(...); ... }
