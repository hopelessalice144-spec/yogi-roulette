import { useEffect, useRef, useState } from 'react';

import { useGame } from '../context/GameContext.jsx';

import { LOCK_BANNER_DURATION_MS, shouldShowLockBanner } from '../lib/lockPhaseBanner.js';

import { shouldLockBannerReadyGlow } from '../lib/lockBannerReadyGlow.js';

import { shouldLockBannerSettleEntryPulse } from '../lib/lockBannerSettleEntryPulse.js';



/**

 * Subtle toast when the betting window closes and bets lock.

 */

export function LockPhaseBanner() {

  const { clock } = useGame();

  const [visible, setVisible] = useState(false);

  const prevPhaseRef = useRef(clock.name);

  const lockBannerReadyGlow = shouldLockBannerReadyGlow(clock.name, visible);

  const prevLockBannerReadyRef = useRef(false);

  const [lockBannerSettleEntryPulsing, setLockBannerSettleEntryPulsing] = useState(false);



  useEffect(() => {

    const prevPhase = prevPhaseRef.current;

    if (shouldShowLockBanner(prevPhase, clock.name)) {

      setVisible(true);

    }

    prevPhaseRef.current = clock.name;

  }, [clock.name]);



  useEffect(() => {

    if (!visible) return undefined;

    if (clock.name !== 'locked') {

      setVisible(false);

      return undefined;

    }

    const timer = window.setTimeout(() => setVisible(false), LOCK_BANNER_DURATION_MS);

    return () => window.clearTimeout(timer);

  }, [visible, clock.name]);



  useEffect(() => {

    const prevLockBannerReady = prevLockBannerReadyRef.current;

    prevLockBannerReadyRef.current = lockBannerReadyGlow;

    if (!shouldLockBannerSettleEntryPulse(prevLockBannerReady, lockBannerReadyGlow)) return undefined;

    setLockBannerSettleEntryPulsing(true);

    const timer = window.setTimeout(() => setLockBannerSettleEntryPulsing(false), 620);

    return () => window.clearTimeout(timer);

  }, [lockBannerReadyGlow]);



  if (!visible) return null;



  return (

    <div

      className={[

        'lock-phase-banner',

        lockBannerReadyGlow ? 'lock-banner-ready-glow-active' : '',

        lockBannerSettleEntryPulsing ? 'lock-banner-settle-entry-pulse' : '',

      ]

        .filter(Boolean)

        .join(' ')}

      role="status"

      aria-live="polite"

      data-testid="lock-phase-banner"

    >

      <span className="lock-phase-banner-icon" aria-hidden />

      <span className="lock-phase-banner-copy">

        <strong>No more bets</strong>

        <span>Wheel spinning soon</span>

      </span>

    </div>

  );

}

