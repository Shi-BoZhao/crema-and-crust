export const AGENT_STATES = [
  'idle',
  'thinking',
  'reading',
  'coding',
  'testing',
  'error',
  'done',
] as const;

export type AgentState = (typeof AGENT_STATES)[number];

export function isAgentState(value: unknown): value is AgentState {
  return typeof value === 'string' && (AGENT_STATES as readonly string[]).includes(value);
}

export interface AgentEvent {
  state: AgentState;
  detail?: string;
  at: number;
}

/** HUD に出す状態ラベル。柔らかい日本語で。 */
export const STATE_LABELS: Record<AgentState, string> = {
  idle: 'ひとやすみ中',
  thinking: 'かんがえ中',
  reading: '材料をさがし中',
  coding: 'しこみ中',
  testing: '窯で焼き中',
  error: 'ちょっと困り中',
  done: 'できあがり〜',
};
