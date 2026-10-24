# CLAUDE.md: Ludo Web App

Read `Spec.md` first. It is the source of truth for scope, rules, protocol, and acceptance criteria. If code and spec disagree, ask or update the spec explicitly. Do not silently drift.
## We cautious
- **Follow existing conventions:** Reuse the defined architecture, tech stack, database schema, and coding patterns. Avoid unnecessary dependencies or redesigns.
- **Concise responses:** Focus on relevant decisions and actionable changes. Avoid unnecessary explanations, repetition, and lengthy code snippets.
- **Token efficiency:** Prefer minimal context, targeted file reads, and focused changes. Do not repeat information which is already documented.
- **Clarify conflicts:** If a request conflicts with `@SPEC.md` or leaves a critical ambiguity, ask before proceeding.

Prioritize correctness, consistency, and minimal token usage.
## Project summary

Single-page, good-looking Ludo game. Online multiplayer via room codes, offline vs bots, pass-and-play. Standard Ludo rules.

## Stack

- TypeScript (strict) everywhere, npm workspaces monorepo
- `packages/engine`: pure game logic (no DOM, no Node APIs)
- `packages/server`: Node + `ws`, authoritative rooms
- `packages/client`: React + Vite, SVG/CSS board
- Tests: Vitest (unit/integration), Playwright (e2e)

## Commands

```
npm install
npm run dev          # client + server together
npm run lint
npm run typecheck
npm test             # vitest, all packages
npm run e2e          # playwright
npm run build
```

Definition of done for any task: lint, typecheck, and tests pass.

## Architecture rules

1. **All game rules live in `packages/engine`.** The client and server never re-implement rules.
2. Engine functions are pure and deterministic. Randomness comes from an injected RNG.
3. The server rolls dice and validates every move. Never trust client input.
4. The client has one code path: it talks to a `GameRunner` interface. Implementations: `RemoteRunner` (WebSocket) and `LocalRunner` (in-browser engine, used offline and for fallback).
5. Board geometry is defined once in `boardGeometry.ts`. No magic coordinates elsewhere.
6. Protocol messages are typed in a shared file and versioned (`v` field).

## Code style

- Small files, named exports, no `any`. Prefer discriminated unions for moves and events.
- Comments explain why, not what.
- UI: CSS variables for theme colours, no inline magic colours. Respect `prefers-reduced-motion`.
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
