import { ThemedText } from '@/components/themed-text';
import { reverseGeocode } from '@/src/services/geocodingService';
import { Location } from '@/src/types';
import * as ExpoLocation from 'expo-location';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

interface CurrentLocationButtonProps {
  onLocationSelect: (location: Location) => void;
}

export default function CurrentLocationButton({
  onLocationSelect,
}: CurrentLocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetLocation = async () => {
    setIsLoading(true);
    try {
      // Request permission
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use your current location.'
        );
        setIsLoading(false);
        return;
      }

      // Get current location
      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Get address name
      const name = await reverseGeocode(latitude, longitude);

      onLocationSelect({
        lat: latitude,
        lng: longitude,
        name: name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
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
    >
      <ThemedText style={styles.buttonText}>
        {isLoading ? '📍 Getting location...' : '📍 Use Current Location'}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
