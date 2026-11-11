import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Whether the native map can be rendered safely.
 *
 * On Android, react-native-maps uses the Google Maps SDK, which crashes the
 * whole app if the build has no Maps API key. Expo Go ships its own key; other
 * builds report theirs via `extra.androidGoogleMapsKey` (see app.config.js).
 * iOS uses Apple Maps and web uses Leaflet, so both are always fine.
 */
export function nativeMapAvailable(): boolean {
  if (Platform.OS !== 'android') return true;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return true;
  return Constants.expoConfig?.extra?.androidGoogleMapsKey === true;
}

/** Google Maps directions link, used when the in-app map isn't available. */
export function googleMapsDirectionsUrl(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
): string {
  const point = (p: { latitude: number; longitude: number }) => `${p.latitude},${p.longitude}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${point(start)}&destination=${point(end)}&travelmode=driving`;
}
