#!/usr/bin/env node
// 使い方: node scripts/send-event.mjs <state> [detail...]
//   例:   node scripts/send-event.mjs coding "生地をのばしている"
// ポートは環境変数 DIORAMA_PORT で変更できる(既定 5199)。

const STATES = ['idle', 'thinking', 'reading', 'coding', 'testing', 'error', 'done'];

const [state, ...rest] = process.argv.slice(2);
const detail = rest.join(' ') || undefined;

if (!state || !STATES.includes(state)) {
  console.error(`使い方: send-event.mjs <state> [detail]\nstate: ${STATES.join(' | ')}`);
  process.exit(1);
}

const port = process.env.DIORAMA_PORT ?? '5199';

try {
  const res = await fetch(`http://localhost:${port}/api/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, detail }),
  });
  const body = await res.json();
  if (body.ok) {
    console.log(`ok: ${state}${detail ? ` (${detail})` : ''}`);
  } else {
    console.error(`error: ${body.error}`);
    process.exit(1);
  }
} catch {
  console.error(`つながらなかった… visualizer を起動してる? (cd visualizer && npm run dev)`);
  process.exit(1);
}
