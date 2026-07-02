#!/usr/bin/env node
// コマンドを「testing → 実行 → done / error」で包む半自動連携。
// 使い方: node scripts/wrap.mjs npm test
//         node scripts/wrap.mjs -s coding -- git commit -m "..."
// -s で開始状態を変えられる(既定 testing)。

import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
let startState = 'testing';
if (args[0] === '-s') {
  startState = args[1];
  args.splice(0, 2);
}
if (args[0] === '--') args.shift();

if (args.length === 0) {
  console.error('使い方: wrap.mjs [-s state] [--] <command...>');
  process.exit(1);
}

const port = process.env.DIORAMA_PORT ?? '5199';

async function send(state, detail) {
  try {
    await fetch(`http://localhost:${port}/api/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, detail }),
    });
  } catch {
    // visualizer が起動していなくても、包んだコマンド自体は実行する
  }
}

const commandLine = args.join(' ');
await send(startState, commandLine);

const child = spawn(args[0], args.slice(1), { stdio: 'inherit', shell: false });
child.on('close', async (code) => {
  if (code === 0) {
    await send('done', `${commandLine} がとおった`);
  } else {
    await send('error', `${commandLine} がうまくいかなかった (exit ${code})`);
  }
  process.exit(code ?? 0);
});
