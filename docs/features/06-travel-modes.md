# 06 · Train, walking and other travel modes

**Status:** Proposed · **Value:** Medium–High · **Effort:** M–L

## Summary

Let users pick a travel mode: **Bus/Car** (today), **Train**, **Walk/Cycle**. Each mode uses a suitable route and speed, and words its advice for that mode ("window seat on the left", "walk on the north side of the street").

## Why

Train passengers have exactly the same seat question, and long intercity rail trips are where it matters most. Walking and cycling users care about which side of the street is shaded. Covering more modes widens who the app is for, without changing the core sun calculation.

## User experience

- On Home, a row of mode chips above From/To: 🚌 Bus · 🚆 Train · 🚶 Walk · 🚲 Cycle.
- The result wording changes with the mode. Train: "Sit on the left (window seats A/B usually face …)". Walk/cycle: "Stay on the shady (right) side of the street".
- Saved routes remember their mode.

## Technical approach

- **Routing backends.** `routingService.fetchRoute` gains a `profile` parameter.
  - **Car / bus:** `router.project-osrm.org` (current). The public demo server only serves the **driving** profile.
  - **Walk / cycle:** FOSSGIS servers `routing.openstreetmap.de/routed-foot/` and `/routed-bike/`. They use the same OSRM API, so the existing parser works. Check their usage policy.
  - **Train:** OSRM has no rail profile. Options:
    (a) a self-hosted OSRM with a rail profile, or OpenRailRouting (GraphHopper-based);
    (b) BRouter's rail profile;
    (c) a GTFS-based planner (e.g. a public OpenTripPlanner instance) for real schedules.
    Start with (a) or (b) for track geometry. Duration can come from the backend or from an assumed average speed.
- Put the backends behind a small interface, `RoutingProvider { fetch(origin, dest, departure) }`, so modes can be added without changing the screens.
- The sun maths doesn't change. The direction of travel along the path is all it needs.
- Mode travels in the route params and is stored on `FavoriteRoute` (optional field).

## Edge cases

- Train stations: geocoding an address doesn't snap to a station. Snap to the nearest rail line or show a "choose a station" search.
- Bidirectional seating on trains (seats facing backwards): add a "facing backwards" toggle that swaps left and right.
- A backend is down or rate-limited: show a clear, translated error, and fall back to driving when the modes are similar enough.

## Acceptance criteria

- [ ] Mode chips are on Home, the selected mode persists, and the right backend is called for each mode (unit-tested with mocked `fetch`).
- [ ] Walk and cycle routes follow footpaths and cycle paths, not highways.
- [ ] Train mode returns rail geometry for at least one known intercity pair (e.g. Dhaka → Chattogram).
- [ ] "Facing backwards" swaps the recommendation.
- [ ] Results wording is translated for each mode (EN/BN).

## Effort

Walk and cycle: about 1 day. Train: about 2–4 days, depending on which backend is chosen and hosted.
