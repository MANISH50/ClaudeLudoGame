import { useEffect, useRef, useState } from 'react';
import type { GameRunner, Seat } from './runner/GameRunner';
import { LocalRunner } from './runner/LocalRunner';
import { loadSettings, saveSettings, type Settings } from './settings/settings';
import { describeEvents } from './announce/describeEvent';
import { Header } from './components/Header';
import { SettingsDrawer } from './components/SettingsDrawer';
import { RulesSheet } from './components/RulesSheet';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { ResultScreen } from './screens/ResultScreen';

type Screen = 'home' | 'game' | 'result';

interface Session {
  readonly id: number;
  readonly runner: GameRunner;
  readonly seats: readonly Seat[];
}

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Owns the screen state and the runner lifecycle. Runners are disposed explicitly in
// handlers rather than in effects, because StrictMode runs effects twice in development.
export function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings(prefersDark()));
  const [screen, setScreen] = useState<Screen>('home');
  const [session, setSession] = useState<Session | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sessionRef = useRef<Session | null>(null);
  const sessionCount = useRef(0);

  useEffect(() => {
    document.documentElement.dataset['theme'] = settings.theme;
    saveSettings(settings);
  }, [settings]);

  // Announcements and the switch to the result screen both follow runner updates.
  useEffect(() => {
    if (session === null) return;
    return session.runner.subscribe((snapshot) => {
      setAnnouncement(describeEvents(snapshot.state.events));
      if (snapshot.state.turn.phase === 'over') setScreen('result');
    });
  }, [session]);

  const startGame = (seats: readonly Seat[]) => {
    sessionRef.current?.runner.dispose();
    const runner = new LocalRunner({ seats });
    sessionCount.current += 1;
    const next: Session = { id: sessionCount.current, runner, seats };
    sessionRef.current = next;
    setAnnouncement(describeEvents(runner.getSnapshot().state.events));
    setSession(next);
    setScreen('game');
  };

  const goHome = () => {
    sessionRef.current?.runner.dispose();
    sessionRef.current = null;
    setSession(null);
    setAnnouncement('');
    setScreen('home');
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header
        onRules={() => setRulesOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onHome={screen === 'home' ? undefined : goHome}
      />
      <main id="main" className="app-main">
        {screen === 'home' && <HomeScreen onStart={startGame} />}
        {screen === 'game' && session !== null && (
          <GameScreen key={session.id} runner={session.runner} settings={settings} />
        )}
        {screen === 'result' && session !== null && (
          <ResultScreen
            runner={session.runner}
            onPlayAgain={() => startGame(session.seats)}
            onChangeMode={goHome}
          />
        )}
      </main>
      <div className="sr-only" role="status" aria-live="polite" data-testid="announcer">
        {announcement}
      </div>
      <SettingsDrawer
        open={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
      />
      <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
