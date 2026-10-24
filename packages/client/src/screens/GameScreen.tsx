import { useEffect, useState } from 'react';
import type { Die, Move } from '@ludo/engine';
import type { GameRunner } from '../runner/GameRunner';
import { BASE_PROGRESS } from '../runner/progress';
import { Board } from '../board/Board';
import { TurnPanel } from '../components/TurnPanel';
import { MoveChoices } from '../components/MoveChoices';
import { PlayersPanel } from '../components/PlayersPanel';
import { RollCallout } from '../components/RollCallout';
import { useRunnerSnapshot } from '../hooks/useRunnerSnapshot';
import { useAutoMove } from '../hooks/useAutoMove';
import { useSpaceToRoll } from '../hooks/useSpaceToRoll';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useTokenPositions } from '../animation/useTokenPositions';
import type { Settings } from '../settings/settings';
import { describeProgress } from '../game/tokenText';

export interface GameScreenProps {
  readonly runner: GameRunner;
  readonly settings: Settings;
}

interface LastRoll {
  readonly value: Die;
  readonly id: number;
}

// One game in progress. Remounted per game (keyed by the session), so animation state never leaks across games.
export function GameScreen({ runner, settings }: GameScreenProps) {
  const snapshot = useRunnerSnapshot(runner);
  const reducedMotion = usePrefersReducedMotion();
  const anim = useTokenPositions(snapshot.state, reducedMotion);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [lastRoll, setLastRoll] = useState<LastRoll | null>(null);

  useAutoMove(runner, snapshot, settings.autoMove);
  useSpaceToRoll(runner);

  useEffect(() => {
    const rolled = snapshot.state.events.find((event) => event.type === 'rolled');
    if (rolled?.type !== 'rolled') return;
    const value = rolled.value;
    setLastRoll((previous) => ({ value, id: (previous?.id ?? 0) + 1 }));
  }, [snapshot]);

  const turn = snapshot.state.turn;
  const turnColor = turn.phase === 'over' ? null : turn.player;
  const activeColors = snapshot.seats.map((seat) => seat.color);

  const describeFrom = (move: Move): string => {
    const player = snapshot.state.players.find((p) => p.color === move.color);
    return describeProgress(move.color, player?.tokens[move.tokenIndex] ?? BASE_PROGRESS);
  };

  const handleMove = (move: Move) => {
    setHoverKey(null);
    runner.move(move);
  };

  return (
    <div className="game-screen">
      <div className="board-column">
        <div className="board-wrap">
          <Board
            positions={anim.positions}
            pops={anim.pops}
            activeColors={activeColors}
            turnColor={turnColor}
            options={snapshot.options}
            hoverKey={hoverKey}
            onMove={handleMove}
            onHoverKey={setHoverKey}
          />
          {lastRoll !== null && <RollCallout key={lastRoll.id} value={lastRoll.value} />}
        </div>
      </div>
      <div className="side-column">
        <TurnPanel snapshot={snapshot} lastRoll={lastRoll} onRoll={() => runner.roll()} />
        <MoveChoices
          options={snapshot.options}
          hoverKey={hoverKey}
          describeFrom={describeFrom}
          onMove={handleMove}
          onHoverKey={setHoverKey}
        />
        <PlayersPanel seats={snapshot.seats} state={snapshot.state} />
      </div>
    </div>
  );
}
