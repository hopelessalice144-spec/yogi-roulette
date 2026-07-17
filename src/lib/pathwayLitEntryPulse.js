/** Brief cell flash when a bet cell newly enters pathway-lit highlight. */
export function shouldPathwayLitEntryPulse(prevLit, nextLit) {
  return prevLit !== true && nextLit === true;
}
