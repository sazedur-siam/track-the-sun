import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { reverseGeocode } from '@/src/services/geocodingService';
import { Location } from '@/src/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ExpoLocation from 'expo-location';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from 'react-native';

interface CurrentLocationButtonProps {
  onLocationSelect: (location: Location) => void;
}

export default function CurrentLocationButton({ onLocationSelect }: CurrentLocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();

  const handleGetLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('currentLocation.permissionTitle'), t('currentLocation.permissionMsg'));
        return;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;
      const name = await reverseGeocode(latitude, longitude);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLocationSelect({
        lat: latitude,
        lng: longitude,
        name: name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('currentLocation.errorMsg'));
      console.error('Location error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleGetLocation}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={t('currentLocation.a11y')}
      accessibilityState={{ busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.secondary} />
      ) : (
        <MaterialCommunityIcons name="crosshairs-gps" size={16} color={theme.secondary} />
      )}
      <ThemedText style={[styles.buttonText, { color: theme.secondary }]}>
        {isLoading ? t('home.locating') : t('home.currentLocation')}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.pill,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
