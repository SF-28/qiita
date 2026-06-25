// feature_list.json structural gate. Dependency-free; shipped into the target
// repository so the gate works for any agent, with or without the skill.
//
// Modes:
//   (default)  validate feature_list.json in cwd, exit 1 on violation (CI/CLI)
//   --file P   validate file P instead
//   --hook     Claude Code PostToolUse hook: reads payload on stdin, only acts
//              when the edited file is feature_list.json, exit 2 blocks the edit
//   --stop     Claude Code Stop hook: validates features + clean-state check,
//              exit 2 blocks session end and feeds reasons back to the agent
//   --archive [--keep N]
//              move all but the N most recent done features (default 10) into
//              <list-dir>/archive/features.jsonl to keep the active list small
//
// hook/stop でブロックした違反は harness/violations.jsonl に rule ID 付きで
// 追記され、validate-harness.mjs の監査が集計する (弱点採掘の入力)。

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const STATUSES = new Set(['not-started', 'in-progress', 'blocked', 'done']);
const HARNESS_FILES = new Set([
  'progress.md',
  'feature_list.json',
  'deferred.md',
  'violations.jsonl',
  'audit-history.jsonl',
  'features.jsonl'
]);
// harness/ 配下を正とし、旧レイアウト (リポジトリ直下) もフォールバックで読む
const FEATURE_LIST_CANDIDATES = ['harness/feature_list.json', 'feature_list.json'];
// violations.jsonl の保持上限。傾向観測用なので直近分だけあればよい
const MAX_LOG_ENTRIES = 500;
// --archive でアクティブリストに残す done feature の件数 (--keep で変更可)
const DEFAULT_KEEP_DONE = 10;

function resolveFeatureList(root) {
  for (const candidate of FEATURE_LIST_CANDIDATES) {
    const fullPath = path.join(root, candidate);
    if (existsSync(fullPath)) return fullPath;
  }
  return null;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

// rule は集計の連続性を保つための安定した識別子。改名せず追加のみ行う
export function featureViolations(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return [{ rule: 'invalid-json', detail: `feature_list.json is not valid JSON: ${error.message}` }];
  }
  if (!Array.isArray(parsed.features)) {
    return [{ rule: 'invalid-json', detail: 'feature_list.json must contain a "features" array' }];
  }

  const violations = [];
  let inProgress = 0;

  for (const feature of parsed.features) {
    const label = isNonEmptyString(feature?.id) ? feature.id : '(missing id)';
    for (const field of ['id', 'name', 'description', 'status']) {
      if (!isNonEmptyString(feature?.[field])) {
        violations.push({ rule: 'required-field', detail: `${label}: required field "${field}" is missing or empty` });
      }
    }
    if (isNonEmptyString(feature?.status) && !STATUSES.has(feature.status)) {
      violations.push({ rule: 'invalid-status', detail: `${label}: status "${feature.status}" is not one of ${[...STATUSES].join(', ')}` });
    }

    if (feature?.status === 'in-progress') {
      inProgress += 1;
      if (!isNonEmptyStringArray(feature.scope)) {
        violations.push({ rule: 'intake-scope', detail: `${label}: in-progress requires non-empty "scope" (intake before starting)` });
      }
      if (!isNonEmptyStringArray(feature.acceptance)) {
        violations.push({ rule: 'intake-acceptance', detail: `${label}: in-progress requires non-empty "acceptance" (intake before starting)` });
      }
      if (!isNonEmptyString(feature.verify)) {
        violations.push({ rule: 'intake-verify', detail: `${label}: in-progress requires a "verify" command (intake before starting)` });
      }
    }
    if (feature?.status === 'done') {
      if (!isNonEmptyString(feature.evidence)) {
        violations.push({ rule: 'done-evidence', detail: `${label}: done requires non-empty "evidence" (run "verify" and record the result)` });
      }
      if (!isNonEmptyString(feature.verify)) {
        violations.push({ rule: 'done-verify', detail: `${label}: done requires a "verify" command` });
      }
    }
    if (feature?.status === 'blocked' && !isNonEmptyString(feature.blocked_reason)) {
      violations.push({ rule: 'blocked-reason', detail: `${label}: blocked requires "blocked_reason"` });
    }
  }

  if (inProgress > 1) {
    violations.push({ rule: 'wip-limit', detail: `WIP=1 violated: ${inProgress} features are in-progress; finish or defer all but one` });
  }
  return violations;
}

// 後方互換: 違反メッセージを文字列配列で返す旧 API
export function validateFeatures(raw) {
  return featureViolations(raw).map((v) => v.detail);
}

export function cleanStateViolations(root) {
  let output;
  try {
    // -uall: 未追跡をディレクトリ単位でなくファイル単位で列挙させる
    // (harness/archive/ のような新規ディレクトリも basename 判定できるように)
    output = execFileSync('git', ['status', '--porcelain', '-uall'], { cwd: root, encoding: 'utf8' });
  } catch {
    return []; // git 不在・非リポジトリは clean-state 検査の対象外
  }
  const touched = output.split('\n').filter(Boolean).map((line) => line.slice(3));
  if (touched.length === 0) return [];

  const progressTouched = touched.some((file) => path.basename(file) === 'progress.md');
  const nonHarness = touched.filter((file) => !HARNESS_FILES.has(path.basename(file)));
  if (nonHarness.length > 0 && !progressTouched) {
    return [
      `Uncommitted changes exist (${nonHarness.length} files) but progress.md was not updated. ` +
      'Update progress.md (current state, evidence, next step) before ending the session.'
    ];
  }
  return [];
}

