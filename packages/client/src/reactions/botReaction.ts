import type { Color, GameEvent, Rng } from '@ludo/engine';
import type { Seat } from '../runner/GameRunner';
import { REACTION, type EmojiChoice, type ReactionMessage } from './reactions';

// Bots should feel present without spamming: most commits get no reply.
export const BOT_REACT_CHANCE = 0.35;

type Mood = 'happy' | 'upset' | 'party';

const MOOD_CHOICES: Readonly<Record<Mood, readonly EmojiChoice[]>> = {
  happy: [REACTION.laugh, REACTION.thumbsUp],
  upset: [REACTION.sad, REACTION.angry],
  party: [REACTION.party],
};

interface Cue {
  readonly color: Color;
  readonly mood: Mood;
}

// The first event that gives a bot something to react to. A finished game is ignored:
// the screen unmounts for the result, so a reply would never be seen.
function cueFor(events: readonly GameEvent[], isBot: (color: Color) => boolean): Cue | null {
  if (events.some((event) => event.type === 'gameOver')) return null;
  for (const event of events) {
    if (event.type === 'captured') {
      if (isBot(event.by)) return { color: event.by, mood: 'happy' };
      if (isBot(event.victim)) return { color: event.victim, mood: 'upset' };
    }
    if (event.type === 'playerFinished' && isBot(event.color)) return { color: event.color, mood: 'party' };
  }
  return null;
}

function pick<T>(items: readonly T[], rng: Rng): T {
  const index = Math.min(Math.floor(rng() * items.length), items.length - 1);
  // The mood tables are never empty, so this index is always in range.
  return items[index] as T;
}

// Pure: the caller supplies the rng, so the probability gate and the emoji choice are replayable.
export function botReactionFor(
  events: readonly GameEvent[],
  seats: readonly Seat[],
  rng: Rng,
): ReactionMessage | null {
  const isBot = (color: Color) => seats.some((s) => s.color === color && s.control.kind === 'bot');
  const cue = cueFor(events, isBot);
  if (cue === null) return null;
  if (rng() >= BOT_REACT_CHANCE) return null;
  const choice = pick(MOOD_CHOICES[cue.mood], rng);
  return { color: cue.color, emoji: choice.emoji, label: choice.label };
}
