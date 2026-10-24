import { useEffect, useState } from 'react';
import { quadrantCentre, BOARD_SIZE } from '../board/boardGeometry';
import type { Reaction } from './reactions';

// Float time for motion, and a static hold for reduced motion so the message still registers.
const FLOAT_MS = 1600;
const STATIC_MS = 2000;

export interface ReactionLayerProps {
  readonly reactions: readonly Reaction[];
  readonly reducedMotion: boolean;
}

// Sits over the board and ignores the pointer, the same way RollCallout does.
export function ReactionLayer({ reactions, reducedMotion }: ReactionLayerProps) {
  return (
    <div className="reaction-layer" aria-hidden="true">
      {reactions.map((reaction) => (
        <ReactionFloat key={reaction.id} reaction={reaction} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

// Keyed by reaction id, so each emoji times itself out and then removes its own node.
function ReactionFloat({ reaction, reducedMotion }: { readonly reaction: Reaction; readonly reducedMotion: boolean }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), reducedMotion ? STATIC_MS : FLOAT_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion]);
  if (!visible) return null;
  const centre = quadrantCentre(reaction.color);
  return (
    <span
      className="reaction-float"
      style={{ left: `${(centre.x / BOARD_SIZE) * 100}%`, top: `${(centre.y / BOARD_SIZE) * 100}%` }}
    >
      {reaction.emoji}
    </span>
  );
}
