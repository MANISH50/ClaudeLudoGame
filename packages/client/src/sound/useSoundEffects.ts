import { useCallback, useEffect, useRef } from 'react';
import type { GameEvent } from '@ludo/engine';
import type { Settings } from '../settings/settings';
import { soundForEvents, type SoundId } from './soundForEvent';
import { gainFor, playSound, unlockAudio } from './synth';

export interface SoundEffects {
  // Plays the one sound for a commit's events. Stable across renders.
  readonly playEvents: (events: readonly GameEvent[]) => void;
  // Plays a named sound, subject to the same mute and volume settings.
  readonly play: (id: SoundId) => void;
}

// Called once from App. The settings are read through a ref so that toggling mute
// does not resubscribe the runner listener, and so the handlers stay stable.
export function useSoundEffects(settings: Settings): SoundEffects {
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const play = useCallback((id: SoundId) => {
    const current = settingsRef.current;
    if (!current.sound) return;
    playSound(id, gainFor(current.volume));
  }, []);

  const playEvents = useCallback(
    (events: readonly GameEvent[]) => {
      const id = soundForEvents(events);
      if (id !== null) play(id);
    },
    [play],
  );

  return { playEvents, play };
}
