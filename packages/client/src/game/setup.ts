import { COLORS, type BotLevel, type Color } from '@ludo/engine';
import type { Seat } from '../runner/GameRunner';
import { COLOR_LABEL } from './colors';

export const LEVEL_LABEL: Readonly<Record<BotLevel, string>> = { easy: "Easy", medium: "Medium" };

export type BotCount = 1 | 2 | 3;
export type HumanCount = 2 | 3 | 4;

// Opponent seats follow clockwise order from Red so the human always starts as Red.
// One bot sits opposite Red, which keeps a two-player game across the board.
const BOT_SEATS: Readonly<Record<BotCount, readonly Color[]>> = {
  1: ['red', 'yellow'],
  2: ['red', 'green', 'yellow'],
  3: ['red', 'green', 'yellow', 'blue'],
};

export function vsBotsSeats(botCount: BotCount, level: BotLevel): Seat[] {
  const colors = BOT_SEATS[botCount];
  return colors.map((color, index): Seat => {
    if (index === 0) return { color, name: 'You', control: { kind: 'human' } };
    return { color, name: `Bot ${COLOR_LABEL[color]}`, control: { kind: 'bot', level } };
  });
}

export function passAndPlaySeats(humanCount: HumanCount): Seat[] {
  return COLORS.slice(0, humanCount).map((color, index): Seat => ({
    color,
    name: `Player ${index + 1}`,
    control: { kind: 'human' },
  }));
}
