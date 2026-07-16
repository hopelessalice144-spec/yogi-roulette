import { describe, expect, it } from 'vitest';
import { FloatingWinText } from './FloatingWinText.jsx';

describe('FloatingWinText', () => {
  it('exports the floating win text component', () => {
    expect(typeof FloatingWinText).toBe('function');
  });
});
