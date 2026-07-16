import { describe, expect, it } from 'vitest';
import { PerformanceMonitor } from './PerformanceMonitor.jsx';

describe('PerformanceMonitor', () => {
  it('exports the performance monitor component', () => {
    expect(typeof PerformanceMonitor).toBe('function');
  });
});
