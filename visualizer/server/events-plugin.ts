import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import {
  isAgentState,
  MAX_DETAIL_LENGTH,
  sanitizeAgentId,
  AGENT_STATES,
  type AgentEvent,
} from '../src/protocol';

/** これより古い agent は「もう帰った」とみなして配信から外す */
const AGENT_TTL_MS = 30 * 60_000;

/**
 * 開発サーバーに同居するイベント受け口。
 *   POST /api/event   {"state":"coding","detail":"...","agent":"cloud-1"} を受け取る
 *   GET  /api/event?state=coding&detail=...&agent=...  curl での手動確認用
 *   GET  /api/events  SSE。接続直後に各 agent の最後のイベントを流す
 *   GET  /api/state   全 agent の最後のイベントを JSON で返す
 *
 * 環境変数 DIORAMA_TOKEN を設定すると、イベント送信に
 * Authorization: Bearer <token>(または ?token= / body.token)が必要になる。
 * トンネルでインターネットに公開するときに使う。
 */
export function eventsPlugin(): Plugin {
  const agents = new Map<string, AgentEvent>();
  let received = false; // デモ抑止用: 実イベントが一度でも来たか
  const subscribers = new Set<ServerResponse>();
  const token = process.env.DIORAMA_TOKEN;

  function prune() {
    const now = Date.now();
    for (const [agent, event] of agents) {
      if (now - event.at > AGENT_TTL_MS) agents.delete(agent);
    }
  }

  function broadcast(event: AgentEvent) {
    agents.set(event.agent, event);
    prune();
    const payload = `data: ${JSON.stringify({ ...event, received })}\n\n`;
    for (const res of subscribers) {
      res.write(payload);
    }
  }

  function json(res: ServerResponse, status: number, body: unknown) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  }

  function authorized(req: IncomingMessage, params: Record<string, unknown>): boolean {
    if (!token) return true;
    const header = req.headers.authorization;
    if (header === `Bearer ${token}`) return true;
    return params.token === token;
  }

  function acceptEvent(
    req: IncomingMessage,
    params: Record<string, unknown>,
    res: ServerResponse,
  ) {
    if (!authorized(req, params)) {
      json(res, 401, { ok: false, error: 'token required' });
      return;
    }
    const { state, detail, agent } = params;
    if (!isAgentState(state)) {
      json(res, 400, {
        ok: false,
        error: `state must be one of: ${AGENT_STATES.join(', ')}`,
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

  function readBody(req: IncomingMessage): Promise<string> {
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
    name: 'crema-agent-events',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (!url.pathname.startsWith('/api/')) {
          next();
          return;
        }

        // トンネル越し・別オリジンからの送信を許す
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (url.pathname === '/api/event') {
          if (req.method === 'POST') {
            readBody(req)
              .then((body) => {
                let parsed: Record<string, unknown> = {};
                try {
                  parsed = JSON.parse(body || '{}');
                } catch {
                  /* 空のまま acceptEvent で 400 になる */
                }
                acceptEvent(req, parsed, res);
              })
              .catch(() => json(res, 400, { ok: false }));
          } else {
            acceptEvent(req, Object.fromEntries(url.searchParams), res);
          }
          return;
        }

        if (url.pathname === '/api/state') {
          prune();
          json(res, 200, { agents: [...agents.values()], received });
          return;
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
          return;
        }

        next();
      });
    },
  };
}
