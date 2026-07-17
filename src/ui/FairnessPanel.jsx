import { useEffect, useMemo, useRef, useState } from 'react';
import { deriveWinningNumber } from '../core/provablyFair.js';
import { shouldFairnessPanelReadyGlow } from '../lib/fairnessPanelReadyGlow.js';
import { shouldFairnessPanelReadyEntryPulse } from '../lib/fairnessPanelReadyEntryPulse.js';
import { shouldFairnessCustodyBadgeGlow } from '../lib/fairnessCustodyBadgeGlow.js';
import { shouldFairnessCustodyBadgeReadyEntryPulse } from '../lib/fairnessCustodyBadgeReadyEntryPulse.js';
import { IconShieldCheck } from './icons.jsx';

function truncateHash(hash, head = 10, tail = 8) {
  if (!hash || hash.length <= head + tail + 1) return hash ?? '—';
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function FairnessPanel({
  commit,
  audit,
  history = [],
  expanded,
  onToggle,
  syncMode,
  custodyBadge,
}) {
  const status = audit?.verified ? 'verified' : commit ? 'committed' : 'pending';
  const fairnessReadyGlow = shouldFairnessPanelReadyGlow(history, expanded);
  const prevFairnessReadyRef = useRef(false);
  const [fairnessReadyEntryPulsing, setFairnessReadyEntryPulsing] = useState(false);

  useEffect(() => {
    const prevFairnessReady = prevFairnessReadyRef.current;
    prevFairnessReadyRef.current = fairnessReadyGlow;
    if (!shouldFairnessPanelReadyEntryPulse(prevFairnessReady, fairnessReadyGlow)) return undefined;
    setFairnessReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setFairnessReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [fairnessReadyGlow]);

  const custodyBadgeGlow = shouldFairnessCustodyBadgeGlow(history, custodyBadge, expanded);
  const prevCustodyBadgeReadyRef = useRef(false);
  const [custodyBadgeReadyEntryPulsing, setCustodyBadgeReadyEntryPulsing] = useState(false);

  useEffect(() => {
    const prevCustodyBadgeReady = prevCustodyBadgeReadyRef.current;
    prevCustodyBadgeReadyRef.current = custodyBadgeGlow;
    if (!shouldFairnessCustodyBadgeReadyEntryPulse(prevCustodyBadgeReady, custodyBadgeGlow)) return undefined;
    setCustodyBadgeReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setCustodyBadgeReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [custodyBadgeGlow]);

  const rows = useMemo(() => {
    if (!expanded) return [];
    const items = [
      { label: 'Algorithm', value: audit?.algorithm ?? 'hmac-sha256-mod37' },
      { label: 'Seed custody', value: custodyBadge?.label ?? '—', title: custodyBadge?.title },
      { label: 'Cycle', value: String(commit?.cycleId ?? '—') },
      { label: 'Client seed', value: commit?.clientSeed ?? '—' },
      { label: 'Server hash', value: commit?.serverSeedHash ?? '—', mono: true },
    ];
    if (audit?.verified) {
      items.push(
        { label: 'Server seed', value: audit.revealServerSeed ?? '—', mono: true },
        { label: 'Outcome', value: String(audit.winningNumber ?? '—') },
        { label: 'Verified', value: audit.verified ? 'PASS' : 'FAIL' }
      );
    }
    return items;
  }, [commit, audit, expanded, custodyBadge]);

  const historyRows = useMemo(() => {
    if (!expanded || !history.length) return [];
    return history.map((round) => ({
      cycleId: round.cycleId,
      hash: round.serverSeedHash,
      outcome:
        round.serverSeed && round.clientSeed
          ? deriveWinningNumber(round.serverSeed, round.clientSeed, round.cycleId)
          : null,
    }));
  }, [expanded, history]);

  return (
    <section className={`fairness-panel status-${status}`} aria-label="Provably fair round">
      <button
        type="button"
        className={[
          'fairness-toggle',
          fairnessReadyGlow ? 'fairness-ready-glow-active' : '',
          fairnessReadyEntryPulsing ? 'fairness-ready-entry-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls="fairness-details"
      >
        <IconShieldCheck className="icon-svg fairness-icon" />
        <span className="fairness-label">Provably Fair</span>
        <code className="fairness-hash" title={commit?.serverSeedHash}>
          {truncateHash(commit?.serverSeedHash)}
        </code>
        <span className={`fairness-badge ${status}`}>
          {audit?.verified ? 'Verified' : 'Committed'}
        </span>
        {custodyBadge && (
          <span
            className={[
              'fairness-custody-badge',
              `custody-${custodyBadge.badge}`,
              custodyBadgeGlow ? 'fairness-custody-badge-glow-active' : '',
              custodyBadgeReadyEntryPulsing ? 'fairness-custody-badge-ready-entry-pulse' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            title={custodyBadge.title}
          >
            {custodyBadge.label}
          </span>
        )}
        {syncMode && syncMode !== 'wall-clock' && (
          <span className="fairness-sync-badge" title="Cycle sync mode">
            {syncMode === 'authoritative-stream' ? 'Live sync' : 'API'}
          </span>
        )}
      </button>
      {expanded && (
        <dl id="fairness-details" className="fairness-details">
          {rows.map((row) => (
            <div key={row.label} className="fairness-row">
              <dt>{row.label}</dt>
              <dd
                className={row.mono ? 'mono' : ''}
                title={row.title ?? (row.mono ? row.value : undefined)}
              >
                {row.mono ? truncateHash(row.value, 12, 12) : row.value}
              </dd>
            </div>
          ))}
          {!audit?.verified && (
            <p className="fairness-hint">Server seed reveals after the ball settles (T-0).</p>
          )}
          {historyRows.length > 0 && (
            <div className="fairness-history" aria-label="Verified round history">
              <p className="fairness-history-title">Verified history</p>
              <ul className="fairness-history-list">
                {historyRows.map((row) => (
                  <li key={row.cycleId} className="fairness-history-item">
                    <span className="fairness-history-cycle">#{row.cycleId}</span>
                    <code className="fairness-history-hash" title={row.hash}>
                      {truncateHash(row.hash, 6, 6)}
                    </code>
                    {row.outcome != null && (
                      <span className="fairness-history-outcome">{row.outcome}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}
