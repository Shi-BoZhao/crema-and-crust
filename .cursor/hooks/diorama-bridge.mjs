#!/usr/bin/env node
/**
 * Cursor hooks → Crema & Crust ジオラマのブリッジ(単一ファイル・依存なし)。
 * stdin に Cursor が渡す JSON を読み、visualizer へ状態を POST する。
 *
 * このファイルは .cursor/hooks.json / diorama.sh とセットで、
 * どのリポジトリにコピーしてもそのまま動く。
 * (crema-and-crust リポジトリでは visualizer/scripts/install-hooks.mjs が配布元)
 *
 * 環境変数(Cursor Cloud Agent の Secrets / ローカルはシェルの env):
 *   DIORAMA_URL    送信先。Cloud では必須(トンネル URL)。
 *                  未設定ならローカル用に http://localhost:5199 を試す
 *   DIORAMA_TOKEN  サーバー側で設定した合言葉(あれば)
 *   DIORAMA_AGENT  店員の名前。未設定なら package.json の name か
 *                  リポジトリのフォルダ名から自動で決まる
 *   DIORAMA_AUTO   0 で自動送信を無効化
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';
import { tmpdir } from 'node:os';

const THROTTLE_MS = 2500;
const THROTTLE_DIR = `${tmpdir()}/crema-diorama-throttle`;
const STATES = new Set(['idle', 'thinking', 'reading', 'coding', 'testing', 'error', 'done']);

// ---- agent 名: DIORAMA_AGENT → package.json name → フォルダ名 ----

function detectAgent() {
  if (process.env.DIORAMA_AGENT) return process.env.DIORAMA_AGENT;
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    if (typeof pkg.name === 'string' && pkg.name) {
      return pkg.name.replace(/^@[^/]+\//, '');
    }
  } catch {
    /* package.json が無いリポジトリ */
  }
  const dir = basename(process.cwd());
  return dir && dir !== '/' ? dir : 'main';
}

// ---- 送信 ----

