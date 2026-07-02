import * as THREE from 'three';
import { applyStateAnimation, cleanupState, type AnimContext } from './barista/animations';
import { Barista, lookForAgent } from './barista/barista';
import { DOOR, laneOffset, STAGE_PLANS } from './director';
import type { PuffEmitter } from './scene/particles';
import { ServeItems } from './scene/serve';
import type { ShopRefs } from './scene/shop';
import type { AgentEvent, AgentState } from './types';

/** これだけイベントが来なければ、その店員はそっと退店する */
export const MEMBER_TIMEOUT_MS = 15 * 60_000;

interface Member {
  agent: string;
  barista: Barista;
  serve: ServeItems;
  state: AgentState;
  stateTime: number;
  detail?: string;
  /** performance.now() 基準(送信元との時計ずれを避ける) */
  lastSeen: number;
  lane: number;
  leaving: boolean;
}

export interface HudRow {
  agent: string;
  state: AgentState;
  detail?: string;
  color: string;
}

/**
 * 店員たちの管理。agent ごとに1人割り当て、入店・持ち場移動・退店を面倒みる。
 * 同じ持ち場に複数人が来たときはレーン(laneOffset)で横に並ぶ。
 */
export class Crew {
  private members = new Map<string, Member>();
  private nextLane = 0;

  constructor(
    private scene: THREE.Scene,
    private shop: ShopRefs,
  ) {}

  get size(): number {
    return this.members.size;
  }

  has(agent: string): boolean {
    return this.members.has(agent);
  }

  handleEvent(event: AgentEvent): void {
    let member = this.members.get(event.agent);
    if (!member) {
      const barista = new Barista(this.scene, lookForAgent(event.agent));
      const lane = this.nextLane++;
      const spot = this.shop.counter.serveSpot.clone();
      spot.x += laneOffset(lane);
      member = {
        agent: event.agent,
        barista,
        serve: new ServeItems(this.scene, spot),
        state: 'idle',
        stateTime: 0,
        lastSeen: performance.now(),
        lane,
        leaving: false,
      };
      barista.teleport(DOOR.x, DOOR.z, DOOR.yaw);
      this.members.set(event.agent, member);
      // 入口に立ったままにせず、すぐ持ち場へ向かわせる
      this.moveToStation(member, event.state);
      member.state = event.state;
    } else if (member.leaving) {
      // 帰りかけていたが、また仕事が来た
      member.leaving = false;
      this.moveToStation(member, event.state);
      member.state = event.state;
      member.stateTime = 0;
    } else if (event.state !== member.state) {
      const othersInState = [...this.members.values()].some(
        (other) => other !== member && !other.leaving && other.state === member!.state,
      );
      if (!othersInState) cleanupState(member.state, this.shop);
      if (member.state === 'done') member.serve.hide();
      member.state = event.state;
      member.stateTime = 0;
      this.moveToStation(member, event.state);
    }
    if (event.state === 'done' && member.stateTime === 0) {
      member.serve.serve();
    }
    member.detail = event.detail;
    member.lastSeen = performance.now();
  }

  private moveToStation(member: Member, state: AgentState): void {
    const plan = STAGE_PLANS[state];
    if (!plan.station) return; // error などは、その場にとどまる
    const offset = laneOffset(member.lane);
    const x = plan.station.x + (plan.station.spread === 'z' ? 0 : offset);
    const z = plan.station.z + (plan.station.spread === 'z' ? offset : 0);
    member.barista.walkTo(x, z, plan.station.yaw);
  }

  /** 指定の店員を退店させる(デモ店主の交代などに使う)。 */
  depart(agent: string): void {
    const member = this.members.get(agent);
    if (!member || member.leaving) return;
    member.leaving = true;
    member.serve.hide();
    member.barista.walkTo(DOOR.x, DOOR.z, 0);
  }

  /** しばらくイベントが来ない店員を退店させる。HUD 更新が必要なら true。 */
  pruneInactive(): boolean {
    let changed = false;
    const now = performance.now();
    for (const member of this.members.values()) {
      if (!member.leaving && now - member.lastSeen > MEMBER_TIMEOUT_MS) {
        this.depart(member.agent);
        changed = true;
      }
    }
    return changed;
  }

  /** 全員のアニメーションを1フレームぶん進める。誰か消えたら true。 */
  update(dt: number, t: number, steam: PuffEmitter, smoke: PuffEmitter): boolean {
    let changed = false;
    for (const member of this.members.values()) {
      member.stateTime += dt;
      const walking = member.barista.update(dt);
      if (walking) {
        member.barista.setEmote('none');
        continue;
      }
      if (member.leaving) {
        // 入口に着いたので、そっといなくなる
        this.scene.remove(member.barista.group);
        member.serve.detach(this.scene);
        this.members.delete(member.agent);
        changed = true;
        continue;
      }
      member.barista.resetPose();
      const ctx: AnimContext = {
        barista: member.barista,
        shop: this.shop,
        steam,
        smoke,
        stateTime: member.stateTime,
        t,
        dt,
      };
      applyStateAnimation(member.state, ctx);
      member.barista.setEmote(STAGE_PLANS[member.state].emote);
    }
    return changed;
  }

  /** いま誰かが窯の前で焼いているか(アンビエントの火加減に使う)。 */
  anyBaking(): boolean {
    for (const member of this.members.values()) {
      if (member.state === 'testing' && !member.leaving && !member.barista.walking.active) {
        return true;
      }
    }
    return false;
  }

  /** HUD 表示用。店主(main / demo)を先頭に、あとは名前順。 */
  hudRows(): HudRow[] {
    return [...this.members.values()]
      .filter((member) => !member.leaving)
      .sort((a, b) => {
        const rank = (m: Member) => (m.agent === 'main' || m.agent === 'demo' ? 0 : 1);
        return rank(a) - rank(b) || a.agent.localeCompare(b.agent);
      })
      .map((member) => ({
        agent: member.agent,
        state: member.state,
        detail: member.detail,
        color: member.barista.look.apron,
      }));
  }
}
