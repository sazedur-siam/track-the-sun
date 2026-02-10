import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import CurrentLocationButton from '@/src/components/CurrentLocationButton';
import FavoritesModal from '@/src/components/FavoritesModal';
import LocationInput from '@/src/components/LocationInput';
import NameInputModal from '@/src/components/NameInputModal';
import TimePicker from '@/src/components/TimePicker';
import { saveFavoriteRoute } from '@/src/services/favoritesService';
import { fetchRoute } from '@/src/services/routingService';
import { Location } from '@/src/types';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
      ActivityIndicator,
      Alert,
      KeyboardAvoidingView,
      Platform,
      ScrollView,
      StyleSheet,
      TouchableOpacity,
      View,
} from 'react-native';

export default function HomeScreen() {
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [departureTime, setDepartureTime] = useState(new Date());
  const [isCalculating, setIsCalculating] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);

  const handleDepartureTimeChange = (time: Date) => {
    setDepartureTime(time);
  };

  const canCalculate = fromLocation !== null && toLocation !== null && !isCalculating;

  const handleCalculate = async () => {
    if (!canCalculate || !fromLocation || !toLocation) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCalculating(true);

    try {
      // Fetch route from OSRM
      const route = await fetchRoute(fromLocation, toLocation, departureTime);

      if (!route) {
        Alert.alert(
          'Route Not Found',
          'Unable to find a route between these locations. Please try different locations.'
        );
        setIsCalculating(false);
        return;
      }

      // Navigate to results screen with route data
      router.push({
        pathname: '/route-result',
        params: {
          route: JSON.stringify(route),
          fromName: fromLocation.name,
          toName: toLocation.name,
          departureTime: departureTime.toISOString(),
        },
      });
    } catch {
      Alert.alert(
        'Error',
        'Failed to calculate route. Please check your internet connection and try again.'
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSwapLocations = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const handleSaveFavorite = async () => {
    if (!fromLocation || !toLocation) return;
    setShowNameInput(true);
  };

  const handleSaveWithName = async (name: string) => {
    if (!fromLocation || !toLocation) return;

    try {
      await saveFavoriteRoute(fromLocation, toLocation, name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Route saved to favorites!');
      setShowNameInput(false);
    } catch {
      Alert.alert('Error', 'Failed to save favorite route.');
    }
  };

  const handleLoadFavorite = (from: Location, to: Location) => {
    setFromLocation(from);
    setToLocation(to);
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              ☀️ TrackTheSun
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Find the sunny side of your journey
            </ThemedText>
            <TouchableOpacity
              style={styles.favoritesButton}
              onPress={() => setShowFavorites(true)}
            >
              <ThemedText style={styles.favoritesButtonText}>⭐ Favorites</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Current Location Button */}
          <CurrentLocationButton onLocationSelect={setFromLocation} />

          {/* From Location */}
          <LocationInput
            label="From"
            placeholder="Search starting location..."
            onLocationSelect={setFromLocation}
            selectedLocation={fromLocation}
          />

          {/* Swap Button */}
          {(fromLocation || toLocation) && (
            <View style={styles.swapContainer}>
              <TouchableOpacity
                style={styles.swapButton}
                onPress={handleSwapLocations}
              >
                <ThemedText style={styles.swapIcon}>⇅</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* To Location */}
          <LocationInput
            label="To"
            placeholder="Search destination..."
            onLocationSelect={setToLocation}
            selectedLocation={toLocation}
          />

          {/* Departure Time */}
          <TimePicker
            label="Departure Time"
            selectedTime={departureTime}
            onTimeChange={handleDepartureTimeChange}
          />

          {/* Save Favorite Button */}
          {fromLocation && toLocation && (
            <TouchableOpacity
              style={styles.saveFavoriteButton}
              onPress={handleSaveFavorite}
            >
              <ThemedText style={styles.saveFavoriteText}>💾 Save as Favorite</ThemedText>
            </TouchableOpacity>
          )}

          {/* Calculate Button */}
          <TouchableOpacity
            style={[
              styles.calculateButton,
              !canCalculate && styles.calculateButtonDisabled,
            ]}
            onPress={handleCalculate}
            disabled={!canCalculate}
          >
            {isCalculating ? (
              <View style={styles.calculatingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <ThemedText style={styles.calculateButtonText}>
                  Finding Route...
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.calculateButtonText}>
                Calculate Sun Exposure
              </ThemedText>
            )}
          </TouchableOpacity>

          {/* Helper Text */}
          {!canCalculate && !isCalculating && (
            <ThemedText style={styles.helperText}>
              Please select both origin and destination to continue
            </ThemedText>
          )}
          
          {isCalculating && (
            <ThemedText style={styles.helperText}>
              🗺️ Fetching route from OSRM...
            </ThemedText>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Favorites Modal */}
      <FavoritesModal
        visible={showFavorites}
        onClose={() => setShowFavorites(false)}
        onSelectFavorite={handleLoadFavorite}
      />

      {/* Name Input Modal */}
      <NameInputModal
        visible={showNameInput}
        defaultName={fromLocation && toLocation ? `${fromLocation.name.split(',')[0]} → ${toLocation.name.split(',')[0]}` : ''}
        onSave={handleSaveWithName}
        onCancel={() => setShowNameInput(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  favoritesButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FF9500',
    borderRadius: 20,
  },
  favoritesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveFavoriteButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  saveFavoriteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: -10,
    zIndex: 0,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapIcon: {
    fontSize: 24,
    color: '#fff',
  },
  calculateButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  calculateButtonDisabled: {
    backgroundColor: '#8E8E93',
    opacity: 0.5,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  calculatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  helperText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 12,
  },
});
