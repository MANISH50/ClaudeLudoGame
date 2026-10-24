import type { Color } from './color';

// The die value is already in state.turn, so a move only names the token.
export type Move = { readonly type: 'moveToken'; readonly color: Color; readonly tokenIndex: number };
