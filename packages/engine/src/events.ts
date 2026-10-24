import type { Color } from './color';
import type { Die } from './state';

export type ExtraRollReason = 'six' | 'capture' | 'home';

export type GameEvent =
  | { readonly type: 'turnStarted'; readonly color: Color }
  | { readonly type: 'rolled'; readonly color: Color; readonly value: Die }
  | { readonly type: 'forfeited'; readonly color: Color; readonly reason: 'three-sixes' }
  | { readonly type: 'passed'; readonly color: Color; readonly reason: 'no-legal-move' }
  | { readonly type: 'released'; readonly color: Color; readonly tokenIndex: number }
  | {
      readonly type: 'moved';
      readonly color: Color;
      readonly tokenIndex: number;
      readonly from: number;
      readonly to: number;
    }
  | {
      readonly type: 'captured';
      readonly victim: Color;
      readonly victimTokenIndex: number;
      readonly by: Color;
      readonly square: number;
    }
  | { readonly type: 'reachedHome'; readonly color: Color; readonly tokenIndex: number }
  | { readonly type: 'extraRoll'; readonly color: Color; readonly reason: ExtraRollReason }
  | { readonly type: 'playerFinished'; readonly color: Color; readonly rank: number }
  | { readonly type: 'gameOver'; readonly ranking: readonly Color[] };
