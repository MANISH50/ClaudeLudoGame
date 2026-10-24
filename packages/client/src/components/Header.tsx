export interface HeaderProps {
  readonly onRules: () => void;
  readonly onSettings: () => void;
  readonly onHome?: (() => void) | undefined;
}

export function Header({ onRules, onSettings, onHome }: HeaderProps) {
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
