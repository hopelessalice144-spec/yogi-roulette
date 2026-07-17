import { describe, expect, it } from 'vitest';
import {
  cycleDropSecondsLeft,
  CYCLE_DROP_URGENCY_SECONDS,
  shouldCycleDropUrgency,
} from './cycleDropUrgency.js';

describe('cycleDropUrgency', () => {
  it('counts down seconds until ball drop', () => {
    expect(cycleDropSecondsLeft(19)).toBe(6);
    expect(cycleDropSecondsLeft(24)).toBe(1);
    expect(cycleDropSecondsLeft(25)).toBe(0);
  });

  it('pulses only in final seconds before drop during betting or lock', () => {
    expect(shouldCycleDropUrgency(19, 'betting')).toBe(false);
    expect(shouldCycleDropUrgency(20, 'locked')).toBe(true);
    expect(shouldCycleDropUrgency(24, 'locked')).toBe(true);
    expect(shouldCycleDropUrgency(22, 'spinning')).toBe(false);
    expect(CYCLE_DROP_URGENCY_SECONDS).toBe(5);
  });
});
