import type { EmoteKind } from './barista/barista';
import type { AgentState } from './types';

export interface Station {
  x: number;
  z: number;
  /** 到着後に向く方向 (rotation.y)。0 が手前(+z)向き */
  yaw: number;
}

export interface StagePlan {
  /** null は「その場にとどまる」(error など) */
  station: Station | null;
  emote: EmoteKind;
}

const FACE_FRONT = 0;
const FACE_LEFT_WALL = -Math.PI / 2;
const FACE_BACK = Math.PI;

/**
 * エージェントの状態 → 店内の持ち場と吹き出しの対応表。
 * 状態を増やすときはここに1エントリ足し、animations.ts に動きを足す。
 */
export const STAGE_PLANS: Record<AgentState, StagePlan> = {
  idle: { station: { x: 1.6, z: 0.9, yaw: FACE_FRONT }, emote: 'none' },
  thinking: { station: { x: -0.9, z: 0.9, yaw: FACE_FRONT }, emote: 'dots' },
  reading: { station: { x: -4.6, z: 0.6, yaw: FACE_LEFT_WALL }, emote: 'none' },
  coding: { station: { x: 2.1, z: -2.5, yaw: FACE_BACK }, emote: 'none' },
  testing: { station: { x: -2.5, z: -2.0, yaw: FACE_BACK + Math.PI / 5 }, emote: 'none' },
  error: { station: null, emote: 'question' },
  done: { station: { x: 0.4, z: 0.9, yaw: FACE_FRONT }, emote: 'note' },
};

/** 店の床の範囲(はみ出し検知テスト用) */
export const FLOOR_BOUNDS = { minX: -5.8, maxX: 5.8, minZ: -4.8, maxZ: 3.8 };
