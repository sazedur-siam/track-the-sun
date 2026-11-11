import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  defaultSettings,
  effectiveGoogleKey,
  getSettings,
  googleKeySource,
  maskKey,
  planRoute,
  updateSettings,
} from '../settingsService';

// Fake keys only — never put real keys in tests.
const BUILT_IN = 'FAKE-builtin-key-0001';
const USER = 'FAKE-user-key-0002';

const originalEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const setBuiltInKey = (value: string | undefined) => {
  if (value === undefined) delete process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  else process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = value;
};

beforeEach(async () => {
  await AsyncStorage.clear();
  setBuiltInKey(undefined);
});

afterAll(() => setBuiltInKey(originalEnv));

describe('defaults', () => {
  it('defaults to OSRM without a built-in key', async () => {
    expect(defaultSettings()).toEqual({ routingProvider: 'osrm', googleApiKey: null });
    expect(await getSettings()).toEqual({ routingProvider: 'osrm', googleApiKey: null });
  });

  it('defaults to Google when a built-in key exists', async () => {
    setBuiltInKey(BUILT_IN);
    expect((await getSettings()).routingProvider).toBe('google');
  });

  it('ignores a blank built-in key', () => {
    setBuiltInKey('   ');
    expect(defaultSettings().routingProvider).toBe('osrm');
  });
});

describe('persistence', () => {
  it('saves and reloads provider and key (trimmed)', async () => {
    await updateSettings({ routingProvider: 'google', googleApiKey: `  ${USER}  ` });
    expect(await getSettings()).toEqual({ routingProvider: 'google', googleApiKey: USER });
  });

  it('stores an empty key as null', async () => {
    await updateSettings({ googleApiKey: '   ' });
    expect((await getSettings()).googleApiKey).toBeNull();
  });

  it('recovers from corrupted or invalid stored settings', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await AsyncStorage.setItem('@trackthesun_settings', '{oops');
    expect(await getSettings()).toEqual(defaultSettings());

    await AsyncStorage.setItem('@trackthesun_settings', JSON.stringify({ routingProvider: 'bing', googleApiKey: 42 }));
    expect(await getSettings()).toEqual(defaultSettings());
    jest.restoreAllMocks();
  });
});

describe('effective key', () => {
  it("prefers the user's key over the built-in key", () => {
    setBuiltInKey(BUILT_IN);
    const settings = { routingProvider: 'google' as const, googleApiKey: USER };
    expect(effectiveGoogleKey(settings)).toBe(USER);
    expect(googleKeySource(settings)).toBe('user');
  });

  it('uses the built-in key when the user has none', () => {
    setBuiltInKey(BUILT_IN);
    const settings = { routingProvider: 'google' as const, googleApiKey: null };
    expect(effectiveGoogleKey(settings)).toBe(BUILT_IN);
    expect(googleKeySource(settings)).toBe('builtIn');
  });

  it('reports no key at all', () => {
    const settings = { routingProvider: 'osrm' as const, googleApiKey: null };
    expect(effectiveGoogleKey(settings)).toBeNull();
    expect(googleKeySource(settings)).toBe('none');
  });
});

describe('maskKey', () => {
  it('shows only the first and last 4 characters', () => {
    expect(maskKey('ABCD-0123456789-WXYZ')).toBe('ABCD…WXYZ');
  });
  it('fully masks short values and handles empty input', () => {
    expect(maskKey('short')).toBe('•••••');
    expect(maskKey(null)).toBe('');
  });
});

describe('planRoute', () => {
  it('routes with the saved provider and effective key', async () => {
    await updateSettings({ routingProvider: 'google', googleApiKey: USER });
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          routes: [{ distanceMeters: 1000, duration: '60s', polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC' } }],
        }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const route = await planRoute({ lat: 1, lng: 2, name: 'A' }, { lat: 3, lng: 4, name: 'B' }, new Date());

    expect(route?.provider).toBe('google');
    expect(fetchMock.mock.calls[0][1].headers['X-Goog-Api-Key']).toBe(USER);
  });
});
