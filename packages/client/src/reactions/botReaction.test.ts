import { describe, expect, it } from 'vitest';
import type { GameEvent, Rng } from '@ludo/engine';
import type { Seat } from '../runner/GameRunner';
import { BOT_REACT_CHANCE, botReactionFor } from './botReaction';
import { REACTION } from './reactions';

// Red is the human; the other three seats are bots.
const seats: Seat[] = [
  { color: 'red', name: 'You', control: { kind: 'human' } },
  { color: 'green', name: 'Bot G', control: { kind: 'bot', level: 'easy' } },
  { color: 'yellow', name: 'Bot Y', control: { kind: 'bot', level: 'medium' } },
  { color: 'blue', name: 'Bot B', control: { kind: 'bot', level: 'easy' } },
];

// Constant rng: 0 passes the probability gate and picks the first choice.
const always: Rng = () => 0;
// Just under 1 fails the gate, so nothing should be said.
const never: Rng = () => 0.999;

function captureBy(by: 'red' | 'green' | 'yellow' | 'blue', victim: 'red' | 'green' | 'yellow' | 'blue'): GameEvent {
  return { type: 'captured', by, victim, victimTokenIndex: 0, square: 10 };
}

describe('botReactionFor', () => {
  it('a bot that captures reacts happily', () => {
    const reaction = botReactionFor([captureBy('green', 'red')], seats, always);
    expect(reaction?.color).toBe('green');
    expect([REACTION.laugh.emoji, REACTION.thumbsUp.emoji]).toContain(reaction?.emoji);
  });

  it('a bot that is captured reacts sadly or angrily', () => {
    const reaction = botReactionFor([captureBy('red', 'yellow')], seats, always);
    expect(reaction?.color).toBe('yellow');
    expect([REACTION.sad.emoji, REACTION.angry.emoji]).toContain(reaction?.emoji);
  });

  it('a bot that finishes celebrates', () => {
    const reaction = botReactionFor([{ type: 'playerFinished', color: 'blue', rank: 1 }], seats, always);
    expect(reaction).toEqual({ color: 'blue', emoji: REACTION.party.emoji, label: REACTION.party.label });
  });

  it('never reacts for the human seat', () => {
    expect(botReactionFor([{ type: 'playerFinished', color: 'red', rank: 1 }], seats, always)).toBeNull();
    // A human captures a bot: the bot is the one who reacts, not the human.
    expect(botReactionFor([captureBy('red', 'green')], seats, always)?.color).toBe('green');
  });

  it('ignores ordinary moves, rolls and turn changes', () => {
    const quiet: GameEvent[] = [
      { type: 'rolled', color: 'green', value: 3 },
      { type: 'moved', color: 'green', tokenIndex: 0, from: 0, to: 3 },
      { type: 'turnStarted', color: 'red' },
    ];
    expect(botReactionFor(quiet, seats, always)).toBeNull();
  });

  it('says nothing when the game is over', () => {
    const events: GameEvent[] = [captureBy('green', 'red'), { type: 'gameOver', ranking: ['green', 'red'] }];
    expect(botReactionFor(events, seats, always)).toBeNull();
  });

  it('respects the probability gate at the boundary', () => {
    expect(botReactionFor([captureBy('green', 'red')], seats, never)).toBeNull();
    const justUnder: Rng = () => BOT_REACT_CHANCE - 0.001;
    expect(botReactionFor([captureBy('green', 'red')], seats, justUnder)).not.toBeNull();
    const atChance: Rng = () => BOT_REACT_CHANCE;
    expect(botReactionFor([captureBy('green', 'red')], seats, atChance)).toBeNull();
  });

  it('reacts at about the chance rate over many seeded commits', () => {
    let state = 12345;
    const rng: Rng = () => {
      state = (Math.imul(state, 1103515245) + 12345) >>> 0;
      return state / 4294967296;
    };
    const events = [captureBy('green', 'red')];
    const trials = 2000;
    let reacted = 0;
    for (let i = 0; i < trials; i++) if (botReactionFor(events, seats, rng) !== null) reacted++;
    const rate = reacted / trials;
    expect(rate).toBeGreaterThan(BOT_REACT_CHANCE - 0.05);
    expect(rate).toBeLessThan(BOT_REACT_CHANCE + 0.05);
  });
});
