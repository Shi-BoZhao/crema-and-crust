import { describe, expect, it } from 'vitest';
import { DOOR, FLOOR_BOUNDS, laneOffset, MAX_LANES, STAGE_PLANS } from './director';
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

  it('レーン全員分ずれても床からはみ出さない', () => {
    for (const state of AGENT_STATES) {
      const station = STAGE_PLANS[state].station;
      if (!station) continue;
      for (let lane = 0; lane < MAX_LANES; lane++) {
        const offset = laneOffset(lane);
        const x = station.x + (station.spread === 'z' ? 0 : offset);
        const z = station.z + (station.spread === 'z' ? offset : 0);
        expect(x).toBeGreaterThanOrEqual(FLOOR_BOUNDS.minX);
        expect(x).toBeLessThanOrEqual(FLOOR_BOUNDS.maxX);
        expect(z).toBeGreaterThanOrEqual(FLOOR_BOUNDS.minZ);
        expect(z).toBeLessThanOrEqual(FLOOR_BOUNDS.maxZ);
      }
    }
  });
});

describe('laneOffset', () => {
  it('1人目は持ち場の中心に立つ', () => {
    expect(laneOffset(0)).toBe(0);
  });

  it('2人目以降は左右交互に外へ広がる', () => {
    expect(laneOffset(1)).toBeGreaterThan(0);
    expect(laneOffset(2)).toBeLessThan(0);
    expect(Math.abs(laneOffset(3))).toBeGreaterThan(Math.abs(laneOffset(1)));
  });

  it('レーン上限を超えると使い回す', () => {
    expect(laneOffset(MAX_LANES)).toBe(laneOffset(0));
  });
});

describe('DOOR', () => {
  it('入口が床の中にある', () => {
    expect(DOOR.x).toBeGreaterThanOrEqual(FLOOR_BOUNDS.minX);
    expect(DOOR.x).toBeLessThanOrEqual(FLOOR_BOUNDS.maxX);
    expect(DOOR.z).toBeGreaterThanOrEqual(FLOOR_BOUNDS.minZ);
    expect(DOOR.z).toBeLessThanOrEqual(FLOOR_BOUNDS.maxZ);
  });
});
