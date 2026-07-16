function GhostChip({ bet, fullQuality }) {
  const dropY = fullQuality ? (1 - bet.dropT) * -28 : (1 - bet.dropT) * -14;
  const scale = 0.72 + bet.dropT * 0.28;

  return (
    <span
      className={`ghost-chip ${bet.landed ? 'ghost-chip-landed' : 'ghost-chip-falling'}`}
      style={{
        '--ghost-hue': `${bet.hue}deg`,
        '--ghost-drop': `${dropY}px`,
        '--ghost-scale': scale,
      }}
      title={`${bet.vipName} · $${bet.amount}`}
    >
      <span className="ghost-chip-ring" aria-hidden />
      <span className="ghost-chip-face">${bet.amount}</span>
    </span>
  );
}

export function GhostChipStack({ bets, fullQuality }) {
  if (!bets?.length) return null;
  return (
    <span className="ghost-chip-stack" aria-hidden>
      {bets.map((b) => (
        <GhostChip key={b.id} bet={b} fullQuality={fullQuality} />
      ))}
    </span>
  );
}

/** Holographic confetti over winning ghost chips at settle. */
export function GhostConfettiBurst({ events, fullQuality }) {
  if (!fullQuality || events.length === 0) return null;

  return (
    <div className="ghost-confetti-layer" aria-hidden>
      {events.map((ev) =>
        Array.from({ length: 8 }, (_, i) => (
          <i
            key={`${ev.id}-${i}`}
            className="ghost-confetti-bit"
            style={{
              '--gc-hue': `${ev.hue}deg`,
              '--gc-i': i,
              left: `${12 + (i * 11) % 76}%`,
            }}
          />
        ))
      )}
    </div>
  );
}