// ブロックした違反を harness/violations.jsonl に追記する (弱点採掘の入力)。
// ログは観測用の副次機能であり、書き込み失敗でゲート本体 (exit 2) を
// 止めてはならないため、この関数に限りログ I/O の例外を意図的に無視する
function logViolations(root, mode, violations) {
  try {
    const dir = path.join(root, 'harness');
    if (!existsSync(dir)) return; // 旧レイアウトにはログを増やさない
    const logPath = path.join(dir, 'violations.jsonl');
    const ts = new Date().toISOString();
    const added = violations.map((v) => JSON.stringify({ ts, mode, rule: v.rule, detail: v.detail }));
    const existing = existsSync(logPath)
      ? readFileSync(logPath, 'utf8').split('\n').filter(Boolean)
      : [];
    writeFileSync(logPath, `${existing.concat(added).slice(-MAX_LOG_ENTRIES).join('\n')}\n`);
  } catch {
    // ログ失敗時もゲートの判定は fail() 側で継続する
  }
}

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--file') {
      args.file = argv[i + 1];
      i += 1;
    } else if (argv[i] === '--keep') {
      args.keep = argv[i + 1];
      i += 1;
    } else if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = true;
    } else {
      args._.push(argv[i]);
    }
  }
  return args;
}

function fail(violations, exitCode) {
  for (const violation of violations) {
    console.error(`[feature-gate] ${violation.rule}: ${violation.detail}`);
  }
  process.exit(exitCode);
}

// done feature を直近 keep 件残して <list-dir>/archive/features.jsonl へ退避する。
// 配列の前方ほど古い前提 (feature は末尾に追記される運用)。
// データを失わないよう必ずアーカイブへ書いてからアクティブリストを書き換える
function archiveDoneFeatures(listPath, keep) {
  const raw = readFileSync(listPath, 'utf8');
  const violations = featureViolations(raw);
  if (violations.length > 0) fail(violations, 1); // 不正な状態からはアーカイブしない

  const parsed = JSON.parse(raw);
  const done = parsed.features.filter((feature) => feature.status === 'done');
  if (done.length <= keep) {
    console.log(`[feature-gate] nothing to archive (${done.length} done <= keep ${keep})`);
    return;
  }

  const toArchive = new Set(done.slice(0, done.length - keep));
  const archivePath = path.join(path.dirname(listPath), 'archive', 'features.jsonl');
  const ts = new Date().toISOString();
  mkdirSync(path.dirname(archivePath), { recursive: true });
  appendFileSync(
    archivePath,
    [...toArchive].map((feature) => JSON.stringify({ ...feature, archived_at: ts })).join('\n') + '\n'
  );
  parsed.features = parsed.features.filter((feature) => !toArchive.has(feature));
  writeFileSync(listPath, JSON.stringify(parsed, null, 2) + '\n');
  console.log(`[feature-gate] archived ${toArchive.size} done features to ${archivePath} (kept ${keep} most recent done)`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.hook || args.stop) {
    let payload = {};
    try {
      payload = JSON.parse(readStdin() || '{}');
    } catch {
      payload = {};
    }
    const root = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
    const listPath = resolveFeatureList(root);

    if (args.hook) {
      const editedPath = payload.tool_input?.file_path || '';
      if (path.basename(editedPath) !== 'feature_list.json') process.exit(0);
      if (!listPath) process.exit(0);
      const violations = featureViolations(readFileSync(listPath, 'utf8'));
      if (violations.length > 0) {
        logViolations(root, 'hook', violations);
        fail(violations, 2);
      }
      process.exit(0);
    }

    // --stop: stop_hook_active ガードで無限ループを防ぐ
    if (payload.stop_hook_active) process.exit(0);
    const violations = [];
    if (listPath) {
      violations.push(...featureViolations(readFileSync(listPath, 'utf8')));
    }
    violations.push(...cleanStateViolations(root).map((detail) => ({ rule: 'clean-state', detail })));
    if (violations.length > 0) {
      logViolations(root, 'stop', violations);
      fail(violations, 2);
    }
    process.exit(0);
  }

  const explicit = args.file || args._[0];
  const target = explicit ? path.resolve(explicit) : resolveFeatureList(process.cwd());
  if (!target || !existsSync(target)) {
    console.error(`[feature-gate] feature list not found (looked for ${explicit || FEATURE_LIST_CANDIDATES.join(', ')})`);
    process.exit(1);
  }

  if (args.archive) {
    const keep = Number(args.keep ?? DEFAULT_KEEP_DONE);
    if (!Number.isInteger(keep) || keep < 0) {
      console.error(`[feature-gate] --keep must be a non-negative integer (got "${args.keep}")`);
      process.exit(1);
    }
    archiveDoneFeatures(target, keep);
    return;
  }

  // CLI/CI モードはワークスペースを汚さないためログを書かない
  const violations = featureViolations(readFileSync(target, 'utf8'));
  if (violations.length > 0) fail(violations, 1);
  console.log('[feature-gate] OK');
}

main();
