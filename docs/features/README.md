# Feature backlog

These are planned features, one per file. **When a feature ships, its file is deleted** (in the same commit), so this folder only holds work that is still to do. Each file covers the user problem, the proposed experience, a technical approach based on the current code, edge cases, acceptance criteria and a rough effort estimate.

| # | Feature | Value | Effort | Depends on |
| --- | --- | --- | --- | --- |
| 06 | [Train, walking and other travel modes](06-travel-modes.md) | Medium–High | M–L | — |
| 07 | [Share a result](07-share-result.md) | Medium | S–M | — |

Effort: **S** ≈ under 1 day, **M** ≈ 1–3 days, **L** ≈ 3+ days.

## Shipped

- 04 Seek-the-sun mode
- 05 Glare-aware weighting by sun height
- 03 Sun exposure timeline
- 02 Best time to leave
- 01 Route map with sun-side colouring

## Suggested order

1. **07 Share**, **06 Travel modes.**

## Adding a feature file

Copy the structure of an existing file: Summary → Why → User experience → Technical approach → Edge cases → Acceptance criteria → Effort. When the feature ships, delete its file, remove its row from the table above, and add it to **Shipped**.
