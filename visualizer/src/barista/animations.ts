import type { PuffEmitter } from '../scene/particles';
import type { ShopRefs } from '../scene/shop';
import type { AgentState } from '../types';
import type { Barista } from './barista';

export interface AnimContext {
  barista: Barista;
  shop: ShopRefs;
  steam: PuffEmitter;
  smoke: PuffEmitter;
  /** 現在の状態に入ってからの秒数 */
  stateTime: number;
  /** 起動からの秒数 */
  t: number;
  dt: number;
}

type AnimFn = (ctx: AnimContext) => void;

/** 呼吸のゆれ。どのアニメでも下敷きにする。 */
function breathe({ barista, t }: AnimContext, scale = 1): void {
  barista.body.position.y = 0.9 + Math.sin(t * 2.1) * 0.015 * scale;
  barista.head.position.y = 1.32 + Math.sin(t * 2.1 + 0.4) * 0.012 * scale;
}

const animations: Record<AgentState, AnimFn> = {
  /** カウンターでカップを拭いたり、ぼーっとしたり */
  idle(ctx) {
    const { barista, stateTime, t } = ctx;
    breathe(ctx);
    const cycle = stateTime % 12;
    if (cycle > 5 && cycle < 10) {
      // カップみがき
      barista.heldCup.visible = true;
      barista.heldCloth.visible = true;
      barista.armLeft.rotation.x = -1.0;
      barista.armRight.rotation.x = -1.0 + Math.sin(t * 5) * 0.12;
      barista.armRight.rotation.z = -0.15 + Math.cos(t * 5) * 0.12;
      barista.head.rotation.x = 0.18;
    } else {
      // ぼーっと外をながめる
      barista.head.rotation.y = Math.sin(t * 0.35) * 0.3;
    }
  },

  /** レシピノートを読みながらかんがえる */
  thinking(ctx) {
    const { barista, shop, t } = ctx;
    breathe(ctx);
    barista.heldNotebook.visible = true;
    barista.armRight.rotation.x = -1.15;
    barista.armLeft.rotation.x = -1.05;
    barista.armLeft.rotation.z = 0.25;
    barista.head.rotation.x = 0.3 + Math.sin(t * 0.8) * 0.03;
    // ときどきカウンターのノートのページがめくれる
    const flip = (t % 4) / 4;
    shop.counter.notebookPage.rotation.z = flip < 0.15 ? (flip / 0.15) * Math.PI : Math.PI;
    if (flip > 0.98) shop.counter.notebookPage.rotation.z = 0;
  },

  /** 棚から材料をさがす */
  reading(ctx) {
    const { barista, shop, t } = ctx;
    breathe(ctx);
    barista.armRight.rotation.x = -1.7 + Math.sin(t * 2.2) * 0.15;
    barista.armLeft.rotation.x = -0.3;
    barista.head.rotation.x = -0.2 + Math.sin(t * 1.1) * 0.15;
    // 瓶が順番に少し出たり戻ったり
    const jars = shop.shelf.jars;
    const active = Math.floor(t / 1.3) % jars.length;
    for (let i = 0; i < jars.length; i++) {
      const jar = jars[i];
      const out = i === active ? Math.sin(((t % 1.3) / 1.3) * Math.PI) * 0.3 : 0;
      jar.position.x = (jar.userData.homeX as number) + out;
    }
  },

  /** 作業台でピザ生地をのばす */
  coding(ctx) {
    const { barista, shop, t, stateTime, steam } = ctx;
    breathe(ctx, 0.5);
    const roll = Math.sin(t * 4.2);
    barista.armLeft.rotation.x = -0.95 + roll * 0.18;
    barista.armRight.rotation.x = -0.95 + roll * 0.18;
    barista.head.rotation.x = 0.32;
    // 麺棒が生地の上を往復し、生地がすこしずつ広がる
    shop.worktable.pin.position.z = 0.05 + roll * 0.3;
    const grow = (stateTime % 9) / 9;
    const spread = 0.75 + grow * 0.75;
    shop.worktable.dough.scale.set(spread, Math.max(0.45, 1 - grow * 0.55), spread);
    // ときどき小麦粉がふわっと
    if (Math.random() < ctx.dt * 0.5) {
      const s = shop.worktable.surface;
      steam.spawn(s.x - 0.6, s.y, s.z, 1.0);
    }
  },

  /** 窯でピザを焼く(火が強まり、煙突から煙) */
  testing(ctx) {
    const { barista, shop, t, dt, smoke } = ctx;
    breathe(ctx);
    // 手を前で組んで、ときどき窯をのぞきこむ
    barista.armLeft.rotation.x = -0.55;
    barista.armRight.rotation.x = -0.55;
    barista.armLeft.rotation.z = 0.3;
    barista.armRight.rotation.z = -0.3;
    const peek = Math.max(0, Math.sin(t * 0.7));
    barista.head.rotation.x = 0.1 + peek * 0.25;
    // 炎が強く揺れる
    for (let i = 0; i < shop.oven.fireMaterials.length; i++) {
      shop.oven.fireMaterials[i].emissiveIntensity = 1.1 + Math.sin(t * 11 + i * 2.1) * 0.5;
    }
    shop.oven.fireLight.intensity = 7 + Math.sin(t * 9) * 2.5;
    if (Math.random() < dt * 2.2) {
      const c = shop.oven.chimneyTop;
      smoke.spawn(c.x, c.y, c.z, 2.2);
    }
  },

  /** 手を止めて、頭をかいて困る */
  error(ctx) {
    const { barista, t } = ctx;
    breathe(ctx);
    barista.armRight.rotation.x = -2.5;
    barista.armRight.rotation.z = -0.4 + Math.sin(t * 6) * 0.1;
    barista.armLeft.rotation.x = -0.2;
    barista.head.rotation.z = 0.16 + Math.sin(t * 0.9) * 0.05;
    barista.head.rotation.x = 0.12;
  },

  /** できあがりをカウンターへ。小さくうれしいジャンプ */
  done(ctx) {
    const { barista, stateTime, t, steam, shop } = ctx;
    breathe(ctx);
    if (stateTime < 1.6) {
      const hop = Math.abs(Math.sin(stateTime * Math.PI * 2.5));
      barista.group.position.y = hop * 0.14;
      barista.armLeft.rotation.x = -0.4 - hop * 0.4;
      barista.armRight.rotation.x = -0.4 - hop * 0.4;
      barista.armLeft.rotation.z = 0.5;
      barista.armRight.rotation.z = -0.5;
    } else {
      barista.head.rotation.y = Math.sin(t * 0.5) * 0.2;
    }
    // できたてから湯気
    if (Math.random() < ctx.dt * 2.5) {
      const s = shop.counter.serveSpot;
      steam.spawn(s.x, s.y + 0.2, s.z, 1.4);
    }
  },
};

/**
 * 状態アニメを1フレームぶん適用する。
 * 呼ぶ前に barista.resetPose() 済みであることを前提にする。
 */
export function applyStateAnimation(state: AgentState, ctx: AnimContext): void {
  animations[state](ctx);
}

/** 状態を離れるときの後片付け(出しっぱなし防止)。 */
export function cleanupState(state: AgentState, shop: ShopRefs): void {
  if (state === 'reading') {
    for (const jar of shop.shelf.jars) {
      jar.position.x = jar.userData.homeX as number;
    }
  }
  if (state === 'coding') {
    shop.worktable.dough.scale.set(1, 1, 1);
    shop.worktable.pin.position.z = 0.05;
  }
  if (state === 'testing') {
    shop.oven.fireLight.intensity = 5;
  }
  if (state === 'thinking') {
    shop.counter.notebookPage.rotation.z = 0;
  }
}
