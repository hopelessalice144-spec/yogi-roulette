/**
 * Anti-clickjacking — break out of hostile iframes (Magecart / UI-redress defense).
 */
export function enforceTopLevelFrame() {
  if (typeof window === 'undefined') return;
  try {
    if (window.self !== window.top) {
      window.top.location = window.self.location;
    }
  } catch {
    // Cross-origin parent blocks access — hide UI to prevent clickjacking
    document.documentElement?.classList?.add('frame-blocked');
  }
}
