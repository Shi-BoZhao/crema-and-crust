import * as THREE from 'three';
import { at, box, cylinder, mat } from './builders';
import { PALETTE as P } from './palette';

export interface ShopRefs {
  oven: {
    fireMaterials: THREE.MeshLambertMaterial[];
    fireLight: THREE.PointLight;
    chimneyTop: THREE.Vector3;
  };
  shelf: {
    jars: THREE.Mesh[];
  };
  worktable: {
    dough: THREE.Mesh;
    pin: THREE.Group;
    surface: THREE.Vector3;
  };
  counter: {
    serveSpot: THREE.Vector3;
    notebookPage: THREE.Group;
  };
  machine: {
    steamSpot: THREE.Vector3;
  };
  cat: {
    body: THREE.Group;
    tail: THREE.Group;
  };
}

/** 店内をまるごと組み立てて、アニメーションで触る参照を返す。 */
export function buildShop(scene: THREE.Scene): ShopRefs {
  // --- 照明: あたたかい昼下がりの光 ---
  scene.add(new THREE.AmbientLight('#ffe8c8', 1.05));
  const sun = new THREE.DirectionalLight('#fff1d6', 1.4);
  sun.position.set(6, 10, 8);
  scene.add(sun);
  const roomGlow = new THREE.PointLight('#ffd9a0', 6, 18);
  roomGlow.position.set(0, 4.5, 0);
  scene.add(roomGlow);

  // --- 床: 市松のタイル ---
  const floor = new THREE.Group();
  for (let x = -6; x < 6; x++) {
    for (let z = -5; z < 4; z++) {
      const tile = box(1, 0.1, 1, (x + z) % 2 === 0 ? P.floorLight : P.floorDark);
      at(tile, x + 0.5, -0.05, z + 0.5);
      floor.add(tile);
    }
  }
  scene.add(floor);

  // --- 壁: クリーム色 + 深緑の腰壁 ---
  const backWall = at(box(12, 4.6, 0.3, P.wallCream), 0, 2.3, -5.15);
  const backWainscot = at(box(12, 1.5, 0.32, P.wallGreen), 0, 0.75, -5.14);
  const leftWall = at(box(0.3, 4.6, 9.3, P.wallCream), -6.15, 2.3, -0.5);
  const leftWainscot = at(box(0.32, 1.5, 9.3, P.wallGreen), -6.14, 0.75, -0.5);
  scene.add(backWall, backWainscot, leftWall, leftWainscot);

  // --- 窓(奥の壁・右側)。外はやわらかい昼の空 ---
  const windowGlass = at(box(2.0, 1.8, 0.08, '#a8c4de'), 3.9, 2.6, -5.0);
  (windowGlass.material as THREE.MeshLambertMaterial).emissive = new THREE.Color('#9db8d4');
  (windowGlass.material as THREE.MeshLambertMaterial).emissiveIntensity = 0.85;
  scene.add(windowGlass);
  // 枠は細い木の帯4本 + 中桟
  scene.add(at(box(2.3, 0.16, 0.14, P.wood), 3.9, 3.55, -4.97));
  scene.add(at(box(2.3, 0.16, 0.14, P.wood), 3.9, 1.65, -4.97));
  scene.add(at(box(0.16, 2.0, 0.14, P.wood), 2.85, 2.6, -4.97));
  scene.add(at(box(0.16, 2.0, 0.14, P.wood), 4.95, 2.6, -4.97));
  scene.add(at(box(0.1, 1.8, 0.1, P.wood), 3.9, 2.6, -4.96));
  const windowSill = at(box(2.4, 0.15, 0.6, P.wood), 3.9, 1.55, -4.85);
  scene.add(windowSill);

  // --- メニュー黒板(奥の壁・中央) ---
  const menuBoard = at(box(1.7, 1.3, 0.12, '#33402f'), 0.9, 2.9, -5.0);
  const menuFrame = at(box(1.9, 1.5, 0.1, P.woodDark), 0.9, 2.9, -5.02);
  scene.add(menuFrame, menuBoard);
  for (let i = 0; i < 3; i++) {
    scene.add(at(box(1.1 - i * 0.2, 0.08, 0.05, P.paper), 0.75, 3.25 - i * 0.35, -4.93));
  }

  // --- ピザ窯(奥の左) ---
  const oven = new THREE.Group();
  oven.add(at(box(2.4, 1.1, 2.0, P.metalDark), 0, 0.55, 0)); // 土台
  oven.add(at(box(2.2, 1.0, 1.8, P.brick), 0, 1.6, -0.1)); // 胴
  oven.add(at(box(1.8, 0.5, 1.5, P.terracotta), 0, 2.35, -0.15)); // ドーム下段
  oven.add(at(box(1.2, 0.4, 1.1, P.terracotta), 0, 2.75, -0.2)); // ドーム上段
  const mouth = at(box(1.0, 0.55, 0.15, '#241a12'), 0, 1.5, 0.82);
  oven.add(mouth);
  // 炎: 窯口の中で揺れる発光ボックス
  const fireMaterials: THREE.MeshLambertMaterial[] = [];
  const firePositions: Array<[number, number]> = [
    [-0.25, 0.02],
    [0.03, 0.1],
    [0.28, 0.0],
  ];
  for (const [fx, fy] of firePositions) {
    const material = mat(P.fire, { emissive: P.fireDeep });
    material.emissiveIntensity = 0.9;
    const flame = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.38, 0.12), material);
    at(flame, fx, 1.42 + fy, 0.88);
    oven.add(flame);
    fireMaterials.push(material);
  }
  const fireLight = new THREE.PointLight(P.fire, 5, 5);
  fireLight.position.set(0, 1.6, 1.2);
  oven.add(fireLight);
  // 煙突
  oven.add(at(box(0.5, 1.9, 0.5, P.brick), 0, 3.9, -0.3));
  oven.add(at(box(0.7, 0.2, 0.7, P.metalDark), 0, 4.9, -0.3));
  // 薪と窯用ピール(窯の右脇に立てかける)
  oven.add(at(box(0.9, 0.35, 0.5, P.woodDark), -1.5, 0.18, 0.9));
  const peel = new THREE.Group();
  peel.add(at(box(0.09, 2.2, 0.09, P.wood), 0, 1.1, 0));
  peel.add(at(box(0.34, 0.5, 0.05, P.wood), 0, 2.35, 0));
  peel.position.set(1.45, 0, 0.3);
  peel.rotation.z = -0.18;
  oven.add(peel);
  oven.position.set(-3.6, 0, -3.7);
  scene.add(oven);
  const chimneyTop = new THREE.Vector3(-3.6 - 0.3, 5.05, -3.7 - 0.3);

  // --- 材料棚(左の壁) ---
  const shelf = new THREE.Group();
  const jars: THREE.Mesh[] = [];
  const jarColors = [P.cheese, P.sauce, '#7c9a62', P.coffee, P.dough, '#b8763f'];
  for (let level = 0; level < 2; level++) {
    const boardY = 1.7 + level * 0.9;
    shelf.add(at(box(0.55, 0.1, 3.2, P.wood), 0, boardY, 0));
    for (let i = 0; i < 3; i++) {
      const jar = cylinder(0.16, 0.42, jarColors[level * 3 + i], 8);
      at(jar, 0, boardY + 0.27, -1.1 + i * 1.1);
      jar.userData.homeX = jar.position.x;
      shelf.add(jar);
      jars.push(jar);
    }
  }
  // 麻袋(棚の下)
  shelf.add(at(box(0.7, 0.6, 0.7, '#c9b088'), 0.2, 0.3, -1.0));
  shelf.add(at(box(0.6, 0.45, 0.6, '#b89a70'), 0.25, 0.22, 0.2));
  shelf.position.set(-5.7, 0, 0.6);
  scene.add(shelf);

  // --- 作業台(奥の右寄り) ---
  const table = new THREE.Group();
  table.add(at(box(2.6, 0.16, 1.3, P.counterTop), 0, 0.95, 0));
  table.add(at(box(2.4, 0.9, 1.1, P.wood), 0, 0.48, 0));
  // 小麦粉のふんわり(白い薄板)
  table.add(at(box(1.0, 0.02, 0.7, P.paper), -0.6, 1.04, 0.1));
  // 生地: しこみ中に広がる
  const dough = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 12), mat(P.dough));
  at(dough, 0.45, 1.12, 0.05);
  table.add(dough);
  // 麺棒: 持ち手つき
  const pin = new THREE.Group();
  const pinBody = cylinder(0.08, 1.0, P.wood, 8);
  pinBody.rotation.z = Math.PI / 2;
  pin.add(pinBody);
  pin.add(at(cylinder(0.05, 0.2, P.woodDark, 6), -0.6, 0, 0));
  pin.add(at(cylinder(0.05, 0.2, P.woodDark, 6), 0.6, 0, 0));
  pin.children.forEach((c) => (c.rotation.z = Math.PI / 2));
  at(pin, 0.45, 1.26, 0.05);
  table.add(pin);
  table.position.set(2.1, 0, -3.5);
  scene.add(table);
  const surface = new THREE.Vector3(2.55, 1.2, -3.45);

  // --- カウンター(手前) ---
  const counter = new THREE.Group();
  counter.add(at(box(7.4, 0.16, 1.4, P.counterTop), 0, 1.05, 0));
  counter.add(at(box(7.2, 1.0, 1.2, P.woodDark), 0, 0.52, 0));
  counter.add(at(box(7.2, 0.35, 0.06, P.wallGreen), 0, 0.78, 0.61)); // 前面の飾り帯
  counter.position.set(1.4, 0, 1.9);
  scene.add(counter);
  const serveSpot = new THREE.Vector3(0.4, 1.16, 1.9);

  // レシピノート(カウンター左端で読む)
  const notebook = new THREE.Group();
  notebook.add(at(box(0.62, 0.05, 0.45, P.woodDark), 0, 0, 0));
  notebook.add(at(box(0.56, 0.04, 0.4, P.paper), 0, 0.04, 0));
  const notebookPage = new THREE.Group();
  const page = at(box(0.26, 0.015, 0.38, '#fffdf4'), 0.13, 0, 0);
  notebookPage.add(page);
  notebookPage.position.set(0, 0.07, 0);
  notebook.add(notebookPage);
  notebook.position.set(-0.9, 1.13, 1.9);
  notebook.rotation.y = 0.25;
  scene.add(notebook);

  // --- エスプレッソマシン(カウンター右) ---
  const machine = new THREE.Group();
  machine.add(at(box(1.5, 0.9, 0.9, '#b0483a'), 0, 0.45, 0)); // 赤銅色の胴
  machine.add(at(box(1.6, 0.18, 1.0, P.metal), 0, 0.95, 0)); // 天板
  machine.add(at(box(0.35, 0.3, 0.35, P.metal), -0.35, 0.1, 0.5)); // グループヘッド
  machine.add(at(box(0.35, 0.3, 0.35, P.metal), 0.35, 0.1, 0.5));
  machine.add(at(cylinder(0.07, 0.35, P.metalDark, 6), 0.55, 1.1, 0)); // スチームノブ
  // 上に並んだカップ
  for (let i = 0; i < 3; i++) {
    machine.add(at(cylinder(0.11, 0.16, P.paper, 8), -0.45 + i * 0.42, 1.12, 0.1));
  }
  machine.position.set(3.6, 1.13, 1.75);
  scene.add(machine);
  const steamSpot = new THREE.Vector3(3.25, 1.6, 2.15);

  // --- 窓辺の猫 ---
  const cat = new THREE.Group();
  const catBody = at(box(0.62, 0.32, 0.4, P.cat), 0, 0.16, 0);
  const catHead = at(box(0.32, 0.28, 0.3, P.cat), 0.32, 0.34, 0);
  const earLeft = at(box(0.1, 0.12, 0.08, P.catDark), 0.24, 0.52, -0.08);
  const earRight = at(box(0.1, 0.12, 0.08, P.catDark), 0.24, 0.52, 0.08);
  const tail = new THREE.Group();
  tail.add(at(box(0.1, 0.34, 0.1, P.catDark), 0, 0.17, 0));
  tail.position.set(-0.32, 0.2, 0.12);
  tail.rotation.z = 0.5;
  cat.add(catBody, catHead, earLeft, earRight, tail);
  cat.position.set(3.9, 1.63, -4.85);
  cat.rotation.y = 0.5;
  scene.add(cat);

  // --- 小さな緑(手前左) ---
  const plant = new THREE.Group();
  plant.add(at(cylinder(0.28, 0.4, P.terracotta, 8), 0, 0.2, 0));
  plant.add(at(box(0.45, 0.5, 0.45, '#5d7a4d'), 0, 0.65, 0));
  plant.add(at(box(0.3, 0.35, 0.3, '#6f8f5c'), 0.1, 0.95, 0.05));
  plant.position.set(-5.3, 0, 3.2);
  scene.add(plant);

  // --- 壁のランプ(奥の壁に2つ) ---
  for (const lampX of [-1.6, 2.7]) {
    const lamp = new THREE.Group();
    lamp.add(at(box(0.12, 0.4, 0.14, P.woodDark), 0, 0.1, -0.06)); // 取り付け金具
    lamp.add(at(box(0.44, 0.24, 0.34, P.terracotta), 0, 0.3, 0.1)); // かさ
    const bulb = at(box(0.16, 0.12, 0.16, '#ffe9b0'), 0, 0.14, 0.1);
    (bulb.material as THREE.MeshLambertMaterial).emissive = new THREE.Color('#ffcf7d');
    (bulb.material as THREE.MeshLambertMaterial).emissiveIntensity = 1;
    lamp.add(bulb);
    lamp.position.set(lampX, 3.0, -4.95);
    scene.add(lamp);
  }

  // --- 客席(右手前)。ちいさな丸テーブルとスツール ---
  const seating = new THREE.Group();
  const table2 = new THREE.Group();
  table2.add(at(cylinder(0.75, 0.1, P.wood, 10), 0, 1.0, 0));
  table2.add(at(cylinder(0.09, 1.0, P.woodDark, 6), 0, 0.5, 0));
  table2.add(at(cylinder(0.3, 0.08, P.woodDark, 8), 0, 0.05, 0));
  // 置きっぱなしのカップと小さな花瓶
  table2.add(at(cylinder(0.1, 0.14, P.paper, 8), 0.3, 1.12, 0.1));
  table2.add(at(cylinder(0.07, 0.2, '#7c9a62', 6), -0.25, 1.15, -0.15));
  table2.add(at(box(0.1, 0.1, 0.1, '#c96f6f'), -0.25, 1.3, -0.15));
  seating.add(table2);
  for (const [sx, sz] of [
    [-1.0, 0.35],
    [0.75, -0.75],
  ] as const) {
    const stool = new THREE.Group();
    stool.add(at(cylinder(0.32, 0.12, P.terracotta, 8), 0, 0.62, 0));
    stool.add(at(cylinder(0.08, 0.6, P.woodDark, 6), 0, 0.3, 0));
    stool.position.set(sx, 0, sz);
    seating.add(stool);
  }
  seating.position.set(4.3, 0, -1.2);
  scene.add(seating);

  // --- 入口のマット(手前) ---
  const mat1 = at(box(1.5, 0.05, 0.9, P.terracotta), 2.0, 0.03, 3.3);
  const mat2 = at(box(1.2, 0.052, 0.62, '#d98d54'), 2.0, 0.03, 3.3);
  scene.add(mat1, mat2);

  return {
    oven: { fireMaterials, fireLight, chimneyTop },
    shelf: { jars },
    worktable: { dough, pin, surface },
    counter: { serveSpot, notebookPage },
    machine: { steamSpot },
    cat: { body: cat, tail },
  };
}
