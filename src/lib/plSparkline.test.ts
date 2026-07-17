import { describe, expect, it } from 'vitest';
import { sparklineGeometry } from './plSparkline.js';

describe('plSparkline', () => {
  it('builds line and area paths for cumulative P/L points', () => {
    const geom = sparklineGeometry(
      [
        { cycleId: 1, cumulative: -10, net: -10 },
        { cycleId: 2, cumulative: 20, net: 30 },
        { cycleId: 3, cumulative: 5, net: -15 },
      ],
      100,
      40,
      2,
    );

    expect(geom.empty).toBe(false);
    expect(geom.linePath.startsWith('M')).toBe(true);
    expect(geom.areaPath.endsWith('Z')).toBe(true);
    expect(geom.endCumulative).toBe(5);
    expect(geom.zeroY).toBeGreaterThan(0);
    expect(geom.endPoint?.x).toBe(98);
  });

  it('returns empty geometry for no data', () => {
    expect(sparklineGeometry([]).empty).toBe(true);
  });
});
