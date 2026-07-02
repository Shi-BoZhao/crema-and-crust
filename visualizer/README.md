# Crema & Crust Diorama

Cursor で AI エージェントが作業している様子を、ドット絵風の小さな 3D ジオラマ
(ピッツェリア兼エスプレッソカフェ)として眺めるビジュアライザー。

監視ダッシュボードではなく、**作業の気配をのほほんと見守る置き物**です。
エージェントが考えていれば店員さんはレシピノートを読み、コードを書いていれば
ピザ生地をのばし、テストが走れば窯に火が入ります。

設計メモは [`../docs/visualizer.md`](../docs/visualizer.md) にあります。

## 起動

### ワンコマンド起動(おすすめ)

```bash
cd visualizer
npm install        # 初回だけ
npm run up
```

これだけで **visualizer + トンネル(cloudflared があれば) + ブラウザ** が立ち上がり、
Cursor Secrets に貼る値がターミナルに表示されます。
合言葉(トークン)は初回に自動生成され、`.diorama-token` に保存されます。
止めるときは Ctrl+C。

### 手動起動

```bash
npm run dev        # localhost:5199 のみ(トンネルなし)
```

ブラウザで http://localhost:5199 を開くと店内が表示されます。
しばらくイベントが届かないと、自動でデモ(一日の営業)が流れます。

- `?demo=1` … 最初からデモを流す
- `?demo=0` … デモを無効にする(実イベントのみ)

## 状態を送る

エージェント(またはあなた)の状態は HTTP で送ります。

```bash
# 付属 CLI
npm run send coding "生地をのばしている"

# curl でも同じ
curl -X POST http://localhost:5199/api/event \
  -H 'Content-Type: application/json' \
  -d '{"state":"coding","detail":"src/game/pizza.ts を編集中"}'

# ブラウザや簡易確認には GET でも
curl "http://localhost:5199/api/event?state=done"
```

`state` は次の7つ。店員さんの持ち場と動きが切り替わります。

| state | 意味 | 店内での表現 |
|---|---|---|
| `idle` | 待機中 | カウンターでカップを拭いたり、ぼーっとする |
| `thinking` | 考え中 | レシピノートを読む(頭上に「…」) |
| `reading` | 読み込み中 | 棚から材料の瓶をさがす |
| `coding` | 実装中 | 作業台でピザ生地をのばす |
| `testing` | テスト/ビルド中 | 窯の火が強まり、煙突から煙が出る |
| `error` | エラー発生 | 手を止めて頭をかく(頭上に「?」) |
| `done` | 完了 | ピザやコーヒーをカウンターに置く(湯気つき) |

`detail` は任意の一言で、画面下の HUD に表示されるだけです。

## 複数エージェント

イベントに `agent`(識別子)を付けると、エージェントごとに店員が1人ずつ
入店してきます。省略すると `main`(店主)扱いです。

```bash
npm run send -- --agent cloud-1 testing "CI を実行中"
curl -X POST http://localhost:5199/api/event \
  -H 'Content-Type: application/json' \
  -d '{"state":"reading","agent":"cloud-2","detail":"調査中"}'
```

- 新しい店員は**入口から歩いて入店**し、同じ持ち場では横に並びます
- エプロンと髪の色は識別子から決まり、HUD の色付きドットと対応します
- 15分イベントが来ない店員は、そっと退店します(また送れば戻ってきます)

## Cloud Agent から送る

Cloud Agent(リモート VM)からあなたの手元の店に送るには、
ローカルの visualizer をトンネルで公開します。

```bash
# 手元: visualizer を起動し、トークン付きで公開する
DIORAMA_TOKEN=あなたの合言葉 npm run dev
cloudflared tunnel --url http://localhost:5199   # 表示される https://xxx.trycloudflare.com を控える
```

Cloud Agent 側には、Cursor Dashboard の Secrets などで環境変数を渡します。

```bash
export DIORAMA_URL=https://xxx.trycloudflare.com
export DIORAMA_TOKEN=あなたの合言葉
export DIORAMA_AGENT=cloud-1

# あとはローカルと同じ
node visualizer/scripts/send-event.mjs coding "実装中"
node visualizer/scripts/wrap.mjs -- npm test
```

`DIORAMA_TOKEN` をサーバー側に設定すると、送信には
`Authorization: Bearer <token>` が必須になります(眺めるだけなら不要)。
トンネルは cloudflared のほか、ngrok や `ssh -R` でも同じです。

