// Dynamic Expo config: extends app.json.
//
// Android renders react-native-maps with Google Maps, which needs a key with
// "Maps SDK for Android" enabled (Expo Go ships its own, so this only matters
// for development/production builds). Set GOOGLE_MAPS_ANDROID_API_KEY, or it
// falls back to EXPO_PUBLIC_GOOGLE_MAPS_API_KEY. iOS uses Apple Maps (no key).
module.exports = ({ config }) => {
  const androidMapsKey =
    process.env.GOOGLE_MAPS_ANDROID_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!androidMapsKey) return config;

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: { apiKey: androidMapsKey },
      },
    },
  };
};
