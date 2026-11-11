import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import LanguagePicker from '@/src/components/LanguagePicker';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import {
  deleteFavoriteRoute,
  FavoriteRoute,
  getFavoriteRoutes,
  resolveDepartureTime,
} from '@/src/services/favoritesService';
import { buildRouteResultParams, putRoute } from '@/src/services/routeStore';
import { planRoute } from '@/src/services/settingsService';
import { formatClock } from '@/src/utils/time';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

export default function SavedLocationsScreen() {
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();

  const loadFavorites = async () => {
    const data = await getFavoriteRoutes();
    setFavorites(data);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFavorites();
    setIsRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(t('saved.deleteTitle'), t('saved.deleteMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteFavoriteRoute(id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          loadFavorites();
        },
      },
    ]);
  };

  const handleCalculateRoute = async (favorite: FavoriteRoute) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Use the saved time of day (today), or "now" for routes saved without one.
      const departureTime = resolveDepartureTime(favorite.departureTime);
      const route = await planRoute(favorite.fromLocation, favorite.toLocation, departureTime);
      if (!route) {
        Alert.alert(t('saved.routeNotFoundTitle'), t('saved.routeNotFoundMsg'));
        return;
      }
      const routeId = putRoute(route);
      router.push({
        pathname: '/route-result',
        params: buildRouteResultParams(routeId, favorite.fromLocation, favorite.toLocation, departureTime),
      });
    } catch {
      Alert.alert(t('common.error'), t('saved.errorMsg'));
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            {t('saved.loading')}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <ThemedText type="title">{t('saved.title')}</ThemedText>
            <LanguagePicker />
          </View>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t(favorites.length === 1 ? 'saved.countOne' : 'saved.countOther', {
              count: favorites.length,
            })}
          </ThemedText>
        </View>

        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="star-outline" size={56} color={theme.textMuted} />
            <ThemedText style={[styles.emptyStateText, { color: theme.text }]}>{t('saved.empty')}</ThemedText>
            <ThemedText style={[styles.emptyStateSubtext, { color: theme.textMuted }]}>
              {t('saved.emptySub')}
            </ThemedText>
          </View>
        ) : (
          favorites.map((favorite, index) => (
            <Animated.View
              key={favorite.id}
              entering={FadeInDown.delay(index * 80).springify()}
              layout={Layout.springify()}
            >
              <View
                style={[
                  styles.favoriteCard,
                  { backgroundColor: theme.card, shadowColor: theme.shadow },
                  Shadows.sm,
                ]}
              >
                <TouchableOpacity
                  style={styles.favoriteContent}
                  onPress={() => handleCalculateRoute(favorite)}
                  accessibilityRole="button"
                  accessibilityLabel={t('saved.calcA11y', { name: favorite.name })}
                >
                  <ThemedText style={[styles.favoriteName, { color: theme.text }]}>{favorite.name}</ThemedText>
                  <View style={styles.routeRow}>
                    <MaterialCommunityIcons name="circle-outline" size={15} color={theme.secondary} />
                    <ThemedText style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
                      {favorite.fromLocation.name}
                    </ThemedText>
                  </View>
                  <View style={[styles.routeConnector, { backgroundColor: theme.border }]} />
                  <View style={styles.routeRow}>
                    <MaterialCommunityIcons name="map-marker" size={15} color={theme.primary} />
                    <ThemedText style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
                      {favorite.toLocation.name}
                    </ThemedText>
                  </View>
                  <View style={styles.tapHintRow}>
                    <MaterialCommunityIcons name="white-balance-sunny" size={14} color={theme.primary} />
                    <ThemedText style={[styles.tapHint, { color: theme.primary }]}>{t('saved.tapHint')}</ThemedText>
                    {favorite.departureTime && (
                      <>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={14}
                          color={theme.textSecondary}
                          style={styles.timeIcon}
                        />
                        <ThemedText style={[styles.tapHint, { color: theme.textSecondary }]}>
                          {t('common.departsAt', { time: formatClock(resolveDepartureTime(favorite.departureTime)) })}
                        </ThemedText>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(favorite.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('saved.deleteA11y', { name: favorite.name })}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={22} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl + Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 15,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
    lineHeight: 20,
  },
  favoriteCard: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  favoriteContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  favoriteName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  routeConnector: {
    width: 2,
    height: 12,
    marginLeft: 6,
    marginVertical: 1,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
  },
  tapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  tapHint: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeIcon: {
    marginLeft: Spacing.md,
  },
  deleteButton: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
