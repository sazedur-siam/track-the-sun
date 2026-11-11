# 03 · Sun exposure timeline

**Status:** Proposed · **Value:** Medium–High · **Effort:** S–M

## Summary

On the result screen, add a horizontal timeline from departure to arrival, coloured by which side the sun is on during each part of the trip.

## Why

The overall percentages hide trips where the sun **switches sides**. For example: "the first 40 minutes are sunny on the left, then the road turns and the right side gets the sun." A timeline lets riders switch seats partway through, or pick the side that is sunny when the sun is strongest.

## User experience

- A card titled **"Your trip, minute by minute"** with one bar showing segments in amber (left), sky blue (right) and grey (neither side or no sun).
- Time ticks under the bar: departure, about 3 in between, and arrival, using `formatClock`.
- A short text summary under the bar, e.g. "Sun on the left until 10:20, then on the right."
- Optional: tap a segment to see "10:05–10:20 · sun on the right · facing SW".

## Technical approach

- The data already exists. `calculateSunExposure().waypointDetails` has `side`, `distance` and `waypoint.timestamp` for every segment.
- Add `src/services/timeline.ts`:
  - `buildTimeline(details)` → `{ side, start: Date, end: Date }[]`. Merge consecutive segments with the same side, and absorb runs shorter than about 2 minutes to remove noise at intersections.
  - `describeTimeline(runs)` → structured phrases. The UI translates them (the existing pattern: services return data, screens build sentences).
- Add `src/components/ExposureTimeline.tsx`: segments are flex children whose `flex` value equals each run's duration. Fade them in with Reanimated, like the other cards. No chart library is needed.

## Edge cases

- Night trips: hide the card, or show one grey bar with "No direct sun".
- Very short trips (< 5 min): hide the card.
- Many tiny flips on winding roads: smoothing (above) plus a maximum of about 12 visible runs.

## Acceptance criteria

- [ ] The timeline renders for any trip with sun. The total length of its segments matches the trip duration.
- [ ] Segment colours match the existing left/right colours in `BusDiagram`.
- [ ] The text summary is correct for a synthetic route that switches sides (unit test).
- [ ] Works in light and dark mode. Strings are translated (EN/BN). There is an accessibility label that reads out the summary.

## Effort

About 0.5–1.5 days.
