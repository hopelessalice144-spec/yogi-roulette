import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getColor } from '../lib/math.js';
import { CYCLE_SECONDS, BALL_DROP_AT } from '@core/timer.js';
import {
  boardHighlightSet,
  isOutsideSource,
  isStraightPathwayLit,
} from '../lib/highlight.js';
import { validateBetTarget } from '../lib/betSchema.js';
import { visibleChipStack } from '../lib/chipVisual.js';
import {
  applyChipMagnet,
  clearCellSpotlight,
  MAGNET_RADIUS,
  resetChipMagnet,
  SPATIAL_SPRING,
  updateCellSpotlight,
} from '../lib/spatialUx.js';
import { useGame } from '../context/GameContext.jsx';
import { usePortraitMobile } from '../hooks/usePortraitMobile.js';
import { stakeRiskLevel } from '../lib/stakeRisk.js';
import {
  shouldDimBettingPanel,
  spinFocusCssVars,
  spinFocusDimLevel,
} from '../lib/spinFocusDim.js';
import { resultPillRevealKey, shouldResultPillFlyIn } from '../lib/resultPillFlyIn.js';
import { shouldResultPillReadyGlow } from '../lib/resultPillReadyGlow.js';
import { shouldResultPillReadyEntryPulse } from '../lib/resultPillReadyEntryPulse.js';
import {
  settleRevealHeaderBloomKey,
} from '../lib/settleRevealHeaderBloom.js';
import {
  buildWinningCascadeMap,
  cellIsWinningBet,
  winningCellCascadeDelay,
} from '../lib/winningCellCascade.js';
import { shouldChipRackSelectEntryPulse } from '../lib/chipRackSelectEntryPulse.js';
import { shouldChipSelectEntryPulse } from '../lib/chipSelectEntryPulse.js';
import { shouldStatusLineEntryPulse } from '../lib/statusLineEntryPulse.js';
import { shouldStatusLineReadyGlow } from '../lib/statusLineReadyGlow.js';
import { shouldStatusLineReadyEntryPulse } from '../lib/statusLineReadyEntryPulse.js';
import { shouldFaucetReadyGlow } from '../lib/faucetReadyGlow.js';
import { shouldFaucetReadyEntryPulse } from '../lib/faucetReadyEntryPulse.js';
import { shouldBalanceLowGlow } from '../lib/balanceLowGlow.js';
import { shouldBalanceLowEntryPulse } from '../lib/balanceLowEntryPulse.js';
import { shouldBalanceSettleLossEntryPulse } from '../lib/balanceSettleLossEntryPulse.js';
import { shouldBalanceSettleWinEntryPulse } from '../lib/balanceSettleWinEntryPulse.js';
import { stakedLabelEntryPulseKey } from '../lib/stakedLabelEntryPulse.js';
import { shouldStakeCommitEntryPulse } from '../lib/stakeCommitEntryPulse.js';
import { shouldBatchStakeEntryPulse } from '../lib/batchStakeEntryPulse.js';
import { shouldRepeatRoundEntryPulse } from '../lib/repeatRoundEntryPulse.js';
import { shouldFavoriteApplyEntryPulse } from '../lib/favoriteApplyEntryPulse.js';
import { shouldScaleBoardEntryPulse } from '../lib/scaleBoardEntryPulse.js';
import { shouldDrawerMetaEntryPulse } from '../lib/drawerMetaEntryPulse.js';
import { shouldRepeatReadyGlow } from '../lib/repeatReadyGlow.js';
import { shouldRepeatRoundReadyEntryPulse } from '../lib/repeatRoundReadyEntryPulse.js';
import { shouldUndoReadyGlow } from '../lib/undoReadyGlow.js';
import { shouldUndoRoundReadyEntryPulse } from '../lib/undoRoundReadyEntryPulse.js';
import { shouldScaleReadyGlow } from '../lib/scaleReadyGlow.js';
import { shouldScaleReadyEntryPulse } from '../lib/scaleReadyEntryPulse.js';
import { shouldClearReadyGlow } from '../lib/clearReadyGlow.js';
import { shouldClearReadyEntryPulse } from '../lib/clearReadyEntryPulse.js';
import { shouldChipRackBettingGlow } from '../lib/chipRackBettingGlow.js';
import { shouldChipRackBettingGlowEntryPulse } from '../lib/chipRackBettingGlowEntryPulse.js';
import { shouldBoardModeTabGlow } from '../lib/boardModeTabGlow.js';
import { shouldBoardModeTabReadyEntryPulse } from '../lib/boardModeTabReadyEntryPulse.js';
import { shouldMobileDrawerOpenGlow } from '../lib/mobileDrawerOpenGlow.js';
import { shouldMobileDrawerTabEntryPulse } from '../lib/mobileDrawerTabEntryPulse.js';
import { shouldMobileDrawerOpenEntryPulse } from '../lib/mobileDrawerOpenEntryPulse.js';
import { shouldMobileDrawerCollapseEntryPulse } from '../lib/mobileDrawerCollapseEntryPulse.js';
import { shouldCycleDropUrgency } from '../lib/cycleDropUrgency.js';
import { shouldCycleDropUrgencyEntryPulse } from '../lib/cycleDropUrgencyEntryPulse.js';
import { shouldSpinFocusEntryPulse } from '../lib/spinFocusEntryPulse.js';
import { shouldSpinDimSoftEntryPulse } from '../lib/spinDimSoftEntryPulse.js';
import { shouldSettleRevealEntryPulse } from '../lib/settleRevealEntryPulse.js';
import { shouldWinningCellCascadeEntryPulse } from '../lib/winningCellCascadeEntryPulse.js';
import { shouldPathwayLitEntryPulse } from '../lib/pathwayLitEntryPulse.js';
import { shouldPathwaySourceEntryPulse } from '../lib/pathwaySourceEntryPulse.js';
import { shouldChipLandedEntryPulse } from '../lib/chipLandedEntryPulse.js';
import { shouldRepeatFlashEntryPulse } from '../lib/repeatFlashEntryPulse.js';
import { shouldChipUndoRecoilEntryPulse } from '../lib/chipUndoRecoilEntryPulse.js';
import { shouldChipUndoClearEntryPulse } from '../lib/chipUndoClearEntryPulse.js';
import { shouldDropTargetEntryPulse } from '../lib/dropTargetEntryPulse.js';
import { shouldSettleHeaderBloomEntryPulse } from '../lib/settleHeaderBloomEntryPulse.js';
import { shouldStakeRiskEntryPulse } from '../lib/stakeRiskEntryPulse.js';
import { shouldCycleTrackTickEntryPulse } from '../lib/cycleTrackTickEntryPulse.js';
import APP_CONFIG from '@core/config.js';
import { GhostChipStack, GhostConfettiBurst } from './GhostBetLayer.jsx';
import { FairnessPanel } from './FairnessPanel.jsx';
import { SessionStatsPanel } from './SessionStatsPanel.jsx';
import { RecentResultsRail } from './RecentResultsRail.jsx';
import { FavoriteBetsPanel } from './FavoriteBetsPanel.jsx';
import { RacetrackPanel } from './RacetrackPanel.jsx';
import { ChipDragLayer } from './ChipDragLayer.jsx'; // chip-drag-ghost + motion trail
import { buildInsideBetZones, insideZoneStyle } from '../lib/insideBets.js';

const INSIDE_BET_TYPES = new Set(['split', 'street', 'corner', 'line']);

const OUTSIDE = [
  { type: 'dozen', value: 1, label: '1st 12' },
  { type: 'dozen', value: 2, label: '2nd 12' },
  { type: 'dozen', value: 3, label: '3rd 12' },
  { type: 'low', label: '1–18' },
  { type: 'even', label: 'EVEN' },
  { type: 'red', label: 'RED', color: 'red' },
  { type: 'black', label: 'BLACK', color: 'black' },
  { type: 'odd', label: 'ODD' },
  { type: 'high', label: '19–36' },
];

const ELASTIC_SPRING = '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
const CHIP_SPRING = ELASTIC_SPRING;
const SPRING_PREMIUM = '0.3s cubic-bezier(0.25, 1, 0.5, 1)';

function parseBetTarget(el) {
  if (!el?.dataset?.betType) return null;
  const type = el.dataset.betType;
  const raw = el.dataset.betValue;
  const target = {
    type,
    value:
      raw === '' || raw === undefined
        ? undefined
        : INSIDE_BET_TYPES.has(type)
          ? raw
          : Number.isNaN(Number(raw))
            ? raw || undefined
            : Number(raw),
    color: el.dataset.betColor || undefined,
  };
  return validateBetTarget(target) ? target : null;
}

function cellIsWinner(type, value, winningNumber) {
  return cellIsWinningBet(type, value, winningNumber);
}

function ChipStack({ amount, justPlaced }) {
  const { layers, overflow } = useMemo(() => visibleChipStack(amount), [amount]);
  if (layers.length === 0) return null;

  return (
    <span className={`chip-stack ${justPlaced ? 'chip-placed-bounce' : ''}`} aria-label={`$${amount} staked`}>
      {layers.map((val, i) => (
        <span
          key={`${i}-${val}`}
          className="stack-chip"
          style={{ '--stack-i': i, '--stack-n': layers.length }}
        >
          <span className="stack-chip-face">{val >= 100 ? '···' : `$${val}`}</span>
        </span>
      ))}
      {overflow > 0 && <span className="stack-overflow">+{overflow}</span>}
      <em className="chip-total">${amount}</em>
    </span>
  );
}

