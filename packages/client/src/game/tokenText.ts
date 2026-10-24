import { squareFor, type Color } from '@ludo/engine';

// Plain-language position for screen readers and tooltips. The engine's squareFor decides the kind.
export function describeProgress(color: Color, progress: number): string {
  const square = squareFor(color, progress);
  switch (square.kind) {
    case 'base':
      return 'in base';
    case 'track':
      return progress === 0 ? 'on the start square' : `${progress} squares from start`;
    case 'home':
      return `in the home column, step ${square.step}`;
    case 'finished':
      return 'finished';
  }
}
