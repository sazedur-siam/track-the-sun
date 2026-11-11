# CLAUDE.md

TrackTheSun is an Expo / React Native app that tells bus riders which side to sit on to avoid (or get) the sun. You enter a route and a departure time. The app gets a driving route from OSRM, works out the sun's position at each point along it with `suncalc`, and recommends a side.

## Commands

```bash
npm install          # install deps (node_modules is not committed)
npm start            # Expo dev server (press i / a / w, or scan the QR with Expo Go)
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # browser (react-native-web)
npm test             # Jest (jest-expo preset); tests live in src/**/__tests__/
npm run lint         # expo lint (eslint-config-expo)
npm run typecheck    # tsc --noEmit (strict mode)
```

Run `npm test && npm run lint && npm run typecheck` before you call a change done. EAS build profiles (`development`, `preview` → APK, `production`) are in `eas.json`.

## Stack

- Expo SDK 54, React Native 0.81, React 19.1, with the New Architecture and React Compiler enabled (`app.json` → `experiments.reactCompiler`)
- `expo-router` v6 for file-based routing, with typed routes on
- `react-native-reanimated` v4 plus the RN `Animated` API, `expo-haptics`, `expo-location`
- `@react-native-async-storage/async-storage` for persistence
- Routing has two providers, chosen in the Settings tab:
  - **OSRM**: free public server `router.project-osrm.org`, no key, no traffic
  - **Google Maps Platform Routes API** (`routes.googleapis.com/directions/v2:computeRoutes`): live traffic, needs a key. The legacy Directions API is **not** enabled on the key.
- Geocoding uses Nominatim (free, no key).

## Google API key

