import type { Color } from '@ludo/engine';

// Each colour also has a distinct shape, so colour is never the only cue (colour-blind safety).
export type GlyphShape = 'dot' | 'triangle' | 'square' | 'diamond';

export const SHAPE_FOR: Readonly<Record<Color, GlyphShape>> = {
  red: 'dot',
  green: 'triangle',
  yellow: 'square',
  blue: 'diamond',
};

interface ShapeProps {
  readonly shape: GlyphShape;
  readonly className?: string;
}

// Drawn in a -1..1 box, centred on the origin. Used inside SVG groups.
export function ShapeElements({ shape, className }: ShapeProps) {
  switch (shape) {
    case 'dot':
      return <circle className={className} r={0.42} />;
    case 'triangle':
      return <path className={className} d="M0 -0.5 L0.45 0.36 L-0.45 0.36 Z" />;
    case 'square':
      return <rect className={className} x={-0.36} y={-0.36} width={0.72} height={0.72} rx={0.08} />;
    case 'diamond':
      return <path className={className} d="M0 -0.52 L0.5 0 L0 0.52 L-0.5 0 Z" />;
  }
}

// Stand-alone glyph for HTML contexts such as the players panel.
export function ColorGlyph({ shape, className }: ShapeProps) {
  return (
    <svg className={className} viewBox="-1 -1 2 2" aria-hidden="true" focusable="false">
      <ShapeElements shape={shape} className="glyph-shape" />
    </svg>
  );
}
