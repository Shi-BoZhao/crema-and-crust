/**
 * visualizer へのイベント POST。CLI と Cursor hooks から共有する。
 */

const STATES = new Set([
  'idle',
  'thinking',
  'reading',
  'coding',
  'testing',
  'error',
  'done',
]);

export function resolveBaseUrl() {
  return (
    process.env.DIORAMA_URL ?? `http://localhost:${process.env.DIORAMA_PORT ?? '5199'}`
  ).replace(/\/$/, '');
}

export function resolveAgent(explicit) {
  if (explicit) return explicit;
  if (process.env.DIORAMA_AGENT) return process.env.DIORAMA_AGENT;
  return 'main';
}

/**
 * @param {{ state: string, detail?: string, agent?: string, silent?: boolean, tryLocalhost?: boolean, timeoutMs?: number }} opts
 * @returns {Promise<boolean>} 送信できたら true。未設定・接続不可は false。
 */
export async function sendEvent({
  state,
  detail,
  agent,
  silent = false,
  tryLocalhost = false,
  timeoutMs = 2500,
}) {
  if (!STATES.has(state)) {
    if (!silent) console.error(`invalid state: ${state}`);
    return false;
  }
  if (process.env.DIORAMA_AUTO === '0') return false;

  // Cloud Agent では DIORAMA_URL (トンネル先) を Secrets に設定する。
  // ローカル IDE では DIORAMA_URL 未設定 + tryLocalhost で localhost:5199 を試す。
  if (!process.env.DIORAMA_URL && !tryLocalhost) return false;

  const base = resolveBaseUrl();
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.DIORAMA_TOKEN) {
    headers.Authorization = `Bearer ${process.env.DIORAMA_TOKEN}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}/api/event`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        state,
        detail: detail?.slice(0, 200),
        agent: resolveAgent(agent),
      }),
      signal: controller.signal,
    });
    const body = await res.json();
    if (!body.ok && !silent) {
      console.error(`diorama: ${body.error ?? res.status}`);
    }
    return body.ok === true;
  } catch {
    if (!silent && process.env.DIORAMA_URL) {
      console.error(`diorama: つながらなかった (${base})`);
    }
    return false;
  } finally {
    clearTimeout(timer);
  }
}
