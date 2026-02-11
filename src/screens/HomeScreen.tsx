import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import CurrentLocationButton from '@/src/components/CurrentLocationButton';
import FavoritesModal from '@/src/components/FavoritesModal';
import LocationInput from '@/src/components/LocationInput';
import NameInputModal from '@/src/components/NameInputModal';
import SunAnimation from '@/src/components/SunAnimation';
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

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
            <SunAnimation />
            <ThemedText type="title" style={styles.title}>
              TrackTheSun
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Find the shady side of your journey
            </ThemedText>
          </View>

          {/* Main Card */}
          <View style={[styles.mainCard, { borderColor: theme.border, shadowColor: theme.text }]}>
             
               {/* Current Location Button */}
            <View style={styles.sectionHeader}>
                 <CurrentLocationButton onLocationSelect={setFromLocation} />
                 <TouchableOpacity
                    style={[styles.favoritesButton, { backgroundColor: theme.secondary }]}
                    onPress={() => setShowFavorites(true)}
                    >
                    <ThemedText style={styles.favoritesButtonText}>⭐ Favorites</ThemedText>
                </TouchableOpacity>
            </View>

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
                    style={[styles.swapButton, { backgroundColor: theme.primary }]}
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
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Save Favorite Button */}
            {fromLocation && toLocation && (
                <TouchableOpacity
                style={[styles.saveFavoriteButton, { backgroundColor: theme.secondary }]}
                onPress={handleSaveFavorite}
                >
                <ThemedText style={styles.saveFavoriteText}>💾 Save Route</ThemedText>
                </TouchableOpacity>
            )}

            {/* Calculate Button */}
            <TouchableOpacity
                style={[
                styles.calculateButton,
                { backgroundColor: canCalculate ? theme.primary : theme.icon },
                ]}
                onPress={handleCalculate}
                disabled={!canCalculate}
            >
                {isCalculating ? (
                <View style={styles.calculatingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <ThemedText style={[styles.calculateButtonText, { color: theme.secondary }]}>
                    Tracing Sun...
                    </ThemedText>
                </View>
                ) : (
                <ThemedText style={[styles.calculateButtonText, { color: canCalculate ? '#111827' : '#fff' }]}>
                    Calculate Sun Exposure
                </ThemedText>
                )}
            </TouchableOpacity>
          </View>

          {/* Helper Text */}
          {isCalculating && (
            <ThemedText style={styles.helperText}>
              🗺️ Integrating with OSRM & SunCalc...
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
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  favoritesButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  favoritesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveFavoriteButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    marginRight: 10,
    alignItems: 'center',
  },
  saveFavoriteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: -16,
    zIndex: 10,
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff', // White border to separate from inputs
  },
  swapIcon: {
    fontSize: 24,
    color: '#023047', // Secondary color
    fontWeight: 'bold',
  },
  calculateButton: {
    flex: 2,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  calculatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  helperText: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
