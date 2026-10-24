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

// Replaces AudioContext with a stub that counts the sound nodes the client creates.
// Tones use oscillators and the dice rattle uses a buffer source, so both are counted.
// Headless Chromium has no audio device, so checking what the client asks for is the test.
export async function spySound(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const counter = { nodes: 0 };
    (window as unknown as { soundNodes: { nodes: number } }).soundNodes = counter;
    const param = { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
    const node = { connect() {}, disconnect() {} };
    class FakeAudioContext {
      readonly sampleRate = 44100;
      readonly currentTime = 0;
      readonly state = 'running';
      readonly destination = {};
      createOscillator() {
        counter.nodes += 1;
        return { ...node, type: 'sine', frequency: param, start() {}, stop() {} };
      }
      createGain() {
        return { ...node, gain: param };
      }
      createBuffer(_channels: number, length: number) {
        return { getChannelData: () => new Float32Array(length) };
      }
      createBufferSource() {
        counter.nodes += 1;
        return { ...node, buffer: null, start() {} };
      }
      resume() {
        return Promise.resolve();
      }
    }
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
  });
}

export async function soundNodeCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { soundNodes: { nodes: number } }).soundNodes.nodes);
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
