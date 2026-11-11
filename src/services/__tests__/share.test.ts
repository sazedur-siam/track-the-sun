import { translations } from '@/src/i18n/translations';
import { parseRouteResultParams } from '../routeStore';
import { buildShareMessage, buildShareQueryParams, buildShareUrl, shortName } from '../share';

// Minimal English translator over the real strings.
const t = (key: string, params: Record<string, string | number> = {}) =>
  (translations.en[key] ?? key).replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));

const FROM = {
  lat: 23.8431441,
  lng: 90.4053032,
  name: 'Hazrat Shahjalal International Airport, Airport Road, Dhaka, Bangladesh',
};
const TO = { lat: 22.333778, lng: 91.8344348, name: 'Chattogram, Chittagong City, Bangladesh' };
const DEPARTURE = new Date('2026-11-12T01:30:00.000Z');

describe('shortName', () => {
  it('keeps the first part of a geocoded name', () => {
    expect(shortName(TO.name)).toBe('Chattogram');
  });
  it('truncates very long names', () => {
    expect(shortName('x'.repeat(60), 10)).toBe(`${'x'.repeat(9)}…`);
  });
  it('falls back to the whole name if the first part is empty', () => {
    expect(shortName(', Somewhere')).toBe(', Somewhere');
  });
});

describe('share link', () => {
  it('round-trips through the result screen params', () => {
    const url = buildShareUrl('https://example.com/', buildShareQueryParams(FROM, TO, DEPARTURE, 'seek'));
    expect(url.startsWith('https://example.com/route-result?')).toBe(true);
    expect(url).not.toContain('routeId');

    const params = Object.fromEntries(new URL(url).searchParams.entries());
    const parsed = parseRouteResultParams(params);
    expect(parsed.from?.name).toBe('Hazrat Shahjalal International Airport');
    expect(parsed.from?.lat).toBeCloseTo(FROM.lat, 4);
    expect(parsed.to?.lng).toBeCloseTo(TO.lng, 4);
    expect(parsed.departureTime.toISOString()).toBe(DEPARTURE.toISOString());
    expect(parsed.mode).toBe('seek');
  });

  it('stays short', () => {
    const url = buildShareUrl('https://example.com', buildShareQueryParams(FROM, TO, DEPARTURE, 'avoid'));
    expect(url.length).toBeLessThan(300);
  });

  it('works with an app scheme base', () => {
    expect(buildShareUrl('trackthesun://', { a: '1' })).toBe('trackthesun://route-result?a=1');
  });
});

describe('buildShareMessage', () => {
  const sun = { leftPercentage: 5, rightPercentage: 90 };

  it('avoid: names the shady seat and where the sun is', () => {
    const msg = buildShareMessage(t, FROM, TO, '7:30 AM', { ...sun, recommendation: 'left', mode: 'avoid' });
    expect(msg).toContain('Hazrat Shahjalal International Airport → Chattogram');
    expect(msg).toContain('7:30 AM');
    expect(msg).toContain('sit on the left side');
    expect(msg).toContain('right for 90%');
  });

  it('seek: names the sunny seat', () => {
    const msg = buildShareMessage(t, FROM, TO, '7:30 AM', { ...sun, recommendation: 'right', mode: 'seek' });
    expect(msg).toContain('sit on the right side');
    expect(msg).toContain('90%');
  });

  it('neutral: either side', () => {
    const msg = buildShareMessage(t, FROM, TO, '7:30 AM', { ...sun, recommendation: 'neutral', mode: 'avoid' });
    expect(msg).toMatch(/either side/i);
  });
});
