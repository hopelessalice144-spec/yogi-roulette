import { useEffect, useMemo, useRef, useState } from 'react';
import { betLockCountdown } from '../lib/betLockCountdown.js';
import { shouldLockCountdownUrgentEntryPulse } from '../lib/lockCountdownUrgentEntryPulse.js';
import { shouldPhaseCountdownEntryPulse } from '../lib/phaseCountdownEntryPulse.js';
import { shouldBettingPhasePillGlow } from '../lib/bettingPhasePillGlow.js';
import { shouldBettingPhasePillEntryPulse } from '../lib/bettingPhasePillEntryPulse.js';
import { shouldLockPhasePillUrgency } from '../lib/lockPhasePillUrgency.js';
import { shouldLockPhasePillUrgencyEntryPulse } from '../lib/lockPhasePillUrgencyEntryPulse.js';
import { shouldPhaseLabelEntryPulse } from '../lib/phaseLabelEntryPulse.js';
import { shouldSpinPhasePillGlow } from '../lib/spinPhasePillGlow.js';
import { shouldSpinPhasePillEntryPulse } from '../lib/spinPhasePillEntryPulse.js';

const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;

/**
 * HUD phase pill with optional circular countdown ring during betting.
 */
export function PhasePill({ clock, phaseLabel }) {
  const prevLabelRef = useRef(phaseLabel);
  const [labelEntryPulsing, setLabelEntryPulsing] = useState(false);
  const countdown = useMemo(
    () => betLockCountdown(clock.cycleSecond, clock.name),
    [clock.cycleSecond, clock.name],
  );

  useEffect(() => {
    const prevLabel = prevLabelRef.current;
    prevLabelRef.current = phaseLabel;
    if (!shouldPhaseLabelEntryPulse(prevLabel, phaseLabel)) return undefined;
    setLabelEntryPulsing(true);
    const timer = window.setTimeout(() => setLabelEntryPulsing(false), 580);
    return () => window.clearTimeout(timer);
  }, [phaseLabel]);

  const lockUrgent = shouldLockPhasePillUrgency(clock.name);
  const bettingGlow = shouldBettingPhasePillGlow(clock.name);
  const spinGlow = shouldSpinPhasePillGlow(clock.name);
  const prevBettingGlowRef = useRef(false);
  const [bettingPhaseEntryPulsing, setBettingPhaseEntryPulsing] = useState(false);
  const prevLockUrgentRef = useRef(false);
  const [lockPhaseUrgencyEntryPulsing, setLockPhaseUrgencyEntryPulsing] = useState(false);
  const prevSpinGlowRef = useRef(false);
  const [spinPhaseEntryPulsing, setSpinPhaseEntryPulsing] = useState(false);
  const prevCountdownUrgentRef = useRef(false);
  const [countdownUrgentEntryPulsing, setCountdownUrgentEntryPulsing] = useState(false);
  const prevCountdownActiveRef = useRef(false);
  const [phaseCountdownEntryPulsing, setPhaseCountdownEntryPulsing] = useState(false);

  useEffect(() => {
    const prevBettingGlow = prevBettingGlowRef.current;
    prevBettingGlowRef.current = bettingGlow;
    if (!shouldBettingPhasePillEntryPulse(prevBettingGlow, bettingGlow)) return undefined;
    setBettingPhaseEntryPulsing(true);
    const timer = window.setTimeout(() => setBettingPhaseEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [bettingGlow]);

  useEffect(() => {
    const prevLockUrgent = prevLockUrgentRef.current;
    prevLockUrgentRef.current = lockUrgent;
    if (!shouldLockPhasePillUrgencyEntryPulse(prevLockUrgent, lockUrgent)) return undefined;
    setLockPhaseUrgencyEntryPulsing(true);
    const timer = window.setTimeout(() => setLockPhaseUrgencyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [lockUrgent]);

  useEffect(() => {
    const prevSpinGlow = prevSpinGlowRef.current;
    prevSpinGlowRef.current = spinGlow;
    if (!shouldSpinPhasePillEntryPulse(prevSpinGlow, spinGlow)) return undefined;
    setSpinPhaseEntryPulsing(true);
    const timer = window.setTimeout(() => setSpinPhaseEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [spinGlow]);

  useEffect(() => {
    const prevCountdownUrgent = prevCountdownUrgentRef.current;
    prevCountdownUrgentRef.current = countdown.urgent;
    if (!shouldLockCountdownUrgentEntryPulse(prevCountdownUrgent, countdown.urgent)) return undefined;
    setCountdownUrgentEntryPulsing(true);
    const timer = window.setTimeout(() => setCountdownUrgentEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [countdown.urgent]);

  useEffect(() => {
    const prevCountdownActive = prevCountdownActiveRef.current;
    prevCountdownActiveRef.current = countdown.active;
    if (!shouldPhaseCountdownEntryPulse(prevCountdownActive, countdown.active)) return undefined;
    setPhaseCountdownEntryPulsing(true);
    const timer = window.setTimeout(() => setPhaseCountdownEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [countdown.active]);

  const wrapClass = [
    'phase-pill-wrap',
    countdown.active ? 'has-countdown' : '',
    phaseCountdownEntryPulsing ? 'phase-countdown-entry-pulse' : '',
    countdown.urgent ? 'countdown-urgent-active' : '',
    countdownUrgentEntryPulsing ? 'countdown-urgent-entry-pulse' : '',
    bettingGlow ? 'betting-phase-glow-active' : '',
    bettingPhaseEntryPulsing ? 'betting-phase-entry-pulse' : '',
    lockUrgent ? 'lock-phase-urgency-active' : '',
    lockPhaseUrgencyEntryPulsing ? 'lock-phase-urgency-entry-pulse' : '',
    spinGlow ? 'spin-phase-glow-active' : '',
    spinPhaseEntryPulsing ? 'spin-phase-entry-pulse' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapClass}>
      {countdown.active && (
        <svg className="phase-countdown-ring" viewBox="0 0 64 64" aria-hidden>
          <circle className="phase-countdown-track" cx="32" cy="32" r={RING_R} fill="none" />
          <circle
            className="phase-countdown-progress"
            cx="32"
            cy="32"
            r={RING_R}
            fill="none"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - countdown.remaining)}
            transform="rotate(-90 32 32)"
          />
        </svg>
      )}
      <div
        className={`phase-pill phase-${clock.name}`}
        data-testid="phase-pill"
        aria-label={
          countdown.active
            ? `Betting phase, ${countdown.secondsLeft} seconds until lock`
            : undefined
        }
      >
        <span className="phase-status-dot" aria-hidden />
        <span className="phase-copy">
          <strong>
            {clock.name === 'betting'
              ? 'Bets open'
              : clock.name === 'locked'
                ? 'Bets closed'
                : 'Wheel live'}
          </strong>
          <span className={labelEntryPulsing ? 'phase-label-entry-pulse' : ''}>{phaseLabel}</span>
        </span>
        <span className="phase-time">
          {countdown.active ? countdown.secondsLeft : Math.max(0, 30 - Math.floor(clock.cycleSecond))}
          <small>s</small>
        </span>
      </div>
    </div>
  );
}
