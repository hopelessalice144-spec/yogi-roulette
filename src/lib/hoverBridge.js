/**
 * Zero-lag 2D→3D hover bridge — ref updates instantly, React state batched per frame.
 */

export function createHoverBridge(highlightRef, setState) {
  let pending = undefined;
  let scheduled = false;
  let cleared = false;

  function flush() {
    scheduled = false;
    if (cleared) {
      setState(null);
      return;
    }
    if (pending !== undefined) setState(pending);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(flush);
  }

  return {
    push(highlight) {
      cleared = false;
      pending = highlight;
      highlightRef.current = highlight;
      schedule();
    },
    clear() {
      cleared = true;
      pending = null;
      highlightRef.current = null;
      schedule();
    },
    pushImmediate(highlight) {
      cleared = false;
      pending = highlight;
      highlightRef.current = highlight;
      setState(highlight);
    },
  };
}
