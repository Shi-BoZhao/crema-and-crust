import * as THREE from 'three';
import { at, box, cylinder, makeEmoteSprite } from '../scene/builders';
import { PALETTE as P } from '../scene/palette';

export type EmoteKind = 'dots' | 'question' | 'note' | 'none';

/**
 * ボクセル風の店員さん。
 * 体のパーツ(腕・脚・頭)を別グループにして、状態アニメから直接触れるようにする。
 */
export class Barista {
  readonly group = new THREE.Group();
  readonly armLeft = new THREE.Group();
  readonly armRight = new THREE.Group();
  readonly legLeft = new THREE.Group();
  readonly legRight = new THREE.Group();
  readonly head = new THREE.Group();
  readonly body: THREE.Mesh;

  /** 手に持つ小物。アニメ側で visible を切り替える */
  readonly heldNotebook: THREE.Group;
  readonly heldCup: THREE.Group;
  readonly heldCloth: THREE.Mesh;

  private eyes: THREE.Mesh[] = [];
  private emotes: Record<Exclude<EmoteKind, 'none'>, THREE.Sprite>;
  private blinkTimer = Math.random() * 3;

  /** 移動まわり */
  private target: THREE.Vector3 | null = null;
  private targetYaw = 0;
  private walkPhase = 0;
  readonly walking = { active: false };

  constructor(parent: THREE.Object3D) {
    // 脚
    for (const [legGroup, side] of [
      [this.legLeft, -1],
      [this.legRight, 1],
    ] as const) {
      legGroup.position.set(side * 0.15, 0.52, 0);
      legGroup.add(at(box(0.2, 0.5, 0.24, P.pants), 0, -0.26, 0));
      legGroup.add(at(box(0.22, 0.1, 0.3, P.woodDark), 0, -0.5, 0.03)); // くつ
      this.group.add(legGroup);
    }

    // 胴 + エプロン
    this.body = at(box(0.62, 0.72, 0.36, P.shirt), 0, 0.9, 0);
    const apron = at(box(0.5, 0.6, 0.06, P.apron), 0, -0.04, 0.19);
    this.body.add(apron);
    const apronStrap = at(box(0.14, 0.2, 0.05, P.apron), 0, 0.32, 0.19);
    this.body.add(apronStrap);
    this.group.add(this.body);

    // 腕(肩を支点に回す)
    for (const [armGroup, side] of [
      [this.armLeft, -1],
      [this.armRight, 1],
    ] as const) {
      armGroup.position.set(side * 0.39, 1.16, 0);
      armGroup.add(at(box(0.16, 0.5, 0.18, P.shirt), 0, -0.2, 0));
      armGroup.add(at(box(0.14, 0.12, 0.16, P.skin), 0, -0.48, 0)); // 手
      this.group.add(armGroup);
    }

    // 頭
    this.head.position.set(0, 1.32, 0);
    const face = at(box(0.5, 0.48, 0.46, P.skin), 0, 0.24, 0);
    this.head.add(face);
    this.head.add(at(box(0.54, 0.18, 0.5, P.hair), 0, 0.5, -0.01)); // 髪
    this.head.add(at(box(0.52, 0.3, 0.12, P.hair), 0, 0.32, -0.22)); // 後ろ髪
    for (const side of [-1, 1]) {
      const eye = at(box(0.06, 0.09, 0.02, '#3a2c20'), side * 0.12, 0.26, 0.24);
      this.head.add(eye);
      this.eyes.push(eye);
    }
    // ほっぺ
    for (const side of [-1, 1]) {
      this.head.add(at(box(0.07, 0.05, 0.02, '#e09a7a'), side * 0.2, 0.17, 0.24));
    }
    this.group.add(this.head);

    // 手持ち小物
    this.heldNotebook = new THREE.Group();
    this.heldNotebook.add(at(box(0.4, 0.05, 0.3, P.woodDark), 0, 0, 0));
    this.heldNotebook.add(at(box(0.36, 0.04, 0.26, P.paper), 0, 0.03, 0));
    this.heldNotebook.position.set(0, -0.5, 0.12);
    this.heldNotebook.rotation.x = -0.9;
    this.heldNotebook.visible = false;
    this.armRight.add(this.heldNotebook);

    this.heldCup = new THREE.Group();
    this.heldCup.add(cylinder(0.09, 0.14, P.paper, 8));
    this.heldCup.position.set(0, -0.52, 0.05);
    this.heldCup.visible = false;
    this.armLeft.add(this.heldCup);

    this.heldCloth = at(box(0.18, 0.04, 0.18, '#d8c9a8'), 0, -0.54, 0.05);
    this.heldCloth.visible = false;
    this.armRight.add(this.heldCloth);

    // 吹き出し
    this.emotes = {
      dots: makeEmoteSprite('…'),
      question: makeEmoteSprite('?', '#a3543a'),
      note: makeEmoteSprite('♪', '#3e5c4b'),
    };
    for (const sprite of Object.values(this.emotes)) {
      sprite.position.set(0.35, 2.35, 0);
      this.group.add(sprite);
    }

    parent.add(this.group);
  }

