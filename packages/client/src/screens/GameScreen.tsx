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
import { ReactionBar } from '../reactions/ReactionBar';
import { ReactionLayer } from '../reactions/ReactionLayer';
import { useReactions } from '../reactions/useReactions';
import { COLOR_LABEL } from '../game/colors';
import type { SoundId } from '../sound/soundForEvent';

export interface GameScreenProps {
  readonly runner: GameRunner;
  readonly settings: Settings;
  readonly playSound: (id: SoundId) => void;
}

interface LastRoll {
  readonly value: Die;
  readonly id: number;
}

// One game in progress. Remounted per game (keyed by the session), so animation state never leaks across games.
export function GameScreen({ runner, settings, playSound }: GameScreenProps) {
  const snapshot = useRunnerSnapshot(runner);
  const reducedMotion = usePrefersReducedMotion();
  const anim = useTokenPositions(snapshot.state, reducedMotion);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [lastRoll, setLastRoll] = useState<LastRoll | null>(null);
  const { reactions, send } = useReactions(runner);
  const latestReaction = reactions[reactions.length - 1];

  useAutoMove(runner, snapshot, settings.autoMove);
  useSpaceToRoll(runner);

  // Keyed on the newest reaction, so the chime plays once per reaction and not on each render.
  useEffect(() => {
    if (latestReaction !== undefined) playSound('reaction');
  }, [latestReaction, playSound]);

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
      {/* A separate region from the turn announcer, so reactions never crowd out game events. */}
      <div className="sr-only" role="status" aria-live="polite" data-testid="reaction-announcer">
        {latestReaction !== undefined ? `${COLOR_LABEL[latestReaction.color]} reacted ${latestReaction.emoji}` : ''}
      </div>
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
          <ReactionLayer reactions={reactions} reducedMotion={reducedMotion} />
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
        <PlayersPanel seats={snapshot.seats} state={snapshot.state} reactions={reactions} />
        <ReactionBar onSend={send} />
      </div>
    </div>
  );
}
