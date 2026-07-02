#!/usr/bin/env node
/**
 * Cursor hooks → ジオラマ状態のブリッジ。
 * stdin に Cursor が渡す JSON を読み、DIORAMA_URL へ POST する。
 *
 * DIORAMA_URL / DIORAMA_TOKEN / DIORAMA_AGENT は Cursor Cloud Agent の
 * Secrets に設定する。未設定なら localhost:5199 を試し、つながらなければ何もしない。
 *
 * DIORAMA_AUTO=0 で無効化。
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';
import { sendEvent, resolveAgent } from './lib/send.mjs';

const THROTTLE_MS = 2500;
const THROTTLE_DIR = '/tmp/crema-diorama-throttle';

function readStdin() {
  try {
    const raw = readFileSync(0, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

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
  return /(?:^|\s)(npm (?:run )?(?:test|build|lint)|npx vitest|vitest|eslint|tsc(?:\s|$)|pnpm test|yarn test)/.test(
    command,
  );
}

function isGitDone(command) {
  return /\bgit push\b/.test(command);
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

function throttleKey(agent, state) {
  return `${agent}:${state}`;
}

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
    const key = throttleKey(agent, state);
    const now = Date.now();
    if (
      last[key] &&
      now - last[key].at < THROTTLE_MS &&
      last[key].detail === (detail ?? '')
    ) {
      return true;
    }
    last[key] = { at: now, detail: detail ?? '' };
    writeFileSync(file, JSON.stringify(last));
    return false;
  } catch {
    return false;
  }
}

function mapHook(payload) {
  const event = payload.hook_event_name;
  const mainAgent = resolveAgent(process.env.DIORAMA_AGENT);

  switch (event) {
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
      if (isGitDone(cmd)) {
        return { agent: mainAgent, state: 'done', detail: cmd, needsAllow: true };
      }
      return { agent: mainAgent, state: 'thinking', detail: cmd || 'コマンドを考える', needsAllow: true };
    }

    case 'afterShellExecution': {
      const cmd = shortCmd(payload.command);
      if (isTestOrBuild(cmd)) {
        return {
          agent: mainAgent,
          state: shellFailed(payload.output) ? 'error' : 'done',
          detail: shellFailed(payload.output) ? `${cmd} がうまくいかなかった` : `${cmd} がとおった`,
        };
      }
      return null;
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
        agent: `sub-${sub}`,
        state: 'thinking',
        detail:
          (typeof payload.task === 'string' && payload.task.slice(0, 120)) ||
          `${sub} を手伝う`,
        needsAllow: true,
      };
    }

    case 'subagentStop': {
      const sub = payload.subagent_type ?? 'sub';
      const status = payload.status ?? 'completed';
      const agent = `sub-${sub}`;
      if (status === 'completed') {
        return {
          agent,
          state: 'done',
          detail:
            (typeof payload.description === 'string' && payload.description.slice(0, 120)) ||
            'お手伝いが終わった',
        };
      }
      if (status === 'error') {
        return {
          agent,
          state: 'error',
          detail:
            (typeof payload.description === 'string' && payload.description.slice(0, 120)) ||
            'お手伝いで困った',
        };
      }
      return { agent, state: 'idle', detail: 'ひとやすみ' };
    }

    default:
      return null;
  }
}

async function main() {
  const payload = readStdin();
  const mapped = mapHook(payload);
  if (!mapped) {
    return;
  }

  if (!shouldThrottle(mapped.agent, mapped.state, mapped.detail)) {
    await sendEvent({
      state: mapped.state,
      detail: mapped.detail,
      agent: mapped.agent,
      silent: true,
      tryLocalhost: !process.env.DIORAMA_URL,
      timeoutMs: 800,
    });
  }

  if (mapped.needsAllow) {
    process.stdout.write('{"permission":"allow"}\n');
  }
}

main().catch(() => {
  // hook がエージェント本体を止めない
  process.exit(0);
});
