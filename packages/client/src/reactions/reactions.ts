import type { Color } from '@ludo/engine';

// A fixed set, not free text: it keeps a room friendly and gives every reaction a spoken name.
export interface EmojiChoice {
  readonly emoji: string;
  readonly label: string;
}

export const REACTION = {
  thumbsUp: { emoji: '👍', label: 'Thumbs up' },
  laugh: { emoji: '😂', label: 'Laughing' },
  surprised: { emoji: '😮', label: 'Surprised' },
  angry: { emoji: '😡', label: 'Angry' },
  sad: { emoji: '😢', label: 'Crying' },
  party: { emoji: '🎉', label: 'Celebrate' },
} as const satisfies Record<string, EmojiChoice>;

export const EMOJI_CHOICES: readonly EmojiChoice[] = [
  REACTION.thumbsUp,
  REACTION.laugh,
  REACTION.surprised,
  REACTION.angry,
  REACTION.sad,
  REACTION.party,
];

// What is sent or shown. The sender is a seat colour, so the UI can place and label it.
export interface ReactionMessage {
  readonly color: Color;
  readonly emoji: string;
  readonly label: string;
}

export interface Reaction extends ReactionMessage {
  // Unique per session, so React keeps each floating emoji's timer across renders.
  readonly id: number;
}
