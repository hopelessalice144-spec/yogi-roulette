/** Shared Rapier lazy-load promise slots — isolated to avoid GameContext ↔ RapierStage init cycles. */

let rapierModulePromise = null;
let rapierStagePromise = null;

export function getRapierModulePromise() {
  return rapierModulePromise;
}

export function setRapierModulePromise(promise) {
  rapierModulePromise = promise;
}

export function getRapierStagePromise() {
  return rapierStagePromise;
}

export function setRapierStagePromise(promise) {
  rapierStagePromise = promise;
}

export function resetRapierCache() {
  rapierModulePromise = null;
  rapierStagePromise = null;
}
