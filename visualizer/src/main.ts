import { applyStateAnimation, cleanupState, type AnimContext } from './barista/animations';
import { Barista } from './barista/barista';
import { createStage } from './core/renderer';
import { STAGE_PLANS } from './director';
import { connectEvents } from './events/client';
import { updateAmbient } from './scene/ambient';
import { PuffEmitter } from './scene/particles';
import { PALETTE } from './scene/palette';
import { ServeItems } from './scene/serve';
import { buildShop } from './scene/shop';
import { STATE_LABELS, type AgentState } from './types';

const mount = document.getElementById('app')!;
const hud = document.getElementById('hud')!;

const stage = createStage(mount);
const shop = buildShop(stage.scene);
const barista = new Barista(stage.scene);
const steam = new PuffEmitter(stage.scene, PALETTE.steam, 0.14);
const smoke = new PuffEmitter(stage.scene, PALETTE.smoke, 0.2);
const serveItems = new ServeItems(stage.scene, shop.counter.serveSpot);

let currentState: AgentState = 'idle';
let stateTime = 0;

const initialPlan = STAGE_PLANS.idle.station!;
barista.teleport(initialPlan.x, initialPlan.z, initialPlan.yaw);
updateHud('idle');

function updateHud(state: AgentState, detail?: string): void {
  hud.innerHTML = '';
  hud.append(STATE_LABELS[state]);
  if (detail) {
    const span = document.createElement('span');
    span.className = 'detail';
    span.textContent = detail;
    hud.append(span);
  }
}

function enterState(state: AgentState, detail?: string): void {
  if (state !== currentState) {
    cleanupState(currentState, shop);
    if (currentState === 'done') serveItems.hide();
    currentState = state;
    stateTime = 0;
    const plan = STAGE_PLANS[state];
    if (plan.station) {
      barista.walkTo(plan.station.x, plan.station.z, plan.station.yaw);
    }
    if (state === 'done') serveItems.serve();
  }
  updateHud(state, detail);
}

connectEvents({
  onEvent(event) {
    enterState(event.state, event.detail);
  },
});

stage.start((dt, t) => {
  stateTime += dt;
  const walking = barista.update(dt);
  if (!walking) {
    barista.resetPose();
    const ctx: AnimContext = { barista, shop, steam, smoke, stateTime, t, dt };
    applyStateAnimation(currentState, ctx);
    barista.setEmote(STAGE_PLANS[currentState].emote);
  } else {
    barista.setEmote('none');
  }
  updateAmbient(shop, steam, t, dt, currentState === 'testing' && !walking);
  steam.update(dt);
  smoke.update(dt);
});
