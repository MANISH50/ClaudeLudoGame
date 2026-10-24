import { useEffect, useRef } from 'react';
import { DEFAULT_RULES, type Rules } from '@ludo/engine';

export interface RulesSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

interface RuleLine {
  readonly key: keyof Rules;
  readonly text: string;
}

// Mirrors the engine defaults (Spec 4). The engine owns the rules; this sheet only describes them.
const STANDARD: readonly RuleLine[] = [
  { key: 'threeSixesForfeit', text: 'Three sixes in a row: the third six is forfeited and the turn passes.' },
  { key: 'captureExtraRoll', text: 'Capturing an opponent token gives an extra roll.' },
  { key: 'exactFinish', text: 'A token needs the exact roll to reach the centre.' },
  { key: 'homeExtraRoll', text: 'Reaching the centre gives an extra roll.' },
];

const HOUSE: readonly RuleLine[] = [
  { key: 'blocks', text: 'Blocks: two tokens of one colour block a square.' },
  { key: 'mustCapture', text: 'Must capture when a capture is possible.' },
  { key: 'doubleSixRelease', text: 'Two sixes in a row bring a token out of base.' },
];

export function RulesSheet({ open, onClose }: RulesSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="drawer" aria-labelledby="rules-title" onClose={onClose}>
      <div className="drawer-body">
        <div className="drawer-header">
          <h2 id="rules-title">Rules</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="rules-intro">
          Standard Ludo. Roll a six to bring a token out. Move clockwise, then into your home column.
          Star squares and start squares are safe.
        </p>
        <h3 className="section-title">Active rules</h3>
        <ul className="rules-list">
          {STANDARD.filter((r) => DEFAULT_RULES[r.key]).map((r) => (
            <li key={r.key}>{r.text}</li>
          ))}
        </ul>
        <h3 className="section-title">House rules (off)</h3>
        <ul className="rules-list">
          {HOUSE.filter((r) => !DEFAULT_RULES[r.key]).map((r) => (
            <li key={r.key}>{r.text}</li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
