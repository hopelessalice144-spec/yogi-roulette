import { describe, expect, it } from 'vitest';
import { shouldBatchStakePulse } from './batchStakePulse.js';

describe('batchStakePulse', () => {
  it('pulses only on successful batch commit', () => {
    expect(shouldBatchStakePulse(true)).toBe(true);
    expect(shouldBatchStakePulse(false)).toBe(false);
  });
});
