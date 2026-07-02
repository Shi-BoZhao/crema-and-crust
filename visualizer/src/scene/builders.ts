import * as THREE from 'three';

/** 全メッシュ共通の Lambert 素材。ドット絵風なので艶を出さない。 */
export function mat(color: string, options: { emissive?: string } = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    color,
    emissive: options.emissive ?? '#000000',
  });
}

export function box(
  width: number,
  height: number,
  depth: number,
  color: string,
  options: { emissive?: string } = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat(color, options));
  return mesh;
}

export function cylinder(
  radius: number,
  height: number,
  color: string,
  segments = 10,
): THREE.Mesh {
  return new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat(color));
}

export function at<T extends THREE.Object3D>(object: T, x: number, y: number, z: number): T {
  object.position.set(x, y, z);
  return object;
}

/**
 * 文字の吹き出しスプライト(「…」「?」など)。
 * 低解像度キャンバスに描いて NearestFilter で拡大するのでドット絵になじむ。
 */
export function makeEmoteSprite(text: string, color = '#5a4632'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f6ecd4';
  ctx.beginPath();
  ctx.arc(24, 22, 18, 0, Math.PI * 2);
  ctx.fill();
  // フォント依存だと環境で崩れるので、記号は自前のドットで描く
  ctx.fillStyle = color;
  if (text === '…') {
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(12 + i * 9, 20, 5, 5);
    }
  } else if (text === '♪') {
    ctx.fillRect(26, 12, 4, 14);
    ctx.fillRect(20, 24, 8, 6);
    ctx.fillRect(26, 12, 8, 4);
  } else {
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 24, 23);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }),
  );
  sprite.scale.set(0.75, 0.75, 1);
  sprite.visible = false;
  return sprite;
}
