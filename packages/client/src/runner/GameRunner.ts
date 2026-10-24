import type { BotLevel, Color, GameState, Move } from '@ludo/engine';

// The UI talks only to this interface. A remote implementation arrives in M3.
export type SeatControl = { readonly kind: 'human' } | { readonly kind: 'bot'; readonly level: BotLevel };

export interface Seat {
  readonly color: Color;
  readonly name: string;
  readonly control: SeatControl;
}

// A legal human move, with its destination and capture flag precomputed so the
// UI never re-derives rules.
export interface MoveOption {
  readonly move: Move;
  readonly to: number;
  readonly captures: boolean;
}

export interface RunnerSnapshot {
  readonly state: GameState;
  readonly seats: readonly Seat[];
  // True when the current turn is a human seat that may roll now.
  readonly canRoll: boolean;
  // Legal moves for the current human seat. Empty when it is not their move.
  readonly options: readonly MoveOption[];
}

export type ActionResult = { readonly ok: true } | { readonly ok: false; readonly reason: string };

export type SnapshotListener = (snapshot: RunnerSnapshot) => void;

export interface GameRunner {
  getSnapshot(): RunnerSnapshot;
  subscribe(listener: SnapshotListener): () => void;
  // Rolls for the current human seat. Rejected when it is not their roll.
  roll(): ActionResult;
  // Plays a move for the current human seat. Rejected when it is not their move.
  move(move: Move): ActionResult;
  dispose(): void;
}
