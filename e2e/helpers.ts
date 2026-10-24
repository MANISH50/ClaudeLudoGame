import { expect, type Page } from '@playwright/test';

// Records every text the ARIA live region shows, so a test can check what a screen reader would have heard.
export async function recordAnnouncements(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { announcements: string[] }).announcements = seen;
    const observer = new MutationObserver(() => {
      const text = document.querySelector('[data-testid="announcer"]')?.textContent ?? '';
      if (text !== '' && seen[seen.length - 1] !== text) seen.push(text);
    });
    // observing document works before any element exists, so the observer attaches during the init script.
    observer.observe(document, { subtree: true, childList: true, characterData: true });
  });
}

export async function announcements(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { announcements: string[] }).announcements ?? []);
}

// Plays the current human turn to its end: roll, then move whenever a move is offered,
// until the colour tag shows the turn has passed to `nextPlayer`.
export async function finishHumanTurn(page: Page, nextPlayer: string): Promise<void> {
  const roll = page.getByRole('button', { name: 'Roll the dice' });
  const moves = page.locator('.move-button');
  const turnTag = page.locator('.turn-colour');
  await expect
    .poll(
      async () => {
        if ((await turnTag.textContent()) === nextPlayer) return 'done';
        if ((await moves.count()) > 0) {
          await moves.first().click();
        } else if (await roll.isEnabled()) {
          await roll.click();
        }
        return 'playing';
      },
      { timeout: 60_000, intervals: [150] },
    )
    .toBe('done');
}