同じ LAN 内なら、トンネルの代わりに `npm run dev -- --host` で LAN に公開し、
`DIORAMA_URL=http://<あなたのIP>:5199` を指定するだけでも届きます。

## Cursor Cloud Agent で自動連携（初回設定）

**できます。** リポジトリに `.cursor/hooks.json` が入っており、Cloud Agent が
ファイルを読む・編集する・シェルを実行する・サブエージェントを動かすたびに、
自動でジオラマへ状態が送られます。手動の `npm run send` は不要です。

### 一度だけやること

**1. 手元 PC — ワンコマンド起動**

```bash
cd visualizer
npm run up
```

visualizer・トンネル・ブラウザがまとめて立ち上がり、
Secrets に貼る値がターミナルに表示されます。
(cloudflared 未導入なら `brew install cloudflared` してから)

**2. Cursor Dashboard → Cloud Agent → Secrets**

ターミナルに表示された値をそのまま貼ります。

| Secret | 値 |
|---|---|
| `DIORAMA_URL` | 表示された `https://xxxx.trycloudflare.com` |
| `DIORAMA_TOKEN` | 表示された合言葉 |
| `DIORAMA_AGENT` | 省略可(未設定ならリポジトリ名が店員の名前になる) |

**3. ブラウザで見守る**

