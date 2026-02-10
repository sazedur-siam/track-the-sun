# TrackTheSun - Source Code Structure

This directory contains the main source code for the TrackTheSun application.

## Directory Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Full screen components
├── services/       # Business logic and API integrations
│   ├── sunCalcService.ts      # Sun position calculations
│   ├── routingService.ts      # Route fetching (OSRM)
│   └── geocodingService.ts    # Location search (Nominatim)
├── utils/          # Helper functions and utilities
├── hooks/          # Custom React hooks
├── constants/      # App-wide constants
└── types.ts        # Shared TypeScript interfaces
```

## Phase Implementation

### ✅ Phase 0 - Complete
- Project scaffolding
- Folder structure
- Core dependencies installed
- Loading screen with transition

### 🚧 Phase 1 - Next
- Location input UI
- Geocoding integration
- Current location support

### 📋 Phase 2 - Planned
- OSRM route fetching
- Waypoint processing

### 📋 Phase 3 - Planned
- Sun position calculation engine
- East/West side algorithm

### 📋 Phase 4 - Planned
- Results display UI
- Animated charts

### 📋 Phase 5 - Planned
- Polish and UX enhancements