- The built-in key comes from `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`. That file is gitignored; `.env.example` is the template. Restart `expo start` after changing it.
- Users can paste their own key in Settings ("Test & save"), helped by a "How do I get a key?" guide, a Paste button and a key-format hint. `/settings?focus=key` opens the guide and focuses the key field; the Home hint (`RouteSourceHint`) and the fallback notice link there. It is stored in AsyncStorage and **overrides** the built-in key. "Remove my key" goes back to the built-in one.
- **Never commit a real key**, including in tests. Tests use obvious fakes like `FAKE-user-key-0002`.
- `EXPO_PUBLIC_*` values are bundled into the app, so the key can be extracted. Restrict it in Google Cloud Console (Routes API only, plus quotas). For EAS builds, set it with `eas env:create`, because `.env.local` isn't uploaded.
- Read it only as `process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (dot access, literal name). Expo inlines it at build time, and the lint rule `expo/no-dynamic-env-var` enforces this.

## Layout

Two folder trees exist side by side:

- `app/` holds the expo-router **routes only**, as thin wrappers.
  - `_layout.tsx`: root Stack wrapped in `LanguageProvider` and the navigation `ThemeProvider`
  - `(tabs)/index.tsx`: `LoadingScreen` (1.8 s), then `HomeScreen`
  - `(tabs)/saved_locations.tsx`: saved routes list. This screen's logic lives in the route file itself.
  - `(tabs)/settings.tsx`: re-exports `src/screens/SettingsScreen` (route provider + Google key)
  - `route-result.tsx`: header plus `RouteResultScreen`
- `src/` holds the app code.
  - `screens/`: `HomeScreen`, `RouteResultScreen`, `LoadingScreen`
  - `components/`: LocationInput (debounced Nominatim autocomplete), CurrentLocationButton, TimePicker, BusDiagram, FavoritesModal, NameInputModal, LanguagePicker, SunAnimation, AnimatedProgressCircle
  - `services/`: pure logic with no React
    - `routingService.ts`: `requestOsrmRoute` / `requestGoogleRoute` (each throws `RoutingError` with a `code`), and `fetchRoute(…, { provider, googleApiKey })`, which **falls back from Google to OSRM** and records it in `route.fallback`. Also `testGoogleApiKey`, `buildWaypoints` (distance-weighted timestamps), polyline decode, bearing and format helpers.
    - `settingsService.ts`: saved provider and user key (AsyncStorage), `effectiveGoogleKey`, `maskKey`, and **`planRoute()`**. Screens call `planRoute`, never `fetchRoute` directly.
    - `sunCalcService.ts`: `calculateSunExposure()`, the core algorithm
    - `geocodingService.ts`: Nominatim search and reverse geocoding
    - `favoritesService.ts`: AsyncStorage CRUD for saved routes. Stores an optional `departureTime` as a local "HH:mm" time of day; `resolveDepartureTime()` turns it into today's date.
    - `routeStore.ts`: in-memory hand-off of `Route` objects between screens, plus `buildRouteResultParams` / `parseRouteResultParams`
  - `i18n/`: `LanguageProvider` + `useTranslation()`, and `translations.ts` (EN + BN)
  - `utils/time.ts`: `formatClock()` (12h clock)
  - `types.ts`: shared types
- `docs/features/`: the feature backlog, one spec file per proposed feature. **Delete a feature's file in the commit that ships it**, and list it under "Shipped" in `docs/features/README.md`.
- The root `components/`, `hooks/` and `constants/` come from the Expo template: themed-text/view, icon-symbol, `use-color-scheme`. `constants/theme.ts` holds the **design tokens** (`Colors`, `Spacing`, `Radius`, `Shadows`).
- Import alias: `@/*` points to the repo root, e.g. `@/src/services/...` and `@/constants/theme`.

## Core algorithm (sunCalcService)

For each polyline segment, the code does the following:

1. It computes the heading as the bearing to the next point.
2. It computes the sun azimuth: `suncalc` azimuth converted to compass degrees with `(az*180/π + 180) % 360`.
3. It takes `relativeAngle = normalize(sunAz - heading)`.
4. A positive angle means the sun is on the **right**. `|angle| < 30` or `> 150` is neutral (sun ahead or behind). Sun altitude ≤ 0 is also neutral.
5. `leftPercentage` / `rightPercentage` are **distance shares**. They are shown to the user.
6. Each segment also gets an **intensity**: `|sin(relativeAngle)| × cos(sunAltitude)`, from 0 to 1. Low sun from the side is 1, overhead sun is close to 0. `leftIntensity` / `rightIntensity` are distance-weighted intensity shares and **drive the recommendation**: the side *opposite* the sun is recommended only when it leads by more than `RECOMMENDATION_MARGIN` (10 points).
7. `mode` (`SunAvoidance`: `avoid` | `seek`, default `avoid`): avoid recommends the side opposite the clearly sunnier side, seek recommends that side.
8. Extras: `sunnySideStrength` (strong ≥ 0.6, moderate ≥ 0.35, otherwise mild), `glare` (the longest run with altitude < 15° and side factor > 0.7), and `neutralReason` (`balanced` | `overhead`).

Waypoint timestamps are interpolated by **cumulative distance**, not by point index, because polyline points are not evenly spaced. Keep that behaviour.

**Navigating to results:** never put the `Route` in URL params, because a full route is hundreds of KB. Call `putRoute(route)` and pass `buildRouteResultParams(routeId, from, to, departureTime)`. `RouteResultScreen` reads the route with `getRoute(routeId)`. If the route isn't in memory (web refresh, deep link, app restart), it **fetches it again** from the from/to/time params. That is also why a result URL works as a shareable link.

## Conventions

- **Styling:** always use the tokens from `@/constants/theme`. Get colors with `const theme = Colors[useColorScheme() ?? 'light']`. Do not hardcode colors, and support both light and dark mode.
- **i18n:** every user-visible string goes through `t('namespace.key', params)`. Add each key to **both** `en` and `bn` in `translations.ts`, with flat dot-namespaced keys and `{param}` placeholders. `en` is the fallback. Services return structured data; the UI builds the localized sentences (see the summary in `RouteResultScreen`).
- **Accessibility:** touchables get `accessibilityRole` and a translated `accessibilityLabel`.
- **Haptics:** use `Haptics` on primary actions, matching the existing patterns.
- **Files:** components are PascalCase in `src/`. Template files in the root folders are kebab-case.
- **Services:** network failures in services are caught and return `null` or `[]`. Screens show an `Alert`.

## Testing

- Tests use Jest with `jest-expo`. `jest.setup.js` installs the official AsyncStorage mock.
- Keep service logic pure, and test it in `src/services/__tests__/`. Sun tests use synthetic straight routes in Dhaka on the December solstice, where the sun is reliably in the south.
- `src/i18n/__tests__/translations.test.ts` fails if `en` and `bn` have different keys or `{placeholders}`.
- New fields on stored data (e.g. `FavoriteRoute`) must be **optional**, with a test that reads legacy data.

## Known gaps / gotchas

- **Maps:** `src/components/RouteMap.tsx` uses react-native-maps (Apple Maps on iOS; Google Maps on Android, which needs a key with "Maps SDK for Android". `app.config.js` injects `GOOGLE_MAPS_ANDROID_API_KEY`, falling back to `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`. Expo Go has its own key). `RouteMap.web.tsx` uses Leaflet with OpenStreetMap tiles, **lazy-imported** inside an effect because Leaflet touches `window` and would break static web rendering. OSM's public tiles are fine for light use only; switch to a tile provider before heavy web traffic.
- Keep `react-native-maps` at the version `npx expo install` picks (1.20.1 for SDK 54), so it matches Expo Go.
- **Sharing:** `src/services/share.ts` builds the message and a `/route-result?…` link without `routeId`. The receiver refetches from the params. The link base is `EXPO_PUBLIC_WEB_URL` if set, otherwise the current origin on web, otherwise a `trackthesun://` deep link.
- Don't start the dev server with `CI=1`: Expo turns off file watching in CI mode, and edits won't show up.
- The Nominatim usage policy limits requests to 1 per second and asks for a meaningful User-Agent. Search is debounced in `LocationInput`.
- The public OSRM server only serves the driving profile.
- Google rejects departure times in the past. `requestGoogleRoute` then switches to `TRAFFIC_UNAWARE`. Traffic-aware requests are billed at a higher Google tier than traffic-unaware ones.
- `Route.provider`, `trafficAware` and `fallback` are shown on the result screen. Keep them accurate when adding providers.
- Deleting a route file while `expo start` is running can crash the Metro watcher. Restart it.

## Git

Use the personal GitHub account **sazedur-siam** for this repo. The remote is `github.com/sazedur-siam/track-the-sun`, and the repo-local `user.name`/`user.email` are already set to it. Do not add Claude attribution to commits or PRs.
