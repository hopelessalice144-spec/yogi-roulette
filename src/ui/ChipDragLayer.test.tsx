import { describe, expect, it } from 'vitest';
import { ChipDragLayer } from './ChipDragLayer.jsx';

describe('ChipDragLayer', () => {
  it('exports the chip drag layer component', () => {
    expect(typeof ChipDragLayer).toBe('function');
  });
});
