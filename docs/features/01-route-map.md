# 01 · Route map with sun-side colouring

**Status:** Proposed · **Value:** High · **Effort:** M–L

## Summary

Show the route on a map on the result screen. Colour each stretch of road by where the sun is: on the left, on the right, or on neither side (ahead, behind, or set).

## Why

A percentage like "90% right" is abstract. A map shows *where* the sun changes sides. For example: "the highway stretch is sunny on the right, but once you're in the city it doesn't matter." That builds trust in the recommendation and helps on long or winding trips. `react-native-maps` is already a dependency but nothing uses it yet.

## User experience

- On the result screen, a map card sits between the recommendation and the "Sun on each side" card. It is about 220 px tall and zoomed to fit the whole route.
- Line colours: **amber** for sun on the left, **sky blue** for sun on the right, **grey** for neither side or sun down. A legend sits below the map.
- Start and end pins use the same icons as the Journey card.
- Tapping the map opens a full-screen view you can pan and zoom.

## Technical approach

- **Data.** `calculateSunExposure()` already returns `waypointDetails[]`, with the `side` for each segment. Group consecutive segments with the same `side` into runs, giving one `<Polyline>` per run. This keeps the number of lines small: usually 5–30 instead of thousands of segments.
- **Simplification.** OSRM `overview=full` returns many points. Thin out each run before drawing it (Douglas–Peucker, about 15 m tolerance) so long routes stay smooth. Add the helper to `src/utils/geometry.ts`, with tests.
- **Component.** Add `src/components/RouteMap.tsx`, with props `{ details: WaypointSunData[]; from: Location; to: Location }`. Call `fitToCoordinates` once the map has loaded.
- **Web.** `react-native-maps` does not support web. Add `RouteMap.web.tsx`, either as a placeholder ("Map available in the app") or built on Leaflet with OSM tiles.
- **Platform config.**
  - iOS uses Apple Maps by default and needs no key.
  - Android uses Google Maps and **needs an API key** in `app.json` → `android.config.googleMaps.apiKey`, through EAS secrets.
  - Alternative: drop the key and use `UrlTile` with an OSM-based provider. The public OSM tile servers forbid heavy app use, so this would need a tile provider such as MapTiler or Stadia, which have free tiers.
- **Theming.** Use theme tokens for the line colours. Pass `userInterfaceStyle` (iOS) or a dark map style (Android) in dark mode.

## Edge cases

- Very short routes (< 2 points): hide the map.
- Night trips: the whole line is grey, so show a "No direct sun on this trip" note on the map.
- Routes crossing the antimeridian or very long routes: check how the map fits the route on screen.

## Acceptance criteria

- [ ] The map shows the full route with start and end pins on iOS and Android.
- [ ] Each stretch is coloured by sun side and matches the percentages in the Bus diagram.
- [ ] A 300 km route renders without dropped frames (simplified to under 2k points).
- [ ] Web does not crash: a fallback or Leaflet map is shown.
- [ ] Colours and the legend work in light and dark mode. Legend text is translated (EN/BN).
- [ ] Unit tests cover grouping segments into runs and the simplification helper.

## Effort

About 2–4 days. Getting the Android key or tile provider right, plus the web fallback, accounts for most of the uncertainty.
