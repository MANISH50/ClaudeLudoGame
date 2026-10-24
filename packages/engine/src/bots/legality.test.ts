import { describe, expect, it } from 'vitest';
import type { Color } from '../color';
import type { Rules } from '../rules';
import type { BotLevel } from './botLevel';
import { playBotGame } from './testGame';

const GAMES_PER_LEVEL = 2_000;
const ALL_COLORS: readonly Color[] = ['red', 'green', 'yellow', 'blue'];
const HOUSE_RULES: Partial<Rules> = { blocks: true, mustCapture: true, doubleSixRelease: true };

// Player counts and rule sets rotate so the legality check covers 2-4 seats and house rules.
function configFor(game: number): { colors: Color[]; rules: Partial<Rules> } {
  const count = 2 + (game % 3);
  return { colors: ALL_COLORS.slice(0, count), rules: game % 2 === 0 ? {} : HOUSE_RULES };
}

describe.each<BotLevel>(['easy', 'medium'])('%s bot legality', (level) => {
  it(`never picks an illegal move and every ${GAMES_PER_LEVEL} seeded game ends`, () => {
    let illegal = 0;
    for (let game = 0; game < GAMES_PER_LEVEL; game++) {
      const { colors, rules } = configFor(game);
      const result = playBotGame(colors, () => level, game + 1, rules);
      illegal += result.illegalPicks;
      expect(result.final.turn.phase).toBe('over');
    }
    expect(illegal).toBe(0);
  }, 120_000);
});
