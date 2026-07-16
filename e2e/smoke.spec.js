import { test, expect } from '@playwright/test';
import { installMockCycleClock } from './helpers/mockClock.js';

/** Advance virtual cycle clock and wait for React ticker (1 Hz). */
async function advanceClock(page, seconds) {
  await page.evaluate((s) => window.__e2eAdvanceSeconds(s), seconds);
  await page.waitForTimeout(1200);
}

test.describe('Yogi Roulette smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(installMockCycleClock);
    await page.goto('/');
    await page.waitForSelector('[data-testid="betting-panel"]');
    await expect(page.locator('[data-testid="phase-pill"]')).toHaveClass(/phase-betting/);
  });

  test('cycle smoke: bet lock at T-20 and settle at T-0', async ({ page }) => {
    const redBet = page.locator('[data-bet-type="red"]');
    await redBet.click();

    await expect(page.locator('[data-testid="status-line"]')).toContainText(/\+\$|on red/i, {
      timeout: 8_000,
    });

    const stakedBefore = await page.locator('.staked strong').textContent();

    // Virtual T-20 — betting closes (5 → 20)
    await advanceClock(page, 15);

    await expect(page.locator('[data-testid="phase-pill"] strong')).toHaveText('locked', {
      timeout: 5_000,
    });
    await expect(page.locator('.cycle-label')).toContainText('No more bets');

    await redBet.click({ force: true });
    const redDisabled = await redBet.isDisabled();
    expect(redDisabled).toBe(true);
    await expect(page.locator('.staked strong')).toHaveText(stakedBefore ?? '');
    await expect(page.getByRole('button', { name: 'Clear all bets' })).toBeDisabled();

    // Virtual T-0 — settle at second 29 (20 → 29)
    await advanceClock(page, 9);

    await expect(page.locator('[data-testid="betting-panel"]')).toHaveAttribute(
      'data-hud-phase',
      'settle-reveal',
      { timeout: 8_000 }
    );

    const resultBall = page.locator('.result-pill .ball');
    await expect(resultBall).toBeVisible({ timeout: 8_000 });

    const num = await resultBall.textContent();
    expect(num).toMatch(/^\d+$/);
    const pocket = Number.parseInt(num ?? '-1', 10);
    expect(pocket).toBeGreaterThanOrEqual(0);
    expect(pocket).toBeLessThanOrEqual(36);

    await expect(page.locator('[data-testid="status-line"]')).toContainText(
      /Ball settled on|Ball on|Won|Lost|\+\$/
    );
  });
});
