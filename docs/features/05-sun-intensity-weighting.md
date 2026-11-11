# 05 · Glare-aware weighting by sun height

**Status:** Proposed · **Value:** High (accuracy) · **Effort:** M

## Summary

Weight each segment by how much sun actually comes through a **side window**, not just which side it's on. Low sun shines straight into side windows. Midday sun high in the sky mostly hits the roof.

## Why

Today every sunny segment counts the same: `side ∈ {left, right, neutral}`, weighted by distance. In practice:

- Sun at 10° high, at 90° to the side, is the worst case: bright glare and heat straight through the window.
- Sun at 75° high is almost overhead, so very little comes through a side window.
- Sun at 40° from straight ahead still lights the side somewhat. Today that is either fully counted or not counted at all (the 30°/150° cut-offs).

Weighting by angle makes the percentages match how the trip actually feels. That makes everything built on them better too: the recommendation, the timeline (03) and best time to leave (02).

## Technical approach

For each segment, with the sun height `h` and the angle `θ` between the sun and the direction of travel:

```
sideFactor  = |sin(θ)|            // 1 when the sun is straight to the side, 0 ahead/behind
heightFactor = cos(h)             // 1 at the horizon, ~0 overhead (side-window share)
exposure    = sideFactor × heightFactor × distance   (h > 0 only)
```

- Add left and right exposure the same way the distances are added today. Show **intensity-weighted percentages**: share of the maximum possible exposure. Keep the current share-of-distance figures as `leftDistancePct` and `rightDistancePct` for the explanation text.
- Optional: add a "glare" flag when `h < 15°` and `sideFactor > 0.7`, shown as "⚠️ Low sun glare around 17:40".
- Optional, as a later step: weather. Open-Meteo (free, no key) has hourly cloud cover. Multiply by `(1 − cloudCover × 0.8)`. That needs a network call and a cache, so keep it behind a setting.
- All changes stay inside `sunCalcService.ts`. The current output is kept so the UI keeps working, and new fields are added. Update the tests in `src/services/__tests__/sunCalcService.test.ts` for the new numbers and add cases for low and high sun.

## Edge cases

- Near the equator, at noon, the sun is almost overhead, so both sides get little sun. The recommendation should become neutral ("either side").
- Wintertime at high latitudes: the sun stays low all day, so these trips keep almost their full weight. Midday summer trips are the ones whose weight drops.
- Keep the 10-point margin rule, but apply it to the weighted shares.

## Acceptance criteria

- [ ] Weighted exposure is computed with the formula above, and the unit tests cover low sun, overhead sun and sun at 45°.
- [ ] The recommendation for the existing eastbound December test route is unchanged.
- [ ] A synthetic equatorial-noon route gives "balanced / either side".
- [ ] The result card explains the weighting in one sentence (EN/BN).

## Effort

About 1–2 days, plus about 1 day if the weather layer is included.
