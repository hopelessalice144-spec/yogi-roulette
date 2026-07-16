import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('App', () => {
  it('exports the root app component', () => {
    expect(typeof App).toBe('function');
  });
});
