import {
  calculateBearing,
  decodePolyline,
  fetchRoute,
  formatDistance,
  formatDuration,
} from '../routingService';

// Google's reference example for the encoded polyline algorithm.
const SAMPLE_POLYLINE = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const SAMPLE_COORDS: [number, number][] = [
  [38.5, -120.2],
  [40.7, -120.95],
  [43.252, -126.453],
];

describe('decodePolyline', () => {
  it('decodes the reference polyline', () => {
    const decoded = decodePolyline(SAMPLE_POLYLINE);
    expect(decoded).toHaveLength(3);
    decoded.forEach(([lat, lng], i) => {
      expect(lat).toBeCloseTo(SAMPLE_COORDS[i][0], 5);
      expect(lng).toBeCloseTo(SAMPLE_COORDS[i][1], 5);
    });
  });

  it('returns an empty list for an empty string', () => {
    expect(decodePolyline('')).toEqual([]);
  });
});

describe('calculateBearing', () => {
  it.each([
    ['north', 0, 0, 1, 0, 0],
    ['east', 0, 0, 0, 1, 90],
    ['south', 1, 0, 0, 0, 180],
    ['west', 0, 1, 0, 0, 270],
  ])('heading %s', (_label, lat1, lng1, lat2, lng2, expected) => {
    expect(calculateBearing(lat1, lng1, lat2, lng2)).toBeCloseTo(expected, 5);
  });

  it('always returns a value in [0, 360)', () => {
    const bearing = calculateBearing(23.8, 90.4, 23.7, 90.3);
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });
});

describe('formatDistance', () => {
  it('uses metres below 1 km', () => {
    expect(formatDistance(850.4)).toBe('850 m');
  });
  it('uses km with one decimal from 1 km', () => {
    expect(formatDistance(5234)).toBe('5.2 km');
  });
  it('accepts localized units', () => {
    expect(formatDistance(2000, { km: 'কিমি', m: 'মি' })).toBe('2.0 কিমি');
  });
});

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(15 * 60)).toBe('15m');
  });
  it('formats hours and minutes', () => {
    expect(formatDuration(83 * 60)).toBe('1h 23m');
  });
});

describe('fetchRoute', () => {
  const origin = { lat: 38.5, lng: -120.2, name: 'A' };
  const destination = { lat: 43.252, lng: -126.453, name: 'B' };
  const departure = new Date('2026-06-01T08:00:00Z');
  const duration = 3600; // seconds

  const mockFetch = (body: unknown, ok = true) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(body),
    }) as unknown as typeof fetch;
  };

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds waypoints with distance-weighted timestamps', async () => {
    mockFetch({
      code: 'Ok',
      routes: [{ distance: 787000, duration, geometry: SAMPLE_POLYLINE }],
    });

    const route = await fetchRoute(origin, destination, departure);
    expect(route).not.toBeNull();
    const { waypoints } = route!;

    expect(waypoints).toHaveLength(3);
    expect(waypoints[0].timestamp.getTime()).toBe(departure.getTime());
    expect(waypoints[2].timestamp.getTime()).toBe(departure.getTime() + duration * 1000);

    // The first leg (~252 km) is much shorter than the second (~535 km), so the
    // middle point is reached ~32% of the way in — not 50% as index-based
    // interpolation would say.
    const progress = (waypoints[1].timestamp.getTime() - departure.getTime()) / (duration * 1000);
    expect(progress).toBeGreaterThan(0.25);
    expect(progress).toBeLessThan(0.4);
  });

  it('requests the OSRM driving route as lng,lat pairs', async () => {
    mockFetch({ code: 'Ok', routes: [{ distance: 1, duration: 1, geometry: SAMPLE_POLYLINE }] });
    await fetchRoute(origin, destination, departure);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/route/v1/driving/-120.2,38.5;-126.453,43.252');
  });

  it('returns null when OSRM finds no route', async () => {
    mockFetch({ code: 'NoRoute', routes: [] });
    await expect(fetchRoute(origin, destination, departure)).resolves.toBeNull();
  });

  it('returns null on an HTTP error', async () => {
    mockFetch({}, false);
    await expect(fetchRoute(origin, destination, departure)).resolves.toBeNull();
  });

  it('returns null when the network request throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    await expect(fetchRoute(origin, destination, departure)).resolves.toBeNull();
  });
});
