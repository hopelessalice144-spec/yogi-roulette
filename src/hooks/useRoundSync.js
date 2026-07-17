import { useEffect } from 'react';
import { fairContextForCycle } from '../core/fairRoundStore.js';
import {
  isAuthorityEnabled,
  resolveAuthoritativeCommit,
  resolveVisualTargetNumber,
} from '../core/authorityClient.js';

/**
 * Per-cycle outcome for visuals + kinematic alignment with wall clock.
 */
export function useRoundSync({
  clock,
  bumpKinematicResync,
  applyVisualTarget,
  setFairnessCommit,
  mergeEngineClock,
  wallClockSnapshot,
}) {
  useEffect(() => {
    bumpKinematicResync(mergeEngineClock(wallClockSnapshot()), { syncWheel: false });
  }, [clock.cycleId, bumpKinematicResync, mergeEngineClock, wallClockSnapshot]);

  useEffect(() => {
    let cancelled = false;
    const cid = clock.cycleId;

    (async () => {
      const commit = await resolveAuthoritativeCommit(cid);
      if (!cancelled) setFairnessCommit(commit);
      fairContextForCycle(cid);

      const visual = await resolveVisualTargetNumber(cid);
      if (!cancelled && visual != null) applyVisualTarget(visual);
    })();

    return () => {
      cancelled = true;
    };
  }, [clock.cycleId, applyVisualTarget, setFairnessCommit]);

  useEffect(() => {
    if (!isAuthorityEnabled()) return;
    const { cycleId, name } = clock;
    if (name !== 'locked' && name !== 'spinning') return;

    let cancelled = false;
    let attempts = 0;
    const tryFetch = async () => {
      if (cancelled || attempts >= 15) return;
      attempts += 1;
      const visual = await resolveVisualTargetNumber(cycleId);
      if (cancelled) return;
      if (visual != null) {
        applyVisualTarget(visual);
        return;
      }
      if (!cancelled) setTimeout(tryFetch, 350);
    };
    tryFetch();

    return () => {
      cancelled = true;
    };
  }, [clock.cycleId, clock.name, applyVisualTarget]);
}
