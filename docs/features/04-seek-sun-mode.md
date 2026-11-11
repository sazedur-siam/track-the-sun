# 04 · Seek-the-sun mode

**Status:** Proposed · **Value:** Medium · **Effort:** S

## Summary

A toggle on the Home screen: **Avoid sun** (the default) or **Get sun**. In "Get sun" mode, the app recommends the sunny side instead of the shady one.

## Why

Many riders *want* the sun: in winter, on cold mornings, for photos or the view, or with motion sickness, where looking out of a bright window helps. Supporting both doubles who the app is for. The `SunAvoidance = "avoid" | "seek"` type already exists in `src/types.ts`, but nothing uses it.

## User experience

- On the Home main card, a segmented control below the departure time: `☀️ Get sun | 🌤 Avoid sun`.
- The result screen keeps the same layout. Only the wording and the highlighted side change, e.g. "Sit on the right side: the sun is on your right for 90% of the trip."
- Remember the last choice (AsyncStorage). Saved routes store their own mode.

## Technical approach

- `calculateSunExposure(waypoints, mode: SunAvoidance = 'avoid')`. Only the last step changes: in `seek` mode, `recommendation = sunnySide` (with the same margin rule) instead of the opposite side.
- Pass `mode` as a route param (`mode=seek`), parsed in `parseRouteResultParams`. Add it to `RouteResultParams`.
- `FavoriteRoute` gets an optional `mode?: SunAvoidance`, which stays compatible with routes saved earlier, as `departureTime` does.
- Add translations `result.summarySeek*` and `home.modeAvoid/modeSeek`. Make `BusDiagram` label the recommended side "Sit here" in both modes.

## Edge cases

- No sun on the trip: the same "either side" message in both modes.
- Balanced exposure: neutral in both modes.

## Acceptance criteria

- [ ] The toggle is visible on Home, its setting persists, and it changes the recommendation.
- [ ] Unit tests: on the eastbound route with a southern sun, `avoid` gives `left` and `seek` gives `right`.
- [ ] A saved route remembers its mode.
- [ ] All strings are translated (EN/BN), with accessibility labels on the toggle.

## Effort

About 0.5–1 day.
