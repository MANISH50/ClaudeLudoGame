export interface HeaderProps {
  readonly onRules: () => void;
  readonly onSettings: () => void;
  readonly onHome?: (() => void) | undefined;
  readonly soundOn: boolean;
  readonly onToggleSound: () => void;
}

// Speaker glyph. The text label carries the meaning for screen readers, so the SVG is decorative.
function SpeakerIcon({ on }: { readonly on: boolean }) {
  return (
    <svg className="mute-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {on ? (
        <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M16 9l5 6m0-6l-5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function Header({ onRules, onSettings, onHome, soundOn, onToggleSound }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand" aria-label="Ludo">
        <span className="brand-mark" aria-hidden="true">
          <span className="brand-dot brand-dot--red" />
          <span className="brand-dot brand-dot--green" />
          <span className="brand-dot brand-dot--yellow" />
          <span className="brand-dot brand-dot--blue" />
        </span>
        <span className="brand-name">Ludo</span>
      </div>
      <nav className="header-actions" aria-label="App">
        {onHome !== undefined && (
          <button type="button" className="btn btn-ghost" onClick={onHome}>
            Home
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost mute-button"
          onClick={onToggleSound}
          aria-pressed={!soundOn}
        >
          <SpeakerIcon on={soundOn} />
          <span className="mute-label">Mute</span>
        </button>
        <button type="button" className="btn btn-ghost" onClick={onRules} aria-haspopup="dialog">
          Rules
        </button>
        <button type="button" className="btn btn-ghost" onClick={onSettings} aria-haspopup="dialog">
          Settings
        </button>
      </nav>
    </header>
  );
}
