# Crema & Crust — 技術選定と実装方針

## スタック

| 項目 | 選定 | 理由 |
|---|---|---|
| 言語 | TypeScript | 型でデータ定義(素材・豆・会話)を安全に育てられる |
| フレームワーク | React 18 + Vite | 画面遷移と状態管理が単純な SPA。ビルドが速く、GitHub Pages 等に静的配信できる |
| 状態管理 | React Context + useReducer | 規模が小さい。外部ライブラリ不要 |
| 描画 | CSS + インライン SVG | ドット絵アセット不要で温かみのある見た目を作れる。アニメは CSS transition 中心 |
| 永続化 | localStorage | サーバー不要。自動保存 |
| テスト | Vitest | ゲームロジック(純関数)のユニットテスト |
| Lint/Format | ESLint + Prettier | 標準構成 |

ゲームエンジン(Phaser 等)は使わない。リアルタイム性・物理・スプライトが不要で、
UI 主体のゲームなので React だけで十分小さく作れる。

## ディレクトリ構成

```
src/
  main.tsx            エントリポイント
  App.tsx             画面ルーティング(scene switch)
  state/              GameState / reducer / 永続化
  game/               純粋なゲームロジック(React 非依存・テスト対象)
    pizza.ts          焼き加減・命名などの判定
    espresso.ts       挽き・抽出の判定と命名
    customers.ts      常連データ・会話選択
    unlocks.ts        解放テーブル
    time.ts           時間帯判定
  scenes/             画面コンポーネント(Cafe, Pizza, Espresso, Serve, Notebook)
  components/         共有 UI 部品
  data/               素材・豆・会話などの静的データ
  styles/             グローバル CSS・テーマ変数
```

## 実装原則

- **ロジックは `src/game/` の純関数に置き、コンポーネントから薄く呼ぶ**。
  判定(焼き加減→名前、抽出量→名前)はすべてテスト可能な純関数にする。
- 文言(会話・命名)は `src/data/` に日本語で集約。コード識別子は英語。
- 「進行がリアルタイムで進む」実装をしない。焼きも抽出も
  「画面を開いて操作している間だけ進む」= requestAnimationFrame / interval は
  アクティブなシーン内のみで動かし、離脱時に必ず停止。
- ペナルティ分岐を書かない。すべての結果 enum は肯定的な名前と文言を持つ。

## 動作確認

```
npm run dev      # 開発サーバー
npm run test     # Vitest
npm run build    # 型チェック + プロダクションビルド
npm run lint     # ESLint
```
