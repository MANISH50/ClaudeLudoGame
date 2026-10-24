import { expect, test } from '@playwright/test';
import { announcements, finishHumanTurn, recordAnnouncements, soundNodeCount, spySound } from './helpers';

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

  test('sound: a roll plays sound by default', async ({ page }) => {
    await spySound(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start vs bots' }).click();

    await expect(page.getByRole('button', { name: 'Roll the dice' })).toBeEnabled();
    await page.getByRole('button', { name: 'Roll the dice' }).click();
    await expect.poll(() => soundNodeCount(page)).toBeGreaterThan(0);
  });

  test('sound: mute silences effects, and the choice survives a reload', async ({ page }) => {
    await spySound(page);
    await recordAnnouncements(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start vs bots' }).click();
    await expect(page.getByRole('heading', { name: 'Your turn' })).toBeVisible();

    const mute = page.getByRole('button', { name: 'Mute', exact: true });
    await mute.click();
    await expect(mute).toHaveAttribute('aria-pressed', 'true');

    const before = await soundNodeCount(page);
    await page.getByRole('button', { name: 'Roll the dice' }).click();
    // The roll must actually happen, or the silence would prove nothing.
    await expect
      .poll(async () => (await announcements(page)).some((line) => /Red rolled \d/.test(line)))
      .toBe(true);
    expect(await soundNodeCount(page)).toBe(before);

    await page.reload();
    await expect(page.getByRole('button', { name: 'Mute', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('reactions: a reaction floats over the board, shows on the card, and is announced', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start pass and play' }).click();
    await expect(page.locator('.turn-colour')).toHaveText('Player 1');

    await page.getByRole('button', { name: 'Laughing' }).click();

    await expect(page.locator('.reaction-float', { hasText: '😂' })).toBeVisible();
    await expect(page.locator('.player-card--red .player-reaction')).toHaveText('😂');
    await expect(page.getByTestId('reaction-announcer')).toHaveText('Red reacted 😂');
  });
});
