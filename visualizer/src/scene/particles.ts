import * as THREE from 'three';

interface Puff {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  speed: number;
}

/**
 * 湯気・煙のためのささやかなパーティクル。
 * 小さな箱がゆっくり上がって薄れて消えるだけ。
 */
export class PuffEmitter {
  private puffs: Puff[] = [];
  private group = new THREE.Group();
  private material: THREE.MeshLambertMaterial;

  constructor(
    parent: THREE.Object3D,
    color: string,
    private size = 0.16,
  ) {
    this.material = new THREE.MeshLambertMaterial({
      color,
      transparent: true,
      opacity: 0.7,
      emissive: color,
      emissiveIntensity: 0.35,
    });
    parent.add(this.group);
  }

  spawn(x: number, y: number, z: number, maxLife = 1.6): void {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(this.size, this.size, this.size),
      this.material.clone(),
    );
    mesh.position.set(x + (Math.random() - 0.5) * 0.15, y, z + (Math.random() - 0.5) * 0.15);
    this.group.add(mesh);
    this.puffs.push({ mesh, life: 0, maxLife, speed: 0.5 + Math.random() * 0.3 });
  }

  update(dt: number): void {
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const puff = this.puffs[i];
      puff.life += dt;
      const progress = puff.life / puff.maxLife;
      puff.mesh.position.y += puff.speed * dt;
      puff.mesh.position.x += Math.sin(puff.life * 3) * 0.08 * dt;
      const scale = 1 + progress * 0.8;
      puff.mesh.scale.setScalar(scale);
      (puff.mesh.material as THREE.MeshLambertMaterial).opacity = 0.7 * (1 - progress);
      if (puff.life >= puff.maxLife) {
        this.group.remove(puff.mesh);
        puff.mesh.geometry.dispose();
        (puff.mesh.material as THREE.Material).dispose();
        this.puffs.splice(i, 1);
      }
    }
  }
}
