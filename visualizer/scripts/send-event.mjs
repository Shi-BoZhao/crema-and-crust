#!/usr/bin/env node
// 使い方: node scripts/send-event.mjs [--agent id] <state> [detail...]
//   例:   node scripts/send-event.mjs coding "生地をのばしている"
//         node scripts/send-event.mjs --agent cloud-1 testing "CI 実行中"
//
// 環境変数:
//   DIORAMA_URL    送信先 (既定 http://localhost:5199)。トンネル URL を入れると Cloud Agent から送れる
//   DIORAMA_PORT   ローカルのポートだけ変えたいとき (DIORAMA_URL 未設定時のみ)
//   DIORAMA_AGENT  agent 識別子の既定値 (--agent が優先)
//   DIORAMA_TOKEN  サーバー側で DIORAMA_TOKEN を設定している場合に必要

const STATES = ['idle', 'thinking', 'reading', 'coding', 'testing', 'error', 'done'];

const args = process.argv.slice(2);
let agent = process.env.DIORAMA_AGENT;
while (args[0]?.startsWith('--')) {
  if (args[0] === '--agent' && args[1]) {
    agent = args[1];
    args.splice(0, 2);
  } else {
    console.error(`不明なオプション: ${args[0]}`);
    process.exit(1);
  }
}

const [state, ...rest] = args;
const detail = rest.join(' ') || undefined;

if (!state || !STATES.includes(state)) {
  console.error(
    `使い方: send-event.mjs [--agent id] <state> [detail]\nstate: ${STATES.join(' | ')}`,
  );
  process.exit(1);
}

const base =
  process.env.DIORAMA_URL ?? `http://localhost:${process.env.DIORAMA_PORT ?? '5199'}`;
const headers = { 'Content-Type': 'application/json' };
if (process.env.DIORAMA_TOKEN) {
  headers.Authorization = `Bearer ${process.env.DIORAMA_TOKEN}`;
}

try {
  const res = await fetch(`${base.replace(/\/$/, '')}/api/event`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ state, detail, agent }),
  });
  const body = await res.json();
  if (body.ok) {
    console.log(`ok: ${body.agent} → ${state}${detail ? ` (${detail})` : ''}`);
  } else {
    console.error(`error: ${body.error}`);
    process.exit(1);
  }
} catch {
  console.error(`つながらなかった… (${base}) visualizer は起動してる?`);
  process.exit(1);
}
