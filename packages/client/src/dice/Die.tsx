import { useEffect, useState } from 'react';
import type { Die as DieValue } from '@ludo/engine';
import { faceOrientation, spinTo, type Orientation } from './dieOrientation';

const PIPS: Readonly<Record<DieValue, readonly (readonly [number, number])[]>> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

const FACES: readonly { readonly value: DieValue; readonly className: string }[] = [
  { value: 1, className: 'die-face--front' },
  { value: 2, className: 'die-face--right' },
  { value: 3, className: 'die-face--back' },
  { value: 4, className: 'die-face--left' },
  { value: 5, className: 'die-face--top' },
  { value: 6, className: 'die-face--bottom' },
];

export interface DieProps {
  readonly value: DieValue;
  // Increments on each roll. A repeated value still tumbles because the id changed.
  readonly rollId: number;
}

// Decorative 3D die. The result is announced in text, so the cube is hidden from assistive tech.
export function Die({ value, rollId }: DieProps) {
  const [orientation, setOrientation] = useState<Orientation>(() => faceOrientation(value));
  useEffect(() => {
    if (rollId === 0) return;
    setOrientation((previous) => spinTo(previous, value));
  }, [rollId, value]);

  return (
    <div className="die-scene" aria-hidden="true">
      <div
        className="die-cube"
        style={{ transform: `rotateX(${orientation.x}deg) rotateY(${orientation.y}deg)` }}
      >
        {FACES.map((face) => (
          <div key={face.value} className={`die-face ${face.className}`}>
            <div className="die-pips">
              {Array.from({ length: 9 }, (_, cell) => {
                const col = cell % 3;
                const row = Math.floor(cell / 3);
                const filled = PIPS[face.value].some(([c, r]) => c === col && r === row);
                return <span key={cell} className={filled ? 'pip' : 'pip pip--empty'} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
