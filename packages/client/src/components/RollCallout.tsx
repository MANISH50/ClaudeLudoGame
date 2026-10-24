import { useEffect, useState } from 'react';
import type { Die } from '@ludo/engine';

// Spec 7: the result shows large for about 800 ms. The parent keys this by roll id,
// so every roll mounts a fresh callout and restarts the timer.
const SHOW_MS = 800;

export function RollCallout({ value }: { readonly value: Die }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), SHOW_MS);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return (
    <div className="roll-callout" aria-hidden="true">
      <span className="roll-callout-value">{value}</span>
    </div>
  );
}