`npm run up` が自動で開きます(http://localhost:5199/?demo=0)。

ここまで終われば、以後 Cursor 上で Cloud Agent を走らせるだけで
手元の店内が勝手に動きます。

**注意**: 無料のクイックトンネルは起動のたびに URL が変わります。
`npm run up` し直したら Secrets の `DIORAMA_URL` も更新してください。
下の「URL を固定する」を設定すれば、Secrets は一度きりで済みます。

## URL を固定する(Named Tunnel / ngrok)

`visualizer/.diorama.config.json`(gitignore 済み)を一度つくると、
`npm run up` が毎回同じ URL でトンネルを張るようになります。

### 方法 A: Cloudflare Named Tunnel(独自ドメインを持っている場合)

```bash
cloudflared tunnel login                       # ブラウザで Cloudflare にログイン
cloudflared tunnel create crema-diorama        # トンネル作成(一度だけ)
cloudflared tunnel route dns crema-diorama diorama.あなたのドメイン.com
```

`.diorama.config.json`:

```json
{
  "tunnelCommand": "cloudflared tunnel run --url http://localhost:5199 crema-diorama",
  "publicUrl": "https://diorama.あなたのドメイン.com"
}
```

### 方法 B: ngrok の固定ドメイン(ドメイン不要・無料枠あり)

[ngrok のダッシュボード](https://dashboard.ngrok.com/)で無料の固定ドメイン
(`xxx.ngrok-free.app`)を1つ取得して:

```bash
brew install ngrok
ngrok config add-authtoken あなたのトークン
```

`.diorama.config.json`:

```json
{
  "tunnelCommand": "ngrok http --domain=xxx.ngrok-free.app 5199",
  "publicUrl": "https://xxx.ngrok-free.app"
}
```

どちらも設定後は `npm run up` だけで固定 URL が使われ、
**Cursor Secrets の `DIORAMA_URL` は一度設定すれば更新不要**になります。

## Cursor の中だけで完結させる

### 見る場所を Cursor にする

ジオラマは普通の Web ページなので、**Cursor 内蔵のブラウザタブ**で
`DIORAMA_URL`(または http://localhost:5199/?demo=0)を開けば、
エディタの中で見守れます。コマンドパレット(⌘⇧P)で「Browser」を検索するか、
Cursor のブラウザパネルに URL を貼るだけです。

### Mac で何も起動したくない場合(常設ホスティング)

visualizer は Vite なしの単体サーバーとしても動きます。
これをどこかに常設すれば、**手元で `npm run up` を起動する必要すらなくなり**、
Cursor 内蔵ブラウザで固定 URL を開くだけになります。

```bash
# 任意のサーバー / PaaS (Fly.io, Railway, Render, VPS など) で
npm ci && npm run build
DIORAMA_TOKEN=合言葉 PORT=5199 node server/standalone.mjs
```

Docker でも動きます(`visualizer/Dockerfile` 同梱):

```bash
docker build -t crema-diorama visualizer/
docker run -p 5199:5199 -e DIORAMA_TOKEN=合言葉 crema-diorama
```

デプロイ先の URL を Cursor Secrets の `DIORAMA_URL` に一度設定すれば、
以後は **Cursor で Cloud Agent を走らせ、Cursor 内蔵ブラウザで眺めるだけ**。
ローカルのプロセスはゼロです。

> 状態はメモリ保持(再起動でリセット)ですが、ジオラマは「いまの気配」を
> 眺めるものなので、永続化は不要という設計です。

### 自動で送られるタイミング

| Cloud Agent の動き | ジオラマの状態 |
|---|---|
| ファイルを読む | `reading` |
| ファイルを編集 | `coding` |
| `npm test` / build / lint など | `testing` → 終了後 `done` or `error` |
| ツール失敗 | `error` |
| サブエージェント開始 | `thinking`（別店員 `sub-explore` など） |
| サブエージェント終了 | `done` / `error` / `idle` |

フックの実体は `.cursor/hooks/diorama-bridge.mjs`(依存なしの単一ファイル)です。
`DIORAMA_AUTO=0` を Secrets に入れると自動送信を止められます。

### ローカル IDE の Agent でも動く

Secrets 不要です。`npm run dev` だけ起動していれば、
同じ hooks が localhost:5199 に送ります。動作確認:

```bash
cd visualizer && npm run hook-test
```

## 他のリポジトリでも使う

自動連携はこのリポジトリ専用ではありません。
**どのリポジトリにも1コマンドでインストール**できます。

```bash
cd visualizer
npm run install-hooks -- ~/path/to/other-repo
```

これで対象リポジトリに `.cursor/hooks.json` と
`.cursor/hooks/diorama-bridge.mjs`(単一ファイル・依存なし)がコピーされます。
対象リポジトリに visualizer を入れる必要はありません。

そのあと:

1. 対象リポジトリで **commit & push** する
   (Cloud Agent は push されたブランチの hooks を読むため)
2. Secrets(`DIORAMA_URL` / `DIORAMA_TOKEN`)は**そのまま共通で使えます**
3. 店員の名前は `DIORAMA_AGENT` 未設定なら**リポジトリ名から自動で決まる**ので、
   複数リポジトリの Agent が同じ店に別々の店員として現れます

既に hooks.json があるリポジトリでも、diorama の項目だけ安全に追記します
(2回実行しても重複しません)。

## コマンドを包む(半自動連携)

テストやビルドを `testing → done / error` で自動的に包めます。

```bash
# testing を送ってから npm test を実行し、結果に応じて done / error を送る
npm run wrap -- npm test

# 開始状態を変える場合
node scripts/wrap.mjs -s coding -- git commit -m "..."
```

Cursor / Claude Code の hooks(ツール実行前後のシェルフック)から
`curl` や `scripts/send-event.mjs` を叩けば、エージェントの動きに合わせて
店が動くようになります。連携は「HTTP で7状態を送るだけ」なので、
ファイル監視や MCP など、好きな方法に差し替えられます。

## 開発

```bash
npm run test    # Vitest(状態対応表・デモ台本の純関数テスト)
npm run build   # 型チェック + プロダクションビルド
```

### コードの構成

```
server/events-plugin.ts  Vite に同居するイベント受け口 (POST /api/event, SSE /api/events)
src/
  protocol.ts            サーバーと共有するイベント仕様 (状態・agent 正規化)
  types.ts               HUD ラベルなどフロント向けの表示定義
  director.ts            状態 → 店内の持ち場・吹き出しの対応表
  crew.ts                複数店員の管理 (入店・持ち場・退店・HUD 行)
  main.ts                すべてをつなぐエントリポイント
  events/                SSE 購読とデモ台本
  barista/               店員さん(ボクセル体格・見た目・状態別アニメーション)
  scene/                 店内ジオラマ・小物・湯気・アンビエント演出
  core/renderer.ts       低解像度レンダリング(ドット絵化)とカメラ
scripts/
  send-event.mjs         状態送信 CLI (DIORAMA_URL / AGENT / TOKEN 対応)
  wrap.mjs               コマンドを testing → done/error で包む
```

### 拡張のしかた

- **状態を増やす**: `protocol.ts` の `AGENT_STATES` に追加 →
  `director.ts` に持ち場を、`barista/animations.ts` に動きを1エントリずつ足す。
  描画や通信のコードは触らなくてよい。
- **小物・演出を増やす**: `scene/shop.ts`(店内)と `scene/ambient.ts`(常時演出)に閉じる。
- **店員の見た目を増やす**: `barista/barista.ts` の `BARISTA_LOOKS` に色の組を足す。
