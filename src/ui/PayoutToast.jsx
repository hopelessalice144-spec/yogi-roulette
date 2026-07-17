import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { payoutToastSyncDelayMs, shouldSyncPayoutToast } from '../lib/payoutToastSync.js';
import { shouldPayoutToastReadyGlow } from '../lib/payoutToastReadyGlow.js';
import { shouldPayoutToastPendingReadyEntryPulse } from '../lib/payoutToastPendingReadyEntryPulse.js';
import { shouldPayoutToastSyncEntryPulse } from '../lib/payoutToastSyncEntryPulse.js';
import { WIN_TIERS } from '../lib/winCelebration.js';

let toastSeq = 0;

const TIER_PREMIUM_TIERS = new Set(['mega', 'legendary']);

function payoutTierEntryPulseClass(tierId, suffix, entryPulsing) {
  if (!entryPulsing || !TIER_PREMIUM_TIERS.has(tierId)) return '';
  return `payout-tier-${tierId}-${suffix}`;
}

/**
 * Spring-physics payout toasts — tiered celebration float burst on win.
 * Synced to result pill fly-in on settle reveal.
 */
export function PayoutToast() {
  const { lastWin, particleBurst, winCelebration, revealedWinningNumber, hudPhase } = useGame();
  const [toasts, setToasts] = useState([]);
  const [shownBurst, setShownBurst] = useState(0);
  const [syncEntryPulsingToastId, setSyncEntryPulsingToastId] = useState(null);
  const pendingWinRef = useRef(null);
  const shownBurstRef = useRef(0);
  const showTimerRef = useRef(null);
  const prevToastCountRef = useRef(0);
  const prevPayoutPendingReadyRef = useRef(false);
  const [payoutPendingReadyEntryPulsing, setPayoutPendingReadyEntryPulsing] = useState(false);

  const pushToast = useCallback((pending) => {
    const tier = WIN_TIERS[pending.tier] ?? WIN_TIERS.small;
    const id = ++toastSeq;
    const x = 32 + Math.random() * 36;
    const duration = 3200 + tier.particleScale * 700;

    setToasts((prev) => [
      ...prev.slice(-4),
      {
        id,
        amount: pending.lastWin,
        x,
        tierId: tier.id,
        toastClass: tier.toastClass,
        label: `+$${pending.lastWin.toLocaleString()}`,
        sub: tier.label || 'WIN',
        syncDelayMs: payoutToastSyncDelayMs(),
      },
    ]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    if (lastWin > 0 && particleBurst > shownBurstRef.current) {
      pendingWinRef.current = {
        burst: particleBurst,
        lastWin,
        tier: winCelebration?.tier,
      };
    }

    if (!shouldSyncPayoutToast(lastWin, revealedWinningNumber, hudPhase)) return undefined;

    const pending = pendingWinRef.current;
    if (!pending || pending.burst <= shownBurstRef.current) return undefined;

    if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
    showTimerRef.current = window.setTimeout(() => {
      shownBurstRef.current = pending.burst;
      setShownBurst(pending.burst);
      pendingWinRef.current = null;
      pushToast(pending);
      showTimerRef.current = null;
    }, payoutToastSyncDelayMs());

    return () => {
      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
    };
  }, [
    particleBurst,
    lastWin,
    winCelebration?.tier,
    revealedWinningNumber,
    hudPhase,
    pushToast,
  ]);

  const payoutToastReadyGlow = shouldPayoutToastReadyGlow(
    lastWin,
    revealedWinningNumber,
    particleBurst,
    shownBurst,
  );

  useEffect(() => {
    const prevPayoutPendingReady = prevPayoutPendingReadyRef.current;
    prevPayoutPendingReadyRef.current = payoutToastReadyGlow;
    if (!shouldPayoutToastPendingReadyEntryPulse(prevPayoutPendingReady, payoutToastReadyGlow)) return undefined;
    setPayoutPendingReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setPayoutPendingReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [payoutToastReadyGlow]);

  useEffect(() => {
    const prevCount = prevToastCountRef.current;
    const nextCount = toasts.length;
    prevToastCountRef.current = nextCount;

    if (!shouldPayoutToastSyncEntryPulse(prevCount, nextCount)) return undefined;

    const latest = toasts[nextCount - 1];
    if (!latest) return undefined;

    setSyncEntryPulsingToastId(latest.id);
    const timer = window.setTimeout(() => setSyncEntryPulsingToastId(null), 620);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  if (!payoutToastReadyGlow && toasts.length === 0) return null;

  return (
    <div
      className={[
        'payout-toast-layer',
        payoutToastReadyGlow ? 'payout-toast-ready-glow-active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-live="polite"
    >
      {payoutToastReadyGlow && (
        <div
          className={[
            'payout-toast-pending-glow-active',
            payoutPendingReadyEntryPulsing ? 'payout-toast-pending-ready-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
          data-testid="payout-toast-pending"
        />
      )}
      {toasts.map((t, i) => {
        const isPremiumTier = TIER_PREMIUM_TIERS.has(t.tierId);
        const isSyncEntryPulsing = syncEntryPulsingToastId === t.id;

        return (
        <div
          key={t.id}
          className={[
            'payout-toast',
            'payout-toast-synced',
            t.toastClass,
            `payout-tier-${t.tierId}-active`,
            syncEntryPulsingToastId === t.id ? 'payout-toast-sync-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            left: `${t.x}%`,
            animationDelay: `${i * 0.06}s`,
            '--payout-sync-delay': `${t.syncDelayMs ?? 0}ms`,
          }}
          data-testid="payout-toast"
        >
          <span
            className={[
              'payout-toast-spark',
              isPremiumTier ? 'payout-toast-spark-active' : '',
              payoutTierEntryPulseClass(t.tierId, 'entry-pulse', isSyncEntryPulsing),
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden
          />
          <span
            className={[
              'payout-toast-coins',
              isPremiumTier ? 'payout-toast-coins-active' : '',
              payoutTierEntryPulseClass(t.tierId, 'coins-entry-pulse', isSyncEntryPulsing),
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden
          >
            {[0, 1, 2, 3, 4, 5, 6].map((c) => (
              <i key={c} style={{ '--coin-i': c }} />
            ))}
          </span>
          <span className="payout-toast-sub">{t.sub}</span>
          <span className="payout-toast-amount">{t.label}</span>
        </div>
        );
      })}
    </div>
  );
}
