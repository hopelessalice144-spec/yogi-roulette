import { describe, expect, it } from 'vitest';
import { BALL_SETTLE_AT } from './timer.js';
import { RoundPhase, resolveRoundPhase } from './roundStateMachine.js';

describe('roundStateMachine', () => {
  it('maps engine clock phases to round FSM', () => {
    expect(resolveRoundPhase({ name: 'betting', cycleSecond: 12 })).toBe(
      RoundPhase.PLACING_BETS
    );
    expect(resolveRoundPhase({ name: 'locked', cycleSecond: 22 })).toBe(
      RoundPhase.BETS_CLOSED
    );
    expect(resolveRoundPhase({ name: 'spinning', cycleSecond: 26 })).toBe(
      RoundPhase.SPINNING
    );
    expect(resolveRoundPhase({ name: 'spinning', cycleSecond: BALL_SETTLE_AT })).toBe(
      RoundPhase.SETTLING
    );
  });
});
