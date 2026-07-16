import { useEffect, useState } from 'react';
import { getCycleId, getPhase, getSecondsToBallDrop } from '@core/timer.js';

/**
 * Live-synced phase clock for HUD + future physics triggers.
 */
export function useLiveClock(intervalMs = 200) {
  const [snapshot, setSnapshot] = useState(() => {
    const phase = getPhase();
    return {
      ...phase,
      cycleId: getCycleId(),
      tMinus: getSecondsToBallDrop(),
    };
  });

  useEffect(() => {
    const id = setInterval(() => {
      const phase = getPhase();
      setSnapshot({
        ...phase,
        cycleId: getCycleId(),
        tMinus: getSecondsToBallDrop(),
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return snapshot;
}
