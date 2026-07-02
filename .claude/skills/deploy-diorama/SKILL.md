---
name: deploy-diorama
description: エージェント作業ジオラマ(visualizer)の自動連携 hooks を他のリポジトリに展開する手順。「ジオラマを別リポジトリでも使いたい」「hooks を入れて」と頼まれたら使う。
---

# ジオラマ自動連携を他リポジトリに展開する手順

visualizer 本体はこのリポジトリ(`visualizer/`)に置いたまま、
**送信側の hooks だけ**を対象リポジトリへコピーする。
対象リポジトリに visualizer や npm 依存は一切不要
(bridge は依存なしの単一ファイルで、`DIORAMA_URL` へ POST するだけ)。

## 前提の確認

1. 受け側(手元 PC)の初回設定が済んでいるか確認する:
   - visualizer が起動している(`cd visualizer && npm run up`)
   - Cursor Dashboard の Cloud Agent Secrets に `DIORAMA_URL` / `DIORAMA_TOKEN` がある
   - まだなら `visualizer/README.md` の「Cursor Cloud Agent で自動連携(初回設定)」を先に案内する
2. Secrets が**リポジトリスコープ**で設定されている場合は、対象リポジトリにも
   同じ Secrets を追加してもらう必要がある(user/team スコープならそのまま使える)。

## 手順 A: install-hooks スクリプト(対象リポジトリが手元にある場合)

```bash
cd visualizer
npm run install-hooks -- ~/path/to/other-repo
```

これで対象リポジトリに次が入る:

- `.cursor/hooks/diorama-bridge.mjs`(hooks 本体。依存なし単一ファイル)
- `.cursor/hooks/diorama.sh`(bridge を呼ぶだけのラッパー。実行権限付き)
- `.cursor/hooks.json`(7イベントに diorama 項目を追記。既存の hooks.json が
  あっても diorama だけ安全に追記され、再実行しても重複しない)

そのあと対象リポジトリで **commit & push** する
(Cloud Agent は push されたブランチの hooks を読むため)。
コミットメッセージは対象リポジトリの規約に従う。

## 手順 B: 手動コピー(対象リポジトリ側で作業していて、このリポジトリが手元にない場合)

1. crema-and-crust の `.cursor/hooks/diorama-bridge.mjs` と `diorama.sh` を
   対象リポジトリの `.cursor/hooks/` にそのままコピーする(編集不要)。
2. `chmod +x .cursor/hooks/diorama.sh`
3. `.cursor/hooks.json` を作成(既存なら追記)。次の7イベントすべてに
   `{ "command": ".cursor/hooks/diorama.sh", "timeout": 5 }` を登録する:
   `beforeReadFile` / `afterFileEdit` / `beforeShellExecution` /
   `afterShellExecution` / `postToolUseFailure` / `subagentStart` / `subagentStop`
4. commit & push する。

## 動作確認

対象リポジトリの環境(または手元)から手動で1発送って、店内に店員が現れるか見る:

```bash
curl -sS -X POST "$DIORAMA_URL/api/event" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DIORAMA_TOKEN" \
  -d '{"state":"reading","detail":"展開テスト","agent":"手動"}'
```

`{"ok":true,...}` が返れば OK。つながらないときは
`visualizer/README.md` の「つながらないとき」に切り分け手順がある。

## 知っておくこと

- 店員の名前は `DIORAMA_AGENT` → 対象リポジトリの `package.json` の name →
  フォルダ名の順で自動決定。複数リポジトリの Agent が同じ店に
  別々の店員として現れる(色は名前のハッシュで決まる)。
- 送信失敗はすべて握りつぶす設計(タイムアウト 800ms)。店が閉まっていても
  対象リポジトリのエージェント作業には一切影響しない。
- 止めたいときは対象リポジトリ側の環境変数に `DIORAMA_AUTO=0` を入れるだけ。
- 無料のクイックトンネルは起動ごとに URL が変わる。展開先が増えるなら
  `visualizer/.diorama.config.json` で URL を固定するか、
  `server/standalone.mjs` の常設ホスティングを勧める(README 参照)。
- hooks の仕様を変えたら配布元はこのリポジトリの `.cursor/hooks/` なので、
  ここを直してから各リポジトリに再実行して配り直す。
