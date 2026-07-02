#!/usr/bin/env node
// コマンドを「testing → 実行 → done / error」で包む半自動連携。
// 使い方: node scripts/wrap.mjs npm test
//         node scripts/wrap.mjs -s coding -a cloud-1 -- git commit -m "..."
// -s で開始状態(既定 testing)、-a で agent 識別子を変えられる。
//
// 環境変数 DIORAMA_URL / DIORAMA_AGENT / DIORAMA_TOKEN は send-event.mjs と同じ。

import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
let startState = 'testing';
let agent = process.env.DIORAMA_AGENT;
while (args[0] === '-s' || args[0] === '-a') {
  if (args[0] === '-s') startState = args[1];
  if (args[0] === '-a') agent = args[1];
  args.splice(0, 2);
}
if (args[0] === '--') args.shift();

if (args.length === 0) {
  console.error('使い方: wrap.mjs [-s state] [-a agent] [--] <command...>');
  process.exit(1);
}

const base =
  process.env.DIORAMA_URL ?? `http://localhost:${process.env.DIORAMA_PORT ?? '5199'}`;

async function send(state, detail) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.DIORAMA_TOKEN) {
      headers.Authorization = `Bearer ${process.env.DIORAMA_TOKEN}`;
    }
    await fetch(`${base.replace(/\/$/, '')}/api/event`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ state, detail, agent }),
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