function BetBtn({
  type,
  value,
  label,
  color,
  amount,
  pathwayClass = '',
  isDropTarget = false,
  isWinning = false,
  cascadeDelayMs,
  cascadeEntryPulse = false,
  justPlaced = false,
  justUndoneRecoil = false,
  justUndoneClear = false,
  undoRecoilAmount = 0,
  justRepeated = false,
  ghostBets = [],
  onClick,
  onMagnetMove,
  disabled,
  fullQuality = true,
}) {
  const isPathwayLit = pathwayClass === 'pathway-lit-active';
  const prevPathwayLitRef = useRef(false);
  const [pathwayLitEntryPulsing, setPathwayLitEntryPulsing] = useState(false);
  const isPathwaySource = pathwayClass === 'pathway-source-active';
  const prevPathwaySourceRef = useRef(false);
  const [pathwaySourceEntryPulsing, setPathwaySourceEntryPulsing] = useState(false);
  const prevJustPlacedRef = useRef(false);
  const [chipLandedEntryPulsing, setChipLandedEntryPulsing] = useState(false);
  const prevJustRepeatedRef = useRef(false);
  const [repeatFlashEntryPulsing, setRepeatFlashEntryPulsing] = useState(false);
  const prevJustUndoneRecoilRef = useRef(false);
  const [chipUndoRecoilEntryPulsing, setChipUndoRecoilEntryPulsing] = useState(false);
  const prevJustUndoneClearRef = useRef(false);
  const [chipUndoClearEntryPulsing, setChipUndoClearEntryPulsing] = useState(false);
  const prevIsDropTargetRef = useRef(false);
  const [dropTargetEntryPulsing, setDropTargetEntryPulsing] = useState(false);
  const prevBetHoverActiveRef = useRef(false);
  const [betHoverActive, setBetHoverActive] = useState(false);
  const [betHoverEntryPulsing, setBetHoverEntryPulsing] = useState(false);

  useEffect(() => {
    const prevPathwayLit = prevPathwayLitRef.current;
    prevPathwayLitRef.current = isPathwayLit;
    if (shouldPathwayLitEntryPulse(prevPathwayLit, isPathwayLit)) {
      setPathwayLitEntryPulsing(true);
      const timer = window.setTimeout(() => setPathwayLitEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!isPathwayLit) {
      setPathwayLitEntryPulsing(false);
    }
    return undefined;
  }, [isPathwayLit]);

  useEffect(() => {
    const prevPathwaySource = prevPathwaySourceRef.current;
    prevPathwaySourceRef.current = isPathwaySource;
    if (shouldPathwaySourceEntryPulse(prevPathwaySource, isPathwaySource)) {
      setPathwaySourceEntryPulsing(true);
      const timer = window.setTimeout(() => setPathwaySourceEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!isPathwaySource) {
      setPathwaySourceEntryPulsing(false);
    }
    return undefined;
  }, [isPathwaySource]);

  useEffect(() => {
    const prevJustPlaced = prevJustPlacedRef.current;
    prevJustPlacedRef.current = justPlaced;
    if (shouldChipLandedEntryPulse(prevJustPlaced, justPlaced)) {
      setChipLandedEntryPulsing(true);
      const timer = window.setTimeout(() => setChipLandedEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!justPlaced) {
      setChipLandedEntryPulsing(false);
    }
    return undefined;
  }, [justPlaced]);

  useEffect(() => {
    const prevJustRepeated = prevJustRepeatedRef.current;
    prevJustRepeatedRef.current = justRepeated;
    if (shouldRepeatFlashEntryPulse(prevJustRepeated, justRepeated)) {
      setRepeatFlashEntryPulsing(true);
      const timer = window.setTimeout(() => setRepeatFlashEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!justRepeated) {
      setRepeatFlashEntryPulsing(false);
    }
    return undefined;
  }, [justRepeated]);

  useEffect(() => {
    const prevJustUndoneRecoil = prevJustUndoneRecoilRef.current;
    prevJustUndoneRecoilRef.current = justUndoneRecoil;
    if (shouldChipUndoRecoilEntryPulse(prevJustUndoneRecoil, justUndoneRecoil)) {
      setChipUndoRecoilEntryPulsing(true);
      const timer = window.setTimeout(() => setChipUndoRecoilEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!justUndoneRecoil) {
      setChipUndoRecoilEntryPulsing(false);
    }
    return undefined;
  }, [justUndoneRecoil]);

  useEffect(() => {
    const prevJustUndoneClear = prevJustUndoneClearRef.current;
    prevJustUndoneClearRef.current = justUndoneClear;
    if (shouldChipUndoClearEntryPulse(prevJustUndoneClear, justUndoneClear)) {
      setChipUndoClearEntryPulsing(true);
      const timer = window.setTimeout(() => setChipUndoClearEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!justUndoneClear) {
      setChipUndoClearEntryPulsing(false);
    }
    return undefined;
  }, [justUndoneClear]);

  useEffect(() => {
    const prevIsDropTarget = prevIsDropTargetRef.current;
    prevIsDropTargetRef.current = isDropTarget;
    if (shouldDropTargetEntryPulse(prevIsDropTarget, isDropTarget)) {
      setDropTargetEntryPulsing(true);
      const timer = window.setTimeout(() => setDropTargetEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!isDropTarget) {
      setDropTargetEntryPulsing(false);
    }
    return undefined;
  }, [isDropTarget]);

  useEffect(() => {
    const prevBetHoverActive = prevBetHoverActiveRef.current;
    prevBetHoverActiveRef.current = betHoverActive;
    if (!prevBetHoverActive && betHoverActive) {
      setBetHoverEntryPulsing(true);
      const timer = window.setTimeout(() => setBetHoverEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!betHoverActive) {
      setBetHoverEntryPulsing(false);
    }
    return undefined;
  }, [betHoverActive]);

  const handleMove = (e) => {
    const el = e.currentTarget;
    updateCellSpotlight(el, e.clientX, e.clientY);
    const rect = el.getBoundingClientRect();
    onMagnetMove?.({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
  };

  const handleEnter = () => {
    if (!disabled) setBetHoverActive(true);
  };

  const handleLeave = (e) => {
    setBetHoverActive(false);
    clearCellSpotlight(e.currentTarget);
  };

  return (
    <button
      type="button"
      className={[
        'bet-cell',
        color || '',
        amount ? 'has-chip' : '',
        pathwayClass,
        pathwayLitEntryPulsing ? 'pathway-lit-entry-pulse' : '',
        pathwaySourceEntryPulsing ? 'pathway-source-entry-pulse' : '',
        isDropTarget ? 'drop-target-active' : '',
        dropTargetEntryPulsing ? 'drop-target-entry-pulse' : '',
        isWinning ? 'winning-cell-active' : '',
        isWinning && cascadeDelayMs != null ? 'winning-cascade-active' : '',
        cascadeEntryPulse ? 'winning-cascade-entry-pulse' : '',
        chipLandedEntryPulsing ? 'chip-landed-entry-pulse' : '',
        chipUndoRecoilEntryPulsing ? 'chip-undone-recoil-entry-pulse' : '',
        chipUndoClearEntryPulsing ? 'chip-undone-clear-entry-pulse' : '',
        repeatFlashEntryPulsing ? 'repeat-flash-entry-pulse' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-bet-type={type}
      data-bet-value={value ?? ''}
      data-bet-color={color ?? ''}
      style={cascadeDelayMs != null ? { '--cascade-delay': `${cascadeDelayMs}ms` } : undefined}
      disabled={disabled}
      onClick={() => onClick({ type, value })}
      onMouseEnter={handleEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      aria-label={
        amount > 0
          ? `Bet on ${label ?? value}, $${amount} staked`
          : `Bet on ${label ?? value}`
      }
    >
      <span
        className={[
          'bet-spotlight-active',
          betHoverEntryPulsing ? 'bet-spotlight-entry-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      />
      <span
        className={[
          'bet-glow-casing-active',
          betHoverEntryPulsing ? 'bet-glow-casing-entry-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      />
      <span
        className={[
          'bet-shine-active',
          betHoverEntryPulsing ? 'bet-shine-entry-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      />
      <span
        className={[
          'bet-glass-depth-active',
          betHoverEntryPulsing ? 'bet-glass-depth-entry-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      />
      <span
        className={[
          isPathwayLit || isPathwaySource ? 'sector-glow-active' : '',
          pathwayLitEntryPulsing || pathwaySourceEntryPulsing ? 'sector-glow-entry-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      />
      {isWinning && <span className="winning-ripple" aria-hidden />}
      <span className="bet-label">{label ?? value}</span>
      <span
        className={[
          'neon-underline-active',
          pathwaySourceEntryPulsing ? 'neon-underline-entry-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      />
      {justUndoneClear && undoRecoilAmount > 0 && (
        <span className="undo-recoil-ghost" aria-hidden>
          <span className="stack-chip">
            <span className="stack-chip-face">
              {undoRecoilAmount >= 100 ? '···' : `$${undoRecoilAmount}`}
            </span>
          </span>
        </span>
      )}
      {amount > 0 && <ChipStack amount={amount} justPlaced={justPlaced} />}
      <GhostChipStack bets={ghostBets} fullQuality />
    </button>
  );
}

function MagneticChip({
  value,
  active,
  selectBounceKey = 0,
  registerChip,
  draggingChipRef,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onChipHover,
}) {
  const chipRef = useRef(null);
  const hoverHaptic = useRef(false);
  const [bouncing, setBouncing] = useState(false);
  const prevActiveRef = useRef(false);
  const [chipSelectEntryPulsing, setChipSelectEntryPulsing] = useState(false);

  useEffect(() => {
    if (!selectBounceKey) return undefined;
    setBouncing(true);
    const timer = window.setTimeout(() => setBouncing(false), 440);
    return () => window.clearTimeout(timer);
  }, [selectBounceKey]);

  useEffect(() => {
    const prevActive = prevActiveRef.current;
    prevActiveRef.current = active;
    if (shouldChipSelectEntryPulse(prevActive, active)) {
      setChipSelectEntryPulsing(true);
      const timer = window.setTimeout(() => setChipSelectEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!active) {
      setChipSelectEntryPulsing(false);
    }
    return undefined;
  }, [active]);

  useEffect(() => {
    registerChip(value, chipRef.current);
    return () => registerChip(value, null);
  }, [value, registerChip]);

  const handlePointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      draggingChipRef.current = value;
      chipRef.current?.setPointerCapture(e.pointerId);
      onSelect(value);
      onDragStart?.(value, e.clientX, e.clientY, chipRef.current);
    },
    [value, onSelect, onDragStart, draggingChipRef]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (draggingChipRef.current === value) {
        onDragMove?.(e.clientX, e.clientY);
      }
    },
    [value, onDragMove, draggingChipRef]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (draggingChipRef.current !== value) return;
      draggingChipRef.current = null;
      chipRef.current?.releasePointerCapture(e.pointerId);
      onDragEnd?.(e.clientX, e.clientY);
      resetChipMagnet(chipRef.current);
    },
    [value, onDragEnd, draggingChipRef]
  );

  const handleEnter = useCallback(() => {
    if (!hoverHaptic.current) {
      hoverHaptic.current = true;
      onChipHover?.();
    }
  }, [onChipHover]);

  const handleLeave = useCallback(() => {
    hoverHaptic.current = false;
    if (draggingChipRef.current !== value) {
      resetChipMagnet(chipRef.current);
    }
  }, [value, draggingChipRef]);

  return (
    <button
      ref={chipRef}
      type="button"
      className={[
        'chip',
        active ? 'active' : '',
        bouncing ? 'chip-select-bounce' : '',
        chipSelectEntryPulsing ? 'chip-select-entry-pulse' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        '--chip-mx': '0px',
        '--chip-my': '0px',
        '--chip-rot': '0deg',
        '--chip-scale': '1',
        '--chip-lift': '0px',
        '--spatial-spring': SPATIAL_SPRING,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      aria-label={`$${value} chip — drag to place`}
      aria-pressed={active}
    >
      <span className="chip-face">${value}</span>
      <span className="chip-ring" aria-hidden />
      <span
        className={[
          'chip-glow-active',
          chipSelectEntryPulsing ? 'chip-glow-entry-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      />
    </button>
  );
}

function InsideZoneBtn({
  zone,
  amount,
  isDropTarget,
  isWinning,
  cascadeDelayMs,
  cascadeEntryPulse = false,
  justPlaced,
  justUndoneRecoil = false,
  justUndoneClear = false,
  undoRecoilAmount = 0,
  justRepeated = false,
  ghostBets,
  onClick,
  disabled,
  fullQuality,
}) {
  const prevJustPlacedRef = useRef(false);
  const [chipLandedEntryPulsing, setChipLandedEntryPulsing] = useState(false);
  const prevJustRepeatedRef = useRef(false);
  const [repeatFlashEntryPulsing, setRepeatFlashEntryPulsing] = useState(false);
  const prevJustUndoneRecoilRef = useRef(false);
  const [chipUndoRecoilEntryPulsing, setChipUndoRecoilEntryPulsing] = useState(false);
  const prevJustUndoneClearRef = useRef(false);
  const [chipUndoClearEntryPulsing, setChipUndoClearEntryPulsing] = useState(false);
  const prevIsDropTargetRef = useRef(false);
  const [dropTargetEntryPulsing, setDropTargetEntryPulsing] = useState(false);

  useEffect(() => {
    const prevJustPlaced = prevJustPlacedRef.current;
    prevJustPlacedRef.current = justPlaced;
    if (shouldChipLandedEntryPulse(prevJustPlaced, justPlaced)) {
      setChipLandedEntryPulsing(true);
      const timer = window.setTimeout(() => setChipLandedEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!justPlaced) {
      setChipLandedEntryPulsing(false);
    }
    return undefined;
  }, [justPlaced]);

  useEffect(() => {
    const prevJustRepeated = prevJustRepeatedRef.current;
    prevJustRepeatedRef.current = justRepeated;
    if (shouldRepeatFlashEntryPulse(prevJustRepeated, justRepeated)) {
      setRepeatFlashEntryPulsing(true);
      const timer = window.setTimeout(() => setRepeatFlashEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!justRepeated) {
      setRepeatFlashEntryPulsing(false);
    }
    return undefined;
  }, [justRepeated]);

  useEffect(() => {
    const prevJustUndoneRecoil = prevJustUndoneRecoilRef.current;
    prevJustUndoneRecoilRef.current = justUndoneRecoil;
    if (shouldChipUndoRecoilEntryPulse(prevJustUndoneRecoil, justUndoneRecoil)) {
      setChipUndoRecoilEntryPulsing(true);
      const timer = window.setTimeout(() => setChipUndoRecoilEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!justUndoneRecoil) {
      setChipUndoRecoilEntryPulsing(false);
    }
    return undefined;
  }, [justUndoneRecoil]);

  useEffect(() => {
    const prevJustUndoneClear = prevJustUndoneClearRef.current;
    prevJustUndoneClearRef.current = justUndoneClear;
    if (shouldChipUndoClearEntryPulse(prevJustUndoneClear, justUndoneClear)) {
      setChipUndoClearEntryPulsing(true);
      const timer = window.setTimeout(() => setChipUndoClearEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!justUndoneClear) {
      setChipUndoClearEntryPulsing(false);
    }
    return undefined;
  }, [justUndoneClear]);

  useEffect(() => {
    const prevIsDropTarget = prevIsDropTargetRef.current;
    prevIsDropTargetRef.current = isDropTarget;
    if (shouldDropTargetEntryPulse(prevIsDropTarget, isDropTarget)) {
      setDropTargetEntryPulsing(true);
      const timer = window.setTimeout(() => setDropTargetEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!isDropTarget) {
      setDropTargetEntryPulsing(false);
    }
    return undefined;
  }, [isDropTarget]);

  return (
    <button
      type="button"
      className={[
        'inside-zone',
        `inside-${zone.kind}`,
        amount ? 'has-chip' : '',
        isDropTarget ? 'drop-target-active' : '',
        dropTargetEntryPulsing ? 'drop-target-entry-pulse' : '',
        isWinning ? 'winning-cell-active' : '',
        isWinning && cascadeDelayMs != null ? 'winning-cascade-active' : '',
        cascadeEntryPulse ? 'winning-cascade-entry-pulse' : '',
        chipLandedEntryPulsing ? 'chip-landed-entry-pulse' : '',
        chipUndoRecoilEntryPulsing ? 'chip-undone-recoil-entry-pulse' : '',
        chipUndoClearEntryPulsing ? 'chip-undone-clear-entry-pulse' : '',
        repeatFlashEntryPulsing ? 'repeat-flash-entry-pulse' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...insideZoneStyle(zone),
        ...(cascadeDelayMs != null ? { '--cascade-delay': `${cascadeDelayMs}ms` } : {}),
      }}
      data-bet-type={zone.type}
      data-bet-value={zone.value}
      disabled={disabled}
      onClick={() => onClick({ type: zone.type, value: zone.value })}
      aria-label={
        amount > 0
          ? `${zone.type} ${zone.value.replace(/,/g, ' ')} — $${amount} staked`
          : `${zone.type} ${zone.value.replace(/,/g, ' ')}`
      }
    >
      <span className="inside-zone-mark" aria-hidden>
        {zone.label}
      </span>
      {isWinning && <span className="winning-ripple" aria-hidden />}
      {justUndoneClear && undoRecoilAmount > 0 && (
        <span className="undo-recoil-ghost" aria-hidden>
          <span className="stack-chip">
            <span className="stack-chip-face">
              {undoRecoilAmount >= 100 ? '···' : `$${undoRecoilAmount}`}
            </span>
          </span>
        </span>
      )}
      {amount > 0 && <ChipStack amount={amount} justPlaced={justPlaced} />}
      <GhostChipStack bets={ghostBets} fullQuality={fullQuality} />
    </button>
  );
}

function ChipRack({
  chipValues,
  selectedChip,
  bettingGlow,
  bettingGlowEntryPulse,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onChipHover,
}) {
  const rackRef = useRef(null);
  const chipRegistry = useRef(new Map());
  const draggingChipRef = useRef(null);
  const selectedChipRef = useRef(selectedChip);
  const prevSelectedChipRef = useRef(selectedChip);
  const [selectBounceKey, setSelectBounceKey] = useState(0);
  const [rackSelectEntryPulsing, setRackSelectEntryPulsing] = useState(false);

  selectedChipRef.current = selectedChip;

  useEffect(() => {
    if (!shouldChipRackSelectEntryPulse(prevSelectedChipRef.current, selectedChip)) return undefined;
    prevSelectedChipRef.current = selectedChip;
    setSelectBounceKey((key) => key + 1);
    setRackSelectEntryPulsing(true);
    const timer = window.setTimeout(() => setRackSelectEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [selectedChip]);

  const registerChip = useCallback((value, el) => {
    if (el) chipRegistry.current.set(value, el);
    else chipRegistry.current.delete(value);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      const rack = rackRef.current;
      if (!rack) return;

      const rect = rack.getBoundingClientRect();
      const pad = MAGNET_RADIUS + 24;
      const nearRack =
        e.clientX >= rect.left - pad &&
        e.clientX <= rect.right + pad &&
        e.clientY >= rect.top - pad &&
        e.clientY <= rect.bottom + pad;

      if (!nearRack) {
        chipRegistry.current.forEach((el, chipValue) => {
          if (draggingChipRef.current !== chipValue) resetChipMagnet(el);
        });
        return;
      }

      chipRegistry.current.forEach((el, chipValue) => {
        if (draggingChipRef.current === chipValue) return;
        applyChipMagnet(el, e.clientX, e.clientY, selectedChipRef.current === chipValue);
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div
      ref={rackRef}
      className={[
        'chip-rack',
        bettingGlow ? 'chip-rack-betting-glow-active' : '',
        bettingGlowEntryPulse ? 'chip-rack-betting-glow-entry-pulse' : '',
        rackSelectEntryPulsing ? 'chip-rack-select-entry-pulse' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {chipValues.map((v) => (
        <MagneticChip
          key={v}
          value={v}
          active={selectedChip === v}
          selectBounceKey={selectedChip === v ? selectBounceKey : 0}
          registerChip={registerChip}
          draggingChipRef={draggingChipRef}
          onSelect={onSelect}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onChipHover={onChipHover}
        />
      ))}
    </div>
  );
}

export function BettingBoard() {
  const {
    balance,
    balancePulse = { key: 0, tone: null },
    betClearShake = { key: 0 },
    scaleBoardPulse = { key: 0, mode: null },
    favoriteApplyPulse = { key: 0 },
    undoCellRecoil = { key: 0, cellKey: null, kind: null, removedAmount: 0 },
    repeatRoundPulse = { key: 0 },
    stakeCommitPulse = { key: 0 },
    batchStakePulse = { key: 0 },
    faucetRefillPulse = { key: 0 },
    bets,
    selectedChip,
    setSelectedChip,
    chipValues,
    clock,
    revealedWinningNumber,
    revealedWinningColor,
    message,
    hoverHighlight,
    recentResults,
    sessionRounds,
    placeBet,
    placeCallBet,
    placeNeighbors,
    saveFavoriteBet,
    deleteFavoriteBet,
    applyFavoriteBets,
    clearBets,
    undoLastBet,
    canUndoBet,
    repeatLastRound,
    canRepeatLastRound,
    scaleBoardStake,
    canScaleBoardHalf,
    canScaleBoardDouble,
    requestFaucet,
    setHoverHighlight,
    clearHoverHighlight,
    ghostBets,
    ghostConfetti,
    hudPhase,
    fairnessCommit,
    lastFairnessAudit,
    fairRoundHistory,
    favorites,
    syncMode,
    seedCustodyBadge,
    qualitySettings,
    securityFrozen = false,
    feedbackChipHover,
    feedbackChipDragStart,
    feedbackChipDragMove,
  } = useGame();

  const panelRef = useRef(null);
  const prevPanelPointerActiveRef = useRef(false);
  const [panelPointerActive, setPanelPointerActive] = useState(false);
  const [panelPointerEntryPulsing, setPanelPointerEntryPulsing] = useState(false);
  const [dropTargetKey, setDropTargetKey] = useState(null);
  const [dragGhost, setDragGhost] = useState(null);
  const [dragTrail, setDragTrail] = useState([]);
  const [placedFlash, setPlacedFlash] = useState(null);
  const [activeUndoRecoil, setActiveUndoRecoil] = useState(null);
  const [repeatFlash, setRepeatFlash] = useState(() => new Set());
  const [fairnessOpen, setFairnessOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [boardMode, setBoardMode] = useState('classic');
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const prevStakedRef = useRef(0);
  const prevCycleSecondRef = useRef(0);
  const prevCanRepeatRef = useRef(false);
  const prevCanUndoRef = useRef(false);
  const skipCycleTickPulseRef = useRef(true);
  const [drawerMetaEntryPulsing, setDrawerMetaEntryPulsing] = useState(false);
  const [cycleTrackTickEntryPulsing, setCycleTrackTickEntryPulsing] = useState(false);
  const prevCycleDropUrgentRef = useRef(false);
  const [cycleDropUrgencyEntryPulsing, setCycleDropUrgencyEntryPulsing] = useState(false);
  const prevSpinFocusRef = useRef(false);
  const [spinFocusEntryPulsing, setSpinFocusEntryPulsing] = useState(false);
  const prevSpinDimSoftRef = useRef(false);
  const [spinDimSoftEntryPulsing, setSpinDimSoftEntryPulsing] = useState(false);
  const prevIsSettleRevealRef = useRef(false);
  const [settleRevealEntryPulsing, setSettleRevealEntryPulsing] = useState(false);
  const prevShowStakeWarningRef = useRef(false);
  const [stakeRiskWarningEntryPulsing, setStakeRiskWarningEntryPulsing] = useState(false);
  const [stakeRiskEntryPulsing, setStakeRiskEntryPulsing] = useState(false);
  const [repeatRoundReadyEntryPulsing, setRepeatRoundReadyEntryPulsing] = useState(false);
  const [undoRoundReadyEntryPulsing, setUndoRoundReadyEntryPulsing] = useState(false);
  const prevClearReadyRef = useRef(false);
  const [clearReadyEntryPulsing, setClearReadyEntryPulsing] = useState(false);
  const prevScaleReadyRef = useRef(false);
  const [scaleReadyEntryPulsing, setScaleReadyEntryPulsing] = useState(false);
  const prevFaucetReadyRef = useRef(false);
  const [faucetReadyEntryPulsing, setFaucetReadyEntryPulsing] = useState(false);
  const prevBalanceLowRef = useRef(false);
  const [balanceLowEntryPulsing, setBalanceLowEntryPulsing] = useState(false);
  const prevBalanceSettleKeyRef = useRef(0);
  const [balanceSettleWinEntryPulsing, setBalanceSettleWinEntryPulsing] = useState(false);
  const [balanceSettleLossEntryPulsing, setBalanceSettleLossEntryPulsing] = useState(false);
  const prevCascadeActiveRef = useRef(false);
  const [winningCascadeEntryPulsing, setWinningCascadeEntryPulsing] = useState(false);
  const prevDrawerOpenRef = useRef(false);
  const [mobileDrawerTabEntryPulsing, setMobileDrawerTabEntryPulsing] = useState(false);
  const prevMobileDrawerExpandedRef = useRef(false);
  const [mobileDrawerOpenEntryPulsing, setMobileDrawerOpenEntryPulsing] = useState(false);
  const prevMobileDrawerCollapsedRef = useRef(false);
  const [mobileDrawerCollapseEntryPulsing, setMobileDrawerCollapseEntryPulsing] = useState(false);
  const prevClassicTabGlowRef = useRef(false);
  const prevRacetrackTabGlowRef = useRef(false);
  const [classicTabEntryPulsing, setClassicTabEntryPulsing] = useState(false);
  const [racetrackTabEntryPulsing, setRacetrackTabEntryPulsing] = useState(false);
  const prevChipRackBettingGlowRef = useRef(false);
  const [chipRackBettingGlowEntryPulsing, setChipRackBettingGlowEntryPulsing] = useState(false);
  const prevResultPillReadyRef = useRef(false);
  const [resultPillReadyEntryPulsing, setResultPillReadyEntryPulsing] = useState(false);
  const [clearShakeEntryPulsing, setClearShakeEntryPulsing] = useState(false);
  const [scaleBoardEntryPulsing, setScaleBoardEntryPulsing] = useState(false);
  const [favoriteApplyEntryPulsing, setFavoriteApplyEntryPulsing] = useState(false);
  const [repeatRoundEntryPulsing, setRepeatRoundEntryPulsing] = useState(false);
  const [stakeCommitEntryPulsing, setStakeCommitEntryPulsing] = useState(false);
  const [batchStakeEntryPulsing, setBatchStakeEntryPulsing] = useState(false);
  const [stakedLabelEntryPulsing, setStakedLabelEntryPulsing] = useState(false);
  const prevSettleHeaderBloomKeyRef = useRef(null);
  const [settleHeaderBloomEntryPulsing, setSettleHeaderBloomEntryPulsing] = useState(false);
  const [faucetEntryPulsing, setFaucetEntryPulsing] = useState(false);
  const [statusEntryPulsing, setStatusEntryPulsing] = useState(false);
  const prevStatusLineReadyRef = useRef(false);
  const [statusLineReadyEntryPulsing, setStatusLineReadyEntryPulsing] = useState(false);
  const skipStatusFlashRef = useRef(true);
  const isPortraitMobile = usePortraitMobile();
  const dragValue = useRef(null);
  const lastDragRef = useRef({ x: 0, y: 0, t: 0 });
  const trailRef = useRef([]);

  const bettingOpen = clock.acceptsBets ?? clock.name === 'betting';
  const spinDimLevel = spinFocusDimLevel(hudPhase, clock.name);
  const isSpinFocus = shouldDimBettingPanel(hudPhase);
  const isSpinDimSoft = spinDimLevel === 'soft';
  const isSettleReveal = hudPhase === 'settle-reveal';

  useEffect(() => {
    if (!betClearShake.key) return undefined;
    setClearShakeEntryPulsing(true);
    const timer = window.setTimeout(() => setClearShakeEntryPulsing(false), 480);
    return () => window.clearTimeout(timer);
  }, [betClearShake.key]);

  useEffect(() => {
    if (!shouldScaleBoardEntryPulse(scaleBoardPulse.key)) return undefined;
    setScaleBoardEntryPulsing(true);
    const timer = window.setTimeout(() => setScaleBoardEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [scaleBoardPulse.key]);

  useEffect(() => {
    if (!shouldFavoriteApplyEntryPulse(favoriteApplyPulse.key)) return undefined;
    setFavoriteApplyEntryPulsing(true);
    const timer = window.setTimeout(() => setFavoriteApplyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [favoriteApplyPulse.key]);

  useEffect(() => {
    if (!shouldRepeatRoundEntryPulse(repeatRoundPulse.key)) return undefined;
    setRepeatRoundEntryPulsing(true);
    const timer = window.setTimeout(() => setRepeatRoundEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [repeatRoundPulse.key]);

  useEffect(() => {
    if (!shouldStakeCommitEntryPulse(stakeCommitPulse.key)) return undefined;
    setStakeCommitEntryPulsing(true);
    const timer = window.setTimeout(() => setStakeCommitEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [stakeCommitPulse.key]);

  useEffect(() => {
    if (!shouldBatchStakeEntryPulse(batchStakePulse.key)) return undefined;
    setBatchStakeEntryPulsing(true);
    const timer = window.setTimeout(() => setBatchStakeEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [batchStakePulse.key]);

  const stakedLabelEntryPulse = stakedLabelEntryPulseKey(stakeCommitPulse.key, batchStakePulse.key);

  useEffect(() => {
    if (!stakedLabelEntryPulse) return undefined;
    setStakedLabelEntryPulsing(true);
    const timer = window.setTimeout(() => setStakedLabelEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [stakedLabelEntryPulse]);

  useEffect(() => {
    if (!faucetRefillPulse.key) return undefined;
    setFaucetEntryPulsing(true);
    const timer = window.setTimeout(() => setFaucetEntryPulsing(false), 720);
    return () => window.clearTimeout(timer);
  }, [faucetRefillPulse.key]);

  useEffect(() => {
    if (skipStatusFlashRef.current) {
      skipStatusFlashRef.current = false;
      return undefined;
    }
    if (!shouldStatusLineEntryPulse(message)) return undefined;
    setStatusEntryPulsing(true);
    const timer = window.setTimeout(() => setStatusEntryPulsing(false), 520);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!undoCellRecoil.key) return undefined;
    setActiveUndoRecoil({
      cellKey: undoCellRecoil.cellKey,
      kind: undoCellRecoil.kind,
      removedAmount: undoCellRecoil.removedAmount,
    });
    const timer = window.setTimeout(() => setActiveUndoRecoil(null), 540);
    return () => window.clearTimeout(timer);
  }, [undoCellRecoil.key]);

  useEffect(() => {
    if (isSpinFocus) clearHoverHighlight();
  }, [isSpinFocus, clearHoverHighlight]);

  useEffect(() => {
    if (!isPortraitMobile) {
      setDrawerCollapsed(false);
      return;
    }
    if (isSpinFocus) setDrawerCollapsed(true);
    if (isSettleReveal) setDrawerCollapsed(false);
  }, [isPortraitMobile, isSpinFocus, isSettleReveal]);

  const staked = bets.reduce((s, b) => s + b.amount, 0);

  useEffect(() => {
    const prevStaked = prevStakedRef.current;
    prevStakedRef.current = staked;
    if (!shouldDrawerMetaEntryPulse(prevStaked, staked)) return undefined;
    setDrawerMetaEntryPulsing(true);
    const timer = window.setTimeout(() => setDrawerMetaEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [staked]);

  useEffect(() => {
    const prevSecond = prevCycleSecondRef.current;
    prevCycleSecondRef.current = clock.cycleSecond;
    if (skipCycleTickPulseRef.current) {
      skipCycleTickPulseRef.current = false;
      return undefined;
    }
    if (!shouldCycleTrackTickEntryPulse(prevSecond, clock.cycleSecond)) return undefined;
    setCycleTrackTickEntryPulsing(true);
    const timer = window.setTimeout(() => setCycleTrackTickEntryPulsing(false), 580);
    return () => window.clearTimeout(timer);
  }, [clock.cycleSecond]);

  useEffect(() => {
    const prevCanRepeat = prevCanRepeatRef.current;
    prevCanRepeatRef.current = canRepeatLastRound;
    if (!shouldRepeatRoundReadyEntryPulse(prevCanRepeat, canRepeatLastRound)) return undefined;
    setRepeatRoundReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setRepeatRoundReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [canRepeatLastRound]);

  useEffect(() => {
    const prevCanUndo = prevCanUndoRef.current;
    prevCanUndoRef.current = canUndoBet;
    if (!shouldUndoRoundReadyEntryPulse(prevCanUndo, canUndoBet)) return undefined;
    setUndoRoundReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setUndoRoundReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [canUndoBet]);

  const clearReadyGlow = shouldClearReadyGlow(bettingOpen, staked);

  useEffect(() => {
    const prevClearReady = prevClearReadyRef.current;
    prevClearReadyRef.current = clearReadyGlow;
    if (!shouldClearReadyEntryPulse(prevClearReady, clearReadyGlow)) return undefined;
    setClearReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setClearReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [clearReadyGlow]);

  const scaleReadyGlow = shouldScaleReadyGlow(canScaleBoardHalf, canScaleBoardDouble);

  useEffect(() => {
    const prevScaleReady = prevScaleReadyRef.current;
    prevScaleReadyRef.current = scaleReadyGlow;
    if (!shouldScaleReadyEntryPulse(prevScaleReady, scaleReadyGlow)) return undefined;
    setScaleReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setScaleReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [scaleReadyGlow]);

  const stakeRisk = useMemo(() => stakeRiskLevel(staked, balance), [staked, balance]);
  const showStakeWarning = bettingOpen && stakeRisk.highRisk;

  useEffect(() => {
    const prevShowStakeWarning = prevShowStakeWarningRef.current;
    prevShowStakeWarningRef.current = showStakeWarning;
    if (!shouldStakeRiskEntryPulse(prevShowStakeWarning, showStakeWarning)) return undefined;
    setStakeRiskWarningEntryPulsing(true);
    setStakeRiskEntryPulsing(true);
    const timer = window.setTimeout(() => {
      setStakeRiskWarningEntryPulsing(false);
      setStakeRiskEntryPulsing(false);
    }, 620);
    return () => window.clearTimeout(timer);
  }, [showStakeWarning]);

  const faucetReadyGlow = shouldFaucetReadyGlow(balance, { securityFrozen });

  useEffect(() => {
    const prevFaucetReady = prevFaucetReadyRef.current;
    prevFaucetReadyRef.current = faucetReadyGlow;
    if (!shouldFaucetReadyEntryPulse(prevFaucetReady, faucetReadyGlow)) return undefined;
    setFaucetReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setFaucetReadyEntryPulsing(false), 720);
    return () => window.clearTimeout(timer);
  }, [faucetReadyGlow]);

  const balanceLowGlow = shouldBalanceLowGlow(balance, chipValues, { securityFrozen });

  useEffect(() => {
    const prevBalanceLow = prevBalanceLowRef.current;
    prevBalanceLowRef.current = balanceLowGlow;
    if (!shouldBalanceLowEntryPulse(prevBalanceLow, balanceLowGlow)) return undefined;
    setBalanceLowEntryPulsing(true);
    const timer = window.setTimeout(() => setBalanceLowEntryPulsing(false), 680);
    return () => window.clearTimeout(timer);
  }, [balanceLowGlow]);

  useEffect(() => {
    const prevKey = prevBalanceSettleKeyRef.current;
    prevBalanceSettleKeyRef.current = balancePulse.key;

    let winTimer;
    let lossTimer;

    if (shouldBalanceSettleWinEntryPulse(prevKey, balancePulse.key, balancePulse.tone)) {
      setBalanceSettleWinEntryPulsing(true);
      winTimer = window.setTimeout(() => setBalanceSettleWinEntryPulsing(false), 850);
    }

    if (shouldBalanceSettleLossEntryPulse(prevKey, balancePulse.key, balancePulse.tone)) {
      setBalanceSettleLossEntryPulsing(true);
      lossTimer = window.setTimeout(() => setBalanceSettleLossEntryPulsing(false), 850);
    }

    return () => {
      if (winTimer !== undefined) window.clearTimeout(winTimer);
      if (lossTimer !== undefined) window.clearTimeout(lossTimer);
    };
  }, [balancePulse.key, balancePulse.tone]);

  const repeatReadyGlow = shouldRepeatReadyGlow(canRepeatLastRound);
  const undoReadyGlow = shouldUndoReadyGlow(canUndoBet);
  const chipRackBettingGlow = shouldChipRackBettingGlow(bettingOpen);

  useEffect(() => {
    const prevChipRackBettingGlow = prevChipRackBettingGlowRef.current;
    prevChipRackBettingGlowRef.current = chipRackBettingGlow;
    if (!shouldChipRackBettingGlowEntryPulse(prevChipRackBettingGlow, chipRackBettingGlow)) return undefined;
    setChipRackBettingGlowEntryPulsing(true);
    const timer = window.setTimeout(() => setChipRackBettingGlowEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [chipRackBettingGlow]);

  const drawerOpenGlow = shouldMobileDrawerOpenGlow(isPortraitMobile, bettingOpen, drawerCollapsed);

  useEffect(() => {
    const prevDrawerOpen = prevDrawerOpenRef.current;
    prevDrawerOpenRef.current = drawerOpenGlow;
    if (!shouldMobileDrawerTabEntryPulse(prevDrawerOpen, drawerOpenGlow)) return undefined;
    setMobileDrawerTabEntryPulsing(true);
    const timer = window.setTimeout(() => setMobileDrawerTabEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [drawerOpenGlow]);

  const isMobileDrawerOpen = isPortraitMobile && !drawerCollapsed;

  useEffect(() => {
    const prevMobileDrawerOpen = prevMobileDrawerExpandedRef.current;
    prevMobileDrawerExpandedRef.current = isMobileDrawerOpen;
    if (!shouldMobileDrawerOpenEntryPulse(prevMobileDrawerOpen, isMobileDrawerOpen)) return undefined;
    setMobileDrawerOpenEntryPulsing(true);
    const timer = window.setTimeout(() => setMobileDrawerOpenEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [isMobileDrawerOpen]);

  const isMobileDrawerCollapsed = isPortraitMobile && drawerCollapsed;

  useEffect(() => {
    const prevMobileDrawerCollapsed = prevMobileDrawerCollapsedRef.current;
    prevMobileDrawerCollapsedRef.current = isMobileDrawerCollapsed;
    if (!shouldMobileDrawerCollapseEntryPulse(prevMobileDrawerCollapsed, isMobileDrawerCollapsed)) return undefined;
    setMobileDrawerCollapseEntryPulsing(true);
    const timer = window.setTimeout(() => setMobileDrawerCollapseEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [isMobileDrawerCollapsed]);

  const statusLineReadyGlow = shouldStatusLineReadyGlow(bettingOpen);

  useEffect(() => {
    const prevStatusLineReady = prevStatusLineReadyRef.current;
    prevStatusLineReadyRef.current = statusLineReadyGlow;
    if (!shouldStatusLineReadyEntryPulse(prevStatusLineReady, statusLineReadyGlow)) return undefined;
    setStatusLineReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setStatusLineReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [statusLineReadyGlow]);

  const cycleDropUrgent = shouldCycleDropUrgency(clock.cycleSecond, clock.name);

  useEffect(() => {
    const prevCycleDropUrgent = prevCycleDropUrgentRef.current;
    prevCycleDropUrgentRef.current = cycleDropUrgent;
    if (!shouldCycleDropUrgencyEntryPulse(prevCycleDropUrgent, cycleDropUrgent)) return undefined;
    setCycleDropUrgencyEntryPulsing(true);
    const timer = window.setTimeout(() => setCycleDropUrgencyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [cycleDropUrgent]);

  useEffect(() => {
    const prevSpinFocus = prevSpinFocusRef.current;
    prevSpinFocusRef.current = isSpinFocus;
    if (!shouldSpinFocusEntryPulse(prevSpinFocus, isSpinFocus)) return undefined;
    setSpinFocusEntryPulsing(true);
    const timer = window.setTimeout(() => setSpinFocusEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [isSpinFocus]);

  useEffect(() => {
    const prevSpinDimSoft = prevSpinDimSoftRef.current;
    prevSpinDimSoftRef.current = isSpinDimSoft;
    if (!shouldSpinDimSoftEntryPulse(prevSpinDimSoft, isSpinDimSoft)) return undefined;
    setSpinDimSoftEntryPulsing(true);
    const timer = window.setTimeout(() => setSpinDimSoftEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [isSpinDimSoft]);

  useEffect(() => {
    const prevIsSettleReveal = prevIsSettleRevealRef.current;
    prevIsSettleRevealRef.current = isSettleReveal;
    if (!shouldSettleRevealEntryPulse(prevIsSettleReveal, isSettleReveal)) return undefined;
    setSettleRevealEntryPulsing(true);
    const timer = window.setTimeout(() => setSettleRevealEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [isSettleReveal]);

  const classicTabGlow = shouldBoardModeTabGlow(bettingOpen, boardMode === 'classic');
  const racetrackTabGlow = shouldBoardModeTabGlow(bettingOpen, boardMode === 'racetrack');

  useEffect(() => {
    const prevClassicTabGlow = prevClassicTabGlowRef.current;
    prevClassicTabGlowRef.current = classicTabGlow;
    if (!shouldBoardModeTabReadyEntryPulse(prevClassicTabGlow, classicTabGlow)) return undefined;
    setClassicTabEntryPulsing(true);
    const timer = window.setTimeout(() => setClassicTabEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [classicTabGlow]);

  useEffect(() => {
    const prevRacetrackTabGlow = prevRacetrackTabGlowRef.current;
    prevRacetrackTabGlowRef.current = racetrackTabGlow;
    if (!shouldBoardModeTabReadyEntryPulse(prevRacetrackTabGlow, racetrackTabGlow)) return undefined;
    setRacetrackTabEntryPulsing(true);
    const timer = window.setTimeout(() => setRacetrackTabEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [racetrackTabGlow]);

  const cycleProgress = (clock.cycleSecond / CYCLE_SECONDS) * 100;
  const secondsToDrop =
    clock.cycleSecond < BALL_DROP_AT
      ? BALL_DROP_AT - clock.cycleSecond
      : CYCLE_SECONDS - clock.cycleSecond + BALL_DROP_AT;

  const pathwayNumbers = useMemo(
    () => boardHighlightSet(hoverHighlight),
    [hoverHighlight]
  );

  const betAmount = (type, value) =>
    bets.find((b) => b.type === type && String(b.value ?? '') === String(value ?? ''))?.amount ?? 0;

  const cellKey = (type, value) => `${type}:${value ?? ''}`;

  const fullGhostQuality = qualitySettings.ghostChipsFull !== false;

  const ghostByCell = useMemo(() => {
    const map = new Map();
    for (const b of ghostBets) {
      const key = cellKey(b.type, b.value);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    }
    return map;
  }, [ghostBets]);

  const insideBetZones = useMemo(() => buildInsideBetZones(), []);
  const displayNumber = revealedWinningNumber;
  const displayColor = revealedWinningColor;
  const boardCascadeSpecs = useMemo(
    () => [
      { type: 'straight', value: 0 },
      ...Array.from({ length: 36 }, (_, i) => ({ type: 'straight', value: i + 1 })),
      ...insideBetZones.map((zone) => ({ type: zone.type, value: zone.value })),
      ...OUTSIDE.map((cell) => ({ type: cell.type, value: cell.value })),
    ],
    [insideBetZones]
  );
  const winningCascadeMap = useMemo(() => {
    if (!isSettleReveal || displayNumber == null) return new Map();
    return buildWinningCascadeMap(boardCascadeSpecs, displayNumber);
  }, [isSettleReveal, displayNumber, boardCascadeSpecs]);
  const cascadeActive =
    isSettleReveal && displayNumber != null && winningCascadeMap.size > 0;

  useEffect(() => {
    const prevCascadeActive = prevCascadeActiveRef.current;
    prevCascadeActiveRef.current = cascadeActive;
    if (!shouldWinningCellCascadeEntryPulse(prevCascadeActive, cascadeActive)) return undefined;
    setWinningCascadeEntryPulsing(true);
    const timer = window.setTimeout(() => setWinningCascadeEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [cascadeActive]);

  const resultPillFlyIn = shouldResultPillFlyIn(displayNumber, hudPhase);
  const resultPillReadyGlow = shouldResultPillReadyGlow(displayNumber, recentResults);
  const settleHeaderBloomKey = settleRevealHeaderBloomKey(displayNumber, hudPhase);

  useEffect(() => {
    const prevResultPillReady = prevResultPillReadyRef.current;
    prevResultPillReadyRef.current = resultPillReadyGlow;
    if (!shouldResultPillReadyEntryPulse(prevResultPillReady, resultPillReadyGlow)) return undefined;
    setResultPillReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setResultPillReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [resultPillReadyGlow]);

  useEffect(() => {
    if (!settleHeaderBloomKey) {
      setSettleHeaderBloomEntryPulsing(false);
      prevSettleHeaderBloomKeyRef.current = null;
      return undefined;
    }
    const prevKey = prevSettleHeaderBloomKeyRef.current;
    prevSettleHeaderBloomKeyRef.current = settleHeaderBloomKey;
    if (!shouldSettleHeaderBloomEntryPulse(prevKey, settleHeaderBloomKey)) return undefined;
    setSettleHeaderBloomEntryPulsing(true);
    const timer = window.setTimeout(() => setSettleHeaderBloomEntryPulsing(false), 720);
    return () => window.clearTimeout(timer);
  }, [settleHeaderBloomKey]);

  const ghostConfettiEvents = useMemo(() => {
    if (!isSettleReveal || displayNumber == null) return [];
    return ghostConfetti;
  }, [ghostConfetti, isSettleReveal, displayNumber]);

  const col1 = [];
  const col2 = [];
  const col3 = [];
  for (let n = 1; n <= 36; n++) {
    const col = ((n - 1) % 3) + 1;
    if (col === 1) col1.push(n);
    else if (col === 2) col2.push(n);
    else col3.push(n);
  }

  const findDropTarget = useCallback((clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    const btn = el?.closest?.('[data-bet-type]');
    if (!btn || btn.disabled) return null;
    return parseBetTarget(btn);
  }, []);

  const flashPlacement = useCallback((type, value) => {
    const key = cellKey(type, value);
    setPlacedFlash(key);
    window.setTimeout(() => setPlacedFlash((k) => (k === key ? null : k)), 500);
  }, []);

  const handleUndo = useCallback(() => {
    void undoLastBet();
  }, [undoLastBet]);

  const handleRepeat = useCallback(async () => {
    const layout = await repeatLastRound();
    if (!layout?.length) return;
    const keys = new Set(layout.map((bet) => cellKey(bet.type, bet.value)));
    setRepeatFlash(keys);
    window.setTimeout(() => setRepeatFlash(new Set()), 620);
  }, [repeatLastRound]);

  const handleScaleHalf = useCallback(() => {
    void scaleBoardStake(0.5);
  }, [scaleBoardStake]);

  const handleScaleDouble = useCallback(() => {
    void scaleBoardStake(2);
  }, [scaleBoardStake]);

  const handleChipDragStart = useCallback(
    (value, x, y) => {
      dragValue.current = value;
      lastDragRef.current = { x, y, t: performance.now() };
      trailRef.current = [{ x, y, t: performance.now() }];
      setDragTrail(trailRef.current);
      setDragGhost({ x, y, value, angle: -24, speed: 0.2, spring: CHIP_SPRING });
      void feedbackChipDragStart?.(value);
    },
    [feedbackChipDragStart]
  );

  const handleChipDragMove = useCallback(
    (x, y) => {
      const now = performance.now();
      const prev = lastDragRef.current;
      const dt = Math.max(12, now - prev.t);
      const speed = Math.hypot(x - prev.x, y - prev.y) / dt;
      const angle = (Math.atan2(y - prev.y, x - prev.x) * 180) / Math.PI;

      lastDragRef.current = { x, y, t: now };
      trailRef.current = [...trailRef.current.slice(-5), { x, y, t: now }];
      setDragTrail([...trailRef.current]);

      setDragGhost((g) =>
        g ? { ...g, x, y, angle, speed: Math.min(1.4, speed) } : null
      );

      const target = findDropTarget(x, y);
      setDropTargetKey(target ? cellKey(target.type, target.value) : null);
      if (speed > 0.08) feedbackChipDragMove?.(speed);
    },
    [findDropTarget, feedbackChipDragMove]
  );

  const handleChipDragEnd = useCallback(
    async (x, y) => {
      const target = findDropTarget(x, y);
      setDragGhost(null);
      setDragTrail([]);
      trailRef.current = [];
      setDropTargetKey(null);
      dragValue.current = null;
      if (target && bettingOpen) {
        await placeBet(target);
        flashPlacement(target.type, target.value);
      }
    },
    [findDropTarget, bettingOpen, placeBet, flashPlacement]
  );

  const handleBoardPointer = useCallback(
    (e) => {
      if (isSpinFocus || dragGhost) return;
      const btn = e.target.closest('[data-bet-type]');
      if (!btn) return;
      const target = parseBetTarget(btn);
      if (target) setHoverHighlight(target);
    },
    [isSpinFocus, dragGhost, setHoverHighlight]
  );

  const handleBoardMove = useCallback(
    (e) => {
      if (isSpinFocus || dragGhost) return;
      const btn = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-bet-type]');
      if (!btn) {
        clearHoverHighlight();
        return;
      }
      const target = parseBetTarget(btn);
      if (target) setHoverHighlight(target);
    },
    [isSpinFocus, dragGhost, setHoverHighlight, clearHoverHighlight]
  );

  const handleBoardLeave = useCallback(() => {
    if (!dragGhost) clearHoverHighlight();
  }, [dragGhost, clearHoverHighlight]);

  useEffect(() => {
    const prevPanelPointerActive = prevPanelPointerActiveRef.current;
    prevPanelPointerActiveRef.current = panelPointerActive;
    if (!prevPanelPointerActive && panelPointerActive) {
      setPanelPointerEntryPulsing(true);
      const timer = window.setTimeout(() => setPanelPointerEntryPulsing(false), 620);
      return () => window.clearTimeout(timer);
    }
    if (!panelPointerActive) {
      setPanelPointerEntryPulsing(false);
    }
    return undefined;
  }, [panelPointerActive]);

  const handlePanelMove = useCallback((e) => {
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    el.style.setProperty('--glow-opacity', '1');
    setPanelPointerActive(true);
  }, []);

  const handlePanelLeave = useCallback(() => {
    setPanelPointerActive(false);
    panelRef.current?.style.setProperty('--glow-opacity', '0');
  }, []);

  const handleMagnetMove = useCallback((offset) => {
    if (!panelRef.current) return;
    panelRef.current.style.setProperty('--ox', `${offset.x * 0.22}px`);
    panelRef.current.style.setProperty('--oy', `${offset.y * 0.22}px`);
  }, []);

  const handleBetClick = useCallback(
    async (target) => {
      await placeBet(target);
      flashPlacement(target.type, target.value);
    },
    [placeBet, flashPlacement]
  );

  const straightPathwayClass = (n) => {
    if (!hoverHighlight) return '';
    if (hoverHighlight.type === 'straight' && hoverHighlight.value === n) {
      return 'pathway-source-active';
    }
    if (INSIDE_BET_TYPES.has(hoverHighlight.type)) {
      return isStraightPathwayLit(n, hoverHighlight) ? 'pathway-lit-active' : '';
    }
    return isStraightPathwayLit(n, hoverHighlight) ? 'pathway-lit-active' : '';
  };

  const panelClass = [
    'betting-panel',
    `phase-${clock.name}`,
    `hud-${hudPhase}`,
    bettingOpen ? 'phase-betting-active' : '',
    'panel-enter',
    isSpinDimSoft ? 'spin-dim-soft-active' : '',
    spinDimSoftEntryPulsing ? 'spin-dim-soft-entry-pulse' : '',
    isSpinFocus ? 'spin-focus-active' : '',
    spinFocusEntryPulsing ? 'spin-focus-entry-pulse' : '',
    isSettleReveal ? 'settle-reveal-active' : '',
    settleRevealEntryPulsing ? 'settle-reveal-entry-pulse' : '',
    hoverHighlight ? 'has-3d-highlight' : '',
    isPortraitMobile ? 'mobile-drawer' : '',
    isPortraitMobile && drawerCollapsed ? 'drawer-collapsed' : '',
    clearShakeEntryPulsing ? 'bet-clear-shake-entry-pulse' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const betBtnProps = (type, value, extra = {}) => {
    const key = cellKey(type, value);
    const isWinning = isSettleReveal && cellIsWinner(type, value, displayNumber);
    const cascadeIndex = winningCascadeMap.get(key);
    const cascadeDelayMs =
      isWinning && cascadeIndex != null ? winningCellCascadeDelay(cascadeIndex) : undefined;
    const undoRecoil = activeUndoRecoil?.cellKey === key ? activeUndoRecoil : null;
    return {
      type,
      value,
      amount: betAmount(type, value),
      onClick: handleBetClick,
      disabled: !bettingOpen,
      onMagnetMove: handleMagnetMove,
      isDropTarget: dropTargetKey === key,
      isWinning,
      cascadeDelayMs,
      cascadeEntryPulse: winningCascadeEntryPulsing && cascadeIndex === 0,
      justPlaced: placedFlash === key,
      justUndoneRecoil: undoRecoil?.kind === 'reduce',
      justUndoneClear: undoRecoil?.kind === 'clear',
      undoRecoilAmount: undoRecoil?.removedAmount ?? 0,
      justRepeated: repeatFlash.has(key),
      ghostBets: ghostByCell.get(key) ?? [],
      fullQuality: fullGhostQuality,
      ...extra,
    };
  };

  return (
    <>
      <GhostConfettiBurst events={ghostConfettiEvents} fullQuality={fullGhostQuality} />
      <ChipDragLayer ghost={dragGhost} trail={dragTrail} />

      <aside
        ref={panelRef}
        className={panelClass}
        style={{
          '--spring': ELASTIC_SPRING,
          '--chip-spring': CHIP_SPRING,
          '--spatial-spring': SPATIAL_SPRING,
          '--spring-premium': SPRING_PREMIUM,
          ...spinFocusCssVars(APP_CONFIG.hud),
        }}
        onMouseMove={handlePanelMove}
        onMouseLeave={handlePanelLeave}
        aria-label="VIP betting dashboard"
        aria-hidden={isSpinFocus ? true : undefined}
        data-testid="betting-panel"
        data-hud-phase={hudPhase}
        data-spin-dim={spinDimLevel}
      >
        {isSpinFocus && <div className="hud-spin-veil" aria-hidden />}
        <div
          className={[
            'holo-border-active',
            panelPointerEntryPulsing ? 'holo-border-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
        />
        <div
          className={[
            'glass-reflection-active',
            panelPointerEntryPulsing ? 'glass-reflection-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
        />
        <div
          className={[
            'panel-pointer-active',
            panelPointerEntryPulsing ? 'panel-pointer-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
        />
        <div
          className={[
            'glass-sheen-active',
            panelPointerEntryPulsing ? 'glass-sheen-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
        />
        <div
          className={[
            'glass-depth-layer-active',
            panelPointerEntryPulsing ? 'glass-depth-layer-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
        />

        {isPortraitMobile && (
          <button
            type="button"
            className={[
              'mobile-drawer-toggle',
              drawerOpenGlow ? 'drawer-open-glow-active' : '',
              mobileDrawerTabEntryPulsing ? 'mobile-drawer-tab-entry-pulse' : '',
              mobileDrawerCollapseEntryPulsing ? 'mobile-drawer-collapse-entry-pulse' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setDrawerCollapsed((collapsed) => !collapsed)}
            aria-expanded={!drawerCollapsed}
            aria-controls="betting-drawer-body"
          >
            <span className="drawer-grab" aria-hidden />
            <span className="drawer-toggle-label">{drawerCollapsed ? 'Open bets' : 'Hide bets'}</span>
            <span
              className={[
                'drawer-toggle-meta',
                drawerMetaEntryPulsing ? 'drawer-meta-entry-pulse' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              ${staked.toLocaleString()} at risk
            </span>
          </button>
        )}

        <div
          id="betting-drawer-body"
          className={[
            'mobile-drawer-body',
            'panel-body-dim-target',
            mobileDrawerOpenEntryPulsing ? 'mobile-drawer-open-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
        <div
          className={[
            'cycle-track',
            cycleDropUrgent ? 'cycle-drop-urgency-active' : '',
            cycleDropUrgencyEntryPulsing ? 'cycle-drop-urgency-entry-pulse' : '',
            cycleTrackTickEntryPulsing ? 'cycle-track-tick-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
        >
          <div className="cycle-fill" style={{ width: `${cycleProgress}%` }} />
          <span className="cycle-label">
            {clock.name === 'betting'
              ? `Drop in ${secondsToDrop}s`
              : clock.name === 'locked'
                ? 'No more bets'
                : isSettleReveal
                  ? 'Result'
                  : 'Live spin'}
          </span>
        </div>

        <RecentResultsRail recentResults={recentResults} />

        <div
          className={[
            'panel-header',
            showStakeWarning ? 'stake-risk-warning-active' : '',
            stakeRiskWarningEntryPulsing ? 'stake-risk-warning-entry-pulse' : '',
            favoriteApplyEntryPulsing ? 'favorite-apply-entry-pulse' : '',
            repeatRoundEntryPulsing ? 'repeat-round-entry-pulse' : '',
            stakeCommitEntryPulsing ? 'stake-commit-entry-pulse' : '',
            batchStakeEntryPulsing ? 'batch-stake-entry-pulse' : '',
            settleHeaderBloomEntryPulsing ? 'settle-header-bloom-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div>
            <div className="balance-label">Balance</div>
            <div
              className={[
                'balance-value',
                balanceSettleWinEntryPulsing ? 'balance-settle-win-entry-pulse' : '',
                balanceSettleLossEntryPulsing ? 'balance-settle-loss-entry-pulse' : '',
                faucetEntryPulsing ? 'faucet-refill-entry-pulse' : '',
                balanceLowEntryPulsing ? 'balance-low-entry-pulse' : '',
                balanceLowGlow && !balancePulse.tone && !faucetEntryPulsing && !balanceLowEntryPulsing
                  ? 'balance-low-glow-active'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={`${balance}-${balancePulse.key}-${faucetRefillPulse.key}`}
            >
              ${balance.toLocaleString()}
            </div>
          </div>
          <div
            className={[
              'result-pill',
              displayNumber !== null ? 'result-reveal-active' : '',
              resultPillFlyIn ? 'result-fly-in-entry-pulse' : '',
              resultPillReadyGlow ? 'result-pill-ready-glow-active' : '',
              resultPillReadyEntryPulsing ? 'result-pill-ready-entry-pulse' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={resultPillRevealKey(displayNumber, hudPhase)}
            data-testid="result-pill"
          >
            {displayNumber !== null ? (
              <>
                <span className={`ball ${displayColor}`}>{displayNumber}</span>
                <span className="result-text">{displayColor}</span>
              </>
            ) : (
              <span className="result-text">Awaiting spin</span>
            )}
          </div>
          <div
            className={[
              'staked',
              stakeRiskEntryPulsing ? 'stake-risk-entry-pulse' : '',
              stakedLabelEntryPulsing ? 'staked-label-entry-pulse' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            title={
              showStakeWarning
                ? `${Math.round(stakeRisk.ratio * 100)}% of balance at risk`
                : undefined
            }
          >
            At risk <strong>${staked}</strong>
          </div>
        </div>

        <FairnessPanel
          commit={fairnessCommit}
          audit={lastFairnessAudit}
          history={fairRoundHistory}
          expanded={fairnessOpen}
          onToggle={() => setFairnessOpen((o) => !o)}
          syncMode={syncMode}
          custodyBadge={seedCustodyBadge}
        />

        <SessionStatsPanel
          rounds={sessionRounds}
          recentResults={recentResults}
          chipValues={chipValues}
          selectedChip={selectedChip}
          balance={balance}
          onSelectChip={setSelectedChip}
          expanded={statsOpen}
          onToggle={() => setStatsOpen((o) => !o)}
        />

        <FavoriteBetsPanel
          favorites={favorites}
          currentStaked={staked}
          bettingOpen={bettingOpen}
          expanded={favoritesOpen}
          onToggle={() => setFavoritesOpen((o) => !o)}
          onSave={saveFavoriteBet}
          onApply={applyFavoriteBets}
          onDelete={deleteFavoriteBet}
        />

        <div className="board-mode-tabs" role="tablist" aria-label="Betting layout">
          <button
            type="button"
            role="tab"
            className={[
              'board-mode-tab',
              boardMode === 'classic' ? 'active' : '',
              classicTabGlow ? 'board-mode-tab-glow-active' : '',
              classicTabEntryPulsing ? 'board-mode-tab-entry-pulse' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-selected={boardMode === 'classic'}
            onClick={() => setBoardMode('classic')}
          >
            Classic
          </button>
          <button
            type="button"
            role="tab"
            className={[
              'board-mode-tab',
              boardMode === 'racetrack' ? 'active' : '',
              racetrackTabGlow ? 'board-mode-tab-glow-active' : '',
              racetrackTabEntryPulsing ? 'board-mode-tab-entry-pulse' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-selected={boardMode === 'racetrack'}
            onClick={() => setBoardMode('racetrack')}
          >
            Racetrack
          </button>
        </div>

        {boardMode === 'racetrack' ? (
          <RacetrackPanel
            bets={bets}
            sessionRounds={sessionRounds}
            bettingOpen={bettingOpen}
            litNumbers={pathwayNumbers}
            onHoverHighlight={setHoverHighlight}
            onClearHover={clearHoverHighlight}
            onPlaceStraight={placeBet}
            onPlaceNeighbors={placeNeighbors}
            onPlaceCallBet={placeCallBet}
          />
        ) : (
        <div
          className="board-grid"
          onPointerMove={handleBoardMove}
          onPointerLeave={handleBoardLeave}
          onFocus={handleBoardPointer}
          onBlur={handleBoardLeave}
        >
          <div className="inside-board-wrap">
            <div className="number-grid-wrap">
              <BetBtn
                label="0"
                color="green"
                pathwayClass={
                  hoverHighlight?.type === 'straight' && hoverHighlight.value === 0
                    ? 'pathway-source-active'
                    : hoverHighlight?.type === 'split' && hoverHighlight.value?.startsWith('0,')
                      ? 'pathway-source-active'
                      : ''
                }
                {...betBtnProps('straight', 0)}
              />

              <div className="number-grid-stack">
              <div className="number-grid">
                {[col3, col2, col1].map((col, ri) => (
                  <div key={ri} className="number-row">
                    {col.map((n) => (
                      <BetBtn
                        key={n}
                        label={String(n)}
                        color={getColor(n)}
                        pathwayClass={straightPathwayClass(n)}
                        {...betBtnProps('straight', n)}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div
                className={`inside-zones${dragGhost ? ' drag-active' : ''}`}
                data-testid="inside-bet-zones"
              >
                {insideBetZones.map((zone) => {
                    const key = cellKey(zone.type, zone.value);
                    const props = betBtnProps(zone.type, zone.value);
                    return (
                      <InsideZoneBtn
                        key={`${zone.kind}-${zone.value}`}
                        zone={zone}
                        amount={betAmount(zone.type, zone.value)}
                        ghostBets={ghostByCell.get(key) ?? []}
                        isWinning={props.isWinning}
                        cascadeDelayMs={props.cascadeDelayMs}
                        cascadeEntryPulse={props.cascadeEntryPulse}
                        justPlaced={props.justPlaced}
                        justUndoneRecoil={props.justUndoneRecoil}
                        justUndoneClear={props.justUndoneClear}
                        undoRecoilAmount={props.undoRecoilAmount}
                        justRepeated={props.justRepeated}
                        isDropTarget={props.isDropTarget}
                        disabled={props.disabled}
                        onClick={props.onClick}
                        fullQuality={fullGhostQuality}
                      />
                    );
                  })}
              </div>
              </div>
            </div>
          </div>

          <div className="outside-grid">
            {OUTSIDE.map((cell) => (
              <BetBtn
                key={cell.label}
                {...cell}
                pathwayClass={isOutsideSource(cell, hoverHighlight) ? 'pathway-source-active' : ''}
                {...betBtnProps(cell.type, cell.value, { color: cell.color })}
              />
            ))}
          </div>
        </div>
        )}

        {isSpinFocus && <div className="spin-focus-body-dim" aria-hidden />}

        </div>

        <div className="panel-footer mobile-chip-dock">
          <ChipRack
            chipValues={chipValues}
            selectedChip={selectedChip}
            bettingGlow={chipRackBettingGlow}
            bettingGlowEntryPulse={chipRackBettingGlowEntryPulsing}
            onSelect={setSelectedChip}
            onDragStart={handleChipDragStart}
            onDragMove={handleChipDragMove}
            onDragEnd={handleChipDragEnd}
            onChipHover={feedbackChipHover}
          />
          <div className="actions">
            <div
              className={[
                'stake-scale-cluster',
                scaleReadyGlow ? 'scale-ready-glow-active' : '',
                scaleReadyEntryPulsing ? 'scale-ready-entry-pulse' : '',
                scaleBoardEntryPulsing ? 'scale-board-entry-pulse' : '',
                scaleBoardEntryPulsing && scaleBoardPulse.mode === 'half' ? 'scale-board-entry-pulse-half' : '',
                scaleBoardEntryPulsing && scaleBoardPulse.mode === 'double' ? 'scale-board-entry-pulse-double' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="group"
              aria-label="Quick stake controls"
            >
              <button
                type="button"
                className="btn ghost btn-scale"
                onClick={handleScaleHalf}
                disabled={!canScaleBoardHalf}
                aria-label="Halve all board stakes"
              >
                ½×
              </button>
              <button
                type="button"
                className="btn ghost btn-scale"
                onClick={handleScaleDouble}
                disabled={!canScaleBoardDouble}
                aria-label="Double all board stakes"
              >
                2×
              </button>
            </div>
            <button
              type="button"
              className={[
                'btn',
                'ghost',
                'btn-repeat',
                repeatReadyGlow ? 'repeat-ready-glow-active' : '',
                repeatRoundReadyEntryPulsing ? 'repeat-round-ready-entry-pulse' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={handleRepeat}
              disabled={!canRepeatLastRound}
              aria-label="Repeat last round bets"
            >
              Repeat
            </button>
            <button
              type="button"
              className={[
                'btn',
                'ghost',
                'btn-undo',
                undoReadyGlow ? 'undo-ready-glow-active' : '',
                undoRoundReadyEntryPulsing ? 'undo-round-ready-entry-pulse' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={handleUndo}
              disabled={!canUndoBet}
              aria-label="Undo last bet"
            >
              Undo
            </button>
            <button
              type="button"
              className={[
                'btn',
                'ghost',
                'btn-clear',
                clearReadyGlow ? 'clear-ready-glow-active' : '',
                clearReadyEntryPulsing ? 'clear-ready-entry-pulse' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={clearBets}
              disabled={!bettingOpen}
              aria-label="Clear all bets"
            >
              Clear
            </button>
            <button
              type="button"
              className={[
                'btn',
                'gold',
                faucetReadyGlow ? 'faucet-ready-glow-active' : '',
                faucetReadyEntryPulsing ? 'faucet-ready-entry-pulse' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={requestFaucet}
              aria-label="Refill balance with one thousand dollars"
            >
              $1,000 Refill
            </button>
          </div>
        </div>

        <p
          className={[
            'status-line',
            statusEntryPulsing ? 'status-line-entry-pulse' : '',
            statusLineReadyGlow ? 'status-line-ready-glow-active' : '',
            statusLineReadyEntryPulsing ? 'status-line-ready-entry-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          data-testid="status-line"
        >
          {message}
        </p>
      </aside>
    </>
  );
}
