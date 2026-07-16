import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../context/GameContext.jsx';

/** Monitors frame time and adjusts quality tier via performanceGuard. */
export function PerformanceMonitor() {
  const { performanceGuardRef, updateQualityTier, updateLiveFps, simulationPausedRef } = useGame();
  const frameCount = useRef(0);
  const lastTier = useRef('high');
  const lastGodStep = useRef(0);
  const fpsAccum = useRef(0);

  useFrame((_, delta) => {
    if (simulationPausedRef?.current) return;
    const guard = performanceGuardRef.current;
    if (!guard) return;
    frameCount.current += 1;
    fpsAccum.current += 1;

    if (frameCount.current % 2 !== 0) return;

    const result = guard.tick(delta * 1000);
    if (guard.tier !== lastTier.current) {
      lastTier.current = guard.tier;
      updateQualityTier(guard.tier, guard.godStep ?? 0);
    } else if (guard.godStep !== lastGodStep.current) {
      lastGodStep.current = guard.godStep;
      updateQualityTier(guard.tier, guard.godStep);
    }

    if (fpsAccum.current >= 30) {
      updateLiveFps(result.fps);
      fpsAccum.current = 0;
    }
  });

  return null;
}
