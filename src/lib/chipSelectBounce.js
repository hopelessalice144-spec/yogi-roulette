/** True when chip selection actually changed. */
export function shouldChipSelectBounce(prevValue, nextValue) {
  return prevValue !== nextValue && Number.isFinite(Number(nextValue));
}
