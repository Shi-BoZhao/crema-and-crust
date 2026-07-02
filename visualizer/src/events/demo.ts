import type { AgentState } from '../types';

export interface DemoStep {
  state: AgentState;
  detail: string;
  /** 秒 */
  duration: number;
}

/** 実イベントが来ない間に流す「一日の営業」。ループする。 */
export const DEMO_SCRIPT: DemoStep[] = [
  { state: 'idle', detail: '開店まえの、しずかな時間', duration: 6 },
  { state: 'thinking', detail: 'きょうの仕込みをかんがえている…', duration: 6 },
  { state: 'reading', detail: '棚から小麦粉とトマトをさがしている', duration: 6 },
  { state: 'coding', detail: '生地をのばしている', duration: 10 },
  { state: 'testing', detail: '窯でじっくり焼いている', duration: 9 },
  { state: 'done', detail: 'マルゲリータ、できたてをどうぞ', duration: 6 },
  { state: 'idle', detail: 'カップをみがきながらひとやすみ', duration: 6 },
  { state: 'thinking', detail: 'つぎは深煎りにしようかな…', duration: 5 },
  { state: 'coding', detail: 'エスプレッソをしこんでいる', duration: 8 },
  { state: 'error', detail: 'あれ、豆をひきすぎたかも…', duration: 6 },
  { state: 'coding', detail: 'ひきなおして、もういちど', duration: 7 },
  { state: 'testing', detail: '味見してたしかめている', duration: 7 },
  { state: 'done', detail: 'いい香りの一杯ができた', duration: 6 },
];

/** 経過秒からデモの現在ステップを返す純関数(テスト対象)。 */
export function demoStepAt(elapsedSeconds: number): DemoStep {
  const total = DEMO_SCRIPT.reduce((sum, s) => sum + s.duration, 0);
  let t = ((elapsedSeconds % total) + total) % total;
  for (const step of DEMO_SCRIPT) {
    if (t < step.duration) return step;
    t -= step.duration;
  }
  return DEMO_SCRIPT[0];
}
