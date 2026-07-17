import { describe, expect, it } from 'vitest';
import { RacetrackPanel } from './RacetrackPanel.jsx';

describe('RacetrackPanel', () => {
  it('exports the racetrack panel component', () => {
    expect(typeof RacetrackPanel).toBe('function');
  });
});
