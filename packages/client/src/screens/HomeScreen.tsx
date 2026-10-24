import { useState } from 'react';
import type { BotLevel } from '@ludo/engine';
import type { Seat } from '../runner/GameRunner';
import { LEVEL_LABEL, passAndPlaySeats, vsBotsSeats, type BotCount, type HumanCount } from '../game/setup';
import { SegmentedControl } from '../components/SegmentedControl';

export interface HomeScreenProps {
  readonly onStart: (seats: readonly Seat[]) => void;
}

const LEVELS: readonly { readonly value: BotLevel; readonly label: string }[] = [
  { value: 'easy', label: LEVEL_LABEL.easy },
  { value: 'medium', label: LEVEL_LABEL.medium },
];

// Lobby and online modes arrive in M3, so only the offline modes appear here.
export function HomeScreen({ onStart }: HomeScreenProps) {
  const [botCount, setBotCount] = useState<BotCount>(1);
  const [level, setLevel] = useState<BotLevel>('easy');
  const [humanCount, setHumanCount] = useState<HumanCount>(2);

  return (
    <section className="home" aria-labelledby="home-heading">
      <h1 id="home-heading" className="home-title">Choose a mode</h1>
      <div className="mode-grid">
        <article className="mode-card" aria-labelledby="mode-bots">
          <h2 id="mode-bots" className="mode-title">Vs Bots</h2>
          <p className="mode-desc">Play against the computer. Works offline.</p>
          <SegmentedControl
            name="bot-count"
            legend="Bots"
            value={String(botCount)}
            options={[
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
            ]}
            onChange={(value) => setBotCount(Number(value) as BotCount)}
          />
          <SegmentedControl
            name="bot-level"
            legend="Difficulty"
            value={level}
            options={LEVELS}
            onChange={(value) => setLevel(value as BotLevel)}
          />
          <button type="button" className="btn btn-primary mode-start" onClick={() => onStart(vsBotsSeats(botCount, level))}>
            Start vs bots
          </button>
        </article>

        <article className="mode-card" aria-labelledby="mode-pnp">
          <h2 id="mode-pnp" className="mode-title">Pass and Play</h2>
          <p className="mode-desc">Share one device. Each player takes a turn in order.</p>
          <SegmentedControl
            name="human-count"
            legend="Players"
            value={String(humanCount)}
            options={[
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
            ]}
            onChange={(value) => setHumanCount(Number(value) as HumanCount)}
          />
          <button type="button" className="btn btn-primary mode-start" onClick={() => onStart(passAndPlaySeats(humanCount))}>
            Start pass and play
          </button>
        </article>
      </div>
    </section>
  );
}
