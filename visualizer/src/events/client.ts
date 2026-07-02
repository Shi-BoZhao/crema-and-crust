import { isAgentState, sanitizeAgentId, type AgentEvent } from '../types';
import { demoStepAt } from './demo';

export interface EventSourceOptions {
  onEvent: (event: AgentEvent, source: 'live' | 'demo') => void;
}

const DEMO_START_DELAY_MS = 6_000;
const DEMO_TICK_MS = 500;
const DEMO_AGENT = 'demo';

/**
 * SSE で実イベントを購読しつつ、しばらく何も来なければデモを流す。
 * 実イベントが一度でも届いたらデモは永続的に止まる。
 * URL パラメータ: ?demo=1 で強制デモ、?demo=0 でデモ無効。
 */
export function connectEvents({ onEvent }: EventSourceOptions): void {
  const demoParam = new URLSearchParams(location.search).get('demo');
  const forceDemo = demoParam === '1';
  const noDemo = demoParam === '0';

  let liveReceived = false;
  let demoTimer: ReturnType<typeof setInterval> | undefined;
  let demoStartedAt = 0;
  let lastDemoState = '';

  function stopDemo() {
    if (demoTimer !== undefined) {
      clearInterval(demoTimer);
      demoTimer = undefined;
    }
    document.getElementById('demo-badge')?.setAttribute('hidden', '');
  }

  function startDemo() {
    if (demoTimer !== undefined || noDemo) return;
    demoStartedAt = performance.now();
    document.getElementById('demo-badge')?.removeAttribute('hidden');
    demoTimer = setInterval(() => {
      const elapsed = (performance.now() - demoStartedAt) / 1000;
      const step = demoStepAt(elapsed);
      if (step.state !== lastDemoState) {
        lastDemoState = step.state;
        onEvent(
          { agent: DEMO_AGENT, state: step.state, detail: step.detail, at: Date.now() },
          'demo',
        );
      }
    }, DEMO_TICK_MS);
  }

  if (!forceDemo) {
    const source = new EventSource('/api/events');
    source.onmessage = (message) => {
      let payload: unknown;
      try {
        payload = JSON.parse(message.data);
      } catch {
        return;
      }
      const { agent, state, detail, at, received } = payload as {
        agent?: unknown;
        state?: unknown;
        detail?: unknown;
        at?: unknown;
        received?: unknown;
      };
      if (!isAgentState(state)) return;
      // received=false のイベントは存在しない(サーバーは実イベントのみ保持)が、
      // 念のためフラグで判定してデモ抑止に使う
      if (received === true) {
        liveReceived = true;
        stopDemo();
      }
      if (liveReceived) {
        onEvent(
          {
            agent: sanitizeAgentId(agent),
            state,
            detail: typeof detail === 'string' ? detail : undefined,
            at: typeof at === 'number' ? at : Date.now(),
          },
          'live',
        );
      }
    };
  }

  if (forceDemo) {
    startDemo();
  } else if (!noDemo) {
    setTimeout(() => {
      if (!liveReceived) startDemo();
    }, DEMO_START_DELAY_MS);
  }
}
