# Ludo Web App: Technical Specification

Status: v1.0 · Owner: Mani Bro · Audience: Claude Code + subagents

## 1. Goal

Build a polished, single-page Ludo game that runs in the browser.
- Play online with friends via a room code (real-time multiplayer).
- If the server is unreachable or not enough humans join, bots fill the empty seats.
- Works fully offline vs bots (no server needed).
- Follows standard Ludo rules (section 4).

Non-goals (v1): accounts/login, matchmaking by rank, payments, native apps.

## 2. Assumptions (change if wrong)

| # | Assumption |
|---|---|
| A1 | 2-4 players per game; any seat can be Human or Bot |
| A2 | Online play uses room codes, no login (guest name + colour) |
| A3 | Server is authoritative: clients never decide dice or moves |
| A4 | Stack: TypeScript everywhere, React + Vite (client), Node + `ws` (server) |
| A5 | Game engine is a pure shared TS module used by client (offline) and server (online) |
| A6 | Deploy as one Node service serving the built client (Docker, Render/Fly/Railway) |
| A7 | Optional house rules are toggles, standard rules are defaults |

## 3. Game Modes

1. **Online room**: create room, share 5-letter code or link, others join, host starts. Empty seats can be set to Bot.
2. **Vs Bots (offline)**: choose 1-3 bots, difficulty Easy / Medium / Hard. No network needed.
3. **Pass & Play**: 2-4 humans on one device.
4. **Auto-fallback**: if WebSocket fails to connect (or drops and cannot reconnect in 30 s), show a banner "Multiplayer unavailable, continue vs bots?" and migrate the current state to offline mode.

## 4. Rules (Standard Ludo)

Board: 52 outer track squares, 4 home columns of 6 squares (5 + final home), 4 bases, 4 colours (Red, Green, Yellow, Blue) in clockwise order. 4 tokens per player.

1. Turn order is clockwise. Roll one die (1-6).
2. A token leaves base only on a roll of **6**, onto its colour's start square.
3. Rolling a **6** grants an extra roll.
4. **Three 6s in a row**: third move is forfeited and the turn passes (toggle, default ON).
5. Tokens move clockwise along the track, then turn into their own home column after completing one lap.
6. **Capture**: landing on a square with a single opponent token sends it back to its base. Capturing grants an extra roll (toggle, default ON).
7. **Safe squares**: 4 start squares + 4 star squares (8 steps after each start). Tokens on safe squares cannot be captured; any colours may share them.
8. **Exact finish**: a token needs the exact roll to land on the final home square (toggle; default ON). Reaching home grants an extra roll (toggle, default ON).
9. If no legal move exists, the turn passes automatically (after showing the roll briefly).
10. If exactly one legal move exists, the UI may auto-play it (setting: Auto-move single option, default OFF).
11. A player wins when all 4 tokens are home. Game continues until ranks 1..N-1 are decided (2nd, 3rd place are tracked); last player is ranked last.
12. Optional house rules (default OFF): **Blocks** (two same-colour tokens on one square block passage), **Must capture** when possible, **Double-six extra token release**.

### Token position model

`progress` per token: `-1` = in base, `0..50` = on the common track (0 is its start square), `51..55` = home column, `56` = finished.
Track index = `(startIndex[color] + progress) % 52` for progress 0..50.
Start indices (clockwise): Red 0, Green 13, Yellow 26, Blue 39.
Safe track indices: 0, 8, 13, 21, 26, 34, 39, 47.

## 5. Architecture

```
/ludo
  /packages
    /engine     pure TS: rules, state reducer, bot logic (no DOM, no Node APIs)
    /server     Node + ws: rooms, authoritative game loop, reconnect
    /client     React + Vite: UI, animations, offline runner
  CLAUDE.md
  Spec.md
  .claude/agents/*.md
```

- **Engine API**: `createGame(config) -> GameState`; `roll(state, rng) -> GameState`; `legalMoves(state) -> Move[]`; `applyMove(state, move) -> GameState`; `pickBotMove(state, level) -> Move`. All pure, seeded RNG injectable for tests.
- **Server**: rooms in memory (Map). Server rolls the dice and validates every move via the engine. Room expires 30 min after the last activity.
- **Client**: renders `GameState`; in offline mode runs the same engine locally with a `LocalGameRunner` that mimics the server protocol so the UI has one code path.

### Protocol (JSON over WebSocket)

Client to server: `createRoom`, `joinRoom{code,name}`, `setSeat{seat,type:'human'|'bot'|'closed',level?}`, `setRules{...}`, `start`, `roll`, `move{tokenId}`, `chat{emoji}`, `leave`, `rejoin{token}`.
Server to client: `roomState`, `gameState`, `diceRolled{value}`, `moveApplied{...}`, `error{code,msg}`, `playerLeft`, `botTookOver{seat}`.
Every message carries `v` (protocol version). Server ignores out-of-turn or illegal actions and replies with `error`.

