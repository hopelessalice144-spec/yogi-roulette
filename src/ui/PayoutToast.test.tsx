import { describe, expect, it } from 'vitest';
import { PayoutToast } from './PayoutToast.jsx';

describe('PayoutToast', () => {
  it('exports the payout toast component', () => {
    expect(typeof PayoutToast).toBe('function');
  });
});