  setEmote(kind: EmoteKind): void {
    for (const [name, sprite] of Object.entries(this.emotes)) {
      sprite.visible = name === kind;
    }
  }

  /** 立ち位置へ歩かせる。到着まで update が歩行アニメを流す。 */
  walkTo(x: number, z: number, faceYaw: number): void {
    this.target = new THREE.Vector3(x, 0, z);
    this.targetYaw = faceYaw;
  }

  teleport(x: number, z: number, faceYaw: number): void {
    this.group.position.set(x, 0, z);
    this.group.rotation.y = faceYaw;
    this.target = null;
    this.walking.active = false;
  }

  /** 姿勢をニュートラルへ戻す(各アニメの前提)。 */
  resetPose(): void {
    this.armLeft.rotation.set(0, 0, 0.06);
    this.armRight.rotation.set(0, 0, -0.06);
    this.legLeft.rotation.set(0, 0, 0);
    this.legRight.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    this.body.position.y = 0.9;
    this.group.position.y = 0;
    this.heldNotebook.visible = false;
    this.heldCup.visible = false;
    this.heldCloth.visible = false;
  }

  /** 歩行・まばたきなど、状態によらない更新。歩行中は true を返す。 */
  update(dt: number): boolean {
    // まばたき
    this.blinkTimer -= dt;
    if (this.blinkTimer < 0) {
      this.blinkTimer = 2.2 + Math.random() * 2.5;
    }
    const blink = this.blinkTimer < 0.12 ? 0.15 : 1;
    for (const eye of this.eyes) eye.scale.y = blink;

    if (!this.target) {
      this.walking.active = false;
      return false;
    }

    const pos = this.group.position;
    const delta = new THREE.Vector3().subVectors(this.target, pos);
    delta.y = 0;
    const distance = delta.length();
    const speed = 2.0;

    if (distance < 0.05) {
      pos.x = this.target.x;
      pos.z = this.target.z;
      this.target = null;
      this.walking.active = false;
      this.group.rotation.y = this.targetYaw;
      return false;
    }

    // 進行方向を向いて歩く
    const step = Math.min(distance, speed * dt);
    delta.normalize();
    pos.addScaledVector(delta, step);
    const walkYaw = Math.atan2(delta.x, delta.z);
    this.group.rotation.y += shortestAngle(this.group.rotation.y, walkYaw) * Math.min(1, dt * 10);

    this.walkPhase += dt * 9;
    const swing = Math.sin(this.walkPhase) * 0.5;
    this.resetPose();
    this.legLeft.rotation.x = swing;
    this.legRight.rotation.x = -swing;
    this.armLeft.rotation.x = -swing * 0.6;
    this.armRight.rotation.x = swing * 0.6;
    this.group.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.05;

    this.walking.active = true;
    return true;
  }
}

function shortestAngle(from: number, to: number): number {
  let diff = (to - from) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}
