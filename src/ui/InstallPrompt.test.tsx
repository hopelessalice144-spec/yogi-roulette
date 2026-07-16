import { describe, expect, it } from 'vitest';
import { InstallPrompt } from './InstallPrompt.jsx';

describe('InstallPrompt', () => {
  it('exports the install prompt component', () => {
    expect(typeof InstallPrompt).toBe('function');
  });
});
