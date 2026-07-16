import { describe, expect, it } from 'vitest';
import {
  BALL_DROP_AT,
  BALL_MAGNET_AT,
  BALL_PHYSICS_AT,
  BALL_SETTLE_AT,
} from '@core/timer.js';
import { GAME_STATES, resolveGameState, resolveSpinState } from './gamePhase.js';

describe('gamePhase', () => {
  it('exports frozen betting and locked presets', () => {
    expect(GAME_STATES.betting).toEqual({
      ballPhase: 'orbit',
      cameraMode: 'lounge',
      wheelSpinSpeed: 0.42,
      timeScale: 1,
    });
    expect(GAME_STATES.locked).toEqual({
      ballPhase: 'orbit',
      cameraMode: 'tension',
      wheelSpinSpeed: 1.5,
      timeScale: 1,
    });
  });

  describe('resolveSpinState', () => {
    it('returns descent with rim camera at ball drop', () => {
      expect(resolveSpinState(BALL_DROP_AT)).toEqual({
        ballPhase: 'descent',
        cameraMode: 'rim',
        wheelSpinSpeed: 2.8,
        timeScale: 0.88,
        spinProgress: 0,
        message: 'Ball descending into the bowl…',
      });
    });

    it('switches to drop camera late in descent', () => {
      const lateDrop = BALL_DROP_AT + (BALL_PHYSICS_AT - BALL_DROP_AT) * 0.6;
      const state = resolveSpinState(lateDrop);
      expect(state.ballPhase).toBe('descent');
      expect(state.cameraMode).toBe('drop');
      expect(state.spinProgress).toBeCloseTo(0.6, 5);
    });

    it('returns free chase phase during physics window', () => {
      expect(resolveSpinState(BALL_PHYSICS_AT)).toMatchObject({
        ballPhase: 'free',
        cameraMode: 'chase',
        wheelSpinSpeed: 3.2,
        timeScale: 1,
        spinProgress: 0,
      });
      expect(resolveSpinState(BALL_PHYSICS_AT + 1)).toMatchObject({
        ballPhase: 'free',
        cameraMode: 'chase',
      });
    });

    it('returns guided slowmo during magnet window', () => {
      expect(resolveSpinState(BALL_MAGNET_AT)).toMatchObject({
        ballPhase: 'guided',
        cameraMode: 'slowmo',
        spinProgress: 0,
        guideStrength: 0.65,
      });
    });

    it('returns macro settle state at and after settle second', () => {
      expect(resolveSpinState(BALL_SETTLE_AT)).toEqual({
        ballPhase: 'guided',
        cameraMode: 'macro',
        wheelSpinSpeed: 0.85,
        timeScale: 0.4,
        spinProgress: 1,
        guideStrength: 1,
      });
      expect(resolveSpinState(BALL_SETTLE_AT + 0.5).cameraMode).toBe('macro');
    });
  });

  describe('resolveGameState', () => {
    it('maps betting and locked clocks to presets', () => {
      expect(resolveGameState({ name: 'betting', cycleSecond: 5 })).toEqual({
        ...GAME_STATES.betting,
        phaseName: 'betting',
      });
      expect(resolveGameState({ name: 'locked', cycleSecond: 22 })).toEqual({
        ...GAME_STATES.locked,
        phaseName: 'locked',
      });
    });

    it('delegates spinning clocks to resolveSpinState', () => {
      const spinning = resolveGameState({ name: 'spinning', cycleSecond: BALL_DROP_AT });
      expect(spinning.phaseName).toBe('spinning');
      expect(spinning.ballPhase).toBe('descent');
      expect(spinning.cameraMode).toBe('rim');
    });

    it('falls back to betting preset for unknown phase names', () => {
      expect(resolveGameState({ name: 'results', cycleSecond: 0 })).toEqual({
        ...GAME_STATES.betting,
        phaseName: 'results',
      });
    });
  });
});
