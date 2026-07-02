# Crema & Crust Diorama

Cursor で AI エージェントが作業している様子を、ドット絵風の小さな 3D ジオラマ
(ピッツェリア兼エスプレッソカフェ)として眺めるビジュアライザー。

監視ダッシュボードではなく、**作業の気配をのほほんと見守る置き物**です。
エージェントが考えていれば店員さんはレシピノートを読み、コードを書いていれば
ピザ生地をのばし、テストが走れば窯に火が入ります。

設計メモは [`../docs/visualizer.md`](../docs/visualizer.md) にあります。

## 起動

```bash
cd visualizer
npm install
npm run dev
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
