import { CHIP_VALUES } from './bets.js';

/** Greedy chip breakdown for visual stack rendering (largest first). */
export function chipsFromAmount(amount, denominations = CHIP_VALUES) {
  if (!amount || amount <= 0) return [];
  const sorted = [...denominations].sort((a, b) => b - a);
  const result = [];
  let rem = amount;
  for (const d of sorted) {
    while (rem >= d && result.length < 8) {
      result.push(d);
      rem -= d;
    }
  }
  return result;
}

/** Visible stack layers capped for layout. */
export function visibleChipStack(amount, maxLayers = 5) {
  const chips = chipsFromAmount(amount);
  if (chips.length <= maxLayers) return { layers: chips, overflow: 0 };
  return { layers: chips.slice(0, maxLayers), overflow: chips.length - maxLayers };
}
