# CLAUDE.md

crema-and-crust — 「個人経営の小さなピッツェリア兼エスプレッソカフェ」を舞台にした
落ち着いた暇つぶしゲーム。設計〜実装は Cursor で進める。

設計の正典は `docs/game-design.md`(ピラー・やらないことリスト)。
機能を足す前に必ず読むこと。詳細ルールは `.cursor/rules/project.mdc` にもある。

## ディレクトリ構成

| ディレクトリ | 用途 |
|---|---|
| `docs/` | 設計メモ・調査記録(Markdown) |
| `src/game/` | 純粋なゲームロジック(React 非依存・Vitest 対象) |
| `src/data/` | ゲーム内データ・日本語文言 |
| `src/scenes/` | 画面コンポーネント |
| `src/state/` | GameState / reducer / localStorage 永続化 |
| `.cursor/rules/` | Cursor 向けプロジェクトルール |
| `.claude/skills/` | このプロジェクト固有の skills(`add-content` など) |
| `.claude/agents/` | このプロジェクト固有の subagents(`cozy-reviewer` など) |

## コマンド

```
npm run dev / test / build / lint
```

## 作業ルール

- コミットメッセージ: `<領域>: <変更内容>` の形式。
- メモやドキュメントは日本語で書く。コード内の識別子は英語。
- 小さく作って動かすことを優先する。過剰な抽象化・フレームワーク導入はしない。

## agents-share(エージェント記憶)との連携

このリポジトリでの作業は、記憶リポジトリ `agents-share` と併用する前提です。
(環境作成時に `agents-share` もソースに含めること。含まれていない場合、この節は無視する)

- **セッション開始時**: `../agents-share/AGENTS.md`(ルール)→ `MEMORY.md`(索引)→
  `projects/crema-and-crust.md`(このプロジェクトの記憶)の順で読み込む。
  `.claude/settings.json` の SessionStart hook が自動注入するが、失敗時は手動で読む。
- **作業で得た知見**: `/remember` skill の手順で agents-share に書き込む。
- **セッション終了時**: `/wrap-up` skill で作業の push・知見の記憶・最終確認を行う。
