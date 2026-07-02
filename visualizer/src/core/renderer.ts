import * as THREE from 'three';

/** 内部レンダリング解像度。低くしてCSSで拡大するとドット絵になる。 */
export const PIXEL_WIDTH = 320;
export const PIXEL_HEIGHT = 200;

export interface Stage {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  /** 毎フレーム呼ばれる。dt は秒、t は起動からの秒。 */
  start(update: (dt: number, t: number) => void): void;
}

export function createStage(mount: HTMLElement): Stage {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(1);
  renderer.setSize(PIXEL_WIDTH, PIXEL_HEIGHT, false);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2b2620');

  const aspect = PIXEL_WIDTH / PIXEL_HEIGHT;
  const viewHeight = 9.2;
  const camera = new THREE.OrthographicCamera(
    (-viewHeight * aspect) / 2,
    (viewHeight * aspect) / 2,
    viewHeight / 2,
    -viewHeight / 2,
    0.1,
    100,
  );
  camera.position.set(8.5, 7.5, 10.5);
  camera.lookAt(0, 1.0, -0.6);

  const clock = new THREE.Clock();

  return {
    scene,
    camera,
    start(update) {
      renderer.setAnimationLoop(() => {
        const dt = Math.min(clock.getDelta(), 0.1);
        update(dt, clock.elapsedTime);
        renderer.render(scene, camera);
      });
    },
  };
}
