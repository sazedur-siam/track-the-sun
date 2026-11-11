import {
  buildRouteResultParams,
  clearRoutes,
  getRoute,
  parseRouteResultParams,
  putRoute,
} from '../routeStore';
import { Route } from '../routingService';

const makeRoute = (distance: number): Route => ({
  distance,
  duration: 60,
  waypoints: [{ lat: 0, lng: 0, timestamp: new Date(0) }],
});

beforeEach(() => clearRoutes());

describe('route store', () => {
  it('returns the stored route by id, keeping Date objects intact', () => {
    const route = makeRoute(1);
    const id = putRoute(route);
    expect(getRoute(id)).toBe(route);
    expect(getRoute(id)!.waypoints[0].timestamp).toBeInstanceOf(Date);
  });

  it('gives each route a unique id', () => {
    expect(putRoute(makeRoute(1))).not.toBe(putRoute(makeRoute(2)));
  });

  it('returns undefined for unknown or missing ids', () => {
    expect(getRoute('nope')).toBeUndefined();
    expect(getRoute(undefined)).toBeUndefined();
    expect(getRoute(null)).toBeUndefined();
  });

  it('evicts the oldest routes beyond 5 entries', () => {
    const ids = Array.from({ length: 7 }, (_, i) => putRoute(makeRoute(i)));
    expect(getRoute(ids[0])).toBeUndefined();
    expect(getRoute(ids[1])).toBeUndefined();
    ids.slice(2).forEach((id) => expect(getRoute(id)).toBeDefined());
  });
});

describe('route result params', () => {
  const from = { lat: 23.85, lng: 90.4, name: 'Airport, Dhaka' };
  const to = { lat: 22.35, lng: 91.78, name: 'Chattogram' };
  const departure = new Date('2026-11-11T05:16:00.000Z');

  it('builds only small string params (no route payload)', () => {
    const params = buildRouteResultParams('abc', from, to, departure);
    Object.values(params).forEach((value) => expect(typeof value).toBe('string'));
    expect(JSON.stringify(params).length).toBeLessThan(300);
  });

  it('round-trips locations and departure time', () => {
    const params = buildRouteResultParams('abc', from, to, departure);
    const parsed = parseRouteResultParams(params);

    expect(parsed.routeId).toBe('abc');
    expect(parsed.from).toEqual(from);
    expect(parsed.to).toEqual(to);
    expect(parsed.departureTime.toISOString()).toBe(departure.toISOString());
  });

  it('accepts array-valued params (expo-router can pass string[])', () => {
    const parsed = parseRouteResultParams({ fromLat: ['1.5'], fromLng: ['2.5'], fromName: ['X'] });
    expect(parsed.from).toEqual({ lat: 1.5, lng: 2.5, name: 'X' });
  });

  it('returns null locations for missing or invalid coordinates', () => {
    const parsed = parseRouteResultParams({ fromLat: 'abc', fromLng: '1', toLat: '' });
    expect(parsed.from).toBeNull();
    expect(parsed.to).toBeNull();
  });

  it('falls back to now for a missing or invalid departure time', () => {
    const before = Date.now();
    const missing = parseRouteResultParams({}).departureTime.getTime();
    const invalid = parseRouteResultParams({ departureTime: 'not a date' }).departureTime.getTime();
    expect(missing).toBeGreaterThanOrEqual(before);
    expect(invalid).toBeGreaterThanOrEqual(before);
  });
});
