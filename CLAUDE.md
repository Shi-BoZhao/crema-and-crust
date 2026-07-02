# CLAUDE.md

crema-and-crust — ゲーム開発プロジェクト。設計〜実装は Cursor で進める。

## ディレクトリ構成

| ディレクトリ | 用途 |
|---|---|
| `docs/` | 設計メモ・調査記録(Markdown) |
| `.claude/skills/` | このプロジェクト固有の skills |
| `.claude/agents/` | このプロジェクト固有の subagents |

(プロジェクトの成長に合わせて `src/` などを追加し、この表を更新する)

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
