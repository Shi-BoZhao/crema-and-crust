# Crema & Crust Diorama — エージェント可視化の設計

CursorでAIエージェントが作業している様子を、ドット絵風の小さな3Dジオラマ
(ピッツェリア兼エスプレッソカフェ)として眺めるビジュアライザー。

実用的な監視ダッシュボードではない。**作業の気配をのほほんと見守る**ための置き物。
ゲーム本体(`src/`)とはコードを共有しない独立したサブプロジェクト(`visualizer/`)だが、
世界観・トーン(クリーム色・テラコッタ・深緑、急かさない、失敗を責めない)は共有する。

## デザイン方針

- ドット絵風の小さな3Dジオラマ。1画面固定カメラ(アイソメ風)、スクロールも操作もほぼ無し
- のんびりした空気感。状態が変わっても店員は**歩いて**持ち場へ移動する(瞬間移動しない)
- エラーでも赤ランプや警告音は出さない。店員がちょっと困るだけ
- 常時アンビエント演出(マシンの湯気、窯の火、窓辺で寝ている猫)で「待機中でも眺めていられる」

## 状態とビジュアル表現の対応

| 状態 | 意味 | 店員の行動 | 演出 |
|---|---|---|---|
| `idle` | 待機中 | カウンターでカップを拭いたり、ぼーっとする | ゆっくりした呼吸、まばたき |
| `thinking` | 考え中 | カウンター端でレシピノートを読む | ページをめくる、頭上に「…」 |
| `reading` | 読み込み中 | 棚から材料の瓶を探す | 瓶が少し出たり戻ったり、視線が上下 |
| `coding` | 実装中 | 作業台でピザ生地をのばす | 麺棒を往復、生地が少しずつ広がる |
| `testing` | テスト/ビルド中 | 窯にピザを入れて焼く | 窯の火が揺れる、煙突から煙 |
| `error` | エラー発生 | 手を止めて頭をかく | 頭上に「?」、首をかしげる |
| `done` | 完了 | ピザ/カップをカウンターに置く | 湯気、小さくうれしいジャンプ |

## アーキテクチャ

```
イベント送信側                     visualizer (npm run dev で全部起動)
──────────────                    ─────────────────────────────────
curl / 付属CLI /                   Vite dev server
Cursor hooks / 手動 ──POST──▶       ├─ events-plugin (POST /api/event, GET /api/events SSE)
                                    └─ フロント (Three.js)
                                         ├─ events/client   SSE購読・デモ進行
                                         ├─ director        状態 → 持ち場・アニメの割当
                                         ├─ crew            agent ごとの店員管理(入店・退店)
                                         ├─ barista/        ボクセル店員と状態別アニメ
                                         ├─ scene/          店内ジオラマ・小物・パーティクル
                                         └─ core/           低解像度レンダリング(ドット絵化)
```

### 技術選定

| 項目 | 選定 | 理由 |
|---|---|---|
| 描画 | Three.js(素の TypeScript) | React 不要の常時アニメーション。ジオメトリはすべてコード生成で外部アセット無し |
| ドット絵化 | 低解像度レンダリング + `image-rendering: pixelated` | シェーダ不要で確実にドット感が出る、いちばん単純な方法 |
| カメラ | OrthographicCamera(アイソメ風固定) | ジオラマ感。パースが付かないのでドット絵と相性がよい |
| イベント取得 | Vite プラグイン内蔵の HTTP + SSE | プロセス1つ・`npm run dev` 一発。WebSocket より単純で再接続も EventSource 任せ |
| テスト | Vitest(イベント解釈・状態遷移の純関数のみ) | 見た目はスクリーンショットで確認し、ロジックだけ自動テスト |

### イベント仕様

```
POST http://localhost:5199/api/event
Content-Type: application/json
{ "state": "coding", "detail": "src/game/pizza.ts を編集中", "agent": "cloud-1" }
```

- `state` は `idle | thinking | reading | coding | testing | error | done` のいずれか(必須)
- `detail` は自由文(任意)。HUD に表示されるだけで挙動には影響しない
- `agent` は送信元の識別子(任意、既定 `main`)。英数と `-` `_` 以外は正規化される。
  仕様は `src/protocol.ts` にあり、サーバーとフロントで共有する
- 手動確認用に `GET /api/event?state=coding&detail=...&agent=...` も受ける
- `GET /api/state` で全 agent の最後のイベントを返す(ページ再読込時の同期用)
- `GET /api/events` が SSE。接続時に各 agent の最後のイベントを即時送信
- サーバー側で環境変数 `DIORAMA_TOKEN` を設定すると、送信に
  `Authorization: Bearer <token>` が必要になる(トンネル公開時の合言葉)

送信を楽にする CLI を同梱: `node visualizer/scripts/send-event.mjs coding "生地をのばす"`。
`DIORAMA_URL`(送信先)・`DIORAMA_AGENT`(識別子)・`DIORAMA_TOKEN` の
環境変数で、リモートからの送信にも同じスクリプトを使える。

