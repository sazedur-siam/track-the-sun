# Phase 3 Documentation - Sun Calculation Engine

## Overview

Phase 3 implements the core sun position calculation algorithm that determines which side of a vehicle receives more sun exposure during a journey.

## Algorithm

### Input
- Array of waypoints with coordinates and timestamps
- Departure time (used to calculate time at each waypoint)

### Process

#### 1. For Each Waypoint Segment

For every pair of consecutive waypoints `[i]` and `[i+1]`:

**a) Calculate Bus Heading**
```typescript
busHeading = calculateBearing(
  waypoint[i].lat, waypoint[i].lng,
  waypoint[i+1].lat, waypoint[i+1].lng
)
// Returns: 0° = North, 90° = East, 180° = South, 270° = West
```

**b) Calculate Sun Position**
```typescript
sunAzimuth = getSunAzimuth(
  waypoint[i].lat,
  waypoint[i].lng,
  waypoint[i].timestamp
)
// Returns: Sun direction in degrees (0-360)

sunAltitude = getSunAltitude(...)
// Returns: Sun elevation above horizon (radians)
```

**c) Compute Relative Angle**
```typescript
relativeAngle = normalizeAngle(sunAzimuth - busHeading)
// Normalized to -180° to +180°
```

**d) Classify Side**
```typescript
if (sunAltitude <=0) {
  side = 'neutral' // Sun below horizon
}
else if (|relativeAngle| < 30° || |relativeAngle| > 150°) {
  side = 'neutral' // Sun ahead or behind
}
else if (relativeAngle > 0) {
  side = 'east' // Sun on right side
}
else {
  side = 'west' // Sun on left side
}
```

**e) Calculate Distance**
```typescript
distance = calculateDistance(
  waypoint[i].lat, waypoint[i].lng,
  waypoint[i+1].lat, waypoint[i+1].lng
)
// Uses Haversine formula, returns meters
```

**f) Accumulate Weighted Totals**
```typescript
if (side === 'east') totalEastDistance += distance
if (side === 'west') totalWestDistance += distance
if (side === 'neutral') totalNeutralDistance += distance
```

#### 2. Calculate Final Percentages

```typescript
totalDistance = totalEastDistance + totalWestDistance + totalNeutralDistance

eastPercentage = (totalEastDistance / totalDistance) * 100
westPercentage = (totalWestDistance / totalDistance) * 100
```

#### 3. Generate Recommendation

```typescript
if (!hasDirectSunlight) {
  recommendation = 'neutral'
  summary = 'No direct sunlight during this journey'
}
else if (eastPercentage > westPercentage + 10) {
  recommendation = 'west' // Sit on west to avoid east sun
  summary = `Sit on the west side to avoid ${eastPercentage}% sun exposure from the east`
}
else if (westPercentage > eastPercentage + 10) {
  recommendation = 'east' // Sit on east to avoid west sun
  summary = `Sit on the east side to avoid ${westPercentage}% sun exposure from the west`
}
else {
  recommendation = 'neutral'
  summary = 'Sun exposure is balanced - either side is fine'
}
```

### Output

```typescript
interface SunExposureResult {
  eastPercentage: number;        // 0-100
  westPercentage: number;         // 0-100
  recommendation: 'east' | 'west' | 'neutral';
  hasDirectSunlight: boolean;
  waypointDetails: WaypointSunData[];
  summary: string;
}
```

## Implementation Details

### Key Functions

**calculateSunExposure(waypoints: RouteWaypoint[]): SunExposureResult**
- Main entry point for sun calculation
- Processes all waypoints and returns final result

**getSunPosition(lat, lng, date): SunCalc.Position**
- Wrapper around suncalc library
- Returns sun position (azimuth and altitude) in radians

**getSunAzimuth(lat, lng, date): number**
- Gets sun direction in degrees
- Converts from radians and normalizes to 0-360

**calculateBearing(lat1, lng1, lat2, lng2): number**
- Calculates geographic bearing between two points
- Returns degrees (0° = North, 90° = East, etc.)

**calculateDistance(lat1, lng1, lat2, lng2): number**
- Haversine formula for distance between coordinates
- Returns distance in meters

**normalizeAngle(angle): number**
- Normalizes angle to -180° to +180° range
- Used for relative angle calculation

**determineSide(relativeAngle): 'east' | 'west' | 'neutral'**
- Classifies which side based on relative angle
- Handles ahead/behind cases as neutral

### Edge Cases

1. **Nighttime Travel**
   - Detected when `sunAltitude <= 0`
   - All waypoints marked as neutral
   - Display: "No direct sunlight"

2. **Low Sun Angles**
   - Dawn/dusk automatically handled
   - Low altitude affects classification
   - Neutral zones near horizon

3. **North-South Routes**
   - Sun ahead or behind (low relative angle)
   - Marked as neutral
   - Summary reflects balanced exposure

4. **Very Short Routes**
   - Handled gracefully
   - Minimum 2 waypoints required
   - Works with any distance

5. **Equator Crossing**
   - Algorithm works globally
   - Suncalc handles all latitudes
   - Accurate worldwide

## Usage Example

```typescript
import { calculateSunExposure } from '@/src/services/sunCalcService';

const waypoints = [
  { lat: 40.7128, lng: -74.0060, timestamp: new Date('2024-03-15T08:00:00') },
  { lat: 40.7580, lng: -73.9855, timestamp: new Date('2024-03-15T08:30:00') },
  // ... more waypoints
];

const result = calculateSunExposure(waypoints);

console.log(result);
// {
//   eastPercentage: 73,
//   westPercentage: 27,
//   recommendation: 'west',
//   hasDirectSunlight: true,
//   summary: 'Sit on the west side to avoid 73% sun exposure from the east',
//   waypointDetails: [...]
// }
```

## Performance

- **Complexity:** O(n) where n = number of waypoints
- **Typical waypoints:** 100-500 for most routes
- **Calculation time:** <100ms for average route
- **Memory:** Minimal, processes sequentially

## Testing Scenarios

### Test Case 1: Morning East Commute
```
Route: Manhattan to Brooklyn (eastward)
Time: 8:00 AM
Expected: High east exposure, recommend west side
```

### Test Case 2: Evening West Return
```
Route: Brooklyn to Manhattan (westward)
Time: 6:00 PM
Expected: High west exposure, recommend east side
```

### Test Case 3: Midnight Route
```
Route: Any direction
Time: 12:00 AM
Expected: No sunlight, neutral recommendation
```

### Test Case 4: North-South Route
```
Route: Uptown to Downtown (northward)
Time: 12:00 PM (noon)
Expected: Balanced exposure, either side fine
```

## Future Enhancements (Optional)

1. **Sun Intensity**
   - Factor in sun altitude for intensity
   - Higher sun = more intense

2. **Cloud Coverage**
   - External weather API integration
   - Adjust for forecast

3. **Window Position**
   - Account for specific seat/window locations
   - Vehicle-specific recommendations

4. **Historical Data**
   - Learn from user preferences
   - Personalized recommendations

## Dependencies

- **suncalc**: Sun position calculations
- **@types/suncalc**: TypeScript types
- **routingService**: Bearing and distance calculations

## Files

- `src/services/sunCalcService.ts` - Main implementation
- `src/screens/RouteResultScreen.tsx` - UI display
- `src/types.ts` - TypeScript interfaces
