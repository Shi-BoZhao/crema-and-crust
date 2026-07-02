/**
 * イベント API の本体(プレーン Node、依存なし)。
 * Vite 開発プラグイン(events-plugin.ts)と、Vite 不要の
 * スタンドアロンサーバー(standalone.mjs)の両方から使う。
 *
 * エンドポイント:
 *   POST /api/event   {"state","detail","agent"} を受け取る
 *   GET  /api/event?state=...&detail=...&agent=...  手動確認用
 *   GET  /api/state   全 agent の最後のイベント
 *   GET  /api/events  SSE。接続直後に各 agent の最後のイベントを流す
 *
 * 環境変数 DIORAMA_TOKEN があると、イベント送信に Bearer トークンが必要。
 */

const VALID_STATES = new Set([
  'idle',
  'thinking',
  'reading',
  'coding',
  'testing',
  'error',
  'done',
]);

const MAX_DETAIL_LENGTH = 200;
const AGENT_TTL_MS = 30 * 60_000;

/** @param {unknown} value */
function sanitizeAgentId(value) {
  if (typeof value !== 'string') return 'main';
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 32);
  return cleaned || 'main';
}

/**
 * @param {{ token?: string }} [options]
 * @returns {{ handle(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse): boolean }}
 */
export function createEventHub({ token = process.env.DIORAMA_TOKEN } = {}) {
  /** @type {Map<string, { agent: string, state: string, detail?: string, at: number }>} */
  const agents = new Map();
  let received = false;
  /** @type {Set<import('node:http').ServerResponse>} */
  const subscribers = new Set();

  function prune() {
    const now = Date.now();
    for (const [agent, event] of agents) {
      if (now - event.at > AGENT_TTL_MS) agents.delete(agent);
    }
  }

  /** @param {{ agent: string, state: string, detail?: string, at: number }} event */
  function broadcast(event) {
    agents.set(event.agent, event);
    prune();
    const payload = `data: ${JSON.stringify({ ...event, received })}\n\n`;
    for (const res of subscribers) {
      res.write(payload);
    }
  }

  /**
   * @param {import('node:http').ServerResponse} res
   * @param {number} status
   * @param {unknown} body
   */
  function json(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  }

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {Record<string, unknown>} params
   */
  function authorized(req, params) {
    if (!token) return true;
    if (req.headers.authorization === `Bearer ${token}`) return true;
    return params.token === token;
  }

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {Record<string, unknown>} params
   * @param {import('node:http').ServerResponse} res
   */
  function acceptEvent(req, params, res) {
    if (!authorized(req, params)) {
      json(res, 401, { ok: false, error: 'token required' });
      return;
    }
    const { state, detail, agent } = params;
    if (typeof state !== 'string' || !VALID_STATES.has(state)) {
      json(res, 400, {
        ok: false,
        error: `state must be one of: ${[...VALID_STATES].join(', ')}`,
      });
      return;
    }
    received = true;
    broadcast({
      agent: sanitizeAgentId(agent),
      state,
      detail: typeof detail === 'string' ? detail.slice(0, MAX_DETAIL_LENGTH) : undefined,
      at: Date.now(),
    });
    json(res, 200, { ok: true, state, agent: sanitizeAgentId(agent) });
  }

  /** @param {import('node:http').IncomingMessage} req */
  function readBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 10_000) reject(new Error('body too large'));
      });
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  }

  return {
    handle(req, res) {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (!url.pathname.startsWith('/api/')) return false;

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return true;
      }

      if (url.pathname === '/api/event') {
        if (req.method === 'POST') {
          readBody(req)
            .then((body) => {
              /** @type {Record<string, unknown>} */
              let parsed = {};
              try {
                parsed = JSON.parse(String(body) || '{}');
              } catch {
                /* 空のまま acceptEvent で 400 になる */
              }
              acceptEvent(req, parsed, res);
            })
            .catch(() => json(res, 400, { ok: false }));
        } else {
          acceptEvent(req, Object.fromEntries(url.searchParams), res);
        }
        return true;
      }

      if (url.pathname === '/api/state') {
        prune();
        json(res, 200, { agents: [...agents.values()], received });
        return true;
      }

      if (url.pathname === '/api/events') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        prune();
        for (const event of agents.values()) {
          res.write(`data: ${JSON.stringify({ ...event, received })}\n\n`);
        }
        subscribers.add(res);
        const keepAlive = setInterval(() => res.write(': ping\n\n'), 25_000);
        req.on('close', () => {
          clearInterval(keepAlive);
          subscribers.delete(res);
        });
        return true;
      }

      json(res, 404, { ok: false });
      return true;
    },
  };
}
