# ☀️ TrackTheSun

**Which side of the bus should you sit on to avoid the sun?**

TrackTheSun is an Expo / React Native app. You pick where you're going and when you leave. The app follows the route and the sun's position along the way, then tells you which side of the vehicle will be in the shade.

## Features

- 🔎 **Location search** with autocomplete (OpenStreetMap / Nominatim) and **use my current location**
- 🕒 **Departure time** picker ("Now" or any date and time)
- 🗺️ **Two route providers**: free **OSRM**, or **Google Maps** (Routes API, live traffic) with your API key. If Google fails, the app switches to OSRM automatically.
- 🧭 **Sun-side analysis**: works out the sun's position for every part of the route, weighted by distance
- 🚌 **Clear recommendation**: which side to sit on, what share of the trip each side is in the sun, and the compass direction the sunny side faces
- ⭐ **Saved routes** that remember your usual departure time
- 🌗 **Light and dark mode**
- 🇬🇧 🇧🇩 **English and Bangla**
- 🆓 **Works without any API key**: Google Maps is optional

## How it works

1. **Route.** The app gets the driving route from [OSRM](https://project-osrm.org/) or the [Google Routes API](https://developers.google.com/maps/documentation/routes), whichever is chosen in Settings, and decodes its path. Each point gets an expected time based on how far along the route it is. Google's times include traffic, so they are usually closer to reality on busy roads.
2. **Sun.** For each part of the route, [`suncalc`](https://github.com/mourner/suncalc) gives the sun's direction and height at that place and time.
3. **Side.** The app compares the sun's direction with the direction of travel:
   - sun to the right → sun on the right side
   - sun to the left → sun on the left side
   - sun mostly ahead, behind, or below the horizon → neither side
4. **Recommendation.** Each part counts in proportion to its length. If one side is in the sun clearly more often, by a margin of more than 10 percentage points, the app tells you to sit on the other side.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Expo SDK 54, React Native 0.81, React 19 (New Architecture and React Compiler) |
| Navigation | `expo-router` (file-based, typed routes) |
| Routing API | OSRM public server, or Google Maps Routes API (optional, with automatic fallback) |
| Geocoding | Nominatim / OpenStreetMap |
| Sun maths | `suncalc` |
| Storage | `@react-native-async-storage/async-storage` |
| Animation | `react-native-reanimated` |
| Tests | Jest (`jest-expo`) |

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: add a Google Maps key (Routes API)
npm start          # then press i (iOS), a (Android), w (web), or scan the QR code with Expo Go
```

### Google Maps key (optional)

1. In Google Cloud Console, enable the **Routes API**. Create an API key and restrict it to that API.
2. Put it in `.env.local` as `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=…`, then restart `npm start`.
3. Or paste a key in the app under **Settings → Google Maps API key → Test & save**. A key entered there replaces the built-in one, which helps when the built-in key expires.

Keys in `EXPO_PUBLIC_*` variables are bundled into the app, so always restrict the key. For EAS builds, set the variable with `eas env:create`.

Other scripts:

```bash
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # browser
npm test           # unit tests
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

To build with EAS, use the `development`, `preview` (Android APK) and `production` profiles in [`eas.json`](eas.json).

## Project structure

```
app/                      # expo-router routes (thin wrappers)
├── _layout.tsx           # root stack, theme + language providers
├── (tabs)/index.tsx      # splash → Home
├── (tabs)/saved_locations.tsx
└── route-result.tsx
src/
├── screens/              # HomeScreen, RouteResultScreen, LoadingScreen
├── components/           # LocationInput, TimePicker, BusDiagram, modals, …
├── services/             # pure logic: routing, sun calculation, geocoding, favorites, routeStore
│   └── __tests__/
├── i18n/                 # LanguageProvider + EN/BN translations
├── utils/                # small helpers (time formatting)
└── types.ts
constants/theme.ts        # design tokens (colors, spacing, radius, shadows)
docs/features/            # proposed features, one file each
```

## Roadmap

Planned features are described one per file in [`docs/features/`](docs/features/README.md).

## Credits

Routing by [OSRM](https://project-osrm.org/). Geocoding by [Nominatim](https://nominatim.org/) © OpenStreetMap contributors. Sun positions from [suncalc](https://github.com/mourner/suncalc).
