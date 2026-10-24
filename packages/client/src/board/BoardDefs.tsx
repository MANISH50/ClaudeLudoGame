import { COLORS } from '@ludo/engine';

// Glossy gradients are defined once and referenced by each pawn. Colours come from theme variables.
export function BoardDefs() {
  return (
    <defs>
      {COLORS.map((color) => (
        <radialGradient key={color} id={`ludo-token-${color}`} cx={0.38} cy={0.32} r={0.75} fx={0.32} fy={0.26}>
          <stop offset={0} style={{ stopColor: `var(--token-hi-${color})` }} />
          <stop offset={0.6} style={{ stopColor: `var(--token-${color})` }} />
          <stop offset={1} style={{ stopColor: `var(--token-ink-${color})` }} />
        </radialGradient>
      ))}
    </defs>
  );
}