async function sendEvent(agent, state, detail) {
  if (!STATES.has(state)) return;
  if (process.env.DIORAMA_AUTO === '0') return;

  const base = (
    process.env.DIORAMA_URL ?? `http://localhost:${process.env.DIORAMA_PORT ?? '5199'}`
  ).replace(/\/$/, '');

  const headers = { 'Content-Type': 'application/json' };
  // ngrok 無料枠はこのヘッダがないと HTML の警告ページが返り、API に届かない
  if (/ngrok/i.test(base)) {
    headers['ngrok-skip-browser-warning'] = '1';
  }
  if (process.env.DIORAMA_TOKEN) {
    headers.Authorization = `Bearer ${process.env.DIORAMA_TOKEN}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 800);
  try {
    await fetch(`${base}/api/event`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ state, detail: detail?.slice(0, 200), agent }),
      signal: controller.signal,
    });
  } catch {
    // 店が閉まっていても、エージェントの作業は止めない
  } finally {
    clearTimeout(timer);
  }
}

// ---- 連続送信の抑制(同じ状態+文言は 2.5 秒に1回) ----

function shouldThrottle(agent, state, detail) {
  try {
    mkdirSync(THROTTLE_DIR, { recursive: true });
    const file = `${THROTTLE_DIR}/${createHash('sha1').update(agent).digest('hex')}.json`;
    let last = {};
    try {
      last = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      /* 初回 */
    }
    const key = `${agent}:${state}`;
    const now = Date.now();
    if (last[key] && now - last[key].at < THROTTLE_MS && last[key].detail === (detail ?? '')) {
      return true;
    }
    last[key] = { at: now, detail: detail ?? '' };
    writeFileSync(file, JSON.stringify(last));
    return false;
  } catch {
    return false;
  }
}

// ---- Cursor hook イベント → ジオラマ状態 ----

function shortPath(filePath) {
  if (typeof filePath !== 'string') return '';
  const name = basename(filePath);
  const dir = basename(filePath.replace(/[/\\][^/\\]+$/, ''));
  return dir && dir !== name ? `${dir}/${name}` : name;
}

function shortCmd(command) {
  if (typeof command !== 'string') return '';
  return command.replace(/\s+/g, ' ').trim().slice(0, 120);
}

function isTestOrBuild(command) {
  return /(?:^|\s)(npm (?:run )?(?:test|build|lint)|npx vitest|vitest|eslint|tsc(?:\s|$)|pnpm test|yarn test|cargo (?:test|build)|go (?:test|build)|pytest|make(?:\s|$))/.test(
    command,
  );
}

function shellFailed(output) {
  if (typeof output !== 'string') return false;
  return (
    /exit_code:\s*[1-9]/.test(output) ||
    /\bFAIL\b/.test(output) ||
    /\bError:/.test(output) ||
    / ELIFECYCLE /.test(output)
  );
}

function mapHook(payload, mainAgent) {
  switch (payload.hook_event_name) {
    case 'beforeReadFile':
      return {
        agent: mainAgent,
        state: 'reading',
        detail: shortPath(payload.file_path) || 'ファイルを読む',
        needsAllow: true,
      };

    case 'afterFileEdit':
      return {
        agent: mainAgent,
        state: 'coding',
        detail: shortPath(payload.file_path) || '編集中',
      };

    case 'beforeShellExecution': {
      const cmd = shortCmd(payload.command);
      if (isTestOrBuild(cmd)) {
        return { agent: mainAgent, state: 'testing', detail: cmd, needsAllow: true };
      }
      if (/\bgit push\b/.test(cmd)) {
        return { agent: mainAgent, state: 'done', detail: cmd, needsAllow: true };
      }
      return {
        agent: mainAgent,
        state: 'thinking',
        detail: cmd || 'コマンドを考える',
        needsAllow: true,
      };
    }

    case 'afterShellExecution': {
      const cmd = shortCmd(payload.command);
      if (!isTestOrBuild(cmd)) return null;
      const failed = shellFailed(payload.output);
      return {
        agent: mainAgent,
        state: failed ? 'error' : 'done',
        detail: failed ? `${cmd} がうまくいかなかった` : `${cmd} がとおった`,
      };
    }

    case 'postToolUseFailure':
      return {
        agent: mainAgent,
        state: 'error',
        detail:
          (typeof payload.error_message === 'string' && payload.error_message.slice(0, 120)) ||
          `${payload.tool_name ?? 'tool'} がうまくいかなかった`,
      };

    case 'subagentStart': {
      const sub = payload.subagent_type ?? 'sub';
      return {
        agent: `${mainAgent}-sub-${sub}`,
        state: 'thinking',
        detail:
          (typeof payload.task === 'string' && payload.task.slice(0, 120)) || `${sub} を手伝う`,
        needsAllow: true,
      };
    }

    case 'subagentStop': {
      const sub = payload.subagent_type ?? 'sub';
      const agent = `${mainAgent}-sub-${sub}`;
      const status = payload.status ?? 'completed';
      const desc =
        (typeof payload.description === 'string' && payload.description.slice(0, 120)) || '';
      if (status === 'completed') {
        return { agent, state: 'done', detail: desc || 'お手伝いが終わった' };
      }
      if (status === 'error') {
        return { agent, state: 'error', detail: desc || 'お手伝いで困った' };
      }
      return { agent, state: 'idle', detail: 'ひとやすみ' };
    }

    default:
      return null;
  }
}

// ---- main ----

async function main() {
  let payload = {};
  try {
    const raw = readFileSync(0, 'utf8');
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    /* stdin なし・壊れた JSON は無視 */
  }

  const mapped = mapHook(payload, detectAgent());
  if (mapped) {
    if (!shouldThrottle(mapped.agent, mapped.state, mapped.detail)) {
      await sendEvent(mapped.agent, mapped.state, mapped.detail);
    }
    if (mapped.needsAllow) {
      process.stdout.write('{"permission":"allow"}\n');
    }
  }
}

main().catch(() => process.exit(0));
