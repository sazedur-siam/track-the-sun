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
