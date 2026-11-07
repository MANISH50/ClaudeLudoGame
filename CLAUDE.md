# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read `Spec.md` first. It is the source of truth for scope, rules, protocol, and acceptance criteria. If code and spec disagree, ask or update the spec explicitly. Do not silently drift. `docs/PROGRESS.md` records milestone status, confirmed rule decisions, and open questions; check it before touching rules.

## Be cautious

- **Follow existing conventions:** Reuse the defined architecture, tech stack, and coding patterns. Avoid unnecessary dependencies or redesigns.
- **Concise responses:** Focus on relevant decisions and actionable changes. Avoid unnecessary explanations, repetition, and lengthy code snippets.
- **Token efficiency:** Prefer minimal context, targeted file reads, and focused changes. Do not repeat information already documented.
- **Clarify conflicts:** If a request conflicts with `Spec.md` or leaves a critical ambiguity, ask before proceeding.

Prioritize correctness, consistency, and minimal token usage.

## Project summary

Single-page, good-looking Ludo game. Online multiplayer via room codes, offline vs bots, pass-and-play. Standard Ludo rules.

## Stack

- TypeScript (strict) everywhere, npm workspaces monorepo, Node >= 20
- `packages/engine` (`@ludo/engine`): pure game logic (no DOM, no Node APIs)
- `packages/server` (`@ludo/server`): Node + `ws`, authoritative rooms (still a stub until M3)
- `packages/client` (`@ludo/client`): React 19 + Vite 8, SVG/CSS board
- Tests: Vitest (unit/integration), Playwright (e2e)

## Commands

```
npm install
npm run dev          # Vite client on http://localhost:5173 (server joins in M3)
npm run lint
npm run typecheck    # tsc per workspace
npm test             # vitest, all packages (root vitest.config.ts)
npm run e2e          # playwright; starts the Vite dev server itself
npm run build
```

Single tests:

```
npx vitest run packages/engine/src/capture.test.ts   # one file
npx vitest run -t "partial test name"                # by name
npm test -w @ludo/engine                             # engine package only
npx playwright test e2e/smoke.spec.ts -g "name"      # one e2e test
```

E2E runs one worker, unparallelised, because bot games pace themselves in real time. Port 5173 is `strictPort`, so stop any running dev server first if a test fails to start.

Definition of done for any task: lint, typecheck, and tests pass (Spec section 9 adds `npm run e2e`).

## Architecture rules

1. **All game rules live in `packages/engine`.** The client and server never re-implement rules.
2. Engine functions are pure and deterministic. Randomness comes from an injected `Rng`.
3. The server rolls dice and validates every move. Never trust client input.
4. The client has one code path: it talks to a `GameRunner` interface. Implementations: `RemoteRunner` (WebSocket, M3) and `LocalRunner` (in-browser engine, used offline and for fallback).
5. Board geometry has one source per layer: `packages/engine/src/boardGeometry.ts` owns logical positions (track index, safe squares, `squareFor`); `packages/client/src/board/boardGeometry.ts` owns the only drawing coordinates (15x15 grid cells, SVG viewBox `0 0 15 15`). No magic coordinates elsewhere.
6. Protocol messages are typed in a shared file and versioned (`v` field).

## How the pieces fit

- **Engine API** (`packages/engine/src/index.ts`): `createGame`, `roll(state, rng)`, `legalMoves`, `applyMove`, `pickBotMove(state, level, rng)`. Illegal actions throw `IllegalActionError`. State transitions also emit `GameEvent`s, which the client turns into announcements, sounds, and reactions. Token `progress` model and start/safe indices are in Spec section 4.
- **Workspace packages are consumed as source** (`main: src/index.ts`); there is no engine build step. Import engine code only via `@ludo/engine`.
- **Client flow:** screens → `useRunnerSnapshot` → `GameRunner`. `LocalRunner` owns turn order and bot scheduling; the bot "think" delay lives in the client `scheduler`, not the engine. `RunnerSnapshot.options` carries precomputed legal moves (destination, capture flag) so UI code never derives rules. `LocalRunner` accepts injected `rng`, `scheduler`, and `thinkDelayMs` for deterministic tests.
- **Engine test helpers:** `testSupport.ts` and `bots/testGame.ts`. `fuzz.test.ts` plays 10,000 games and is the slowest test.

## TypeScript gotchas

`tsconfig.base.json` enables `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` (pass optional props only when defined; see `LocalRunner`'s `createGame` call). The base `lib` is ES2022 with `types: []`, so the engine has no DOM or timer typings by design; only the client adds DOM. ESLint enforces `no-explicit-any` and `consistent-type-imports`.

## Code style

- Small files, named exports, no `any`. Prefer discriminated unions for moves and events.
- Comments explain why, not what.
- UI: CSS variables for theme colours (`packages/client/src/styles.css`), no inline magic colours. Respect `prefers-reduced-motion`.
- Accessibility is a requirement, not polish: keyboard play, ARIA live announcements, colour-blind-safe token symbols.

## Workflow

- Work milestone by milestone (M1 to M5 in Spec.md). Finish and verify one before starting the next.
- Before big edits, write a short plan. After each milestone, update `docs/PROGRESS.md` (done, next, open questions).
- Write tests with the code, especially for the engine. A rule bug is the worst bug in this project.
- Use the subagents in `.claude/agents/` for focused work: `engine-dev`, `ui-designer`, `netcode-dev`, `bot-ai`, `qa-reviewer`.
- Commit in small steps with clear messages.

## Guardrails

- Do not add accounts, payments, analytics, or third-party tracking.
- Do not add heavy dependencies without a reason in the PR/commit message. Prefer the platform and small libraries.
- No secrets in the repo. Config via environment variables with a documented `.env.example`.
- Do not delete or rewrite tests to make them pass. Fix the code.
- If a requirement is ambiguous, pick the Spec.md default, note the assumption in `docs/PROGRESS.md`, and continue.
