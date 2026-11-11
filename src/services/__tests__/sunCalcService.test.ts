import { RouteWaypoint } from '@/src/types';
import { calculateSunExposure, getSunAzimuth } from '../sunCalcService';

/**
 * All scenarios are in Dhaka (UTC+6) on the December solstice, when the sun
 * stays well to the south all day. 05:45 UTC = 11:45 local, near solar noon.
 */
const DHAKA = { lat: 23.8, lng: 90.4 };
const LATE_MORNING = new Date('2026-12-21T05:45:00Z');
const MIDNIGHT = new Date('2026-12-21T18:00:00Z');

/**
 * Build a straight route of `steps` segments from `start`, moving `dLat`/`dLng`
 * degrees per step, spread evenly over `minutes`.
 */
function straightRoute(
  start: { lat: number; lng: number },
  dLat: number,
  dLng: number,
  steps: number,
  departure: Date,
  minutes = 30,
): RouteWaypoint[] {
  return Array.from({ length: steps + 1 }, (_, i) => ({
    lat: start.lat + dLat * i,
    lng: start.lng + dLng * i,
    timestamp: new Date(departure.getTime() + (minutes * 60_000 * i) / steps),
  }));
}

describe('getSunAzimuth', () => {
  it('puts the midday December sun in the south over Dhaka', () => {
    const azimuth = getSunAzimuth(DHAKA.lat, DHAKA.lng, LATE_MORNING);
    expect(azimuth).toBeGreaterThan(150);
    expect(azimuth).toBeLessThan(200);
  });
});

describe('calculateSunExposure', () => {
  it('reports a too-short route', () => {
    const result = calculateSunExposure([{ ...DHAKA, timestamp: LATE_MORNING }]);
    expect(result.recommendation).toBe('neutral');
    expect(result.hasDirectSunlight).toBe(false);
    expect(result.summary).toMatch(/too short/i);
  });

  it('eastbound with a southern sun: sun on the right, sit on the left', () => {
    const route = straightRoute(DHAKA, 0, 0.02, 10, LATE_MORNING);
    const result = calculateSunExposure(route);

    expect(result.hasDirectSunlight).toBe(true);
    expect(result.rightPercentage).toBeGreaterThan(90);
    expect(result.leftPercentage).toBe(0);
    expect(result.sunnySide).toBe('right');
    expect(result.recommendation).toBe('left');
    expect(result.sunnySideCompass).toBe('S');
  });

  it('westbound with a southern sun: sun on the left, sit on the right', () => {
    const route = straightRoute(DHAKA, 0, -0.02, 10, LATE_MORNING);
    const result = calculateSunExposure(route);

    expect(result.leftPercentage).toBeGreaterThan(90);
    expect(result.sunnySide).toBe('left');
    expect(result.recommendation).toBe('right');
  });

  it('northbound with the sun behind: no side gets direct sun', () => {
    const route = straightRoute(DHAKA, 0.02, 0, 10, LATE_MORNING);
    const result = calculateSunExposure(route);

    expect(result.hasDirectSunlight).toBe(true);
    expect(result.leftPercentage).toBe(0);
    expect(result.rightPercentage).toBe(0);
    expect(result.recommendation).toBe('neutral');
  });

  it('at night there is no direct sunlight and no recommendation', () => {
    const route = straightRoute(DHAKA, 0, 0.02, 10, MIDNIGHT);
    const result = calculateSunExposure(route);

    expect(result.hasDirectSunlight).toBe(false);
    expect(result.recommendation).toBe('neutral');
    expect(result.sunnySideCompass).toBeNull();
  });

  it('weights exposure by distance, not by waypoint count', () => {
    // Long eastbound leg (sun right) made of FEW points, then a short
    // westbound leg (sun left) made of MANY points.
    const east = straightRoute(DHAKA, 0, 0.09, 2, LATE_MORNING, 20); // ~2 × 9 km
    const turn = east[east.length - 1];
    const west = straightRoute(turn, 0, -0.003, 20, turn.timestamp, 10).slice(1); // ~20 × 0.3 km

    const result = calculateSunExposure([...east, ...west]);

    // Distance split is ~18 km vs ~6 km → ~75% / ~25%.
    expect(result.rightPercentage).toBeGreaterThan(65);
    expect(result.rightPercentage).toBeLessThan(85);
    expect(result.leftPercentage).toBeGreaterThan(15);
    expect(result.leftPercentage).toBeLessThan(35);
    expect(result.recommendation).toBe('left');
  });

  it('needs a clear margin before recommending a side', () => {
    // Equal east and west legs → balanced exposure.
    const east = straightRoute(DHAKA, 0, 0.02, 5, LATE_MORNING, 15);
    const turn = east[east.length - 1];
    const west = straightRoute(turn, 0, -0.02, 5, turn.timestamp, 15).slice(1);

    const result = calculateSunExposure([...east, ...west]);
    expect(Math.abs(result.leftPercentage - result.rightPercentage)).toBeLessThanOrEqual(10);
    expect(result.recommendation).toBe('neutral');
  });
});

