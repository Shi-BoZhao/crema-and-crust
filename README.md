# Crema & Crust

個人経営の小さなピッツェリア兼エスプレッソカフェを舞台にした、
のほほんと暇つぶしできる落ち着いたゲーム。

タイマーもスコアも失敗もありません。
ピザを焼いて、エスプレッソを淹れて、ふらっと来るお客さんとゆるく過ごします。

## 遊び方

```bash
npm install
npm run dev
```

ブラウザで表示された URL を開くと店内から始まります。

- **ピザ窯** … 生地をのばして、ソースを塗って、トッピングをのせて、窯で焼く
- **マシン** … 豆を挽いて、タンピングして、抽出して、仕上げる
- **お客さん** … カウンターにふらっと来る。作ったものを出すと「ありがとうカード」がたまり、新しい豆やトッピングがゆるやかに届く
- **ノート** … 作ったピザやカップの記録を眺める

進み具合はブラウザ (localStorage) に自動保存されます。

## おまけ: エージェント可視化ジオラマ

`visualizer/` に、Cursor で AI エージェントが作業している様子を
ドット絵風 3D の店内として眺められるビジュアライザーがあります(独立プロジェクト)。

```bash
cd visualizer && npm install && npm run dev
```

詳しくは [`visualizer/README.md`](visualizer/README.md) と
[`docs/visualizer.md`](docs/visualizer.md) を参照。

## 開発

```bash
npm run test    # Vitest (ゲームロジックのユニットテスト)
npm run build   # 型チェック + プロダクションビルド
npm run lint    # ESLint
```

設計ドキュメントは `docs/` にあります:

- [`docs/game-design.md`](docs/game-design.md) — デザインピラー・やらないことリスト
- [`docs/mechanics.md`](docs/mechanics.md) — 画面・工程・データ仕様
- [`docs/tech-stack.md`](docs/tech-stack.md) — 技術選定・実装方針

## 技術スタック

React 18 + TypeScript + Vite。ゲームエンジン不使用、絵はすべて CSS / SVG。
