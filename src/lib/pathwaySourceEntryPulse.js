/** Brief cell flash when a bet cell newly becomes pathway source. */
export function shouldPathwaySourceEntryPulse(prevSource, nextSource) {
  return prevSource !== true && nextSource === true;
}
