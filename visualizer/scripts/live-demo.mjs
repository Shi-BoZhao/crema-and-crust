#!/usr/bin/env node
/**
 * 実環境の動作確認用: 複数 agent の状態遷移を順番に送る。
 *
 *   npm run live-demo
 *   DIORAMA_URL=https://xxx.trycloudflare.com DIORAMA_TOKEN=合言葉 npm run live-demo
 *
 * ブラウザで http://localhost:5199/?demo=0 を開いた状態で実行すると、
 * 店員が入店して歩き回る様子を眺められる。
 */

const base =
  process.env.DIORAMA_URL ?? `http://localhost:${process.env.DIORAMA_PORT ?? '5199'}`;
const headers = { 'Content-Type': 'application/json' };
if (process.env.DIORAMA_TOKEN) {
  headers.Authorization = `Bearer ${process.env.DIORAMA_TOKEN}`;
}

async function send(agent, state, detail, waitSec) {
  const res = await fetch(`${base.replace(/\/$/, '')}/api/event`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ agent, state, detail }),
  });
  const body = await res.json();
  if (!body.ok) {
    console.error(`error (${agent} → ${state}):`, body.error ?? res.status);
    process.exit(1);
  }
  console.log(`→ ${agent}: ${state}  ${detail}`);
  await new Promise((r) => setTimeout(r, waitSec * 1000));
}

console.log(`送信先: ${base}`);
console.log('ブラウザで ?demo=0 を開いたまま、見守ってください…\n');

try {
  await send('main', 'idle', 'カウンターでひとやすみ', 6);
  await send('main', 'thinking', 'きょうの仕込みをかんがえる', 8);
  await send('cloud-1', 'reading', '棚から材料をさがす', 9);
  await send('main', 'coding', '生地をのばしている', 10);
  await send('cloud-1', 'testing', '窯でじっくり焼く', 10);
  await send('cloud-2', 'coding', 'エスプレッソをしこむ', 10);
  await send('cloud-1', 'error', 'ちょっと困った…', 7);
  await send('cloud-1', 'coding', 'もういちど、ゆっくり', 9);
  await send('cloud-1', 'done', 'マルゲリータ、できた', 8);
  await send('cloud-2', 'done', 'いい香りの一杯', 8);
  await send('main', 'idle', 'また明日も、のんびり', 6);
  console.log('\nデモ終了');
} catch {
  console.error(`\nつながらなかった (${base})`);
  console.error('visualizer を起動してる?  →  cd visualizer && npm run dev');
  process.exit(1);
}
