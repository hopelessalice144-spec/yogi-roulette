import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluateBet, getColor } from '../lib/math.js';
import { CYCLE_SECONDS, BALL_DROP_AT } from '@core/timer.js';
import {
  boardHighlightSet,
  columnForNumber,
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
import { GhostChipStack, GhostConfettiBurst } from './GhostBetLayer.jsx';
import { FairnessPanel } from './FairnessPanel.jsx';
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
  if (winningNumber === null || winningNumber === undefined) return false;
  return evaluateBet({ type, value, amount: 1 }, winningNumber) > 1;
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
  justPlaced = false,
  ghostBets = [],
  onClick,
  onMagnetMove,
  disabled,
  fullQuality = true,
}) {
  const handleMove = (e) => {
    const el = e.currentTarget;
    updateCellSpotlight(el, e.clientX, e.clientY);
    const rect = el.getBoundingClientRect();
    onMagnetMove?.({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
  };

  const handleLeave = (e) => {
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
        isDropTarget ? 'drop-target' : '',
        isWinning ? 'winning-cell' : '',
        justPlaced ? 'chip-landed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-bet-type={type}
      data-bet-value={value ?? ''}
      data-bet-color={color ?? ''}
      disabled={disabled}
      onClick={() => onClick({ type, value })}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      aria-label={
        amount > 0
          ? `Bet on ${label ?? value}, $${amount} staked`
          : `Bet on ${label ?? value}`
      }
    >
      <span className="bet-spotlight" aria-hidden />
      <span className="bet-glow-casing" aria-hidden />
      <span className="bet-shine" aria-hidden />
      <span className="bet-glass-depth" aria-hidden />
      <span className="sector-glow" aria-hidden />
      <span className="bet-label">{label ?? value}</span>
      <span className="neon-underline" aria-hidden />
      {amount > 0 && <ChipStack amount={amount} justPlaced={justPlaced} />}
      <GhostChipStack bets={ghostBets} fullQuality />
    </button>
  );
}

function MagneticChip({
  value,
  active,
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
      className={`chip ${active ? 'active' : ''}`}
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
      <span className="chip-glow" aria-hidden />
    </button>
  );
}

function InsideZoneBtn({
  zone,
  amount,
  isDropTarget,
  isWinning,
  justPlaced,
  ghostBets,
  onClick,
  disabled,
  fullQuality,
}) {
  return (
    <button
      type="button"
      className={[
        'inside-zone',
        `inside-${zone.kind}`,
        amount ? 'has-chip' : '',
        isDropTarget ? 'drop-target' : '',
        isWinning ? 'winning-cell' : '',
        justPlaced ? 'chip-landed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={insideZoneStyle(zone)}
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
      {amount > 0 && <ChipStack amount={amount} justPlaced={justPlaced} />}
      <GhostChipStack bets={ghostBets} fullQuality={fullQuality} />
    </button>
  );
}

function ChipRack({ chipValues, selectedChip, onSelect, onDragStart, onDragMove, onDragEnd, onChipHover }) {
  const rackRef = useRef(null);
  const chipRegistry = useRef(new Map());
  const draggingChipRef = useRef(null);
  const selectedChipRef = useRef(selectedChip);

  selectedChipRef.current = selectedChip;

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
    <div ref={rackRef} className="chip-rack">
      {chipValues.map((v) => (
        <MagneticChip
          key={v}
          value={v}
          active={selectedChip === v}
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
    placeBet,
    clearBets,
    requestFaucet,
    setHoverHighlight,
    clearHoverHighlight,
    ghostBets,
    ghostConfetti,
    hudPhase,
    fairnessCommit,
    lastFairnessAudit,
    fairRoundHistory,
    syncMode,
    seedCustodyBadge,
    qualitySettings,
    feedbackChipHover,
  } = useGame();

  const panelRef = useRef(null);
  const [dropTargetKey, setDropTargetKey] = useState(null);
  const [dragGhost, setDragGhost] = useState(null);
  const [placedFlash, setPlacedFlash] = useState(null);
  const [fairnessOpen, setFairnessOpen] = useState(false);
  const dragValue = useRef(null);

  const bettingOpen = clock.acceptsBets ?? clock.name === 'betting';
  const isSpinFocus = hudPhase === 'spin-focus';
  const isSettleReveal = hudPhase === 'settle-reveal';

  useEffect(() => {
    if (isSpinFocus) clearHoverHighlight();
  }, [isSpinFocus, clearHoverHighlight]);

  const staked = bets.reduce((s, b) => s + b.amount, 0);
  const cycleProgress = (clock.cycleSecond / CYCLE_SECONDS) * 100;
  const secondsToDrop =
    clock.cycleSecond < BALL_DROP_AT
      ? BALL_DROP_AT - clock.cycleSecond
      : CYCLE_SECONDS - clock.cycleSecond + BALL_DROP_AT;

  const pathwayNumbers = useMemo(
    () => boardHighlightSet(hoverHighlight),
    [hoverHighlight]
  );

  const litColumns = useMemo(() => {
    if (!hoverHighlight?.type) return new Set();
    const cols = new Set();
    for (const n of pathwayNumbers) {
      const c = columnForNumber(n);
      if (c) cols.add(c);
    }
    return cols;
  }, [hoverHighlight, pathwayNumbers]);

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

  const handleChipDragStart = useCallback((value, x, y) => {
    dragValue.current = value;
    setDragGhost({ x, y, value });
  }, []);

  const handleChipDragMove = useCallback(
    (x, y) => {
      setDragGhost((g) => (g ? { ...g, x, y } : null));
      const target = findDropTarget(x, y);
      setDropTargetKey(target ? cellKey(target.type, target.value) : null);
    },
    [findDropTarget]
  );

  const handleChipDragEnd = useCallback(
    async (x, y) => {
      const target = findDropTarget(x, y);
      setDragGhost(null);
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

  const handlePanelMove = useCallback((e) => {
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    el.style.setProperty('--glow-opacity', '1');
  }, []);

  const handlePanelLeave = useCallback(() => {
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
      return 'pathway-source';
    }
    if (INSIDE_BET_TYPES.has(hoverHighlight.type)) {
      return isStraightPathwayLit(n, hoverHighlight) ? 'pathway-lit' : '';
    }
    return isStraightPathwayLit(n, hoverHighlight) ? 'pathway-lit' : '';
  };

  const panelClass = [
    'betting-panel',
    `phase-${clock.name}`,
    `hud-${hudPhase}`,
    bettingOpen ? 'phase-betting-active' : '',
    'panel-enter',
    isSpinFocus ? 'spin-focus' : '',
    isSettleReveal ? 'settle-reveal' : '',
    hoverHighlight ? 'has-3d-highlight' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const betBtnProps = (type, value, extra = {}) => {
    const key = cellKey(type, value);
    return {
      type,
      value,
      amount: betAmount(type, value),
      onClick: handleBetClick,
      disabled: !bettingOpen,
      onMagnetMove: handleMagnetMove,
      isDropTarget: dropTargetKey === key,
      isWinning: isSettleReveal && cellIsWinner(type, value, displayNumber),
      justPlaced: placedFlash === key,
      ghostBets: ghostByCell.get(key) ?? [],
      fullQuality: fullGhostQuality,
      ...extra,
    };
  };

  return (
    <>
      <GhostConfettiBurst events={ghostConfettiEvents} fullQuality={fullGhostQuality} />
      {dragGhost && (
        <div
          className="chip-drag-ghost"
          style={{
            left: dragGhost.x,
            top: dragGhost.y,
            '--chip-spring': CHIP_SPRING,
          }}
          aria-hidden
        >
          ${dragGhost.value}
        </div>
      )}

      <aside
        ref={panelRef}
        className={panelClass}
        style={{
          '--spring': ELASTIC_SPRING,
          '--chip-spring': CHIP_SPRING,
          '--spatial-spring': SPATIAL_SPRING,
          '--spring-premium': SPRING_PREMIUM,
        }}
        onMouseMove={handlePanelMove}
        onMouseLeave={handlePanelLeave}
        aria-label="VIP betting dashboard"
        aria-hidden={isSpinFocus ? true : undefined}
        data-testid="betting-panel"
        data-hud-phase={hudPhase}
      >
        {isSpinFocus && <div className="hud-spin-veil" aria-hidden />}
        <div className="holo-border" aria-hidden />
        <div className="glass-reflection" aria-hidden />
        <div className="magnetic-glow" aria-hidden />
        <div className="glass-sheen" aria-hidden />
        <div className="glass-depth-layer" aria-hidden />

        <div className="cycle-track" aria-hidden>
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

        <div className="panel-header">
          <div>
            <div className="balance-label">Balance</div>
            <div className="balance-value" key={balance}>
              ${balance.toLocaleString()}
            </div>
          </div>
          <div className={`result-pill ${displayNumber !== null ? 'result-reveal' : ''}`}>
            {displayNumber !== null ? (
              <>
                <span className={`ball ${displayColor}`}>{displayNumber}</span>
                <span className="result-text">{displayColor}</span>
              </>
            ) : (
              <span className="result-text">Awaiting spin</span>
            )}
          </div>
          <div className="staked">
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

        {recentResults.length > 0 && (
          <div className="recent-strip" aria-label="Recent results">
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

        <div
          className="board-grid"
          onPointerMove={handleBoardMove}
          onPointerLeave={handleBoardLeave}
          onFocus={handleBoardPointer}
          onBlur={handleBoardLeave}
        >
          {litColumns.size > 0 && (
            <div className="pathway-overlay" aria-hidden>
              {[1, 2, 3].map((c) =>
                litColumns.has(c) ? (
                  <div key={c} className={`pathway-column col-${c} pathway-cascade`} />
                ) : null
              )}
            </div>
          )}

          <div className="inside-board-wrap">
            <div className="number-grid-wrap">
              <BetBtn
                label="0"
                color="green"
                pathwayClass={
                  hoverHighlight?.type === 'straight' && hoverHighlight.value === 0
                    ? 'pathway-source'
                    : hoverHighlight?.type === 'split' && hoverHighlight.value?.startsWith('0,')
                      ? 'pathway-source'
                      : ''
                }
                {...betBtnProps('straight', 0)}
              />

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

              <div className="inside-zones" data-testid="inside-bet-zones">
                {insideBetZones.map((zone) => {
                    const key = cellKey(zone.type, zone.value);
                    const props = betBtnProps(zone.type, zone.value);
                    return (
                      <InsideZoneBtn
                        key={`${zone.kind}-${zone.value}`}
                        zone={zone}
                        amount={betAmount(zone.type, zone.value)}
                        ghostBets={ghostByCell.get(key) ?? []}
                        isWinning={isSettleReveal && cellIsWinner(zone.type, zone.value, displayNumber)}
                        justPlaced={placedFlash === key}
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

          <div className="outside-grid">
            {OUTSIDE.map((cell) => (
              <BetBtn
                key={cell.label}
                {...cell}
                pathwayClass={isOutsideSource(cell, hoverHighlight) ? 'pathway-source' : ''}
                {...betBtnProps(cell.type, cell.value, { color: cell.color })}
              />
            ))}
          </div>
        </div>

        <div className="panel-footer mobile-chip-dock">
          <ChipRack
            chipValues={chipValues}
            selectedChip={selectedChip}
            onSelect={setSelectedChip}
            onDragStart={handleChipDragStart}
            onDragMove={handleChipDragMove}
            onDragEnd={handleChipDragEnd}
            onChipHover={feedbackChipHover}
          />
          <div className="actions">
            <button type="button" className="btn ghost" onClick={clearBets} disabled={!bettingOpen} aria-label="Clear all bets">
              Clear
            </button>
            <button type="button" className="btn gold" onClick={requestFaucet} aria-label="Refill balance with one thousand dollars">
              $1,000 Refill
            </button>
          </div>
        </div>

        <p className="status-line" key={message} data-testid="status-line">
          {message}
        </p>
      </aside>
    </>
  );
}
