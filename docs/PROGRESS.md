# Progress

## M1 Engine: done

Verified: `npm run lint`, `npm run typecheck`, and `npm test` all pass. 8 test files, 74 tests, about 87 s (the 10,000-game fuzz run is most of that).

What exists (`packages/engine/src`):
- Public API: `createGame`, `roll`, `legalMoves`, `applyMove`, plus `squareFor`, `trackIndex`, `isSafeTrackIndex`, `COLORS`, `DEFAULT_RULES`, and `IllegalActionError`.
- Board geometry lives only in `boardGeometry.ts`.
- Each action returns a new state with `state.events` set to that action's events. Nothing is mutated.
- Illegal or out-of-phase actions throw `IllegalActionError`. The server will map these to `error` messages in M3.
- `pickBotMove` is not implemented. It is M2.

Test coverage: every rule in Spec section 4 has a named test, and each of the seven toggles has an on test and an off test. Spec 4.10 (auto-move single option) is a UI setting, so it is out of engine scope.

QA review (read-only, against Spec F3 and the engine part of F4): no critical or major bugs. Minor findings fixed: hard-coded track limit replaced with `LAST_TRACK_PROGRESS`, and comments that cited assumption IDs missing from the Spec now cite Spec sections.

Tooling: vitest upgraded from 3.x to 5.x to fix two critical and one moderate advisory. `npm audit` reports 0 vulnerabilities.

## Next: M2 Board UI and offline vs bot

- Client scaffold (React + Vite, SVG board from `boardGeometry.ts`).
- `LocalRunner` wrapping the engine.
- `pickBotMove` for Easy and Medium, with unit tests.
- Pass-and-play.
- Playwright e2e setup, since `npm run e2e` is still a placeholder.

## Decisions

1. **Fuzz game count: 10,000**, as Spec section 9 requires (confirmed by the user).
2. **"Reaching home" means progress 56 (the finish).** Entering the home column at 51 does not grant the bonus (confirmed by the user).
3. **Blocks apply on safe squares too.** A same-colour pair blocks passage and landing even on a star square (confirmed by the user).

## Open questions

1. **Blocks OFF, two opponent tokens of one colour on a non-safe square.** The engine captures both. Spec 4.6 only covers a single opponent token, so this is a decision, not a Spec reading.
2. **Double-six release (house rule, default OFF).** Fires automatically on the second consecutive six, before the move choice. It is skipped if an opponent blockade sits on the start square. The six still gets a normal move choice.
3. **Consecutive-six counter.** It carries across bonus rolls within a turn and resets when the turn passes.
4. **Ranking.** A finished player gets no bonus roll. Ranked players are skipped in turn order. The last unranked player is ranked N.
5. **Seating.** Seats are sorted clockwise (Red, Green, Yellow, Blue) regardless of input order. The first seat rolls first.

## Known minor items

- `fuzz.test.ts` declares `setTimeout` locally. The engine's TypeScript `lib` has no timer typings, and adding DOM typings would break the no-DOM rule. The declaration is the smallest workaround.
