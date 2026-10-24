// Clockwise seating order. Turn order and start indices both follow it.
export const COLORS = ['red', 'green', 'yellow', 'blue'] as const;

export type Color = (typeof COLORS)[number];
