# Feature backlog

These are planned features, one per file. Each file covers the user problem, the proposed experience, a technical approach based on the current code, edge cases, acceptance criteria and a rough effort estimate.

| # | Feature | Value | Effort | Depends on |
| --- | --- | --- | --- | --- |
| 01 | [Route map with sun-side colouring](01-route-map.md) | High | M–L | — |
| 02 | [Best time to leave](02-best-departure-time.md) | High | M | — |
| 03 | [Sun exposure timeline](03-exposure-timeline.md) | Medium–High | S–M | — |
| 04 | [Seek-the-sun mode](04-seek-sun-mode.md) | Medium | S | — |
| 05 | [Glare-aware weighting by sun height](05-sun-intensity-weighting.md) | High (accuracy) | M | — |
| 06 | [Train, walking and other travel modes](06-travel-modes.md) | Medium–High | M–L | — |
| 07 | [Share a result](07-share-result.md) | Medium | S–M | — |

Effort: **S** ≈ under 1 day, **M** ≈ 1–3 days, **L** ≈ 3+ days.

## Suggested order

1. **04 Seek-the-sun mode.** It's small, and the `SunAvoidance` type already exists. A good warm-up.
2. **03 Timeline.** The per-segment data already exists in `waypointDetails`, so this is UI only.
3. **02 Best time to leave.** It reuses the route geometry, so it needs no extra network calls.
4. **05 Glare weighting.** It makes every other feature more accurate.
5. **01 Map**, **07 Share**, **06 Travel modes.**

## Adding a feature file

Copy the structure of an existing file: Summary → Why → User experience → Technical approach → Edge cases → Acceptance criteria → Effort. When a feature ships, mark it `Status: Shipped` at the top and link the PR.
