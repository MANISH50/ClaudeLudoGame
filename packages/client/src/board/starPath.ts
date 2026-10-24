// Five-point star centred on the origin. Pure presentation, so it lives beside the board art.
const OUTER = 0.3;
const INNER = 0.13;

let cached: string | null = null;

export function starPath(): string {
  if (cached !== null) return cached;
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? OUTER : INNER;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(radius * Math.cos(angle)).toFixed(4)},${(radius * Math.sin(angle)).toFixed(4)}`);
  }
  cached = `M${points.join(' L')} Z`;
  return cached;
}
