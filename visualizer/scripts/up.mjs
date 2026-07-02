#!/usr/bin/env node
/**
 * ワンコマンド起動: visualizer + トンネル + ブラウザ。
 *
 *   npm run up
 *
 * トンネルは3モード:
 *   1. 固定トンネル(推奨): .diorama.config.json か環境変数で設定すると
 *      URL が毎回同じになり、Cursor Secrets の更新が不要になる
 *   2. クイックトンネル: 設定がなければ cloudflared の使い捨て URL
 *   3. トンネルなし: cloudflared 未導入ならローカルのみ
 *
 * .diorama.config.json(visualizer/ 直下、gitignore 済み)の例:
 *   {
 *     "tunnelCommand": "cloudflared tunnel run crema-diorama",
 *     "publicUrl": "https://diorama.example.com"
 *   }
 * ngrok の固定ドメインなら:
 *   {
 *     "tunnelCommand": "ngrok http --domain=xxx.ngrok-free.app 5199",
 *     "publicUrl": "https://xxx.ngrok-free.app"
 *   }
 * 環境変数 DIORAMA_TUNNEL_CMD / DIORAMA_PUBLIC_URL でも同じ(こちらが優先)。
 *
 * 終了は Ctrl+C(vite とトンネルをまとめて止める)。
 */

import { spawn, execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const visualizerDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokenFile = join(visualizerDir, '.diorama-token');
const configFile = join(visualizerDir, '.diorama.config.json');

// ---- 設定(固定トンネル) ----

let config = {};
if (existsSync(configFile)) {
  try {
    config = JSON.parse(readFileSync(configFile, 'utf8'));
  } catch {
    console.error(`${configFile} が読めません(壊れた JSON?)。無視して続行します。`);
  }
}
const tunnelCommand = process.env.DIORAMA_TUNNEL_CMD ?? config.tunnelCommand;
const publicUrl = (process.env.DIORAMA_PUBLIC_URL ?? config.publicUrl)?.replace(/\/$/, '');

// ---- トークン(なければ生成して保存) ----

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

function hasCommand(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore', shell: '/bin/sh' });
    return true;
  } catch {
    return false;
  }
}

function printSecrets(url, { fixed = false } = {}) {
  console.log('\n────────────────────────────────────────────');
  console.log('Cursor Dashboard → Cloud Agents → Secrets に設定:');
  console.log('');
  console.log(`  DIORAMA_URL    ${url ?? '(トンネルなし: ローカル Agent のみ動作)'}`);
  console.log(`  DIORAMA_TOKEN  ${token}`);
  console.log('  DIORAMA_AGENT  (任意。未設定ならリポジトリ名が店員の名前になる)');
  console.log('────────────────────────────────────────────');
  if (url && fixed) {
    console.log('※ 固定 URL なので Secrets は一度設定すれば OK');
  } else if (url) {
    console.log('※ この URL は起動のたびに変わります。変わったら DIORAMA_URL も更新。');
    console.log('  固定したい場合は README の「URL を固定する」を参照');
  }
  console.log('止めるときは Ctrl+C\n');
}

// ---- vite ----

console.log('▸ visualizer を起動中…');
const vite = spawn('npx', ['vite'], {
  cwd: visualizerDir,
  env: { ...process.env, DIORAMA_TOKEN: token },
  stdio: ['ignore', 'pipe', 'pipe'],
});
children.push(vite);
vite.stdout.on('data', (chunk) => {
  if (/Local:/.test(chunk.toString())) console.log('  店: http://localhost:5199/?demo=0');
});
vite.stderr.on('data', () => {});
vite.on('exit', (code) => {
  console.error(`vite が終了しました (exit ${code})`);
  if (code !== 0) {
    console.error('ポート 5199 が使用中かも。先に既存の visualizer を止めてください。');
  }
  shutdown();
});

// ---- トンネル ----

if (tunnelCommand) {
  // 固定トンネル(Named Tunnel / ngrok 固定ドメインなど)
  console.log(`▸ 固定トンネルを起動中… (${tunnelCommand})`);
  const tunnel = spawn(tunnelCommand, {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(tunnel);
  tunnel.stdout.on('data', (chunk) => process.stderr.write(chunk));
  tunnel.stderr.on('data', (chunk) => process.stderr.write(chunk));
  tunnel.on('exit', (code) => {
    if (code !== 0) {
      console.error(`\nトンネルが終了しました (exit ${code})。上の ngrok/cloudflared のエラーを確認してください。`);
      console.error('  ローカルだけ動いていても、Cloud Agent からは届きません。\n');
    }
  });
  printSecrets(publicUrl ?? '(publicUrl 未設定: .diorama.config.json に追記してください)', {
    fixed: Boolean(publicUrl),
  });
  openBrowser();
} else if (hasCommand('cloudflared')) {
  // クイックトンネル(URL 使い捨て)
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
