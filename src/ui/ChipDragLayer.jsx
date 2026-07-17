/**
 * Dragged chip ghost + motion trail streaks.
 */

function trailAngle(from, to) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

function trailLength(from, to) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

export function ChipDragLayer({ ghost, trail = [] }) {
  if (!ghost) return null;

  const segments = [];
  for (let i = 1; i < trail.length; i += 1) {
    const from = trail[i - 1];
    const to = trail[i];
    const len = trailLength(from, to);
    if (len < 4) continue;
    segments.push({
      key: `${from.t}-${to.t}`,
      x: (from.x + to.x) * 0.5,
      y: (from.y + to.y) * 0.5,
      angle: trailAngle(from, to),
      length: len,
      fade: i / trail.length,
    });
  }

  return (
    <div className="chip-drag-layer" aria-hidden data-testid="chip-drag-layer">
      {trail.map((point, i) => (
        <span
          key={point.t}
          className="chip-drag-trail-dot"
          style={{
            left: point.x,
            top: point.y,
            '--trail-fade': 0.2 + (i / Math.max(1, trail.length)) * 0.5,
            '--trail-scale': 0.5 + (i / Math.max(1, trail.length)) * 0.35,
          }}
        />
      ))}
      {segments.map((seg) => (
        <span
          key={seg.key}
          className="chip-drag-trail-streak"
          style={{
            left: seg.x,
            top: seg.y,
            width: Math.min(72, seg.length * 0.85),
            '--trail-angle': `${seg.angle}deg`,
            '--trail-fade': seg.fade * 0.55,
          }}
        />
      ))}
      <div
        className="chip-drag-ghost"
        style={{
          left: ghost.x,
          top: ghost.y,
          '--chip-spring': ghost.spring,
          '--trail-angle': `${ghost.angle ?? -24}deg`,
          '--trail-speed': Math.min(1, ghost.speed ?? 0.3),
        }}
      >
        ${ghost.value}
      </div>
    </div>
  );
}
