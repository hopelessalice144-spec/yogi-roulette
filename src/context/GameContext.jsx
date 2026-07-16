import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { evaluateBet, getColor } from '../lib/math.js';
import { placeChip, settleAll, totalStaked, CHIP_VALUES } from '../lib/bets.js';
import {
  claimFaucet,
  loadBalance,
  loadBets,
  saveBalance,
  saveBets,
} from '../lib/storage.js';
import {
  BALL_DROP_AT,
  BALL_PHYSICS_AT,
  BALL_MAGNET_AT,
  BALL_SETTLE_AT,
  getCycleId,
} from '@core/timer.js';
import { resolveGameState } from '../lib/gamePhase.js';
import { pocketIndexToNumber } from '../lib/wheel.js';
import { createPerformanceGuard, QUALITY_TIERS, resolveGodModeSettings } from '@core/performanceGuard.js';
import { applyRenderBudget, detectDeviceProfile } from '../core/performanceBudget.js';
import { createAudioEngine } from '../lib/audioSynth.js';
import { createFeedbackBridge } from '../lib/feedbackBridge.js';
import { loadFeedbackPrefs } from '../core/feedbackConfig.js';
import { impactShakeIntensity } from '../lib/cameraRig.js';
import { createHoverBridge } from '../lib/hoverBridge.js';
import { createGhostEngine } from '../lib/ghostPlayers.js';
import { wallClockSnapshot, computeBallKinematicSync, computeWheelAngleSync, missedSettleCycle } from '../lib/cycleResync.js';
import { createWatchdogJournal } from '../lib/physicsWatchdog.js';
import { resetRapierCache } from '../lib/rapierCache.js';
import {
  appendSessionRound,
  loadSessionRounds,
  saveSessionRounds,
} from '../lib/sessionStats.js';
import {
  createGameClock,
  resolveHudPhaseFromClock,
} from '../core/gameEngine.js';
import { betRejectionReason, createBetMutex, isBettingOpen } from '../core/betGate.js';
import {
  fairContextForCycle,
  hydrateFairRoundsFromStorage,
  listFairRoundHistory,
  outcomeForCycle,
  publicRoundCommit,
  restoreStoredFairnessAudit,
} from '../core/fairRoundStore.js';
import {
  isAuthorityEnabled,
  resolveAuthoritativeAudit,
  resolveAuthoritativeCommit,
  resolveAuthoritativeOutcome,
  fetchRemoteResult,
} from '../core/authorityClient.js';
import { auditSeedCustody, resolveSeedCustodyBadge } from '../core/authorityGuard.js';
import { createRealtimeHub } from '../core/realtimeHub.js';
import { SYNC_MODES } from '../core/rtProtocol.js';
import {
  clampBalance,
  MAX_TOTAL_STAKED,
  sanitizeBets,
  validateBetTarget,
  validateChipValue,
} from '../lib/betSchema.js';
import { StateIntegrityGuard } from '../lib/stateIntegrity.js';
import { sanitizeText } from '../lib/domSanitize.js';

const GameContext = createContext(null);

const MAX_RECENT = 8;

function hydrateSession() {
  const rounds = loadSessionRounds();
  return {
    rounds,
    recent: rounds.slice(0, MAX_RECENT).map((r) => ({
      number: r.number,
      color: r.color,
      net: r.net,
      cycleId: r.cycleId,
    })),
  };
}

const SESSION_BOOT = hydrateSession();

/** Authoritative cycle outcome — provably fair via committed server seed. */
function cycleTargetNumber(cycleId) {
  return outcomeForCycle(cycleId);
}

function mergeEngineClock(base) {
  const engine = createGameClock(base?.nowMs ?? Date.now());
  return Object.freeze({
    ...base,
    name: engine.name,
    cycleSecond: engine.cycleSecond,
    cycleId: engine.cycleId,
    secondsRemaining: engine.secondsRemaining,
    acceptsBets: engine.acceptsBets,
    betsLocked: engine.betsLocked,
    isSpinning: engine.isSpinning,
    ballDropped: engine.ballDropped,
    settling: engine.settling,
    nowMs: engine.nowMs,
  });
}

function mergeTickClock(tick) {
  const engine = createGameClock(tick.nowMs);
  return Object.freeze({
    ...engine,
    nowMs: tick.nowMs,
    cycleId: tick.cycleId,
    cycleSecond: tick.cycleSecond,
    name: tick.name,
    secondsRemaining: tick.secondsRemaining,
  });
}

