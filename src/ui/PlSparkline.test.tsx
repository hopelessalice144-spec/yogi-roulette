import { describe, expect, it } from 'vitest';
import { PlSparkline } from './PlSparkline.jsx';

describe('PlSparkline', () => {
  it('exports the session P/L sparkline component', () => {
    expect(typeof PlSparkline).toBe('function');
  });
});