describe('sun-height weighting (glare-aware)', () => {
  // ~6:55 local in Dhaka in December: the sun is just up, low in the east-southeast.
  const EARLY_MORNING = new Date('2026-12-21T00:55:00Z');

  it('treats low side-on sun as strong, with a glare window', () => {
    // Northbound: the low eastern sun is on the right.
    const route = straightRoute(DHAKA, 0.02, 0, 10, EARLY_MORNING, 20);
    const result = calculateSunExposure(route);

    expect(result.recommendation).toBe('left');
    expect(result.rightIntensity).toBeGreaterThan(70);
    expect(result.sunnySideStrength).toBe('strong');
    expect(result.glare).not.toBeNull();
    expect(result.glare!.side).toBe('right');
    expect(result.glare!.end.getTime()).toBeGreaterThan(result.glare!.start.getTime());
  });

  it('weights the midday sun less than low sun on the same heading', () => {
    const low = calculateSunExposure(straightRoute(DHAKA, 0.02, 0, 10, EARLY_MORNING, 20));
    // Eastbound at 11:45 puts the ~43° high southern sun exactly side-on.
    const midday = calculateSunExposure(straightRoute(DHAKA, 0, 0.02, 10, LATE_MORNING));

    expect(midday.rightIntensity).toBeLessThan(low.rightIntensity);
    expect(midday.rightIntensity).toBeGreaterThan(60); // cos(43°) ≈ 0.73
    expect(midday.rightIntensity).toBeLessThan(80);
    expect(midday.glare).toBeNull();
  });

  it('gives no recommendation when the sun is almost overhead', () => {
    // Equator at the March equinox, a few minutes before solar noon: the sun
    // is ~86° high and due east, so it is on the right of a northbound bus
    // for the whole trip — but barely reaches the side windows.
    const start = { lat: 0, lng: 0 };
    const route = straightRoute(start, 0.01, 0, 5, new Date('2026-03-20T11:52:00Z'), 5);
    const result = calculateSunExposure(route);

    expect(result.hasDirectSunlight).toBe(true);
    expect(result.rightPercentage).toBeGreaterThan(90);
    expect(result.rightIntensity).toBeLessThan(10);
    expect(result.recommendation).toBe('neutral');
    expect(result.neutralReason).toBe('overhead');
    expect(result.sunnySideStrength).toBe('mild');
  });

  it('reports "balanced" when both sides get similar sun', () => {
    const east = straightRoute(DHAKA, 0, 0.02, 5, LATE_MORNING, 15);
    const turn = east[east.length - 1];
    const west = straightRoute(turn, 0, -0.02, 5, turn.timestamp, 15).slice(1);
    expect(calculateSunExposure([...east, ...west]).neutralReason).toBe('balanced');
  });

  it('has no neutral reason, strength or glare at night', () => {
    const result = calculateSunExposure(straightRoute(DHAKA, 0, 0.02, 10, MIDNIGHT));
    expect(result.neutralReason).toBeNull();
    expect(result.sunnySideStrength).toBeNull();
    expect(result.glare).toBeNull();
    expect(result.leftIntensity + result.rightIntensity).toBe(0);
  });

  it('keeps every segment intensity between 0 and 1', () => {
    const { waypointDetails } = calculateSunExposure(straightRoute(DHAKA, 0.01, 0.01, 10, LATE_MORNING));
    waypointDetails.forEach((d) => {
      expect(d.intensity).toBeGreaterThanOrEqual(0);
      expect(d.intensity).toBeLessThanOrEqual(1);
    });
  });
});

describe('seek-the-sun mode', () => {
  it('recommends the sunny side when seeking the sun', () => {
    const route = straightRoute(DHAKA, 0, 0.02, 10, LATE_MORNING); // eastbound, sun on the right
    expect(calculateSunExposure(route, 'avoid').recommendation).toBe('left');
    const seek = calculateSunExposure(route, 'seek');
    expect(seek.recommendation).toBe('right');
    expect(seek.mode).toBe('seek');
    expect(seek.sunnySide).toBe('right');
    expect(seek.summary).toMatch(/gets the sun/);
  });

  it('defaults to avoid', () => {
    expect(calculateSunExposure(straightRoute(DHAKA, 0, 0.02, 10, LATE_MORNING)).mode).toBe('avoid');
  });

  it('stays neutral for balanced, overhead and night trips in both modes', () => {
    const east = straightRoute(DHAKA, 0, 0.02, 5, LATE_MORNING, 15);
    const turn = east[east.length - 1];
    const balanced = [...east, ...straightRoute(turn, 0, -0.02, 5, turn.timestamp, 15).slice(1)];
    const night = straightRoute(DHAKA, 0, 0.02, 10, MIDNIGHT);
    for (const mode of ['avoid', 'seek'] as const) {
      expect(calculateSunExposure(balanced, mode).recommendation).toBe('neutral');
      expect(calculateSunExposure(night, mode).recommendation).toBe('neutral');
    }
  });
});