export function GameProvider({ children }) {
  const integrityGuardRef = useRef(null);
  if (!integrityGuardRef.current) {
    integrityGuardRef.current = new StateIntegrityGuard();
    integrityGuardRef.current.signWallet(loadBalance(), loadBets());
  }
  const betMutexRef = useRef(null);
  if (!betMutexRef.current) {
    betMutexRef.current = createBetMutex();
  }
  const skipVerifyRef = useRef(true);

  const [balance, setBalance] = useState(loadBalance);
  const [bets, setBets] = useState(loadBets);
  const [securityFrozen, setSecurityFrozen] = useState(false);
  const [selectedChip, setSelectedChip] = useState(25);
  const [clock, setClock] = useState(() => mergeEngineClock(wallClockSnapshot()));
  const [winningNumber, setWinningNumber] = useState(null);
  const [winningColor, setWinningColor] = useState(null);
  const [revealedWinningNumber, setRevealedWinningNumber] = useState(null);
  const [revealedWinningColor, setRevealedWinningColor] = useState(null);
  const [message, setMessage] = useState('Place your bets.');
  const [lastWin, setLastWin] = useState(0);
  const [particleBurst, setParticleBurst] = useState(0);
  const [ballPhase, setBallPhase] = useState('orbit');
  const [wheelSpinSpeed, setWheelSpinSpeed] = useState(0.45);
  const [targetNumber, setTargetNumber] = useState(() => cycleTargetNumber(getCycleId()));
  const [fairnessCommit, setFairnessCommit] = useState(() => publicRoundCommit(getCycleId()));
  const [lastFairnessAudit, setLastFairnessAudit] = useState(null);
  const [syncMode, setSyncMode] = useState(SYNC_MODES.WALL_CLOCK);
  const [physicsLoadState, setPhysicsLoadState] = useState('idle');
  const [hoverHighlight, setHoverHighlightState] = useState(null);
  const [qualityTier, setQualityTier] = useState('high');
  const [settleFlash, setSettleFlash] = useState(false);
  const [sessionRounds, setSessionRounds] = useState(() => SESSION_BOOT.rounds);
  const [recentResults, setRecentResults] = useState(() => SESSION_BOOT.recent);
  const [audioMuted, setAudioMuted] = useState(() => loadFeedbackPrefs().audioMuted);
  const [liveFps, setLiveFps] = useState(60);
  const [ghostBets, setGhostBets] = useState([]);
  const [ghostConfetti, setGhostConfetti] = useState([]);
  const [godModeStep, setGodModeStep] = useState(0);
  const [simulationPaused, setSimulationPaused] = useState(false);
  const [fairRoundHistory, setFairRoundHistory] = useState([]);
  const seedCustodyBadge = useMemo(
    () => resolveSeedCustodyBadge(auditSeedCustody()),
    []
  );

  const pocketCandidate = useRef(null);
  const settledCycle = useRef(null);
  const betsRef = useRef(bets);
  const balanceRef = useRef(balance);
  const wheelAngleRef = useRef(0);
  const ballPosRef = useRef({ x: 0, y: 0.29, z: 1.15 });
  const ballVelRef = useRef({ x: 0, y: 0, z: 0 });
  const guideStrengthRef = useRef(0.65);
  const clockRef = useRef(clock);
  const ballPhaseRef = useRef(ballPhase);
  const targetNumberRef = useRef(targetNumber);
  const hoverHighlightRef = useRef(null);
  const shakeRef = useRef({ amount: 0 });
  const sparkQueueRef = useRef([]);
  const timeScaleRef = useRef(1);
  const cameraModeRef = useRef('lounge');
  const performanceGuardRef = useRef(null);
  const deviceProfileRef = useRef(detectDeviceProfile());
  const audioRef = useRef(null);
  const feedbackRef = useRef(null);
  const lastClockPhaseRef = useRef(null);
  const ghostEngineRef = useRef(null);
  const simulationPausedRef = useRef(false);
  const ballResyncRef = useRef({ token: 0, snapshot: null });
  const clockIntervalRef = useRef(null);
  const settleRoundRef = useRef(null);
  const pocketSettlePlayedRef = useRef(false);
  const revealTimerRef = useRef(null);
  const pendingRevealRef = useRef(null);
  const watchdogJournalRef = useRef(createWatchdogJournal());
  const wheelResyncRef = useRef({ token: 0, angle: 0 });
  const hiddenAtRef = useRef(null);
  const syncModeRef = useRef(syncMode);
  const realtimeHubRef = useRef(null);

  if (!performanceGuardRef.current) {
    performanceGuardRef.current = createPerformanceGuard(deviceProfileRef.current);
  }
  if (!audioRef.current) audioRef.current = createAudioEngine();
  if (!feedbackRef.current) {
    feedbackRef.current = createFeedbackBridge({
      audio: audioRef.current,
      initialPrefs: loadFeedbackPrefs(),
    });
  }
  if (!ghostEngineRef.current) ghostEngineRef.current = createGhostEngine();

  betsRef.current = bets;
  balanceRef.current = balance;
  clockRef.current = clock;
  ballPhaseRef.current = ballPhase;
  targetNumberRef.current = targetNumber;
  hoverHighlightRef.current = hoverHighlight;
  syncModeRef.current = syncMode;

  const applyClock = useCallback((next) => {
    clockRef.current = next;
    setClock(next);
    return next;
  }, []);

  const ensureAudioActive = useCallback(async () => {
    return audioRef.current?.ensureContextActive() ?? false;
  }, []);

  useEffect(() => {
    feedbackRef.current?.setAudioMuted(audioMuted);
  }, [audioMuted]);

  useEffect(() => {
    const prev = lastClockPhaseRef.current;
    if (prev !== clock.name) {
      feedbackRef.current?.onPhaseChange(prev, clock.name, clock.cycleSecond);
      lastClockPhaseRef.current = clock.name;
    }
  }, [clock.name, clock.cycleSecond]);

  simulationPausedRef.current = simulationPaused;

  const syncWallClock = useCallback((nowMs = Date.now()) => {
    const next = mergeEngineClock(wallClockSnapshot(nowMs));
    clockRef.current = next;
    setClock(next);

    const missed = missedSettleCycle(next, settledCycle.current, betsRef.current.length > 0);
    if (missed != null && settleRoundRef.current) {
      pocketCandidate.current = cycleTargetNumber(missed);
      settleRoundRef.current(missed);
    }

    const kinematic = computeBallKinematicSync(next, wheelAngleRef.current, wheelSpinSpeed);
    const wheelAngle = computeWheelAngleSync(next, wheelSpinSpeed);
    wheelAngleRef.current = wheelAngle;
    ballResyncRef.current = {
      token: ballResyncRef.current.token + 1,
      snapshot: kinematic,
    };
    wheelResyncRef.current = {
      token: ballResyncRef.current.token,
      angle: wheelAngle,
    };

    const state = resolveGameState(next);
    ballPhaseRef.current = state.ballPhase;
    cameraModeRef.current = state.cameraMode;
    timeScaleRef.current = state.timeScale;
    guideStrengthRef.current = state.guideStrength ?? 0.7;
    setBallPhase(state.ballPhase);
    setWheelSpinSpeed(state.wheelSpinSpeed);
    if (state.message) setMessage(state.message);

    return next;
  }, [wheelSpinSpeed]);

  const startClockTicker = useCallback(() => {
    if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    clockIntervalRef.current = setInterval(() => {
      if (simulationPausedRef.current) return;
      if (syncModeRef.current === SYNC_MODES.AUTHORITATIVE_STREAM) return;
      applyClock(mergeEngineClock(wallClockSnapshot()));
    }, 100);
  }, [applyClock]);

  useEffect(() => {
    realtimeHubRef.current = createRealtimeHub({
      onTick: (tick) => {
        if (simulationPausedRef.current) return;
        applyClock(mergeTickClock(tick));
      },
      onModeChange: (mode) => {
        syncModeRef.current = mode;
        setSyncMode(mode);
        if (mode === SYNC_MODES.WALL_CLOCK) {
          applyClock(mergeEngineClock(wallClockSnapshot()));
          startClockTicker();
        } else if (clockIntervalRef.current) {
          clearInterval(clockIntervalRef.current);
          clockIntervalRef.current = null;
        }
      },
    });
    startClockTicker();
    return () => {
      realtimeHubRef.current?.close();
      realtimeHubRef.current = null;
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    };
  }, [applyClock, startClockTicker]);

  useEffect(() => {
    const onVisibility = () => {
      const hidden = document.hidden;
      simulationPausedRef.current = hidden;
      setSimulationPaused(hidden);

      if (hidden) {
        hiddenAtRef.current = Date.now();
        if (clockIntervalRef.current) {
          clearInterval(clockIntervalRef.current);
          clockIntervalRef.current = null;
        }
        shakeRef.current.amount = 0;
        sparkQueueRef.current.length = 0;
        feedbackRef.current?.suspend?.();
        audioRef.current?.setRolling?.(0);
      } else {
        hiddenAtRef.current = null;
        syncWallClock(Date.now());
        startClockTicker();
        feedbackRef.current?.resume?.();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [syncWallClock, startClockTicker]);

  useEffect(() => {
    let cancelled = false;
    const cid = clock.cycleId;

    (async () => {
      const commit = await resolveAuthoritativeCommit(cid);
      if (!cancelled) setFairnessCommit(commit);
      fairContextForCycle(cid);

      if (!isAuthorityEnabled()) {
        const next = outcomeForCycle(cid);
        if (!cancelled) {
          setTargetNumber(next);
          targetNumberRef.current = next;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clock.cycleId]);

  useEffect(() => {
    if (!isAuthorityEnabled()) return;
    const { cycleId, cycleSecond, name } = clock;
    if (name !== 'spinning' || cycleSecond < BALL_DROP_AT) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await fetchRemoteResult(cycleId);
        if (!cancelled && Number.isInteger(result?.winningNumber)) {
          setTargetNumber(result.winningNumber);
          targetNumberRef.current = result.winningNumber;
        }
      } catch {
        /* authority may not have unlocked result yet */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clock.cycleId, clock.cycleSecond, clock.name]);

  useEffect(() => {
    const result = ghostEngineRef.current.tick(clock, winningNumber);
    setGhostBets(result.bets);
    setGhostConfetti(result.confetti);
  }, [clock, winningNumber]);

  useEffect(() => {
    const state = resolveGameState(clock);
    ballPhaseRef.current = state.ballPhase;
    cameraModeRef.current = state.cameraMode;
    timeScaleRef.current = state.timeScale;
    guideStrengthRef.current = state.guideStrength ?? 0.7;
    setBallPhase(state.ballPhase);
    setWheelSpinSpeed(state.wheelSpinSpeed);

    if (state.message) setMessage(state.message);

    if (clock.name === 'betting' && audioRef.current?.isActive) {
      feedbackRef.current?.setRolling(0.3);
    }
  }, [clock]);

  const persist = useCallback((bal, bts) => {
    saveBalance(clampBalance(bal));
    saveBets(sanitizeBets(bts));
  }, []);

  const commitWallet = useCallback(
    (bal, bts) => {
      const signed = integrityGuardRef.current.signWallet(bal, bts);
      skipVerifyRef.current = true;
      setSecurityFrozen(false);
      setBalance(signed.balance);
      setBets(signed.bets);
      betsRef.current = signed.bets;
      balanceRef.current = signed.balance;
      persist(signed.balance, signed.bets);
      return signed;
    },
    [persist]
  );

  useEffect(() => {
    if (skipVerifyRef.current) {
      skipVerifyRef.current = false;
      return;
    }
    const result = integrityGuardRef.current.verifyWallet(balance, bets);
    if (!result.ok) {
      setSecurityFrozen(true);
      skipVerifyRef.current = true;
      setBalance(result.balance);
      setBets(result.bets);
      betsRef.current = result.bets;
      balanceRef.current = result.balance;
      setMessage('Security hold — wallet state restored.');
    }
  }, [balance, bets]);

  const onPocketHit = useCallback((pocketIndex, number) => {
    pocketCandidate.current =
      number !== undefined ? number : pocketIndexToNumber(pocketIndex);
  }, []);

  const onWheelAngle = useCallback((angle) => {
    wheelAngleRef.current = angle;
  }, []);

  const onBallPosition = useCallback((pos) => {
    ballPosRef.current = pos;
  }, []);

  const hoverBridgeRef = useRef(null);
  if (!hoverBridgeRef.current) {
    hoverBridgeRef.current = createHoverBridge(hoverHighlightRef, setHoverHighlightState);
  }

  const setHoverHighlight = useCallback((highlight) => {
    const prev = hoverHighlightRef.current;
    if (
      prev?.type === highlight?.type &&
      prev?.value === highlight?.value &&
      prev?.color === highlight?.color
    ) {
      return;
    }
    hoverBridgeRef.current.push(highlight);
  }, []);

  const clearHoverHighlight = useCallback(() => {
    if (hoverHighlightRef.current === null) return;
    hoverBridgeRef.current.clear();
  }, []);

  const registerCollisionShake = useCallback((impactSpeed) => {
    const impulse = impactShakeIntensity(impactSpeed);
    shakeRef.current.amount = Math.max(shakeRef.current.amount, impulse);
    feedbackRef.current?.collision(impactSpeed);
  }, []);

  const emitSpark = useCallback((x, y, z, power = 1) => {
    sparkQueueRef.current.push({ x, y, z, power });
    if (sparkQueueRef.current.length > 40) sparkQueueRef.current.shift();
  }, []);

  const triggerSettleFlash = useCallback(() => {
    setSettleFlash(true);
    window.setTimeout(() => setSettleFlash(false), 420);
  }, []);

  const scheduleResultReveal = useCallback((result, color, delayMs = 280) => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    revealTimerRef.current = window.setTimeout(() => {
      setRevealedWinningNumber(result);
      setRevealedWinningColor(color);
      triggerSettleFlash();
      revealTimerRef.current = null;
    }, delayMs);
  }, [triggerSettleFlash]);

  /** T-0 pocket lock — wood thud + settle haptics (once per cycle). */
  const onBallPocketLock = useCallback(() => {
    if (pocketSettlePlayedRef.current) return;
    pocketSettlePlayedRef.current = true;
    const pos = ballPosRef.current;
    emitSpark(pos.x, pos.y + 0.03, pos.z, 1.12);
    feedbackRef.current?.settle();
    const pending = pendingRevealRef.current;
    if (pending) {
      scheduleResultReveal(pending.result, pending.color, 180);
    }
  }, [emitSpark, scheduleResultReveal]);

  const updateQualityTier = useCallback((tier, step = 0) => {
    setQualityTier((prev) => (prev === tier ? prev : tier));
    setGodModeStep((prev) => (prev === step ? prev : step));
  }, []);

  const updateLiveFps = useCallback((fps) => {
    setLiveFps((prev) => (Math.abs(prev - fps) < 2 ? prev : Math.round(fps)));
  }, []);

  const toggleAudio = useCallback(async () => {
    if (audioMuted) {
      await feedbackRef.current?.ensureActive();
    }
    const next = feedbackRef.current?.toggleAudio() ?? !audioMuted;
    setAudioMuted(next);
  }, [audioMuted]);

  const refreshFairRoundHistory = useCallback(() => {
    setFairRoundHistory(
      listFairRoundHistory()
        .filter((round) => round.revealed)
        .slice(0, 8)
    );
  }, []);

  const settleRound = useCallback(async (overrideCycleId) => {
    const activeClock = clockRef.current;
    const cycleId = overrideCycleId ?? activeClock.cycleId;
    if (settledCycle.current === cycleId) return;
    settledCycle.current = cycleId;

    const currentBets = sanitizeBets(betsRef.current);
    const result = await resolveAuthoritativeOutcome(cycleId);
    setLastFairnessAudit(await resolveAuthoritativeAudit(cycleId, result));
    refreshFairRoundHistory();

    const color = getColor(result);
    setWinningNumber(result);
    setWinningColor(color);
    pendingRevealRef.current = { result, color };
    const revealDelay = pocketSettlePlayedRef.current ? 140 : 480;
    scheduleResultReveal(result, color, revealDelay);

    const pos = ballPosRef.current;
    if (!pocketSettlePlayedRef.current) {
      registerCollisionShake(0.75);
      emitSpark(pos.x, pos.y + 0.03, pos.z, 1.15);
      feedbackRef.current?.settle();
      pocketSettlePlayedRef.current = true;
    } else {
      audioRef.current?.setRolling(0);
    }

    const risked = totalStaked(currentBets);
    const returned = settleAll(currentBets, result, evaluateBet);
    const net = returned - risked;

    const roundEntry = { number: result, color, net, cycleId, risked };
    setRecentResults((prev) => [roundEntry, ...prev.slice(0, MAX_RECENT - 1)]);
    setSessionRounds((prev) => {
      const next = appendSessionRound(prev, roundEntry);
      saveSessionRounds(next);
      return next;
    });

    commitWallet(clampBalance(balanceRef.current + returned), []);
    ballPhaseRef.current = 'orbit';
    setBallPhase('orbit');
    cameraModeRef.current = 'lounge';
    timeScaleRef.current = 1;
    setWheelSpinSpeed(0.42);

    if (returned > 0) {
      setLastWin(net);
      setParticleBurst((n) => n + 1);
      feedbackRef.current?.win();
      setMessage(`Winner ${result} (${color})! Net ${net >= 0 ? '+' : ''}$${net}`);
    } else if (risked > 0) {
      setLastWin(0);
      setMessage(`Ball on ${result} (${color}). Lost $${risked}.`);
    } else {
      setMessage(`Ball settled on ${result} (${color}).`);
    }
  }, [commitWallet, registerCollisionShake, emitSpark, scheduleResultReveal, refreshFairRoundHistory]);

  settleRoundRef.current = settleRound;

  useEffect(() => {
    if (clock.cycleSecond === 0) {
      pocketSettlePlayedRef.current = false;
      if (clock.name === 'betting') {
        setWinningNumber(null);
        setWinningColor(null);
        setRevealedWinningNumber(null);
        setRevealedWinningColor(null);
        pendingRevealRef.current = null;
        if (revealTimerRef.current) {
          clearTimeout(revealTimerRef.current);
          revealTimerRef.current = null;
        }
      }
    }
  }, [clock.cycleSecond, clock.name]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const { cycleSecond, cycleId } = clock;
    if (cycleSecond === BALL_SETTLE_AT && settledCycle.current !== cycleId) {
      settleRound();
    }
    if (cycleSecond === 0) {
      pocketCandidate.current = null;
    }
  }, [clock, settleRound]);

  const selectChip = useCallback(async (value) => {
    await audioRef.current?.ensureContextActive();
    if (!validateChipValue(value)) return;
    setSelectedChip(value);
  }, []);

  const placeBet = useCallback(
    async (target) => {
      const mutex = betMutexRef.current;
      if (!mutex.tryAcquire()) return;

      try {
        let rejectReason = betRejectionReason(clockRef.current);
        if (rejectReason) {
          setMessage(rejectReason);
          return;
        }

        await audioRef.current?.ensureContextActive();

        rejectReason = betRejectionReason(clockRef.current, Date.now());
        if (rejectReason) {
          setMessage(rejectReason);
          return;
        }

        if (securityFrozen || integrityGuardRef.current.isFrozen()) {
          setMessage('Security hold — betting disabled.');
          return;
        }
        if (!isBettingOpen(clockRef.current, Date.now())) {
          setMessage('Bets locked.');
          return;
        }
        if (!validateBetTarget(target)) {
          setMessage('Invalid bet.');
          return;
        }
        if (!validateChipValue(selectedChip)) {
          setMessage('Invalid chip.');
          return;
        }
        if (selectedChip > balance) {
          setMessage('Insufficient balance.');
          return;
        }
        if (totalStaked(bets) + selectedChip > MAX_TOTAL_STAKED) {
          setMessage('Table limit reached.');
          return;
        }
        const nextBets = placeChip(bets, target, selectedChip);
        if (nextBets === bets) {
          setMessage('Bet rejected.');
          return;
        }
        if (!isBettingOpen(clockRef.current, Date.now())) {
          setMessage('Bets locked.');
          return;
        }
        const nextBal = clampBalance(balance - selectedChip);
        commitWallet(nextBal, nextBets);
        await feedbackRef.current?.chipPlace();
        setMessage(`+$${selectedChip} on ${target.type}${target.value ?? ''}`);
      } finally {
        mutex.release();
      }
    },
    [balance, bets, commitWallet, securityFrozen, selectedChip]
  );

  const clearBets = useCallback(() => {
    if (!isBettingOpen(clockRef.current) || securityFrozen) return;
    const safeBets = sanitizeBets(bets);
    const refund = totalStaked(safeBets);
    const nextBal = clampBalance(balance + refund);
    commitWallet(nextBal, []);
    setMessage(refund ? `Refunded $${refund}.` : 'No bets to clear.');
  }, [balance, bets, commitWallet, securityFrozen]);

  const requestFaucet = useCallback(() => {
    if (securityFrozen) {
      setMessage('Security hold — faucet disabled.');
      return;
    }
    const result = claimFaucet(balance);
    if (!result.claimed) {
      setMessage(sanitizeText(result.reason || 'Faucet unavailable.'));
      return;
    }
    const nextBal = clampBalance(result.balance);
    commitWallet(nextBal, bets);
    setMessage(`Free refill +$${result.amount}!`);
  }, [balance, bets, commitWallet, securityFrozen]);

  const qualitySettings = applyRenderBudget(
    resolveGodModeSettings(QUALITY_TIERS[qualityTier] ?? QUALITY_TIERS.high, godModeStep),
    qualityTier,
    deviceProfileRef.current
  );

  const hudPhase = useMemo(() => resolveHudPhaseFromClock(clock), [clock]);

  const recoverWebGLContext = useCallback(() => {
    resetRapierCache();
    setPhysicsLoadState('idle');
  }, []);

  useEffect(() => {
    void hydrateFairRoundsFromStorage().then(() => {
      refreshFairRoundHistory();
      const restored = restoreStoredFairnessAudit(getCycleId());
      if (restored?.verified) setLastFairnessAudit(restored);
    });
  }, [refreshFairRoundHistory]);

  useEffect(() => {
    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      sparkQueueRef.current.length = 0;
      audioRef.current?.destroy?.();
      audioRef.current = null;
    };
  }, []);

  const value = useMemo(
    () => ({
      balance,
      bets,
      selectedChip,
      setSelectedChip: selectChip,
      ensureAudioActive,
      clock,
      winningNumber,
      winningColor,
      revealedWinningNumber,
      revealedWinningColor,
      message,
      lastWin,
      particleBurst,
      ballPhase,
      wheelSpinSpeed,
      targetNumber,
      hoverHighlight,
      qualityTier,
      qualitySettings,
      settleFlash,
      recentResults,
      sessionRounds,
      audioMuted,
      liveFps,
      godModeStep,
      ghostBets,
      ghostConfetti,
      hudPhase,
      fairnessCommit,
      lastFairnessAudit,
      fairRoundHistory,
      syncMode,
      seedCustodyBadge,
      physicsLoadState,
      setPhysicsLoadState,
      securityFrozen,
      simulationPaused,
      simulationPausedRef,
      ballResyncRef,
      wheelResyncRef,
      watchdogJournalRef,
      wheelAngleRef,
      ballPosRef,
      ballVelRef,
      guideStrengthRef,
      clockRef,
      ballPhaseRef,
      targetNumberRef,
      hoverHighlightRef,
      shakeRef,
      sparkQueueRef,
      timeScaleRef,
      cameraModeRef,
      performanceGuardRef,
      audioRef,
      feedbackRef,
      chipValues: CHIP_VALUES,
      feedbackChipHover: () => feedbackRef.current?.chipHover(),
      placeBet,
      clearBets,
      requestFaucet,
      setHoverHighlight,
      clearHoverHighlight,
      registerCollisionShake,
      onBallPocketLock,
      emitSpark,
      updateQualityTier,
      updateLiveFps,
      toggleAudio,
      onPocketHit,
      onWheelAngle,
      onBallPosition,
      recoverWebGLContext,
    }),
    [
      balance,
      bets,
      selectedChip,
      selectChip,
      ensureAudioActive,
      clock,
      winningNumber,
      winningColor,
      revealedWinningNumber,
      revealedWinningColor,
      message,
      lastWin,
      particleBurst,
      ballPhase,
      wheelSpinSpeed,
      targetNumber,
      hoverHighlight,
      qualityTier,
      qualitySettings,
      settleFlash,
      recentResults,
      sessionRounds,
      audioMuted,
      liveFps,
      godModeStep,
      ghostBets,
      ghostConfetti,
      hudPhase,
      fairnessCommit,
      lastFairnessAudit,
      fairRoundHistory,
      syncMode,
      seedCustodyBadge,
      physicsLoadState,
      setPhysicsLoadState,
      securityFrozen,
      simulationPaused,
      placeBet,
      clearBets,
      requestFaucet,
      ensureAudioActive,
      setHoverHighlight,
      clearHoverHighlight,
      registerCollisionShake,
      onBallPocketLock,
      emitSpark,
      updateQualityTier,
      updateLiveFps,
      toggleAudio,
      onPocketHit,
      onWheelAngle,
      onBallPosition,
      recoverWebGLContext,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame requires GameProvider');
  return ctx;
}
