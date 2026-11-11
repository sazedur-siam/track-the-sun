import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteFavoriteRoute,
  getFavoriteRoutes,
  resolveDepartureTime,
  saveFavoriteRoute,
  toTimeOfDay,
} from '../favoritesService';

const FROM = { lat: 23.85, lng: 90.4, name: 'Airport' };
const TO = { lat: 22.35, lng: 91.78, name: 'Chattogram' };

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('toTimeOfDay', () => {
  it('formats local time as zero-padded HH:mm', () => {
    expect(toTimeOfDay(new Date(2026, 0, 1, 8, 5))).toBe('08:05');
    expect(toTimeOfDay(new Date(2026, 0, 1, 23, 59))).toBe('23:59');
  });
});

describe('resolveDepartureTime', () => {
  const now = new Date(2026, 10, 11, 14, 30, 45);

  it('applies the saved time of day to today', () => {
    const resolved = resolveDepartureTime('08:15', now);
    expect(resolved.getFullYear()).toBe(2026);
    expect(resolved.getMonth()).toBe(10);
    expect(resolved.getDate()).toBe(11);
    expect(resolved.getHours()).toBe(8);
    expect(resolved.getMinutes()).toBe(15);
    expect(resolved.getSeconds()).toBe(0);
  });

  it.each([undefined, '', 'soon', '24:00', '12:60', '8.15'])('falls back to now for %p', (value) => {
    expect(resolveDepartureTime(value, now).getTime()).toBe(now.getTime());
  });

  it('does not mutate the "now" argument', () => {
    const copy = new Date(now);
    resolveDepartureTime('06:00', now);
    expect(now.getTime()).toBe(copy.getTime());
  });
});

describe('favorites storage', () => {
  it('saves, lists and deletes routes', async () => {
    await saveFavoriteRoute(FROM, TO, 'Trip home');
    const [saved] = await getFavoriteRoutes();

    expect(saved.name).toBe('Trip home');
    expect(saved.fromLocation).toEqual(FROM);
    expect(saved.toLocation).toEqual(TO);

    await deleteFavoriteRoute(saved.id);
    expect(await getFavoriteRoutes()).toEqual([]);
  });

  it('gives routes saved at the same moment different ids', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    await saveFavoriteRoute(FROM, TO, 'One');
    await saveFavoriteRoute(FROM, TO, 'Two');
    jest.restoreAllMocks();

    const [one, two] = await getFavoriteRoutes();
    expect(one.id).not.toBe(two.id);

    await deleteFavoriteRoute(one.id);
    expect((await getFavoriteRoutes()).map((f) => f.name)).toEqual(['Two']);
  });

  it('defaults the name to "from → to"', async () => {
    await saveFavoriteRoute(FROM, TO);
    const [saved] = await getFavoriteRoutes();
    expect(saved.name).toBe('Airport → Chattogram');
  });

  it('stores the departure time of day when given', async () => {
    await saveFavoriteRoute(FROM, TO, 'Commute', new Date(2026, 5, 1, 7, 45));
    const [saved] = await getFavoriteRoutes();
    expect(saved.departureTime).toBe('07:45');
  });

  it('stores seek mode, and omits mode for the default avoid', async () => {
    await saveFavoriteRoute(FROM, TO, 'Sunny', undefined, 'seek');
    await saveFavoriteRoute(FROM, TO, 'Shady', undefined, 'avoid');
    const [sunny, shady] = await getFavoriteRoutes();
    expect(sunny.mode).toBe('seek');
    expect(shady).not.toHaveProperty('mode');
  });

  it('omits departureTime when not given', async () => {
    await saveFavoriteRoute(FROM, TO, 'Anytime');
    const [saved] = await getFavoriteRoutes();
    expect(saved).not.toHaveProperty('departureTime');
  });

  it('still reads routes saved before departureTime existed', async () => {
    const legacy = [
      { id: '1', fromLocation: FROM, toLocation: TO, name: 'Old', createdAt: '2025-01-01T00:00:00Z' },
    ];
    await AsyncStorage.setItem('@trackthesun_favorites', JSON.stringify(legacy));

    const [saved] = await getFavoriteRoutes();
    expect(saved.name).toBe('Old');
    expect(saved.departureTime).toBeUndefined();
  });

  it('returns an empty list when storage holds invalid JSON', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await AsyncStorage.setItem('@trackthesun_favorites', '{not json');
    expect(await getFavoriteRoutes()).toEqual([]);
    jest.restoreAllMocks();
  });
});
