import type { GameEvent } from '@ludo/engine';

export type SoundId = 'dice' | 'step' | 'capture' | 'home' | 'finish' | 'win' | 'reaction';

// Most significant first. A commit can carry several events, but one sound per commit keeps it readable.
const PRIORITY: readonly SoundId[] = ['win', 'finish', 'home', 'capture', 'step', 'dice'];

// Mirrors the switch in announce/describeEvent.ts. Silent events return null on purpose:
// the turn change and the pass or forfeit are already conveyed by the text and the die.
function soundFor(event: GameEvent): SoundId | null {
  switch (event.type) {
    case 'rolled':
      return 'dice';
    case 'released':
    case 'moved':
      return 'step';
    case 'captured':
      return 'capture';
    case 'reachedHome':
      return 'home';
    case 'playerFinished':
      return 'finish';
    case 'gameOver':
      return 'win';
    case 'turnStarted':
    case 'forfeited':
    case 'passed':
    case 'extraRoll':
      return null;
  }
}

export function soundForEvents(events: readonly GameEvent[]): SoundId | null {
  let best: SoundId | null = null;
  let bestRank = PRIORITY.length;
  for (const event of events) {
    const id = soundFor(event);
    if (id === null) continue;
    const rank = PRIORITY.indexOf(id);
    if (rank < bestRank) {
      best = id;
      bestRank = rank;
    }
  }
  return best;
}
