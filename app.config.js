// Dynamic Expo config: extends app.json.
//
// Android renders react-native-maps with Google Maps, which needs a key with
// "Maps SDK for Android" enabled. Without one the native map CRASHES the app,
// so `extra.androidGoogleMapsKey` tells the app whether this build has a key
// (src/utils/mapSupport.ts hides the map otherwise). Expo Go ships its own key.
//
// Set GOOGLE_MAPS_ANDROID_API_KEY, or it falls back to
// EXPO_PUBLIC_GOOGLE_MAPS_API_KEY. For EAS builds, define it with `eas env:create`
// (.env.local is not uploaded). iOS uses Apple Maps (no key).
module.exports = ({ config }) => {
  const androidMapsKey =
    process.env.GOOGLE_MAPS_ANDROID_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const withFlag = {
    ...config,
    extra: { ...config.extra, androidGoogleMapsKey: Boolean(androidMapsKey) },
  };
  if (!androidMapsKey) return withFlag;

  return {
    ...withFlag,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: { apiKey: androidMapsKey },
      },
    },
  };
};
