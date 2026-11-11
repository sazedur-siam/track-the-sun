import { fetchRoute, requestGoogleRoute, RoutingError, testGoogleApiKey } from '../routingService';

// Google's reference polyline (3 points), also valid for the Routes API.
const POLYLINE = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const ORIGIN = { lat: 38.5, lng: -120.2 };
const DEST = { lat: 43.252, lng: -126.453 };
const NOW = new Date('2026-11-11T06:00:00Z');
const KEY = 'test-key';

const okGoogle = {
  routes: [{ distanceMeters: 787000, duration: '3600s', polyline: { encodedPolyline: POLYLINE } }],
};
const okOsrm = { code: 'Ok', routes: [{ distance: 790000, duration: 4000, geometry: POLYLINE }] };

type Reply = { status: number; body: unknown } | Error;

/** Mock fetch: Google and OSRM URLs each get their own queued replies. */
function mockFetch(replies: { google?: Reply; osrm?: Reply }) {
  const fn = jest.fn(async (url: string) => {
    const reply = url.includes('routes.googleapis.com') ? replies.google : replies.osrm;
    if (!reply) throw new Error(`unexpected fetch ${url}`);
    if (reply instanceof Error) throw reply;
    return {
      ok: reply.status >= 200 && reply.status < 300,
      status: reply.status,
      json: () => Promise.resolve(reply.body),
    };
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

const googleError = (status: number, statusText: string, reason?: string) => ({
  status,
  body: {
    error: {
      code: status,
      status: statusText,
      message: 'boom',
      details: reason ? [{ reason }] : [],
    },
  },
});

const requestBody = (fn: jest.Mock) => JSON.parse(fn.mock.calls[0][1].body);
const requestHeaders = (fn: jest.Mock) => fn.mock.calls[0][1].headers;

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('requestGoogleRoute', () => {
  it('sends a Routes API request with key, field mask and lat/lng', async () => {
    const fn = mockFetch({ google: { status: 200, body: okGoogle } });
    await requestGoogleRoute(ORIGIN, DEST, NOW, KEY, NOW);

    expect(fn.mock.calls[0][0]).toBe('https://routes.googleapis.com/directions/v2:computeRoutes');
    expect(requestHeaders(fn)['X-Goog-Api-Key']).toBe(KEY);
    expect(requestHeaders(fn)['X-Goog-FieldMask']).toContain('routes.polyline.encodedPolyline');
    const body = requestBody(fn);
    expect(body.origin.location.latLng).toEqual({ latitude: 38.5, longitude: -120.2 });
    expect(body.destination.location.latLng).toEqual({ latitude: 43.252, longitude: -126.453 });
    expect(body.travelMode).toBe('DRIVE');
  });

  it('parses distance, "3600s" duration and timestamps', async () => {
    mockFetch({ google: { status: 200, body: okGoogle } });
    const route = await requestGoogleRoute(ORIGIN, DEST, NOW, KEY, NOW);

    expect(route.provider).toBe('google');
    expect(route.distance).toBe(787000);
    expect(route.duration).toBe(3600);
    expect(route.waypoints).toHaveLength(3);
    expect(route.waypoints[2].timestamp.getTime()).toBe(NOW.getTime() + 3600_000);
  });

  it('uses live traffic for "now", without sending a departureTime', async () => {
    const fn = mockFetch({ google: { status: 200, body: okGoogle } });
    const route = await requestGoogleRoute(ORIGIN, DEST, new Date(NOW.getTime() - 20_000), KEY, NOW);
    expect(requestBody(fn).routingPreference).toBe('TRAFFIC_AWARE');
    expect(requestBody(fn).departureTime).toBeUndefined();
    expect(route.trafficAware).toBe(true);
  });

  it('uses predicted traffic and sends departureTime for a future trip', async () => {
    const future = new Date(NOW.getTime() + 2 * 3600_000);
    const fn = mockFetch({ google: { status: 200, body: okGoogle } });
    await requestGoogleRoute(ORIGIN, DEST, future, KEY, NOW);
    expect(requestBody(fn).routingPreference).toBe('TRAFFIC_AWARE');
    expect(requestBody(fn).departureTime).toBe(future.toISOString());
  });

  it('routes past trips without traffic (Google rejects past times)', async () => {
    const past = new Date(NOW.getTime() - 3 * 3600_000);
    const fn = mockFetch({ google: { status: 200, body: okGoogle } });
    const route = await requestGoogleRoute(ORIGIN, DEST, past, KEY, NOW);
    expect(requestBody(fn).routingPreference).toBe('TRAFFIC_UNAWARE');
    expect(requestBody(fn).departureTime).toBeUndefined();
    expect(route.trafficAware).toBe(false);
  });

  it.each([
    ['invalid key', googleError(400, 'INVALID_ARGUMENT', 'API_KEY_INVALID'), 'invalid_key'],
    ['expired key', googleError(400, 'INVALID_ARGUMENT', 'API_KEY_EXPIRED'), 'invalid_key'],
    ['API not enabled', googleError(403, 'PERMISSION_DENIED', 'SERVICE_DISABLED'), 'invalid_key'],
    ['quota exceeded', googleError(429, 'RESOURCE_EXHAUSTED'), 'quota'],
    ['server error', googleError(500, 'INTERNAL'), 'server'],
    ['no route ({} body)', { status: 200, body: {} }, 'no_route'],
  ])('maps %s to "%s"', async (_label, reply, code) => {
    mockFetch({ google: reply });
    await expect(requestGoogleRoute(ORIGIN, DEST, NOW, KEY, NOW)).rejects.toMatchObject({ code });
  });

  it('maps a thrown fetch to "network"', async () => {
    mockFetch({ google: new Error('offline') });
    await expect(requestGoogleRoute(ORIGIN, DEST, NOW, KEY, NOW)).rejects.toMatchObject({ code: 'network' });
  });

  it('fails fast with "missing_key" without calling the network', async () => {
    const fn = mockFetch({});
    await expect(requestGoogleRoute(ORIGIN, DEST, NOW, '  ', NOW)).rejects.toBeInstanceOf(RoutingError);
    await expect(requestGoogleRoute(ORIGIN, DEST, NOW, null, NOW)).rejects.toMatchObject({ code: 'missing_key' });
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('fetchRoute provider selection and fallback', () => {
  it('uses OSRM by default', async () => {
    const fn = mockFetch({ osrm: { status: 200, body: okOsrm } });
    const route = await fetchRoute(ORIGIN, DEST, NOW);
    expect(route?.provider).toBe('osrm');
    expect(route?.fallback).toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses Google when selected and the key works', async () => {
    const fn = mockFetch({ google: { status: 200, body: okGoogle }, osrm: { status: 200, body: okOsrm } });
    const route = await fetchRoute(ORIGIN, DEST, NOW, { provider: 'google', googleApiKey: KEY, now: NOW });
    expect(route?.provider).toBe('google');
    expect(route?.fallback).toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('falls back to OSRM when the Google key is expired, and says why', async () => {
    mockFetch({
      google: googleError(400, 'INVALID_ARGUMENT', 'API_KEY_INVALID'),
      osrm: { status: 200, body: okOsrm },
    });
    const route = await fetchRoute(ORIGIN, DEST, NOW, { provider: 'google', googleApiKey: KEY, now: NOW });
    expect(route?.provider).toBe('osrm');
    expect(route?.fallback).toEqual({ from: 'google', reason: 'invalid_key' });
  });

  it('falls back to OSRM when Google is selected but no key is set', async () => {
    mockFetch({ osrm: { status: 200, body: okOsrm } });
    const route = await fetchRoute(ORIGIN, DEST, NOW, { provider: 'google', googleApiKey: null });
    expect(route?.fallback).toEqual({ from: 'google', reason: 'missing_key' });
  });

  it('returns null when fallback is disabled', async () => {
    mockFetch({ google: googleError(429, 'RESOURCE_EXHAUSTED') });
    const route = await fetchRoute(ORIGIN, DEST, NOW, {
      provider: 'google',
      googleApiKey: KEY,
      fallbackToOsrm: false,
      now: NOW,
    });
    expect(route).toBeNull();
  });

  it('returns null when both providers fail', async () => {
    mockFetch({ google: new Error('offline'), osrm: new Error('offline') });
    const route = await fetchRoute(ORIGIN, DEST, NOW, { provider: 'google', googleApiKey: KEY, now: NOW });
    expect(route).toBeNull();
  });
});

describe('testGoogleApiKey', () => {
  it('reports ok for a working key', async () => {
    mockFetch({ google: { status: 200, body: okGoogle } });
    await expect(testGoogleApiKey(KEY)).resolves.toEqual({ ok: true });
  });

  it('reports the reason for a rejected key', async () => {
    mockFetch({ google: googleError(400, 'INVALID_ARGUMENT', 'API_KEY_INVALID') });
    await expect(testGoogleApiKey(KEY)).resolves.toEqual({ ok: false, code: 'invalid_key' });
  });

  it('treats "no route" as a valid key (Google accepted it)', async () => {
    mockFetch({ google: { status: 200, body: {} } });
    await expect(testGoogleApiKey(KEY)).resolves.toEqual({ ok: true });
  });

  it('uses the cheaper traffic-unaware tier', async () => {
    const fn = mockFetch({ google: { status: 200, body: okGoogle } });
    await testGoogleApiKey(KEY);
    expect(requestBody(fn).routingPreference).toBe('TRAFFIC_UNAWARE');
  });
});
