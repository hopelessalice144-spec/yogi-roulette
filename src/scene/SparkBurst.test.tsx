import { describe, expect, it } from 'vitest';
import { SparkBurst } from './SparkBurst.jsx';

describe('SparkBurst', () => {
  it('exports the spark burst component', () => {
    expect(typeof SparkBurst).toBe('function');
  });
});
