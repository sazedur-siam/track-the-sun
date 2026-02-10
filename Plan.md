Great choices! This keeps everything free and gives users real flexibility. Let me put together a thorough phased plan.

---

## 🚌 SunSide — Phased Implementation Plan

### Tech Stack (All Free)

| Concern | Solution |
|---|---|
| Framework | React Native (Expo managed workflow) |
| Routing/Directions | OSRM (free, no API key) |
| Geocoding/Search | Nominatim / OpenStreetMap (free, no key) |
| Sun Position | `suncalc` JS library (offline) |
| Map Display | `react-native-maps` + OpenStreetMap |
| State Management | React Context (app is simple enough) |
| Navigation | `expo-router` or `react-navigation` |

---

### Phase 0 — Project Setup & Scaffolding
**Goal:** Bootable app on both platforms from your M1 Mac

- Initialize Expo project (`npx create-expo-app SunSide`)
- Configure Android emulator + iOS simulator
- Set up folder structure:
  ```
  src/
    components/
    screens/
    services/    (sun calc, routing, geocoding)
    utils/
    hooks/
    constants/
  ```
- Install core dependencies
- Create a simple splash/loader screen that transitions to the main view

**Deliverable:** App launches on both platforms with a loading animation → blank home screen

---

### Phase 1 — Location Input UI ✅ COMPLETE
**Goal:** User can search and select "From" and "To" locations

- ✅ Build the main screen layout with two input fields (Current Location / Destination)
- ✅ Integrate Nominatim API for location autocomplete (debounced search)
- ✅ Add "Use my current location" button using `expo-location`
- ✅ Store selected locations (lat/lng + display name) in state
- ✅ Add a departure time picker (defaults to "Now", with option to pick custom date/time)
- ✅ "Calculate" button (disabled until both locations are selected)

**Deliverable:** User can search places, select origin/destination, pick time, and tap Calculate

**Implementation Notes:**
- Clean, simple components without over-engineering
- 600ms debounce on search to respect Nominatim rate limits
- Native date/time picker with platform-specific UI
- Swap button for quick origin/destination reversal
- Full dark/light mode support
- Comprehensive error handling

---

### Phase 2 — Route Fetching & Processing ✅ COMPLETE
**Goal:** Get the actual bus/driving route between two points

- ✅ Integrate OSRM API to fetch route between origin and destination
- ✅ Decode the route polyline into an array of lat/lng waypoints
- ✅ Estimate travel duration and calculate time-at-each-waypoint (for sun position over time)
- ✅ Handle error states (no route found, network error)
- ✅ Cache/store the processed route data

**Deliverable:** Given two locations, app fetches and stores a series of waypoints with timestamps

**Implementation Notes:**
- OSRM public API integration (free, no API key needed)
- Custom polyline decoder for OSRM's polyline6 format
- Waypoint timestamps calculated based on linear progression
- Results screen displays route details (distance, duration, times)
- Loading states with spinner and user feedback
- Comprehensive error handling with user-friendly messages

---

### Phase 3 — Sun Position Calculation Engine (Core Logic) ✅ COMPLETE
**Goal:** Calculate which side gets more sun across the entire route

The algorithm per waypoint:
1. **Bus heading** — Calculate bearing from waypoint[i] to waypoint[i+1]
2. **Sun azimuth** — Using `suncalc.getPosition()` for that waypoint's lat/lng and estimated time
3. **Relative angle** — `sunAzimuth - busHeading`. Normalize to -180° to +180°
4. **Side classification:**
   - Sun is to the **East-facing side** → count for East
   - Sun is to the **West-facing side** → count for West
   - Weight each segment by its distance (longer segments matter more)
5. **Aggregate** — East% vs West% across all waypoints

Edge cases handled:
- ✅ Nighttime travel (sun below horizon) → show "No direct sunlight"
- ✅ Dawn/dusk (very low sun angle) → note reduced intensity  
- ✅ North/South travel (sun roughly behind/ahead) → note "minimal side exposure"

**Deliverable:** A pure function: `calculateSunExposure(waypoints) → { eastPercentage, westPercentage, recommendation, summary }`

**Implementation Notes:**
- Clean algorithm using suncalc library
- Distance-weighted calculation for accuracy
- Handles all edge cases (nighttime, low sun, neutral exposure)
- Clear recommendation: which side to sit on to avoid sun
- Beautiful circular percentage display (East: orange, West: blue)
- User-friendly summary messages

---

### Phase 4 — Results Display UI ✅ COMPLETE
**Goal:** Beautiful, clear result screen

- ✅ Large percentage display (animated circular charts)
  - ☀️ **East Side: 70%** | **West Side: 30%**
- ✅ Visual indicator showing which side to sit on to **avoid** sun (or get sun, user preference)
- ✅ Summary card: departure time, route duration, sun intensity note
- ✅ Smooth fade-in animations for results
- ✅ Animated spring scale effect on percentage circles

**Deliverable:** Clean results screen with animated percentage display

**Implementation Notes:**
- Clean AnimatedProgressCircle component using React Native Animated API
- Spring animation for circles with staggered delays (300ms, 500ms)
- Smooth fade-in transition for all result cards (600ms)
- Shadow effects for visual depth
- Removed unused styles to keep code clean
- No external animation libraries needed

---

### Phase 5 — Polish & UX ✅ COMPLETE
**Goal:** App feels smooth and complete

- ✅ Loading animation while route + sun is being calculated
- ✅ Smooth transitions between screens
- ✅ Error handling with user-friendly messages
- ✅ Dark mode support (automatic theme switching)
- ✅ "Swap" button to reverse origin/destination
- ✅ "Recalculate" with different time (via Plan Another Route button)
- ✅ App icon and splash screen branding
- ✅ Haptic feedback on key interactions

**Deliverable:** Production-quality feel

**Implementation Notes:**
- Haptic feedback using expo-haptics on:
  - Calculate button press (Medium impact)
  - Location swap (Light impact)
  - Location selection (Light impact)
  - Current location obtained (Success notification)
  - Results displayed (Success notification)
- Dark mode automatically handled via ThemedView/ThemedText components
- App icon and splash screen configured in app.json with light/dark variants
- Loading states with clear messages ("Finding Route...", "Calculating sun position...")
- Smooth fade-in animations (600ms) on results screen
- Clean error handling with Alert dialogs
- "Plan Another Route" button allows easy recalculation

---

### Phase 6 (Optional Enhancements)
- Save favorite routes
- Show sun position visually on a bus diagram
- Haptic feedback on result
- Widget for frequently traveled routes

---

---

### Key Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Nominatim rate limiting (1 req/sec) | Debounce input to 500ms+, cache results |
| OSRM gives driving route not bus route | OSRM has no public transit mode — route will approximate the road path, which is close enough for sun angle calculation |
| Sun calc accuracy | `suncalc` is well-tested and used widely — accuracy is excellent for this use case |
