/**
 * サーバー(server/events-plugin.ts)とフロントで共有するイベント仕様。
 * ここは純関数と型だけにして、両側から import できるようにする。
 */

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

export const DEFAULT_AGENT = 'main';
export const MAX_DETAIL_LENGTH = 200;

/**
 * agent 識別子をならす。英数と - _ 以外は - に置換、最大32文字。
 * 空や文字列以外は既定の 'main' に落とす。
 */
export function sanitizeAgentId(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_AGENT;
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 32);
  return cleaned || DEFAULT_AGENT;
}

export interface AgentEvent {
  agent: string;
  state: AgentState;
  detail?: string;
  at: number;
}