### マルチエージェント

- agent ごとに店員が1人ずつ。新しい agent の最初のイベントで**入口から歩いて入店**する
- 同じ持ち場に複数人が来たら、`director.ts` の `laneOffset` で左右に並ぶ
- エプロン・髪の色は agent 識別子のハッシュで決まる(`barista/barista.ts` の `BARISTA_LOOKS`)。
  店主の深緑エプロンは `main` / `demo` 専用
- HUD は1人1行。色付きドットがエプロン色と対応する
- 15分イベントが来ない店員は入口へ歩いて退店する(サーバー側も30分で忘れる)
- デモの店主は、実イベントが届いた時点で退店して本物と入れ替わる

### デモモード

実イベントが無い環境でも雰囲気が分かるように、
**起動後しばらくイベントが届かなければ自動で「一日の営業」デモが流れる**。
実イベントが1つでも届いたらデモは止まり、以後は実イベントのみに従う。
`?demo=1` で強制デモ、`?demo=0` で無効化。

## Cursor 連携の現実的な段階

1. **手動/半自動(MVP)**: curl や CLI で送る。Cursor / Claude Code の
   hooks(ツール実行前後のシェルフック)から curl を叩けば半自動になる
2. **ラッパー連携**: テスト・ビルドを `send-event testing` → 実行 → `done|error` で包む
   `scripts/wrap.mjs` を用意済み
3. **Cloud Agent 自動連携(対応済み)**: `.cursor/hooks.json` が Cloud Agent の
   ファイル読取・編集・シェル・サブエージェントを検知し、自動で POST する。
   初回だけ手元で visualizer + トンネルを起動し、Cursor Secrets に
   `DIORAMA_URL` / `DIORAMA_TOKEN` / `DIORAMA_AGENT` を設定する
4. **将来**: ファイル変更監視(chokidar)や MCP サーバー化。イベント仕様は同じまま
   送信側を差し替えるだけでよい設計にしてある

### Cloud Agent 自動連携の構成

```
Cloud Agent VM (任意のリポジトリ)        あなたの PC
──────────────                          ─────────────────────────
.cursor/hooks.json が起動
  ↓ ファイル読取/編集/シェル/サブエージェント
.cursor/hooks/diorama-bridge.mjs         npm run up で一括起動
  ──POST──▶ DIORAMA_URL ──────────▶ cloudflared トンネル
  (Secrets: URL/TOKEN)                       └─▶ visualizer (localhost:5199)
                                                   └─▶ ブラウザの店内
```

**初回設定**

1. 手元: `npm run up`(visualizer + cloudflared + ブラウザをまとめて起動し、
   Secrets に貼る値を表示する。トークンは `.diorama-token` に自動生成・保存)
2. Cursor Dashboard → Cloud Agent Secrets: 表示された `DIORAMA_URL` / `DIORAMA_TOKEN`

以後、Cloud Agent セッションごとに手動送信は不要。`DIORAMA_AUTO=0` で無効化可能。
クイックトンネルの URL は起動ごとに変わる。固定したければ Cloudflare Named Tunnel
か ngrok 固定ドメインで `DIORAMA_URL` を一度だけ設定する。

**他リポジトリへの展開**

`npm run install-hooks -- <repo>` で、任意のリポジトリに
`.cursor/hooks.json` + `.cursor/hooks/diorama-bridge.mjs`(依存なし単一ファイル)を
インストールできる。対象リポジトリに visualizer は不要で、push すれば
Cloud Agent からも有効になる。既存の hooks.json には diorama 項目だけ追記し、
再実行しても重複しない。

agent 名は `DIORAMA_AGENT` → `package.json` の name → フォルダ名の順で決まるため、
複数リポジトリの Agent が同じ店に別々の店員として現れる。

| Hook イベント | ジオラマ状態 |
|---|---|
| `beforeReadFile` | `reading` |
| `afterFileEdit` | `coding` |
| `beforeShellExecution` (test/build) | `testing` |
| `afterShellExecution` (test/build) | `done` / `error` |
| `postToolUseFailure` | `error` |
| `subagentStart` | `thinking` (agent=`sub-<type>`) |
| `subagentStop` | `done` / `error` / `idle` |

Cloud Agent 未対応の hook (`sessionStart`, `stop` など) は使わない。
ローカル IDE Agent でも同じ hooks が localhost:5199 に送る (`npm run hook-test` で確認)。

## 拡張の指針

- 状態を増やす: `protocol.ts` の `AGENT_STATES` に追加 → `director.ts` に持ち場と
  アニメを1エントリ追加するだけ。描画・通信は触らなくてよい
- 演出を増やす: `scene/shop.ts`(小物)と `barista/animations.ts`(動き)に閉じる
- 店員の見た目を増やす: `barista/barista.ts` の `BARISTA_LOOKS` に色の組を足す
