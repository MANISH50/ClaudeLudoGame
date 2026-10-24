# Progress

## Sound and emoji reactions (offline modes): done

- **Sound:** synthesized with Web Audio (no audio files). One sound per commit, by priority (win > finish > home > capture > step > dice). Mute button in the header and a settings toggle; volume low, medium, high. Untested by ear in automation: please listen in a real browser.
- **Reactions:** six fixed emoji on the game screen. Floats over the board, a bubble on the sender's card, and a separate `reaction-announcer` live region. Bots react about 35% of the time to captures and finishes.
- **Assumption:** a human reaction goes to the current human seat, else the first human seat. Pass and play has no per-device identity, so this is the default until M3 seats exist.

**Still open (M4):** music loop, confetti on win.

## M2 Board UI and offline vs bot: done

Verified: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (13 files, 104 tests), and `npm run e2e` (2 smoke tests) all exit 0.

Run it: `npm run dev`, then open http://localhost:5173.

What exists:
- **Engine bots** (`packages/engine/src/bots`): `pickBotMove(state, level, rng)` with `BotLevel = 'easy' | 'medium'`. Easy picks uniformly among legal moves. Medium scores moves by simulating them: finish > capture > leave base > safe square > furthest token. Tests cover legality over 2,000 seeded games per level. Medium beat Easy in 171 of 200 games (85.5%).
- **Client** (`packages/client`): React 19 and Vite 8.
  - `GameRunner` interface, with `LocalRunner` as the only implementation.
  - `LocalRunner` enforces turn order and schedules bot turns with a 600-1200 ms think delay. The delay lives in the client, not the engine.
  - SVG board with all coordinates in `board/boardGeometry.ts`.
  - CSS 3D die, step-by-step token animation, capture pop, and a reduced-motion path.
  - Keyboard play, ARIA live announcements, and colour-blind-safe colour glyphs.
  - Home, Game, and Result screens. Settings drawer with theme and auto-move. Rules sheet.
  - Light and dark themes through CSS variables.
- **E2E** (`e2e/`, Playwright): a Vs Bots game and a two-human pass-and-play turn.

Checked in a browser: desktop and 360 px phone layouts, light and dark, and no console errors. The board is square and fits the viewport at 360 px with no horizontal scroll.

## Decisions

1. **Fuzz game count: 10,000**, as Spec section 9 requires (confirmed by the user).
2. **"Reaching home" means progress 56 (the finish).** Entering the home column at 51 does not grant the bonus (confirmed by the user).
3. **Blocks apply on safe squares too.** A same-colour pair blocks passage and landing even on a star square (confirmed by the user).
4. **Vs Bots seating.** One bot sits opposite Red (Yellow). Two bots take Green and Yellow.
5. **Vite 8 with plugin-react 6.** Vitest 5 pulls in Vite 8, so the client follows it. Mixing Vite 7 with plugin-react 5 broke the dev server.

## Not done in M2 (planned for later)

- Hard bot and `npm run sim` (M4).
- Lighthouse accessibility score (F10, M4).
- On-board token hit targets are about one grid cell, under 44 px on a 360 px phone. The move list next to the board meets the 44 px requirement.
- Sound, confetti, emoji reactions, copy-link, and rematch (M4).

## Next: M3 Multiplayer

- Node + `ws` server with authoritative rooms, 5-letter codes, and a shared typed protocol with a `v` field.
- Lobby screen, seat configuration (Human, Bot, Closed), host controls.
- `RemoteRunner` in the client, and the auto-fallback to `LocalRunner`.
- Reconnect with a `rejoinToken`, 30 s grace period, and a turn timer.
- Server integration tests with 2-4 simulated WebSocket clients.

## Open questions

1. **Blocks OFF, two opponent tokens of one colour on a non-safe square.** The engine captures both. Spec 4.6 only covers a single opponent token, so this is a decision, not a Spec reading.
2. **Double-six release (house rule, default OFF).** Fires automatically on the second consecutive six, before the move choice. It is skipped if an opponent blockade sits on the start square. The six still gets a normal move choice.
3. **Consecutive-six counter.** It carries across bonus rolls within a turn and resets when the turn passes.
4. **Ranking.** A finished player gets no bonus roll. Ranked players are skipped in turn order. The last unranked player is ranked N.
5. **Seating.** Seats are sorted clockwise (Red, Green, Yellow, Blue) regardless of input order. The first seat rolls first.

## Known minor items

- `fuzz.test.ts` declares `setTimeout` locally. The engine's TypeScript `lib` has no timer typings, and adding DOM typings would break the no-DOM rule. The declaration is the smallest workaround.

---

## M1 Engine: done (earlier)

Pure TypeScript rules engine: state, legal move generation, dice, captures, safe squares, exact finish, ranking, and the seven house-rule toggles. Every Spec section 4 rule has a named test. Tooling: vitest upgraded from 3.x to 5.x to clear two critical and one moderate advisory.
