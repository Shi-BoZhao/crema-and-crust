export { AGENT_STATES, DEFAULT_AGENT, isAgentState, sanitizeAgentId } from './protocol';
export type { AgentEvent, AgentState } from './protocol';

import type { AgentState } from './protocol';

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

/** HUD と店内表示で使う、agent 識別子の見せ方。 */
export function agentDisplayName(agent: string): string {
  if (agent === 'main') return '店主';
  if (agent === 'demo') return '店主(デモ)';
  return agent;
}
