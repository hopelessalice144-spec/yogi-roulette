import { describe, expect, it } from 'vitest';
import { shouldChipSelectBounce } from './chipSelectBounce.js';

describe('chipSelectBounce', () => {
  it('bounces only when selection value changes', () => {
    expect(shouldChipSelectBounce(25, 50)).toBe(true);
    expect(shouldChipSelectBounce(25, 25)).toBe(false);
    expect(shouldChipSelectBounce(25, NaN)).toBe(false);
  });
});
