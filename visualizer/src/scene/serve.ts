import * as THREE from 'three';
import { at, box, cylinder, mat } from './builders';
import { PALETTE as P } from './palette';

/**
 * カウンターに置かれる「できあがり」。
 * done のたびにピザとコーヒーを交互に出す。
 */
export class ServeItems {
  private pizza: THREE.Group;
  private coffee: THREE.Group;
  private count = 0;

  constructor(parent: THREE.Object3D, spot: THREE.Vector3) {
    this.pizza = new THREE.Group();
    const crust = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.09, 12), mat(P.crust));
    const sauce = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 12), mat(P.sauce));
    sauce.position.y = 0.05;
    const cheese = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 12), mat(P.cheese));
    cheese.position.y = 0.09;
    this.pizza.add(crust, sauce, cheese);
    // バジルとトマト
    const spots: Array<[number, number, string]> = [
      [0.15, 0.1, '#5d7a4d'],
      [-0.18, -0.05, '#b23a2a'],
      [0.02, -0.2, '#5d7a4d'],
      [-0.05, 0.2, '#b23a2a'],
    ];
    for (const [x, z, color] of spots) {
      this.pizza.add(at(box(0.1, 0.05, 0.1, color), x, 0.12, z));
    }
    this.pizza.position.copy(spot);
    this.pizza.visible = false;
    parent.add(this.pizza);

    this.coffee = new THREE.Group();
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.04, 10), mat(P.paper));
    const cup = at(cylinder(0.15, 0.2, P.paper, 10), 0, 0.12, 0);
    const surface = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 10), mat(P.coffee));
    surface.position.y = 0.22;
    const crema = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.021, 8), mat('#c9995e'));
    crema.position.y = 0.221;
    const handle = at(box(0.05, 0.1, 0.05, P.paper), 0.19, 0.12, 0);
    this.coffee.add(saucer, cup, surface, crema, handle);
    this.coffee.position.copy(spot);
    this.coffee.visible = false;
    parent.add(this.coffee);
  }

  /** done に入ったときに呼ぶ。ピザとコーヒーを交互に。 */
  serve(): void {
    this.hide();
    const item = this.count % 2 === 0 ? this.pizza : this.coffee;
    item.visible = true;
    this.count += 1;
  }

  hide(): void {
    this.pizza.visible = false;
    this.coffee.visible = false;
  }

  /** 店員が退店するときに、置き物ごとシーンから外す。 */
  detach(parent: THREE.Object3D): void {
    parent.remove(this.pizza);
    parent.remove(this.coffee);
  }
}
