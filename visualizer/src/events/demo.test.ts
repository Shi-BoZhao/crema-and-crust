import { describe, expect, it } from 'vitest';
import { isAgentState } from '../types';
import { DEMO_SCRIPT, demoStepAt } from './demo';

describe('DEMO_SCRIPT', () => {
  it('すべてのステップが有効な状態と正の長さを持つ', () => {
    for (const step of DEMO_SCRIPT) {
      expect(isAgentState(step.state)).toBe(true);
      expect(step.duration).toBeGreaterThan(0);
      expect(step.detail.length).toBeGreaterThan(0);
    }
  });

  it('MVP の7状態がすべてデモに登場する', () => {
    const seen = new Set(DEMO_SCRIPT.map((s) => s.state));
    for (const state of ['idle', 'thinking', 'reading', 'coding', 'testing', 'error', 'done']) {
      expect(seen.has(state as never)).toBe(true);
    }
  });
});

describe('demoStepAt', () => {
  it('0秒は最初のステップ', () => {
    expect(demoStepAt(0)).toBe(DEMO_SCRIPT[0]);
  });

  it('最初のステップの長さを超えると次のステップ', () => {
    expect(demoStepAt(DEMO_SCRIPT[0].duration + 0.1)).toBe(DEMO_SCRIPT[1]);
  });

  it('合計時間を超えるとループする', () => {
    const total = DEMO_SCRIPT.reduce((sum, s) => sum + s.duration, 0);
    expect(demoStepAt(total + 1)).toBe(demoStepAt(1));
  });
});