### Reconnect and drop handling

- Each player gets a `rejoinToken` stored in `localStorage`.
- On disconnect: 30 s grace, then a bot (Easy) takes the seat; the human can reclaim it on rejoin.
- Turn timer (default 30 s, host-configurable, off allowed): on timeout the engine auto-rolls and auto-moves via bot logic.

## 6. Bot AI

| Level | Behaviour |
|---|---|
| Easy | Random legal move |
| Medium | Score-based: finish token > capture > leave base > reach safe square > advance furthest token |
| Hard | Medium + risk model: avoid squares within 1-6 steps ahead of opponent tokens, prefer blocking opponents' lead tokens, keep tokens in home column safe |

Bots "think" 600-1200 ms (random) so play feels natural. Bots must never produce an illegal move (fuzz-tested).

## 7. UI / UX

- Single page, no reloads. Screens are states: Home, Lobby, Game, Result.
- **Look and feel**: modern, colourful, soft shadows, rounded board. Board drawn with SVG or CSS grid (crisp at any size). Four vivid colour themes with a dark mode and a light mode.
- **Board**: tokens have a glossy pawn look, safe squares marked with stars, home columns in colour, centre triangle home.
- **Dice**: 3D-style animated die (CSS), tap/click or press Space to roll, shows result large for 800 ms.
- **Token movement**: animated step by step along the path; capture has a "pop" and the captured token flies back to base.
- **Highlights**: movable tokens pulse; destination square glows on hover/focus.
- **Turn indicator**: active player's avatar and base glow, plus a clear "Your turn" label.
- **Players panel**: name, colour, Human/Bot badge, tokens home count, connection status.
- **Extras**: emoji reactions, sound effects and music toggle (dice, move, capture, win), confetti on win, rules sheet, settings drawer (rules toggles, sound, theme, auto-move), copy room link, rematch button.
- **Responsive**: usable from 360 px phones up to desktop; board is always square and fits the viewport. Touch targets at least 44 px.
- **Accessibility**: keyboard play (Tab to token, Enter to move, Space to roll), ARIA live region announcing events ("Red rolled 4"), colour-blind-safe symbols on tokens, respects `prefers-reduced-motion`.

## 8. Functional Requirements (acceptance criteria)

| ID | Requirement | Done when |
|---|---|---|
| F1 | Create/join room by code | 2 browsers join the same room and see each other |
| F2 | Seats configurable as Human/Bot/Closed | Host can mix, game starts with 2-4 players |
| F3 | Full standard rules (section 4) | All engine unit tests pass |
| F4 | Server-authoritative dice and moves | Tampered client messages are rejected |
| F5 | Offline vs bots | Works with network disabled |
| F6 | Auto-fallback to bots | Killing the server mid-game offers to continue vs bots |
| F7 | Reconnect | Refreshing the tab rejoins the same seat |
| F8 | Three bot levels | Hard beats Easy in at least 70% of 200 simulated games |
| F9 | Win flow | Rankings shown, rematch works |
| F10 | Responsive and accessible | Lighthouse accessibility score 90+, playable on a 360 px screen |

## 9. Testing

- **Engine (Vitest)**: unit tests for every rule in section 4, plus property/fuzz tests (10,000 random games finish, no illegal states, exactly 4 tokens per player, no capture on safe squares).
- **Server**: integration tests with 2-4 simulated WS clients; illegal-move and out-of-turn tests.
- **E2E (Playwright)**: two browser contexts play a full game; one offline-vs-bot game; reconnect test.
- CI command must pass before any task is called done: `npm run lint && npm run typecheck && npm test && npm run e2e`.

## 10. Milestones

1. **M1 Engine**: rules, state, legal moves, tests (no UI).
2. **M2 Board UI + Offline vs Bot**: board, dice, animations, bots Easy/Medium, pass-and-play.
3. **M3 Multiplayer**: server, rooms, lobby, reconnect, turn timer, auto-fallback.
4. **M4 Polish**: sounds, themes, emoji reactions, Hard bot, accessibility, responsive pass.
5. **M5 Ship**: Dockerfile, README, deploy instructions, final QA.

Each milestone ends with a working app, green tests, and a short summary in `docs/PROGRESS.md`.

## 11. Risks

| Risk | Mitigation |
|---|---|
| Rule ambiguity (house rules) | Toggles with documented defaults in the rules sheet |
| Board geometry bugs | Single `boardGeometry.ts` source of truth, snapshot tests of all 52 squares |
| Cheating | Server-side dice and validation only |
| Free hosting sleeps | Show "waking server" state, auto-fallback to bots |
