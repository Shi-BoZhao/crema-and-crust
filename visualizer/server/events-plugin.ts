import type { Plugin } from 'vite';
import { createEventHub } from './api.mjs';

/**
 * 開発サーバーに同居するイベント受け口。
 * 実体は server/api.mjs(スタンドアロンサーバーと共有)。
 */
export function eventsPlugin(): Plugin {
  const hub = createEventHub();
  return {
    name: 'crema-agent-events',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!hub.handle(req, res)) next();
      });
    },
  };
}
