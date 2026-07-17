/** Build SVG path geometry for a cumulative P/L sparkline. */
export function sparklineGeometry(series, width = 280, height = 52, padding = 3) {
  if (!series?.length) {
    return {
      empty: true,
      linePath: '',
      areaPath: '',
      zeroY: height / 2,
      endCumulative: 0,
      endPoint: null,
      width,
      height,
      padding,
    };
  }

  const values = series.map((point) => point.cumulative);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = Math.max(max - min, 1);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const xAt = (index) =>
    padding + (series.length === 1 ? innerW / 2 : (index / (series.length - 1)) * innerW);
  const yAt = (value) => padding + innerH - ((value - min) / range) * innerH;
  const zeroY = yAt(0);

  const points = series.map((point, index) => ({
    x: xAt(index),
    y: yAt(point.cumulative),
    cumulative: point.cumulative,
    cycleId: point.cycleId,
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ');

  const last = points[points.length - 1];
  const first = points[0];
  const areaPath = `${linePath} L${last.x.toFixed(2)},${zeroY.toFixed(2)} L${first.x.toFixed(2)},${zeroY.toFixed(2)} Z`;

  return {
    empty: false,
    linePath,
    areaPath,
    zeroY,
    endCumulative: last.cumulative,
    endPoint: last,
    width,
    height,
    padding,
  };
}
