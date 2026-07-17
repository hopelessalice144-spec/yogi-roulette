import { useEffect, useMemo, useRef, useState } from 'react';
import { winStreak } from '../lib/sessionStats.js';
import {
  winStreakTier,
} from '../lib/winStreakTierPulse.js';
import { shouldWinStreakTierEntryPulse } from '../lib/winStreakTierEntryPulse.js';
import { shouldWinStreakHotEntryPulse } from '../lib/winStreakHotEntryPulse.js';
import { IconWinStreak } from './icons.jsx';

/**
 * HUD badge for consecutive profitable rounds in the current session.
 */
export function WinStreakBadge({ sessionRounds = [] }) {
  const streak = useMemo(() => winStreak(sessionRounds), [sessionRounds]);
  const tier = winStreakTier(streak.length);
  const prevTierRef = useRef('none');
  const [tierEntryPulsing, setTierEntryPulsing] = useState(false);
  const [hotTierEntryPulsing, setHotTierEntryPulsing] = useState(false);

  useEffect(() => {
    const prevTier = prevTierRef.current;
    prevTierRef.current = tier;
    if (shouldWinStreakHotEntryPulse(prevTier, tier)) {
      setHotTierEntryPulsing(true);
      const timer = window.setTimeout(() => setHotTierEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!shouldWinStreakTierEntryPulse(prevTier, tier) || tier === 'hot') return undefined;
    setTierEntryPulsing(true);
    const timer = window.setTimeout(() => setTierEntryPulsing(false), 680);
    return () => window.clearTimeout(timer);
  }, [tier]);

  if (tier === 'none') return null;

  return (
    <div
      className={[
        'win-streak-badge',
        `tier-${tier}-active`,
        tierEntryPulsing ? 'win-streak-tier-entry-pulse' : '',
        hotTierEntryPulsing ? 'win-streak-hot-entry-pulse' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="win-streak-badge"
      title={`${streak.length} winning rounds · +$${streak.totalWon.toLocaleString()} this streak`}
      aria-label={`${streak.length} round win streak, plus ${streak.totalWon} dollars`}
    >
      <IconWinStreak className="win-streak-icon" />
      <span className="win-streak-count">{streak.length}</span>
      <span className="win-streak-label">win streak</span>
    </div>
  );
}
