import { describe, expect, it } from 'vitest';
import type { GameEvent } from '@ludo/engine';
import { soundForEvents } from './soundForEvent';

const red = 'red' as const;
const blue = 'blue' as const;

describe('soundForEvents', () => {
  it('maps each sounding event type to its sound', () => {
    expect(soundForEvents([{ type: 'rolled', color: red, value: 4 }])).toBe('dice');
    expect(soundForEvents([{ type: 'moved', color: red, tokenIndex: 0, from: 0, to: 5 }])).toBe('step');
    expect(soundForEvents([{ type: 'released', color: red, tokenIndex: 0 }])).toBe('step');
    expect(
      soundForEvents([{ type: 'captured', victim: blue, victimTokenIndex: 0, by: red, square: 9 }]),
    ).toBe('capture');
    expect(soundForEvents([{ type: 'reachedHome', color: red, tokenIndex: 0 }])).toBe('home');
    expect(soundForEvents([{ type: 'playerFinished', color: red, rank: 1 }])).toBe('finish');
    expect(soundForEvents([{ type: 'gameOver', ranking: [red, blue] }])).toBe('win');
  });

  it('stays silent for turn changes, passes, forfeits and bonus rolls', () => {
    const silent: GameEvent[] = [
      { type: 'turnStarted', color: red },
      { type: 'passed', color: red, reason: 'no-legal-move' },
      { type: 'forfeited', color: red, reason: 'three-sixes' },
      { type: 'extraRoll', color: red, reason: 'six' },
    ];
    for (const event of silent) expect(soundForEvents([event])).toBeNull();
    expect(soundForEvents([])).toBeNull();
  });

  it('plays only the most significant sound when a commit has several events', () => {
    const moveAndCapture: GameEvent[] = [
      { type: 'moved', color: red, tokenIndex: 0, from: 0, to: 5 },
      { type: 'captured', victim: blue, victimTokenIndex: 0, by: red, square: 9 },
    ];
    expect(soundForEvents(moveAndCapture)).toBe('capture');

    const captureAndHome: GameEvent[] = [
      { type: 'captured', victim: blue, victimTokenIndex: 0, by: red, square: 9 },
      { type: 'reachedHome', color: red, tokenIndex: 1 },
    ];
    expect(soundForEvents(captureAndHome)).toBe('home');

    const winAndFinish: GameEvent[] = [
      { type: 'playerFinished', color: red, rank: 1 },
      { type: 'gameOver', ranking: [red, blue] },
    ];
    expect(soundForEvents(winAndFinish)).toBe('win');
  });

  it('ranks dice below a move in the same commit', () => {
    expect(
      soundForEvents([
        { type: 'rolled', color: red, value: 6 },
        { type: 'moved', color: red, tokenIndex: 0, from: 0, to: 5 },
      ]),
    ).toBe('step');
  });
});
