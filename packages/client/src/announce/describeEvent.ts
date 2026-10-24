import type { Color, GameEvent } from '@ludo/engine';
import { COLOR_LABEL } from '../game/colors';

const ORDINALS = ['1st', '2nd', '3rd', '4th'];

function ordinal(rank: number): string {
  return ORDINALS[rank - 1] ?? `${rank}th`;
}

// Plain-language lines for the ARIA live region (Spec 7). Returns null for silent events.
export function describeEvent(event: GameEvent): string | null {
  switch (event.type) {
    case 'turnStarted':
      return `${COLOR_LABEL[event.color]}'s turn`;
    case 'rolled':
      return `${COLOR_LABEL[event.color]} rolled ${event.value}`;
    case 'forfeited':
      return `${COLOR_LABEL[event.color]} rolled a third six and forfeits the turn`;
    case 'passed':
      return `${COLOR_LABEL[event.color]} has no legal move`;
    case 'released':
      return `${COLOR_LABEL[event.color]} brought a token out of base`;
    case 'moved':
      return `${COLOR_LABEL[event.color]} moved token ${event.tokenIndex + 1}`;
    case 'captured':
      return `${COLOR_LABEL[event.by]} captured a ${COLOR_LABEL[event.victim]} token`;
    case 'reachedHome':
      return `${COLOR_LABEL[event.color]} finished a token`;
    case 'extraRoll':
      return `${COLOR_LABEL[event.color]} rolls again`;
    case 'playerFinished':
      return `${COLOR_LABEL[event.color]} finished ${ordinal(event.rank)}`;
    case 'gameOver':
      return `Game over. ${event.ranking.map((color: Color, i: number) => `${ordinal(i + 1)} ${COLOR_LABEL[color]}`).join(', ')}`;
  }
}

export function describeEvents(events: readonly GameEvent[]): string {
  return events
    .map(describeEvent)
    .filter((line): line is string => line !== null)
    .join('. ');
}
