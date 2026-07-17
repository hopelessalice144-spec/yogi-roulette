import { useEffect, useMemo, useRef, useState } from 'react';
import { colorStreakRun, isColorStreakChip } from '../lib/colorStreakChip.js';
import { shouldRecentStreakTierEntryPulse } from '../lib/recentStreakTierEntryPulse.js';
import { shouldRecentStreakHotEntryPulse } from '../lib/recentStreakHotEntryPulse.js';

/**
 * Always-visible horizontal rail of recent winning numbers with streak highlights.
 */
export function RecentResultsRail({ recentResults = [] }) {
  const streakRun = useMemo(() => colorStreakRun(recentResults), [recentResults]);
  const prevTierRef = useRef('none');
  const [tierEntryPulsing, setTierEntryPulsing] = useState(false);
  const [hotTierEntryPulsing, setHotTierEntryPulsing] = useState(false);

  useEffect(() => {
    const prevTier = prevTierRef.current;
    prevTierRef.current = streakRun.tier;
    if (shouldRecentStreakHotEntryPulse(prevTier, streakRun.tier)) {
      setHotTierEntryPulsing(true);
      const timer = window.setTimeout(() => setHotTierEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!shouldRecentStreakTierEntryPulse(prevTier, streakRun.tier) || streakRun.tier === 'hot') {
      return undefined;
    }
    setTierEntryPulsing(true);
    const timer = window.setTimeout(() => setTierEntryPulsing(false), 680);
    return () => window.clearTimeout(timer);
  }, [streakRun.tier]);

  if (!recentResults.length) {
    return (
      <div className="recent-results-rail recent-results-rail--empty" aria-label="Recent results">
        <span className="recent-rail-placeholder">No spins yet this session</span>
      </div>
    );
  }

  return (
    <div
      className={[
        'recent-results-rail',
        streakRun.tier !== 'none' ? `has-color-streak tier-${streakRun.tier}-active` : '',
        tierEntryPulsing ? 'recent-streak-tier-entry-pulse' : '',
        hotTierEntryPulsing ? 'recent-streak-hot-entry-pulse' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Recent results"
    >
      {streakRun.tier !== 'none' && streakRun.color && (
        <span
          className={[
            'recent-streak-badge',
            `tier-${streakRun.tier}-active`,
            streakRun.color,
            tierEntryPulsing ? 'recent-streak-tier-entry-pulse' : '',
            hotTierEntryPulsing ? 'recent-streak-hot-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          title={`${streakRun.length} ${streakRun.color} in a row`}
          data-testid="recent-streak-chip"
        >
          {streakRun.length}× {streakRun.color}
        </span>
      )}
      <div className="recent-strip recent-rail-scroll">
        {recentResults.map((round, index) => {
          const inStreak = isColorStreakChip(index, streakRun);
          return (
            <span
              key={round.cycleId}
              className={[
                'recent-chip',
                round.color,
                inStreak ? 'streak-run-chip-active' : '',
                inStreak && tierEntryPulsing && streakRun.tier !== 'hot'
                  ? 'streak-run-chip-entry-pulse'
                  : '',
                inStreak && streakRun.tier === 'hot' ? 'streak-run-hot-active' : '',
                inStreak && streakRun.tier === 'hot' && hotTierEntryPulsing
                  ? 'streak-run-hot-entry-pulse'
                  : '',
                round.net > 0 ? 'won' : '',
                index === 0 ? 'recent-latest' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={inStreak ? { '--streak-i': index } : undefined}
              title={
                round.net > 0
                  ? `#${round.number} · +$${round.net}`
                  : round.net < 0
                    ? `#${round.number} · -$${Math.abs(round.net)}`
                    : `#${round.number}`
              }
            >
              {round.number}
            </span>
          );
        })}
      </div>
    </div>
  );
}
