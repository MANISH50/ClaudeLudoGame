import {
  applyMove,
  createGame,
  legalMoves,
  pickBotMove,
  roll as rollDice,
  IllegalActionError,
  type Color,
  type GameState,
  type Move,
  type Rng,
  type Rules,
} from '@ludo/engine';
import { isAtBase } from './progress';
import type { ActionResult, GameRunner, MoveOption, RunnerSnapshot, Seat, SnapshotListener } from './GameRunner';
import { browserScheduler, randomThinkDelayMs, type Scheduler } from './scheduler';

export interface LocalRunnerOptions {
  readonly seats: readonly Seat[];
  readonly rules?: Partial<Rules>;
  readonly rng?: Rng;
  readonly scheduler?: Scheduler;
  readonly thinkDelayMs?: () => number;
}

// Runs the engine in the browser. Rules stay in the engine; this class only
// enforces who may act and when bots play.
export class LocalRunner implements GameRunner {
  private state: GameState;
  private snapshot: RunnerSnapshot;
  private readonly listeners = new Set<SnapshotListener>();
  private readonly rng: Rng;
  private readonly scheduler: Scheduler;
  private readonly thinkDelayMs: () => number;
  private timer: unknown = null;
  private disposed = false;

  constructor(private readonly options: LocalRunnerOptions) {
    this.rng = options.rng ?? (() => Math.random());
    this.scheduler = options.scheduler ?? browserScheduler;
    this.thinkDelayMs = options.thinkDelayMs ?? randomThinkDelayMs;
    const colors = options.seats.map((s) => s.color);
    this.state = options.rules === undefined
      ? createGame({ colors })
      : createGame({ colors, rules: options.rules });
    this.snapshot = this.buildSnapshot();
    this.scheduleBotTurn();
  }

  getSnapshot(): RunnerSnapshot {
    return this.snapshot;
  }

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  roll(): ActionResult {
    if (this.disposed) return reject('the game has ended');
    const state = this.state;
    if (state.turn.phase !== 'roll') return reject('dice are not due');
    if (!this.isHuman(state.turn.player)) return reject('not your turn');
    this.commit(rollDice(state, this.rng));
    return ACCEPTED;
  }

  move(move: Move): ActionResult {
    if (this.disposed) return reject('the game has ended');
    const state = this.state;
    if (state.turn.phase !== 'move') return reject('no move is pending');
    if (move.color !== state.turn.player) return reject('not your turn');
    if (!this.isHuman(move.color)) return reject('bots move their own tokens');
    let next: GameState;
    try {
      next = applyMove(state, move);
    } catch (error) {
      if (error instanceof IllegalActionError) return reject(error.message);
      throw error;
    }
    this.commit(next);
    return ACCEPTED;
  }

  dispose(): void {
    this.disposed = true;
    this.cancelTimer();
    this.listeners.clear();
  }

  private commit(next: GameState): void {
    this.state = next;
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) listener(this.snapshot);
    this.scheduleBotTurn();
  }

  private scheduleBotTurn(): void {
    this.cancelTimer();
    if (this.disposed) return;
    const turn = this.state.turn;
    if (turn.phase === 'over' || this.isHuman(turn.player)) return;
    this.timer = this.scheduler.setTimeout(() => {
      this.timer = null;
      this.playBotStep();
    }, this.thinkDelayMs());
  }

  private playBotStep(): void {
    const state = this.state;
    const turn = state.turn;
    if (turn.phase === 'roll') {
      this.commit(rollDice(state, this.rng));
      return;
    }
    if (turn.phase === 'move') {
      const seat = this.seatFor(turn.player);
      if (seat === undefined || seat.control.kind !== 'bot') return;
      const move = pickBotMove(state, seat.control.level, this.rng);
      this.commit(applyMove(state, move));
    }
  }

  private cancelTimer(): void {
    if (this.timer !== null) this.scheduler.clearTimeout(this.timer);
    this.timer = null;
  }

  private buildSnapshot(): RunnerSnapshot {
    const state = this.state;
    const turn = state.turn;
    const humanTurn = turn.phase !== 'over' && this.isHuman(turn.player);
    const options: MoveOption[] =
      turn.phase === 'move' && humanTurn ? legalMoves(state).map((move) => describeOption(state, move)) : [];
    return {
      state,
      seats: this.options.seats,
      canRoll: turn.phase === 'roll' && humanTurn,
      options,
    };
  }

  private seatFor(color: Color): Seat | undefined {
    return this.options.seats.find((s) => s.color === color);
  }

  private isHuman(color: Color): boolean {
    return this.seatFor(color)?.control.kind === 'human';
  }
}

const ACCEPTED: ActionResult = { ok: true };

function reject(reason: string): ActionResult {
  return { ok: false, reason };
}

// The engine does not expose destinations, so the preview applies the move and
// reads the mover's new progress. This is the engine's rule, not a copy of it.
function describeOption(state: GameState, move: Move): MoveOption {
  const next = applyMove(state, move);
  const mover = next.players.find((p) => p.color === move.color);
  const to = mover?.tokens[move.tokenIndex] ?? -1;
  return { move, to, captures: capturesAny(state, next, move) };
}

// A capture sends an opponent token back to base, so count opponent tokens newly at base.
function capturesAny(before: GameState, after: GameState, move: Move): boolean {
  return after.players.some((player) => {
    if (player.color === move.color) return false;
    const previous = before.players.find((p) => p.color === player.color);
    if (previous === undefined) return false;
    return player.tokens.some(
      (progress, i) => isAtBase(player.color, progress) && !isAtBase(player.color, previous.tokens[i] ?? progress),
    );
  });
}
