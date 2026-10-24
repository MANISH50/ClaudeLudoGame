import type { EmojiChoice } from './reactions';
import { EMOJI_CHOICES } from './reactions';

export interface ReactionBarProps {
  readonly onSend: (choice: EmojiChoice) => void;
}

// Each button carries its name in aria-label, so the emoji glyph itself is hidden from assistive tech.
export function ReactionBar({ onSend }: ReactionBarProps) {
  return (
    <section className="reaction-card" aria-labelledby="reactions-heading">
      <h2 id="reactions-heading" className="section-title">
        Reactions
      </h2>
      <div className="reaction-bar" role="group" aria-label="Send a reaction">
        {EMOJI_CHOICES.map((choice) => (
          <button
            key={choice.label}
            type="button"
            className="reaction-button"
            aria-label={choice.label}
            title={choice.label}
            onClick={() => onSend(choice)}
          >
            <span aria-hidden="true">{choice.emoji}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
