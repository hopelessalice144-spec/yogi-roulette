/**
 * Standalone E2E smoke runner — bypasses @playwright/test CLI (Windows hang workaround).
 * Run: node e2e/smoke.mjs
 */
import { chromium } from 'playwright';
import { installMockCycleClock } from './helpers/mockClock.js';

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173';
const TIMEOUT_MS = 45_000;

function assert(cond, msg) {
  if (!cond) throw new Error(`E2E FAIL: ${msg}`);
}

async function waitForPhaseName(page, name, timeoutMs = 15_000) {
  await page.waitForFunction(
    (expected) =>
      document.querySelector('[data-testid="phase-pill"] strong')?.textContent?.trim() === expected,
    name,
    { timeout: timeoutMs },
  );
}

async function advanceClock(page, seconds, expectPhase) {
  await page.evaluate((s) => window.__e2eAdvanceSeconds(s), seconds);
  if (expectPhase) await waitForPhaseName(page, expectPhase);
  else await page.waitForTimeout(1200);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);

  try {
    await page.addInitScript(installMockCycleClock);
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="betting-panel"]');

    const pillClass = await page.getAttribute('[data-testid="phase-pill"]', 'class');
    assert(pillClass?.includes('phase-betting'), 'starts in betting phase');

    await page.locator('[data-bet-type="red"]').click();
    const statusAfterBet = await page.locator('[data-testid="status-line"]').textContent();
    assert(/\+\$|on red/i.test(statusAfterBet ?? ''), 'bet placed on red');

    const stakedBefore = await page.locator('.staked strong').textContent();

    await advanceClock(page, 15, 'locked');
    const phaseName = await page.locator('[data-testid="phase-pill"] strong').textContent();
    assert(phaseName === 'locked', `bet lock at T-20 (got ${phaseName})`);

    const cycleLabel = await page.locator('.cycle-label').textContent();
    assert(cycleLabel?.includes('No more bets'), 'no more bets label');

    const redDisabled = await page.locator('[data-bet-type="red"]').isDisabled();
    assert(redDisabled, 'bet cells disabled after lock');

    const stakedAfter = await page.locator('.staked strong').textContent();
    assert(stakedAfter === stakedBefore, 'stake unchanged after lock rejection');

    const clearDisabled = await page.getByRole('button', { name: 'Clear all bets' }).isDisabled();
    assert(clearDisabled, 'clear disabled when locked');

    await advanceClock(page, 9, 'spinning');
    const hudPhase = await page.getAttribute('[data-testid="betting-panel"]', 'data-hud-phase');
    assert(hudPhase === 'settle-reveal', `settle reveal at T-0 (got ${hudPhase})`);

    const ballText = await page.locator('.result-pill .ball').textContent();
    assert(/^\d+$/.test(ballText ?? ''), 'winning number displayed');
    const pocket = Number.parseInt(ballText ?? '-1', 10);
    assert(pocket >= 0 && pocket <= 36, `pocket in range (got ${pocket})`);

    const finalStatus = await page.locator('[data-testid="status-line"]').textContent();
    assert(
      /Ball settled on|Ball on|Won|Lost|\+\$/.test(finalStatus ?? ''),
      `settle status message (got: ${finalStatus})`
    );

    console.log('E2E smoke passed — bet lock @ T-20, settle @ T-0, pocket', pocket);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
