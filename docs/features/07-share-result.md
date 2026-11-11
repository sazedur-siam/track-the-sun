# 07 · Share a result

**Status:** Proposed · **Value:** Medium · **Effort:** S–M

## Summary

A **Share** button on the result screen. It sends a short message plus a link that opens the same result in the app, or on the web. Optionally it can attach an image of the result card.

## Why

People often travel together: "Sit on the left on the way to Chattogram tomorrow!" Sharing also spreads the app for free, since every shared link points back to TrackTheSun.

## User experience

- On the result screen, a share icon in the header or next to **Save**.
- The shared text looks like this (translated):
  > ☀️ Dhaka Airport → Chattogram, leaving 7:30 AM: sit on the **left**. The sun is on the right for 90% of the trip.
  > https://…/route-result?fromLat=…
- Opening the link in the app (or on web) recalculates and shows the same result.

## Technical approach

- **Links already work.** The result screen gets its locations and time from short params (`buildRouteResultParams`). When the in-memory route is missing, it fetches the route again (see `src/services/routeStore.ts`). So a shared link only needs `fromLat/fromLng/fromName/toLat/toLng/toName/departureTime`. `routeId` is optional.
- **Link format.**
  - In-app: `Linking.createURL('/route-result', { queryParams })` uses the `trackthesun://` scheme already set in `app.json`.
  - Web / universal: once the web build is hosted (`npx expo export -p web` → any static host), use `https://<host>/route-result?...`. Later, add iOS associated domains and Android app links so the https link opens the app.
  - Shorten names to the first part before the comma, to keep links short.
- **Share sheet.** React Native's built-in `Share.share({ message, url })` needs no new dependency. On web, use `navigator.share` when available, otherwise copy to the clipboard (`expo-clipboard`) and show a toast.
- **Image (optional, phase 2).** `react-native-view-shot` captures the result card, and `expo-sharing` shares the PNG.

## Edge cases

- Links with missing or bad coordinates: the result screen already shows "No route" with a Back button.
- Departure time is in the past when the link is opened: show the original time, plus a "Recalculate for now" button.
- Very long place names: shorten them in both the message and the params.

## Acceptance criteria

- [ ] The Share button opens the native share sheet on iOS and Android, and copies to the clipboard on web.
- [ ] Opening a shared link on a fresh install or a new browser tab shows the same recommendation.
- [ ] The message is translated (EN/BN).
- [ ] Unit test: building a share URL and parsing it back gives the same locations and time.

## Effort

Text and link: about 0.5–1 day. Image sharing: about 1 more day. Universal links: about 1 more day, once a web host exists.
