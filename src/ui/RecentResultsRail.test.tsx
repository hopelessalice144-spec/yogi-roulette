import { describe, expect, it } from 'vitest';
import { RecentResultsRail } from './RecentResultsRail.jsx';

describe('RecentResultsRail', () => {
  it('exports the recent results rail component', () => {
    expect(typeof RecentResultsRail).toBe('function');
  });
});
