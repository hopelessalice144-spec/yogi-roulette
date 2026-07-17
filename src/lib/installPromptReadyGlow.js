/** Subtle install-panel pulse while the PWA install prompt is available. */
export function shouldInstallPromptReadyGlow(visible) {
  return visible === true;
}
