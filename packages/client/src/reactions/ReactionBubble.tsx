import { useEffect, useState } from 'react';

// Long enough to read on the player's card, short enough not to clutter it.
const BUBBLE_MS = 3000;

// Keyed by reaction id by the parent, so each new reaction restarts the timer.
export function ReactionBubble({ emoji }: { readonly emoji: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), BUBBLE_MS);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  // The live region announces the reaction, so the bubble is decorative for assistive tech.
  return (
    <span className="player-reaction" aria-hidden="true">
      {emoji}
    </span>
  );
}
