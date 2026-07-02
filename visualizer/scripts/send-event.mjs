#!/usr/bin/env node
// 使い方: node scripts/send-event.mjs [--agent id] [--quiet] <state> [detail...]

import { sendEvent, resolveAgent } from './lib/send.mjs';

const STATES = ['idle', 'thinking', 'reading', 'coding', 'testing', 'error', 'done'];

const args = process.argv.slice(2);
let agent = process.env.DIORAMA_AGENT;
let quiet = false;
while (args[0]?.startsWith('--')) {
  if (args[0] === '--agent' && args[1]) {
    agent = args[1];
    args.splice(0, 2);
  } else if (args[0] === '--quiet') {
    quiet = true;
    args.splice(0, 1);
  } else {
    console.error(`不明なオプション: ${args[0]}`);
    process.exit(1);
  }
}

const [state, ...rest] = args;
const detail = rest.join(' ') || undefined;

if (!state || !STATES.includes(state)) {
  console.error(
    `使い方: send-event.mjs [--agent id] [--quiet] <state> [detail]\nstate: ${STATES.join(' | ')}`,
  );
  process.exit(1);
}

const ok = await sendEvent({
  state,
  detail,
  agent: resolveAgent(agent),
  silent: quiet,
  tryLocalhost: true,
});
process.exit(ok ? 0 : 1);
