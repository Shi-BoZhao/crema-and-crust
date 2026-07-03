# AGENTS.md

crema-and-crust — 「個人経営の小さなピッツェリア兼エスプレッソカフェ」を舞台にした
落ち着いた暇つぶしゲーム。

エージェント向けの共通ルール(ディレクトリ構成・コマンド・作業ルール・
agents-share 連携)は `CLAUDE.md` にある。内容はツール中立なので、作業を
始める前に必ず読むこと。設計の正典は `docs/game-design.md`(ピラー・
やらないことリスト)。機能を足す前に必ず読む。

- Claude Code 固有の記述(skills・hooks・`/xxx` コマンド)は、他のツールでは
  同等の手順を手動で行う(各 skill の実体は `.claude/skills/` にある)。
- Cursor 固有のルールは `.cursor/rules/` にある(プロジェクトルールは
  `project.mdc`、モデル運用は `orchestration.mdc`)。
