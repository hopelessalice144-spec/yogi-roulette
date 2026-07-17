import { useMemo } from 'react';
import { sparklineGeometry } from '../lib/plSparkline.js';

/**
 * SVG cumulative session P/L sparkline with zero baseline.
 */
export function PlSparkline({ series = [], variant = 'full' }) {
  const size = variant === 'mini' ? { width: 92, height: 28 } : { width: 280, height: 52 };
  const geom = useMemo(
    () => sparklineGeometry(series, size.width, size.height),
    [series, size.width, size.height],
  );

  if (geom.empty) {
    if (variant === 'mini') return null;
    return <p className="stats-empty">Play a few rounds to chart session P/L.</p>;
  }

  const trend = geom.endCumulative >= 0 ? 'up' : 'down';
  const last = geom.endPoint;
  const ariaLabel = `Session profit and loss trend, currently ${geom.endCumulative >= 0 ? 'up' : 'down'} $${Math.abs(geom.endCumulative)}`;

  return (
    <svg
      className={`pl-sparkline-svg ${variant} trend-${trend}`}
      viewBox={`0 0 ${geom.width} ${geom.height}`}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      <line
        className="pl-sparkline-zero"
        x1={geom.padding}
        y1={geom.zeroY}
        x2={geom.width - geom.padding}
        y2={geom.zeroY}
      />
      <path className="pl-sparkline-area" d={geom.areaPath} />
      <path className="pl-sparkline-line" d={geom.linePath} />
      {last && (
        <circle className="pl-sparkline-dot" cx={last.x} cy={last.y} r={variant === 'mini' ? 2.2 : 3.2} />
      )}
    </svg>
  );
}
