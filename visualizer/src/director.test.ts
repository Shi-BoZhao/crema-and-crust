import { describe, expect, it } from 'vitest';
import { FLOOR_BOUNDS, STAGE_PLANS } from './director';
import { AGENT_STATES } from './types';

describe('STAGE_PLANS', () => {
  it('すべての状態に持ち場の計画がある', () => {
    for (const state of AGENT_STATES) {
      expect(STAGE_PLANS[state]).toBeDefined();
    }
  });

  it('持ち場が店の床の中に収まっている', () => {
    for (const state of AGENT_STATES) {
      const station = STAGE_PLANS[state].station;
      if (!station) continue;
      expect(station.x).toBeGreaterThanOrEqual(FLOOR_BOUNDS.minX);
      expect(station.x).toBeLessThanOrEqual(FLOOR_BOUNDS.maxX);
      expect(station.z).toBeGreaterThanOrEqual(FLOOR_BOUNDS.minZ);
      expect(station.z).toBeLessThanOrEqual(FLOOR_BOUNDS.maxZ);
    }
  });

  it('error はその場にとどまる(持ち場が null)', () => {
    expect(STAGE_PLANS.error.station).toBeNull();
  });
});
