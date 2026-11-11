# 02 · Best time to leave

**Status:** Proposed · **Value:** High · **Effort:** M

## Summary

For a route, check many possible departure times across a time window and show when the trip would have the least sun on your side. For example: "Leave at 9:15 or later: either side will be fine."

## Why

Sometimes you can choose when to travel but not which seat you get, for example on a full bus. Showing when the sun matters least is a new kind of answer the app can't give today.

## User experience

- On the result screen, a **"Best time to leave"** card with a small chart: departure time on the x-axis and how one-sided the sun exposure is on the y-axis. The current departure time is highlighted.
- The best window is labelled, e.g. "Shadiest: 9:00–10:30". Tapping a bar recalculates the result for that departure time.
- Default window: ±3 hours around the chosen time, in 15-minute steps, limited to daylight.

## Technical approach

- **No extra network calls.** OSRM's route shape and duration don't depend on departure time (the public server has no traffic data). So reuse the existing `Route` and only shift the timestamps:
  `shiftRoute(route, newDeparture)` → move every waypoint's `timestamp` by the same amount.
- Add `src/services/departurePlanner.ts`:
  - `scanDepartures(route, center, { windowMinutes, stepMinutes })` → `{ departure, left, right, score }[]`
  - Score: `max(left, right)` is the share of the trip with sun on the worse side, so lower is better. Option: a "seek" score for feature 04.
  - `bestWindow(scan)`: the longest run of consecutive slots within 5 points of the minimum score.
- **Performance.** About 25 slots × N segments of `suncalc`. On long routes, first sample the route down to points about 500 m apart (add to `src/utils/geometry.ts`), and run the scan with `InteractionManager.runAfterInteractions` so it doesn't slow the transition between screens.
- **UI.** Add `src/components/DepartureChart.tsx` using plain `View` bars and theme tokens, so no chart library is needed.

## Edge cases

- The window crosses sunrise or sunset: slots with no sun score 0 ("no sun"). Label them with 🌙 rather than counting them as "best".
- Very long trips (> 8 h): reduce the window or increase the step size.
- Results always assume the same duration. Say so in the card's footnote, next to the existing disclaimer.

## Acceptance criteria

- [ ] The card shows scores for each 15-minute slot within ±3 h, and highlights the chosen time.
- [ ] Tapping a slot updates the recommendation without another network request.
- [ ] A 500 km route finishes the scan in under 150 ms on a mid-range Android phone.
- [ ] Unit tests: `shiftRoute` keeps the gaps between timestamps unchanged, and `scanDepartures` finds the expected best slot on a synthetic east–west route.
- [ ] All strings are translated (EN/BN).

## Effort

About 1.5–3 days.
