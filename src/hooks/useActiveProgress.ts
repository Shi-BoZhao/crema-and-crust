import { useEffect, useRef } from "react";

/**
 * active が true の間だけ progress をゆっくり増やす。
 * アンマウント・非アクティブ時に必ず rAF を停止する。
 */
export function useActiveProgress(
  active: boolean,
  onTick: (delta: number) => void,
  speed = 0.04,
) {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (!active) return;

    let last = performance.now();
    let frameId = 0;

    const loop = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      onTickRef.current(delta * speed);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [active, speed]);
}
