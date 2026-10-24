// Toggles are part of the game state so applyMove/roll never consult ambient config.
export interface Rules {
  readonly threeSixesForfeit: boolean;
  readonly captureExtraRoll: boolean;
  readonly exactFinish: boolean;
  readonly homeExtraRoll: boolean;
  readonly blocks: boolean;
  readonly mustCapture: boolean;
  readonly doubleSixRelease: boolean;
}

// Standard rules are on by default; house rules are opt-in (Spec 4.12).
export const DEFAULT_RULES: Rules = {
  threeSixesForfeit: true,
  captureExtraRoll: true,
  exactFinish: true,
  homeExtraRoll: true,
  blocks: false,
  mustCapture: false,
  doubleSixRelease: false,
};

export function resolveRules(overrides: Partial<Rules> | undefined): Rules {
  return { ...DEFAULT_RULES, ...overrides };
}
