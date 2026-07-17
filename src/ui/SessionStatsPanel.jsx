import { useEffect, useMemo, useRef, useState } from 'react';
import {
  hotColdNumbers,
  plSeries,
  progressionAdvice,
  sessionTotals,
} from '../lib/sessionStats.js';
import { shouldStatsPanelReadyGlow } from '../lib/statsPanelReadyGlow.js';
import { shouldStatsPanelReadyEntryPulse } from '../lib/statsPanelReadyEntryPulse.js';
import { PlSparkline } from './PlSparkline.jsx';

export function SessionStatsPanel({
  rounds,
  recentResults,
  chipValues,
  selectedChip,
  balance,
  onSelectChip,
  expanded,
  onToggle,
}) {
  const totals = useMemo(() => sessionTotals(rounds), [rounds]);
  const { hot, cold } = useMemo(() => hotColdNumbers(rounds, 5), [rounds]);
  const series = useMemo(() => plSeries(rounds, 24), [rounds]);
  const advice = useMemo(
    () => progressionAdvice({ rounds, chipValues, selectedChip, balance }),
    [rounds, chipValues, selectedChip, balance]
  );

  const netLabel = totals.net >= 0 ? `+$${totals.net}` : `-$${Math.abs(totals.net)}`;
  const statsReadyGlow = shouldStatsPanelReadyGlow(rounds, expanded);
  const prevStatsReadyRef = useRef(false);
  const [statsReadyEntryPulsing, setStatsReadyEntryPulsing] = useState(false);

  useEffect(() => {
    const prevStatsReady = prevStatsReadyRef.current;
    prevStatsReadyRef.current = statsReadyGlow;
    if (!shouldStatsPanelReadyEntryPulse(prevStatsReady, statsReadyGlow)) return undefined;
    setStatsReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setStatsReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [statsReadyGlow]);

  return (
    <section className={`session-stats ${expanded ? 'expanded' : ''}`} data-testid="session-stats-panel">
      <button
        type="button"
        className={[
          'session-stats-toggle',
          statsReadyGlow ? 'stats-ready-glow-active' : '',
          statsReadyEntryPulsing ? 'stats-ready-entry-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="session-stats-label">Session Stats</span>
        <PlSparkline series={series} variant="mini" />
        <span className={`session-net-badge ${totals.net >= 0 ? 'up' : totals.net < 0 ? 'down' : ''}`}>
          {rounds.length > 0 ? netLabel : '—'}
        </span>
        <span className="session-spins">{rounds.length} spins</span>
      </button>

      {expanded && (
        <div className="session-stats-body">
          <div className="stats-summary-row">
            <div>
              <span className="stats-kicker">W / L</span>
              <strong>
                {totals.wins} / {totals.losses}
              </strong>
            </div>
            <div>
              <span className="stats-kicker">Staked</span>
              <strong>${totals.staked.toLocaleString()}</strong>
            </div>
            <div>
              <span className="stats-kicker">Net</span>
              <strong className={totals.net >= 0 ? 'text-up' : 'text-down'}>{netLabel}</strong>
            </div>
          </div>

          {recentResults.length > 0 && (
            <div className="recent-strip stats-recent" aria-label="Recent results">
              {recentResults.map((r) => (
                <span
                  key={r.cycleId}
                  className={`recent-chip ${r.color} ${r.net > 0 ? 'won' : ''}`}
                  title={r.net > 0 ? `+$${r.net}` : r.net < 0 ? `-$${Math.abs(r.net)}` : 'No bet'}
                >
                  {r.number}
                </span>
              ))}
            </div>
          )}

          <div className="hot-cold-grid">
            <div>
              <h4 className="stats-section-title">Hot</h4>
              <ul className="stats-number-list">
                {hot.length === 0 ? (
                  <li className="stats-empty">—</li>
                ) : (
                  hot.map((h) => (
                    <li key={`hot-${h.number}`}>
                      <span className={`stats-ball ${h.number === 0 ? 'green' : h.number % 2 ? 'red' : 'black'}`}>
                        {h.number}
                      </span>
                      <span className="stats-hit-count">×{h.count}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h4 className="stats-section-title">Cold</h4>
              <ul className="stats-number-list">
                {cold.map((c) => (
                  <li key={`cold-${c.number}`}>
                    <span className={`stats-ball ${c.number === 0 ? 'green' : c.number % 2 ? 'red' : 'black'}`}>
                      {c.number}
                    </span>
                    <span className="stats-hit-count">×{c.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="stats-chart-block">
            <h4 className="stats-section-title">P/L trend</h4>
            <PlSparkline series={series} variant="full" />
          </div>

          <div className="progression-card">
            <h4 className="stats-section-title">Progression helper</h4>
            <p className="progression-label">{advice.label}</p>
            <p className="progression-detail">{advice.detail}</p>
            <button
              type="button"
              className="btn ghost progression-apply"
              onClick={() => onSelectChip(advice.chip)}
            >
              Use ${advice.chip} chip
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
