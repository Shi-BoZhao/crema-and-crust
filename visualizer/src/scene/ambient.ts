import type { PuffEmitter } from './particles';
import type { ShopRefs } from './shop';

/**
 * 状態と関係なく、店に「生きている気配」を足すアンビエント演出。
 * 猫の呼吸・しっぽ、窯の弱火、マシンのたまの湯気。
 */
export function updateAmbient(
  shop: ShopRefs,
  steam: PuffEmitter,
  t: number,
  dt: number,
  testing: boolean,
): void {
  // 猫: おなかがゆっくり上下、しっぽがゆらゆら
  shop.cat.body.scale.y = 1 + Math.sin(t * 1.3) * 0.03;
  shop.cat.tail.rotation.z = 0.5 + Math.sin(t * 0.8) * 0.25;

  // 窯の弱火(testing 中は animations 側が強火にする)
  if (!testing) {
    for (let i = 0; i < shop.oven.fireMaterials.length; i++) {
      shop.oven.fireMaterials[i].emissiveIntensity = 0.7 + Math.sin(t * 6 + i * 2.1) * 0.25;
    }
    shop.oven.fireLight.intensity = 4 + Math.sin(t * 5) * 1.0;
  }

  // エスプレッソマシンから、ときどきふわっと湯気
  if (Math.random() < dt * 0.35) {
    const s = shop.machine.steamSpot;
    steam.spawn(s.x, s.y, s.z, 1.6);
  }
}
