# ☀️ TrackTheSun (SunSide)

**Which side of the bus should you sit on to avoid (or get) the sun?**

TrackTheSun is a React Native mobile app that calculates which side of a bus/vehicle gets more sunlight during your journey, helping you choose the right seat for maximum comfort.

## 🎯 Features

- 🗺️ Search and select origin/destination locations
- 🧭 Calculate route with real-time sun position analysis
- 📊 Visual breakdown of sun exposure (East vs West side)
- 🌅 Accounts for time of day and seasonal sun position
- 🆓 100% free - no API keys required

## 🛠️ Tech Stack

- **Framework**: React Native (Expo)
- **Routing**: OSRM (free routing API)
- **Geocoding**: Nominatim/OpenStreetMap
- **Sun Calculations**: `suncalc` library
- **Maps**: `react-native-maps` + OpenStreetMap
- **Navigation**: `expo-router`

## 📦 Installation

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm start
   ```

3. Run on your platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

## 🚀 Development Phases

### ✅ Phase 0 - Project Setup
- [x] Initialize Expo project
- [x] Set up folder structure (`src/components`, `src/screens`, `src/services`, etc.)
- [x] Install core dependencies (suncalc, expo-location, react-native-maps)
- [x] Create loading screen with smooth transition
- [x] App launches on both iOS and Android

### 🚧 Phase 1 - Location Input UI
- [ ] Build main screen with location inputs
- [ ] Integrate Nominatim autocomplete
- [ ] Add "Use current location" feature
- [ ] Departure time picker
- [ ] Calculate button

### 📋 Phase 2 - Route Fetching
- [ ] OSRM API integration
- [ ] Decode route polyline
- [ ] Calculate waypoint timestamps

### 📋 Phase 3 - Sun Calculation Engine
- [ ] Calculate bus heading at each waypoint
- [ ] Determine sun azimuth using suncalc
- [ ] East/West side classification algorithm
- [ ] Handle edge cases (night, dawn/dusk)

### 📋 Phase 4 - Results Display
- [ ] Animated percentage charts
- [ ] Visual route map with color-coding
- [ ] Recommendation card

### 📋 Phase 5 - Polish & UX
- [ ] Loading animations
- [ ] Dark mode support
- [ ] Error handling
- [ ] App branding

## 📁 Project Structure

```
TrackTheSun/
├── app/                    # Expo Router screens
│   ├── (tabs)/
│   │   └── index.tsx      # Main entry point
│   └── _layout.tsx
├── src/                   # Source code
│   ├── components/        # Reusable UI components
│   ├── screens/          # Full screen components
│   │   ├── LoadingScreen.tsx
│   │   └── HomeScreen.tsx
│   ├── services/         # Business logic
│   │   ├── sunCalcService.ts
│   │   ├── routingService.ts
│   │   └── geocodingService.ts
│   ├── utils/            # Helper functions
│   ├── hooks/            # Custom React hooks
│   ├── constants/        # App constants
│   └── types.ts          # TypeScript interfaces
├── assets/               # Images and fonts

```

## 🧪 Testing

The app has been tested to:
- ✅ Launch successfully on iOS and Android
- ✅ Display loading animation
- ✅ Transition to home screen after 2 seconds
- ✅ Support dark mode

