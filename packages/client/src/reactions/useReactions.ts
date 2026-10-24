import { useCallback, useEffect, useRef, useState } from 'react';
import type { Rng } from '@ludo/engine';
import type { GameRunner } from '../runner/GameRunner';
import { browserScheduler, type Scheduler } from '../runner/scheduler';
import { botReactionFor } from './botReaction';
import { reactorColor } from './reactor';
import type { EmojiChoice, Reaction, ReactionMessage } from './reactions';

const COOLDOWN_MS = 1000;
// Only the newest few stay mounted; older floats have already finished by then.
const MAX_LIVE = 6;
// A bot replies a moment after the move, so the player sees the cause first.
const BOT_DELAY_MIN_MS = 700;
const BOT_DELAY_SPAN_MS = 1100;

export interface ReactionOptions {
  readonly scheduler?: Scheduler;
  readonly rng?: Rng;
}

export interface UseReactions {
  readonly reactions: readonly Reaction[];
  readonly send: (choice: EmojiChoice) => void;
}

const defaultRng: Rng = () => Math.random();

// Holds the live reactions for one game. Remounted per game, so nothing carries over.
export function useReactions(runner: GameRunner, options: ReactionOptions = {}): UseReactions {
  const scheduler = options.scheduler ?? browserScheduler;
  const rng = options.rng ?? defaultRng;
  const [reactions, setReactions] = useState<readonly Reaction[]>([]);
  const nextId = useRef(0);
  const lastSent = useRef(Number.NEGATIVE_INFINITY);
  const timers = useRef(new Set<unknown>());

  const push = useCallback((message: ReactionMessage) => {
    nextId.current += 1;
    const reaction: Reaction = { ...message, id: nextId.current };
    setReactions((previous) => [...previous, reaction].slice(-MAX_LIVE));
  }, []);

  useEffect(
    () =>
      runner.subscribe((snapshot) => {
        const message = botReactionFor(snapshot.state.events, snapshot.seats, rng);
        if (message === null) return;
        const delay = BOT_DELAY_MIN_MS + Math.floor(rng() * BOT_DELAY_SPAN_MS);
        const handle = scheduler.setTimeout(() => {
          timers.current.delete(handle);
          push(message);
        }, delay);
        timers.current.add(handle);
      }),
    [runner, scheduler, rng, push],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const handle of pending) scheduler.clearTimeout(handle);
      pending.clear();
    };
  }, [scheduler]);

  const send = useCallback(
    (choice: EmojiChoice) => {
      const now = Date.now();
      if (now - lastSent.current < COOLDOWN_MS) return;
      const color = reactorColor(runner.getSnapshot());
      if (color === null) return;
      lastSent.current = now;
      push({ color, emoji: choice.emoji, label: choice.label });
    },
    [runner, push],
  );

  return { reactions, send };
}
