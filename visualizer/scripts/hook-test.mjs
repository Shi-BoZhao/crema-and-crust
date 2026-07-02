#!/usr/bin/env node
/** hook-bridge の動作確認。visualizer が起動していること。 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { sendEvent } from './lib/send.mjs';

const bridge = join(dirname(fileURLToPath(import.meta.url)), 'hook-bridge.mjs');

const samples = [
  { hook_event_name: 'beforeReadFile', file_path: '/workspace/src/game/pizza.ts' },
  { hook_event_name: 'afterFileEdit', file_path: '/workspace/visualizer/src/crew.ts' },
  { hook_event_name: 'beforeShellExecution', command: 'npm test' },
  {
    hook_event_name: 'afterShellExecution',
    command: 'npm test',
    output: 'Tests 18 passed\nexit_code: 0',
  },
  { hook_event_name: 'postToolUseFailure', tool_name: 'Shell', error_message: 'Command failed' },
  { hook_event_name: 'subagentStart', subagent_type: 'explore', task: 'コードベースを調査' },
];

console.log('hook-bridge テスト (visualizer が localhost:5199 で起動していること)\n');

for (const sample of samples) {
  const res = spawnSync(process.execPath, [bridge], {
    input: JSON.stringify(sample),
    encoding: 'utf8',
    env: process.env,
  });
  console.log(`✓ ${sample.hook_event_name}`);
  if (res.status !== 0) {
    console.error(res.stderr);
    process.exit(1);
  }
}

await sendEvent({ state: 'idle', detail: 'hook テスト完了', tryLocalhost: true });
console.log('\n完了 — ブラウザで状態が変わっていたら OK');
