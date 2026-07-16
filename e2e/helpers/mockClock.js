/**
 * Deterministic wall-clock for Playwright — pins cycle to betting second 5.
 * Injected via page.addInitScript before navigation.
 */
export function installMockCycleClock() {
  const realDate = Date;
  const baseSec = Math.floor(realDate.now() / 1000);
  const cycleStartSec = Math.floor(baseSec / 30) * 30;
  let virtualMs = (cycleStartSec + 5) * 1000;

  globalThis.__e2eAdvanceSeconds = (seconds) => {
    virtualMs += Math.floor(seconds) * 1000;
  };

  globalThis.__e2eCycleSecond = () => Math.floor(virtualMs / 1000) % 30;

  class MockDate extends realDate {
    constructor(...args) {
      if (args.length === 0) {
        super(virtualMs);
      } else {
        super(...args);
      }
    }

    static now() {
      return virtualMs;
    }
  }

  globalThis.Date = MockDate;
}
