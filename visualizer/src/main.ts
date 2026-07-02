import { createStage } from './core/renderer';
import { Crew } from './crew';
import { connectEvents } from './events/client';
import { updateAmbient } from './scene/ambient';
import { PuffEmitter } from './scene/particles';
import { PALETTE } from './scene/palette';
import { buildShop } from './scene/shop';
import { agentDisplayName, STATE_LABELS } from './types';

const mount = document.getElementById('app')!;
const hud = document.getElementById('hud')!;

const stage = createStage(mount);
const shop = buildShop(stage.scene);
const steam = new PuffEmitter(stage.scene, PALETTE.steam, 0.14);
const smoke = new PuffEmitter(stage.scene, PALETTE.smoke, 0.2);
const crew = new Crew(stage.scene, shop);

function renderHud(): void {
  hud.innerHTML = '';
  const rows = crew.hudRows();
  hud.toggleAttribute('hidden', rows.length === 0);
  for (const row of rows) {
    const div = document.createElement('div');
    div.className = 'hud-row';

    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = row.color;
    div.append(dot);

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = agentDisplayName(row.agent);
    div.append(name);

    div.append(STATE_LABELS[row.state]);

    if (row.detail) {
      const span = document.createElement('span');
      span.className = 'detail';
      span.textContent = row.detail;
      div.append(span);
    }
    hud.append(div);
  }
}

renderHud();

connectEvents({
  onEvent(event, source) {
    // 実イベントが来たら、デモの店主にはそっと帰ってもらう
    if (source === 'live' && crew.has('demo')) {
      crew.depart('demo');
    }
    crew.handleEvent(event);
    renderHud();
  },
});

let pruneTimer = 0;

stage.start((dt, t) => {
  const removed = crew.update(dt, t, steam, smoke);

  pruneTimer += dt;
  let pruned = false;
  if (pruneTimer > 10) {
    pruneTimer = 0;
    pruned = crew.pruneInactive();
  }
  if (removed || pruned) renderHud();

  updateAmbient(shop, steam, t, dt, crew.anyBaking());
  steam.update(dt);
  smoke.update(dt);
});
