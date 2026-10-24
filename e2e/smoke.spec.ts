import { expect, test } from '@playwright/test';
import { announcements, finishHumanTurn, recordAnnouncements } from './helpers';

test.describe('smoke', () => {
  test('vs bots: roll, make a move, and the live region announces both', async ({ page }) => {
    await recordAnnouncements(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start vs bots' }).click();

    const roll = page.getByRole('button', { name: 'Roll the dice' });
    await expect(page.getByRole('heading', { name: 'Your turn' })).toBeVisible();
    await expect(roll).toBeEnabled();
    await roll.click();

    // Without a six every token stays in base, so the turn may pass. Keep rolling until a move is offered.
    const moves = page.locator('.move-button');
    await expect
      .poll(
        async () => {
          if ((await moves.count()) > 0) return 'move';
          if (await roll.isEnabled()) await roll.click();
          return 'waiting';
        },
        { timeout: 90_000, intervals: [200] },
      )
      .toBe('move');
    await moves.first().click();

    await expect
      .poll(async () => (await announcements(page)).some((line) => /Red moved token \d/.test(line)))
      .toBe(true);
    const heard = await announcements(page);
    expect(heard.some((line) => /Red rolled \d/.test(line))).toBe(true);
  });

  test('pass and play: two humans each take one full turn', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start pass and play' }).click();

    await expect(page.getByRole('heading', { name: 'Your turn' })).toBeVisible();
    await expect(page.locator('.turn-colour')).toHaveText('Player 1');

    // Player 1 plays until the turn passes to Player 2, then Player 2 plays until it returns.
    await finishHumanTurn(page, 'Player 2');
    await expect(page.locator('.turn-colour')).toHaveText('Player 2');
    await expect(page.getByRole('heading', { name: 'Your turn' })).toBeVisible();

    await finishHumanTurn(page, 'Player 1');
    await expect(page.locator('.turn-colour')).toHaveText('Player 1');
  });
});
