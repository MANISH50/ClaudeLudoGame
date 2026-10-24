import { useEffect } from 'react';
import type { GameRunner } from '../runner/GameRunner';

// Controls keep their own Space behaviour (activating a button or a token), so the
// global shortcut must step aside whenever focus sits on one of them.
const INTERACTIVE = 'button, a, input, select, textarea, dialog, [role="button"]';

export function useSpaceToRoll(runner: GameRunner): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' || event.repeat) return;
      const target = event.target;
      if (target instanceof Element && target.closest(INTERACTIVE) !== null) return;
      event.preventDefault();
      runner.roll();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [runner]);
}
