import { describe, expect, it } from 'vitest';
import { winnerOf, playBotGame } from './testGame';

const GAMES = 200;
const MIN_MEDIUM_WIN_RATE = 0.6;

// Medium takes seat 0 in the first half and seat 1 in the second, so seat order does not decide the result.
describe('Medium vs Easy, 2 players', () => {
  it(`Medium wins at least ${MIN_MEDIUM_WIN_RATE * 100}% of ${GAMES} seeded games`, () => {
    let mediumWins = 0;
    for (let game = 0; game < GAMES; game++) {
      const mediumColor = game < GAMES / 2 ? 'red' : 'green';
      const result = playBotGame(['red', 'green'], (color) => (color === mediumColor ? 'medium' : 'easy'), game + 1);
      if (winnerOf(result.final) === mediumColor) mediumWins++;
    }
    const rate = mediumWins / GAMES;
    expect(rate, `Medium won ${mediumWins}/${GAMES} (${(rate * 100).toFixed(1)}%)`).toBeGreaterThanOrEqual(
      MIN_MEDIUM_WIN_RATE,
    );
  }, 120_000);
});
