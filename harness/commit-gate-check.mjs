// commit ゲートの鮮度を push 前に知らせる repo 自己完結チェック (非ブロッキング)。
// .pre-commit-config.yaml の pre-push local hook から呼ばれる。
//
// registry を持たない repo / CI でも動くよう、ここでは「生成からの経過日数」だけを見る。
// 閾値超過時は create-harness の再実行 (= registry と突き合わせた version/deprecated
// drift の再チェックと推奨の取り込み) を促す。push は止めない (exit 0)。
import { readFile } from 'node:fs/promises';

const MANIFEST = 'harness/commit-gate.json';
const DEFAULT_INTERVAL_DAYS = 30;

function ageInDays(generated, now) {
  const from = new Date(`${generated}T00:00:00Z`);
  if (Number.isNaN(from.getTime())) return null;
  return Math.floor((now.getTime() - from.getTime()) / 86400000);
}

let raw;
try {
  raw = await readFile(MANIFEST, 'utf8');
} catch {
  process.exit(0); // ゲート未管理の repo では何もしない
}

let manifest;
try {
  manifest = JSON.parse(raw);
} catch {
  process.exit(0); // 壊れた manifest で push をブロックしない
}

const interval = typeof manifest.review_interval_days === 'number'
  ? manifest.review_interval_days
  : DEFAULT_INTERVAL_DAYS;
const age = typeof manifest.generated === 'string' ? ageInDays(manifest.generated, new Date()) : null;

if (age !== null && age > interval) {
  console.error(`[commit-gate] この commit ゲートは ${age} 日前 (> ${interval} 日) の生成です。`);
  console.error('[commit-gate] create-harness を再実行し、推奨の更新と drift (version/deprecated) を再チェックしてください。');
}

process.exit(0); // nudge は非ブロッキング
