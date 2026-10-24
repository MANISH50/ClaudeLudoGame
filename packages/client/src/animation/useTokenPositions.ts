import { useEffect, useReducer, useRef } from 'react';
import type { Color, GameState } from '@ludo/engine';
import { tokenKey, type Positions } from './types';
import { stepsFor, type TokenStep } from './tokenSteps';

// About 170 ms per square reads as a hop without dragging out a six-square move.
export const STEP_MS = 170;

interface AnimState {
  readonly positions: Positions;
  readonly target: Positions;
  readonly queue: readonly TokenStep[];
  // Bumped when a token is captured so the pawn can replay its pop.
  readonly pops: Readonly<Record<string, number>>;
}

type AnimAction =
  | { readonly type: 'sync'; readonly target: Positions }
  | { readonly type: 'enqueue'; readonly steps: readonly TokenStep[]; readonly target: Positions }
  | { readonly type: 'tick' };

export function positionsOf(state: GameState): Positions {
  const result: Partial<Record<Color, readonly number[]>> = {};
  for (const player of state.players) result[player.color] = player.tokens;
  return result;
}

function withProgress(positions: Positions, step: TokenStep): Positions {
  const current = positions[step.color];
  if (current === undefined) return positions;
  const next = current.map((progress, i) => (i === step.tokenIndex ? step.progress : progress));
  return { ...positions, [step.color]: next };
}

function reducer(state: AnimState, action: AnimAction): AnimState {
  switch (action.type) {
    case 'sync':
      return { ...state, positions: action.target, target: action.target, queue: [] };
    case 'enqueue': {
      const queue = [...state.queue, ...action.steps];
      // Nothing to animate and nothing pending: jump straight to the new positions.
      const positions = queue.length === 0 ? action.target : state.positions;
      return { ...state, positions, target: action.target, queue };
    }
    case 'tick': {
      const [step, ...rest] = state.queue;
      if (step === undefined) return { ...state, positions: state.target };
      // The last step always lands on the target, so a skipped step can never leave a token stranded.
      const positions = rest.length === 0 ? state.target : withProgress(state.positions, step);
      const pops = step.captured
        ? { ...state.pops, [tokenKey(step.color, step.tokenIndex)]: (state.pops[tokenKey(step.color, step.tokenIndex)] ?? 0) + 1 }
        : state.pops;
      return { ...state, positions, queue: rest, pops };
    }
  }
}

// Drip-feeds engine events into drawn positions. Reduced motion skips straight to the target.
export function useTokenPositions(state: GameState, reducedMotion: boolean): AnimState {
  const initial = positionsOf(state);
  const [anim, dispatch] = useReducer(reducer, {
    positions: initial,
    target: initial,
    queue: [],
    pops: {},
  });
  const handled = useRef<GameState>(state);

  useEffect(() => {
    if (handled.current === state) return;
    handled.current = state;
    const target = positionsOf(state);
    if (reducedMotion) {
      dispatch({ type: 'sync', target });
    } else {
      dispatch({ type: 'enqueue', steps: stepsFor(state.events), target });
    }
  }, [state, reducedMotion]);

  useEffect(() => {
    if (anim.queue.length === 0) return;
    const timer = setTimeout(() => dispatch({ type: 'tick' }), STEP_MS);
    return () => clearTimeout(timer);
  }, [anim.queue]);

  return anim;
}
