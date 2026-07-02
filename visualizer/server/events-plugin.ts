import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

const VALID_STATES = new Set([
  'idle',
  'thinking',
  'reading',
  'coding',
  'testing',
  'error',
  'done',
]);

interface StoredEvent {
  state: string;
  detail?: string;
  at: number;
}

/**
 * 開発サーバーに同居するイベント受け口。
 *   POST /api/event   {"state":"coding","detail":"..."} を受け取る
 *   GET  /api/event?state=coding&detail=...  curl での手動確認用
 *   GET  /api/events  SSE。接続直後に最後のイベントを流す
 *   GET  /api/state   最後のイベントを JSON で返す
 */
export function eventsPlugin(): Plugin {
  let last: StoredEvent = { state: 'idle', at: Date.now() };
  let received = false; // デモ抑止用: 実イベントが一度でも来たか
  const subscribers = new Set<ServerResponse>();

  function broadcast(event: StoredEvent) {
    last = event;
    const payload = `data: ${JSON.stringify({ ...event, received })}\n\n`;
    for (const res of subscribers) {
      res.write(payload);
    }
  }

  function acceptEvent(state: unknown, detail: unknown, res: ServerResponse) {
    if (typeof state !== 'string' || !VALID_STATES.has(state)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          ok: false,
          error: `state must be one of: ${[...VALID_STATES].join(', ')}`,
        }),
      );
      return;
    }
    received = true;
    broadcast({
      state,
      detail: typeof detail === 'string' ? detail.slice(0, 200) : undefined,
      at: Date.now(),
    });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, state }));
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
                acceptEvent(parsed.state, parsed.detail, res);
              })
              .catch(() => {
                res.statusCode = 400;
                res.end('{"ok":false}');
              });
          } else {
            acceptEvent(
              url.searchParams.get('state'),
              url.searchParams.get('detail') ?? undefined,
              res,
            );
          }
          return;
        }

        if (url.pathname === '/api/state') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ...last, received }));
          return;
        }

        if (url.pathname === '/api/events') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.write(`data: ${JSON.stringify({ ...last, received })}\n\n`);
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
