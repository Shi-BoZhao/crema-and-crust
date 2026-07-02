#!/usr/bin/env node
/**
 * ワンコマンド起動: visualizer + cloudflared トンネル + ブラウザ。
 *
 *   npm run up
 *
 * やること:
 *   1. 合言葉(トークン)を .diorama-token に用意(初回は自動生成)
 *   2. vite (localhost:5199) をトークン付きで起動
 *   3. cloudflared があればトンネルを張り、URL を検出
 *   4. Cursor Secrets に貼る値を表示
 *   5. macOS ならブラウザで店を開く
 *
 * 終了は Ctrl+C(vite と cloudflared をまとめて止める)。
 */

import { spawn, execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const visualizerDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokenFile = join(visualizerDir, '.diorama-token');

// ---- 1. トークン(なければ生成して保存) ----

let token = process.env.DIORAMA_TOKEN;
if (!token) {
  if (existsSync(tokenFile)) {
    token = readFileSync(tokenFile, 'utf8').trim();
  } else {
    token = `crema-${randomBytes(6).toString('hex')}`;
    writeFileSync(tokenFile, `${token}\n`);
  }
}

const children = [];
let opened = false;

function openBrowser() {
  if (opened) return;
  opened = true;
  if (process.platform === 'darwin') {
    setTimeout(() => {
      try {
        execSync('open "http://localhost:5199/?demo=0"');
      } catch {
        /* 手で開いてもらう */
      }
    }, 1500);
  }
}

function shutdown() {
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      /* already gone */
    }
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ---- 2. vite ----

console.log('▸ visualizer を起動中…');
const vite = spawn('npx', ['vite'], {
  cwd: visualizerDir,
  env: { ...process.env, DIORAMA_TOKEN: token },
  stdio: ['ignore', 'pipe', 'pipe'],
});
children.push(vite);
vite.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  if (/Local:/.test(text)) console.log('  店: http://localhost:5199/?demo=0');
});
vite.stderr.on('data', () => {});
vite.on('exit', (code) => {
  console.error(`vite が終了しました (exit ${code})`);
  if (code !== 0) {
    console.error('ポート 5199 が使用中かも。先に既存の visualizer を止めてください。');
  }
  shutdown();
});

// ---- 3. cloudflared ----

function hasCommand(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore', shell: '/bin/sh' });
    return true;
  } catch {
    return false;
  }
}

function printSecrets(url) {
  console.log('\n────────────────────────────────────────────');
  console.log('Cursor Dashboard → Cloud Agents → Secrets に設定:');
  console.log('');
  console.log(`  DIORAMA_URL    ${url ?? '(トンネルなし: ローカル Agent のみ動作)'}`);
  console.log(`  DIORAMA_TOKEN  ${token}`);
  console.log('  DIORAMA_AGENT  (任意。未設定ならリポジトリ名が店員の名前になる)');
  console.log('────────────────────────────────────────────');
  if (url) {
    console.log('※ この URL は起動のたびに変わります。変わったら DIORAMA_URL も更新。');
  }
  console.log('止めるときは Ctrl+C\n');
}

if (hasCommand('cloudflared')) {
  console.log('▸ トンネルを起動中…(URL の発行に数秒かかります)');
  const tunnel = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:5199'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(tunnel);

  let announced = false;
  const watch = (chunk) => {
    const match = chunk.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match && !announced) {
      announced = true;
      printSecrets(match[0]);
      openBrowser();
    }
  };
  tunnel.stdout.on('data', watch);
  tunnel.stderr.on('data', watch);
  tunnel.on('exit', (code) => {
    if (!announced) {
      console.error(`cloudflared が終了しました (exit ${code})。トンネルなしで続行します。`);
      printSecrets(null);
      openBrowser();
    }
  });
} else {
  console.log('▸ cloudflared が見つかりません。トンネルなしで起動します。');
  console.log('  (Cloud Agent 連携には `brew install cloudflared` が必要)');
  printSecrets(null);
  openBrowser();
}