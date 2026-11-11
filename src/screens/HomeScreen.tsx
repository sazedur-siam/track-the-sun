import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import CurrentLocationButton from '@/src/components/CurrentLocationButton';
import FavoritesModal from '@/src/components/FavoritesModal';
import LanguagePicker from '@/src/components/LanguagePicker';
import LocationInput from '@/src/components/LocationInput';
import NameInputModal from '@/src/components/NameInputModal';
import SunAnimation from '@/src/components/SunAnimation';
import SunModeToggle from '@/src/components/SunModeToggle';
import TimePicker from '@/src/components/TimePicker';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { FavoriteRoute, resolveDepartureTime, saveFavoriteRoute } from '@/src/services/favoritesService';
import { buildRouteResultParams, putRoute } from '@/src/services/routeStore';
import { getSettings, planRoute, updateSettings } from '@/src/services/settingsService';
import { Location, SunAvoidance } from '@/src/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  const [sunMode, setSunMode] = useState<SunAvoidance>('avoid');
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t } = useTranslation();

  // Restore the last chosen sun preference.
  useEffect(() => {
    getSettings().then((settings) => setSunMode(settings.sunMode));
  }, []);

  const handleSunModeChange = (mode: SunAvoidance) => {
    setSunMode(mode);
    updateSettings({ sunMode: mode }).catch(() => {});
  };

  const canCalculate = fromLocation !== null && toLocation !== null && !isCalculating;
  const hasBothLocations = fromLocation !== null && toLocation !== null;

  const handleCalculate = async () => {
    if (!canCalculate || !fromLocation || !toLocation) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCalculating(true);

    try {
      const route = await planRoute(fromLocation, toLocation, departureTime);

      if (!route) {
        Alert.alert(t('home.routeNotFoundTitle'), t('home.routeNotFoundMsg'));
        setIsCalculating(false);
        return;
      }

      const routeId = putRoute(route);
      router.push({
        pathname: '/route-result',
        params: buildRouteResultParams(routeId, fromLocation, toLocation, departureTime, sunMode),
      });
    } catch {
      Alert.alert(t('common.error'), t('home.errorMsg'));
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSwapLocations = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFromLocation(toLocation);
    setToLocation(fromLocation);
  };

  const handleSaveWithName = async (name: string) => {
    if (!fromLocation || !toLocation) return;

    try {
      await saveFavoriteRoute(fromLocation, toLocation, name, departureTime, sunMode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('home.savedTitle'), t('home.savedMsg'));
      setShowNameInput(false);
    } catch {
      Alert.alert(t('common.error'), t('home.saveErrorMsg'));
    }
  };

  const handleLoadFavorite = (favorite: FavoriteRoute) => {
    setFromLocation(favorite.fromLocation);
    setToLocation(favorite.toLocation);
    if (favorite.departureTime) {
      setDepartureTime(resolveDepartureTime(favorite.departureTime));
    }
    handleSunModeChange(favorite.mode ?? 'avoid');
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
          showsVerticalScrollIndicator={false}
        >
          {/* Language picker */}
          <View style={styles.topBar}>
            <LanguagePicker />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <SunAnimation />
            <ThemedText type="title" style={styles.title}>
              TrackTheSun
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t(sunMode === 'seek' ? 'common.taglineSeek' : 'common.tagline')}
            </ThemedText>
          </View>

          {/* Main Card */}
          <View
            style={[
              styles.mainCard,
              { backgroundColor: theme.card, shadowColor: theme.shadow },
              Shadows.md,
            ]}
          >
            {/* Quick actions */}
            <View style={styles.sectionHeader}>
              <CurrentLocationButton onLocationSelect={setFromLocation} />
              <TouchableOpacity
                style={[styles.chipButton, { backgroundColor: theme.accentSoft }]}
                onPress={() => setShowFavorites(true)}
                accessibilityRole="button"
                accessibilityLabel={t('home.favoritesA11y')}
              >
                <MaterialCommunityIcons name="star" size={16} color={theme.warning} />
                <ThemedText style={[styles.chipText, { color: theme.text }]}>{t('home.favorites')}</ThemedText>
              </TouchableOpacity>
            </View>

            {/* From / To with swap */}
            <View>
              <LocationInput
                label={t('home.from')}
                placeholder={t('home.searchFrom')}
                onLocationSelect={setFromLocation}
                selectedLocation={fromLocation}
              />

              {(fromLocation || toLocation) && (
                <View style={styles.swapContainer} pointerEvents="box-none">
                  <TouchableOpacity
                    style={[
                      styles.swapButton,
                      { backgroundColor: theme.primary, borderColor: theme.card },
                    ]}
                    onPress={handleSwapLocations}
                    accessibilityRole="button"
                    accessibilityLabel={t('home.swapA11y')}
                  >
                    <MaterialCommunityIcons name="swap-vertical" size={22} color={theme.onPrimary} />
                  </TouchableOpacity>
                </View>
              )}

              <LocationInput
                label={t('home.to')}
                placeholder={t('home.searchTo')}
                onLocationSelect={setToLocation}
                selectedLocation={toLocation}
              />
            </View>

            <TimePicker
              label={t('home.departureTime')}
              selectedTime={departureTime}
              onTimeChange={setDepartureTime}
            />

            <SunModeToggle value={sunMode} onChange={handleSunModeChange} />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {hasBothLocations && (
              <TouchableOpacity
                style={[styles.saveFavoriteButton, { backgroundColor: theme.inputBackground }]}
                onPress={() => setShowNameInput(true)}
                accessibilityRole="button"
                accessibilityLabel={t('home.saveA11y')}
              >
                <MaterialCommunityIcons name="bookmark-outline" size={20} color={theme.text} />
                <ThemedText style={[styles.saveFavoriteText, { color: theme.text }]}>{t('common.save')}</ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.calculateButton,
                { backgroundColor: canCalculate ? theme.primary : theme.inputBackground },
                canCalculate && { shadowColor: theme.shadow, ...Shadows.md },
              ]}
              onPress={handleCalculate}
              disabled={!canCalculate}
              accessibilityRole="button"
              accessibilityLabel={t('home.findSeat')}
              accessibilityState={{ disabled: !canCalculate, busy: isCalculating }}
            >
              {isCalculating ? (
                <View style={styles.calculatingContainer}>
                  <ActivityIndicator color={theme.onPrimary} size="small" />
                  <ThemedText style={[styles.calculateButtonText, { color: theme.onPrimary }]}>
                    {t('home.tracingSun')}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText
                  style={[
                    styles.calculateButtonText,
                    { color: canCalculate ? theme.onPrimary : theme.textMuted },
                  ]}
                >
                  {t('home.findSeat')}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {!hasBothLocations && (
            <ThemedText style={[styles.helperText, { color: theme.textMuted }]}>
              {t('home.helper')}
            </ThemedText>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <FavoritesModal
        visible={showFavorites}
        onClose={() => setShowFavorites(false)}
        onSelectFavorite={handleLoadFavorite}
      />

      <NameInputModal
        visible={showNameInput}
        defaultName={
          fromLocation && toLocation
            ? `${fromLocation.name.split(',')[0]} → ${toLocation.name.split(',')[0]}`
            : ''
        }
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
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl + Spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.xs,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mainCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: -Spacing.lg - 2,
    zIndex: 10,
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  saveFavoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
  },
  saveFavoriteText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calculateButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  calculatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
