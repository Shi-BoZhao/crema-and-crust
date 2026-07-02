#!/usr/bin/env node
/**
 * Vite 不要のスタンドアロンサーバー。dist/(ビルド済みフロント)と
 * イベント API を1プロセスで配信する。どこでもホストできる:
 *
 *   npm run build
 *   DIORAMA_TOKEN=合言葉 node server/standalone.mjs
 *
 * 環境変数:
 *   PORT           待ち受けポート(既定 5199)
 *   DIORAMA_TOKEN  イベント送信の合言葉(眺めるだけなら不要)
 */

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEventHub } from './api.mjs';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT ?? 5199);

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('dist/ がありません。先に `npm run build` を実行してください。');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.map': 'application/json',
  '.woff2': 'font/woff2',
};

const hub = createEventHub();

const server = createServer((req, res) => {
  if (hub.handle(req, res)) return;

  const url = new URL(req.url ?? '/', 'http://localhost');
  let filePath = normalize(join(distDir, url.pathname));
  if (!filePath.startsWith(distDir)) {
    res.statusCode = 403;
    res.end();
    return;
  }
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(distDir, 'index.html'); // SPA フォールバック
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream');
  createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`Crema & Crust Diorama: http://localhost:${port}/`);
  console.log(
    process.env.DIORAMA_TOKEN
      ? '送信には DIORAMA_TOKEN の Bearer トークンが必要です'
      : '注意: DIORAMA_TOKEN 未設定(誰でも送信できます)',
  );
});
