#!/usr/bin/env node
/**
 * 他のリポジトリにジオラマ自動連携(Cursor hooks)をインストールする。
 *
 *   npm run install-hooks -- ~/path/to/other-repo
 *
 * やること:
 *   1. <repo>/.cursor/hooks/diorama-bridge.mjs と diorama.sh をコピー
 *   2. <repo>/.cursor/hooks.json を作成(既にあれば diorama の項目だけ追記)
 *
 * インストール先のリポジトリに visualizer は不要。
 * bridge は単一ファイルで、DIORAMA_URL へ POST するだけ。
 */

import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sourceHooksDir = join(here, '..', '..', '.cursor', 'hooks');

const target = process.argv[2];
if (!target) {
  console.error('使い方: npm run install-hooks -- <リポジトリのパス>');
  console.error('例:     npm run install-hooks -- ~/Documents/my-other-repo');
  process.exit(1);
}

const repo = resolve(target.replace(/^~(?=\/)/, process.env.HOME ?? '~'));
if (!existsSync(repo)) {
  console.error(`見つかりません: ${repo}`);
  process.exit(1);
}
if (!existsSync(join(repo, '.git'))) {
  console.error(`git リポジトリではないようです: ${repo}`);
  console.error('(Cloud Agent はリポジトリ内の .cursor/hooks.json を読みます)');
  process.exit(1);
}

// 1. hooks スクリプトをコピー
const hooksDir = join(repo, '.cursor', 'hooks');
mkdirSync(hooksDir, { recursive: true });
for (const file of ['diorama-bridge.mjs', 'diorama.sh']) {
  copyFileSync(join(sourceHooksDir, file), join(hooksDir, file));
}
chmodSync(join(hooksDir, 'diorama.sh'), 0o755);

// 2. hooks.json を作成 or 追記
const DIORAMA_ENTRY = { command: '.cursor/hooks/diorama.sh', timeout: 5 };
const EVENTS = [
  'beforeReadFile',
  'afterFileEdit',
  'beforeShellExecution',
  'afterShellExecution',
  'postToolUseFailure',
  'subagentStart',
  'subagentStop',
];

const hooksJsonPath = join(repo, '.cursor', 'hooks.json');
let config = { version: 1, hooks: {} };
if (existsSync(hooksJsonPath)) {
  try {
    config = JSON.parse(readFileSync(hooksJsonPath, 'utf8'));
    config.hooks ??= {};
  } catch {
    console.error(`${hooksJsonPath} が読めません(壊れた JSON?)。手で直してから再実行してください。`);
    process.exit(1);
  }
}

let added = 0;
for (const event of EVENTS) {
  const list = (config.hooks[event] ??= []);
  const already = list.some(
    (entry) => typeof entry?.command === 'string' && entry.command.includes('diorama'),
  );
  if (!already) {
    list.push({ ...DIORAMA_ENTRY });
    added += 1;
  }
}
writeFileSync(hooksJsonPath, `${JSON.stringify(config, null, 2)}\n`);

console.log(`インストールしました: ${repo}`);
console.log(`  .cursor/hooks/diorama-bridge.mjs`);
console.log(`  .cursor/hooks/diorama.sh`);
console.log(`  .cursor/hooks.json (${added} イベントを追記)`);
console.log('');
console.log('次にやること:');
console.log('  1. インストール先のリポジトリで commit & push する');
console.log('     (Cloud Agent は push されたブランチの hooks を読みます)');
console.log('  2. Cursor Secrets の DIORAMA_URL / DIORAMA_TOKEN はそのまま使えます');
console.log('     (店員の名前はリポジトリ名から自動で決まります)');
