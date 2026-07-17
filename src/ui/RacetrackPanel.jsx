import { useCallback, useMemo, useState } from 'react';
import { getColor } from '../lib/math.js';
import { wheelHeatLevels } from '../lib/sessionStats.js';
import {
  RACETRACK_SECTORS,
  SECTOR_LIST,
  callBetUnits,
  neighborHighlight,
  racetrackLayout,
  sectorForNumber,
  sectorHighlight,
  wheelNeighbors,
} from '../lib/racetrack.js';

const NEIGHBOR_OPTIONS = [1, 2, 3];

function RacetrackNumber({
  number,
  x,
  y,
  color,
  staked,
  lit,
  sectorId,
  heatLevel,
  showHeat,
  disabled,
  onHover,
  onLeave,
  onSelect,
}) {
  const heatClass = showHeat && heatLevel && heatLevel !== 'neutral' ? `heat-${heatLevel}` : '';
  return (
    <button
      type="button"
      className={[
        'racetrack-pocket',
        color,
        sectorId ? `sector-${sectorId}` : '',
        staked ? 'has-stake' : '',
        lit ? 'lit' : '',
        heatClass,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      disabled={disabled}
      data-bet-type="straight"
      data-bet-value={number}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onClick={() => onSelect(number)}
      aria-label={
        staked > 0 ? `Number ${number}, $${staked} staked` : `Bet on number ${number}`
      }
    >
      <span className="racetrack-pocket-face">{number}</span>
      {staked > 0 && <span className="racetrack-pocket-stake">${staked}</span>}
    </button>
  );
}

export function RacetrackPanel({
  bets,
  sessionRounds,
  bettingOpen,
  litNumbers,
  onHoverHighlight,
  onClearHover,
  onPlaceStraight,
  onPlaceNeighbors,
  onPlaceCallBet,
}) {
  const [neighborRadius, setNeighborRadius] = useState(2);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const layout = useMemo(() => racetrackLayout(), []);
  const litSet = useMemo(() => litNumbers ?? new Set(), [litNumbers]);
  const heat = useMemo(() => wheelHeatLevels(sessionRounds ?? []), [sessionRounds]);

  const stakeByNumber = useMemo(() => {
    const map = new Map();
    for (const bet of bets) {
      if (bet.type === 'straight') {
        map.set(Number(bet.value), (map.get(Number(bet.value)) ?? 0) + bet.amount);
      }
    }
    return map;
  }, [bets]);

  const handleNumberHover = useCallback(
    (number) => {
      onHoverHighlight?.(neighborHighlight(number, neighborRadius));
    },
    [neighborRadius, onHoverHighlight]
  );

  const handleSectorHover = useCallback(
    (sectorId) => {
      onHoverHighlight?.(sectorHighlight(sectorId));
    },
    [onHoverHighlight]
  );

  const handleNumberSelect = useCallback(
    (number) => {
      const neighbors = wheelNeighbors(number, neighborRadius);
      if (neighbors.length > 1) {
        onPlaceNeighbors?.(neighbors);
      } else {
        onPlaceStraight?.({ type: 'straight', value: number });
      }
    },
    [neighborRadius, onPlaceNeighbors, onPlaceStraight]
  );

  return (
    <section className="racetrack-panel" data-testid="racetrack-panel">
      <div className="racetrack-toolbar">
        <span className="racetrack-toolbar-label">Neighbors</span>
        <div className="neighbor-picker" role="group" aria-label="Wheel neighbor spread">
          {NEIGHBOR_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={`neighbor-btn${neighborRadius === n ? ' active' : ''}`}
              onClick={() => setNeighborRadius(n)}
              aria-pressed={neighborRadius === n}
            >
              ±{n}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`heatmap-toggle${showHeatmap ? ' active' : ''}`}
          onClick={() => setShowHeatmap((v) => !v)}
          aria-pressed={showHeatmap}
          title="Toggle session hot/cold heatmap"
        >
          Heat
        </button>
      </div>

      {showHeatmap && heat.ready && (
        <div className="racetrack-heat-legend" aria-hidden>
          <span className="heat-key hot">Hot</span>
          <span className="heat-key warm">Warm</span>
          <span className="heat-key cool">Cool</span>
          <span className="heat-key cold">Cold</span>
        </div>
      )}

      <div className="racetrack-oval-wrap">
        <div className="racetrack-oval" aria-hidden />
        <div className="racetrack-track">
          {layout.map(({ number, x, y }) => (
            <RacetrackNumber
              key={number}
              number={number}
              x={x}
              y={y}
              color={getColor(number)}
              sectorId={sectorForNumber(number)}
              heatLevel={heat.levels.get(number)}
              showHeat={showHeatmap && heat.ready}
              staked={stakeByNumber.get(number) ?? 0}
              lit={litSet.has(number)}
              disabled={!bettingOpen}
              onHover={() => handleNumberHover(number)}
              onLeave={onClearHover}
              onSelect={handleNumberSelect}
            />
          ))}
        </div>
      </div>

      <div className="racetrack-call-bets" role="group" aria-label="Announced bets">
        {SECTOR_LIST.map((sector) => {
          const units = callBetUnits(sector.legs);
          return (
            <button
              key={sector.id}
              type="button"
              className={`call-bet-btn sector-${sector.id}`}
              disabled={!bettingOpen}
              onMouseEnter={() => handleSectorHover(sector.id)}
              onMouseLeave={onClearHover}
              onFocus={() => handleSectorHover(sector.id)}
              onBlur={onClearHover}
              onClick={() => onPlaceCallBet?.(sector)}
              aria-label={`${sector.label} — ${units} chips`}
            >
              <span className="call-bet-short">{sector.short}</span>
              <span className="call-bet-units">{units}×</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
