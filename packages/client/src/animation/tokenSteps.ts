import type { Color, GameEvent } from '@ludo/engine';
import { BASE_PROGRESS, isAtBase } from '../runner/progress';

// One visible step of a token. Steps are absolute, so replaying them in order always
// lands on the engine's positions even if a new state arrives mid-animation.
export interface TokenStep {
  readonly color: Color;
  readonly tokenIndex: number;
  readonly progress: number;
  // True when the token was captured and flies home with a pop on arrival.
  readonly captured: boolean;
}

// Spec 7: movement is shown one square at a time. Leaving base is a single hop onto
// the start square, because there is no square to walk through.
export function stepsFor(events: readonly GameEvent[]): TokenStep[] {
  const steps: TokenStep[] = [];
  for (const event of events) {
    if (event.type === 'released') {
      steps.push({ color: event.color, tokenIndex: event.tokenIndex, progress: 0, captured: false });
    } else if (event.type === 'moved') {
      if (isAtBase(event.color, event.from)) {
        steps.push({ color: event.color, tokenIndex: event.tokenIndex, progress: event.to, captured: false });
        continue;
      }
      for (let progress = event.from + 1; progress <= event.to; progress++) {
        steps.push({ color: event.color, tokenIndex: event.tokenIndex, progress, captured: false });
      }
    } else if (event.type === 'captured') {
      steps.push({ color: event.victim, tokenIndex: event.victimTokenIndex, progress: BASE_PROGRESS, captured: true });
    }
  }
  return steps;
}
