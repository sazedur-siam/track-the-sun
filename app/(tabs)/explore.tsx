import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FavoriteRoute, deleteFavoriteRoute, getFavoriteRoutes } from '@/src/services/favoritesService';
import { fetchRoute } from '@/src/services/routingService';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function SavedLocationsScreen() {
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

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
    Alert.alert(
      'Delete Favorite',
      'Are you sure you want to remove this saved location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteFavoriteRoute(id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            loadFavorites();
          },
        },
      ]
    );
  };

  const handleCalculateRoute = async (favorite: FavoriteRoute) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const route = await fetchRoute(
        favorite.fromLocation,
        favorite.toLocation,
        new Date()
      );

      if (!route) {
        Alert.alert('Route Not Found', 'Unable to find a route for this saved location.');
        return;
      }

      router.push({
        pathname: '/route-result',
        params: {
          route: JSON.stringify(route),
          fromName: favorite.fromLocation.name,
          toName: favorite.toLocation.name,
          departureTime: new Date().toISOString(),
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate route. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9500" />
          <ThemedText style={styles.loadingText}>Loading saved locations...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            ⭐ Saved Locations
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {favorites.length} saved route{favorites.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateIcon}>📍</ThemedText>
            <ThemedText style={styles.emptyStateText}>No saved locations yet</ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Save your frequent routes from the home screen for quick access
            </ThemedText>
          </View>
        ) : (
          favorites.map((favorite) => (
            <View key={favorite.id} style={styles.favoriteCard}>
              <TouchableOpacity
                style={styles.favoriteContent}
                onPress={() => handleCalculateRoute(favorite)}
              >
                <ThemedText style={styles.favoriteName}>{favorite.name}</ThemedText>
                <View style={styles.routeDetails}>
                  <ThemedText style={styles.locationText} numberOfLines={1}>
                    📍 {favorite.fromLocation.name}
                  </ThemedText>
                  <ThemedText style={styles.arrow}>↓</ThemedText>
                  <ThemedText style={styles.locationText} numberOfLines={1}>
                    📍 {favorite.toLocation.name}
                  </ThemedText>
                </View>
                <ThemedText style={styles.tapHint}>Tap to calculate route</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(favorite.id)}
              >
                <ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
              </TouchableOpacity>
            </View>
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
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  favoriteContent: {
    flex: 1,
    padding: 16,
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#FF9500',
  },
  routeDetails: {
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    opacity: 0.8,
  },
  arrow: {
    fontSize: 14,
    opacity: 0.5,
    marginLeft: 8,
  },
  tapHint: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 8,
    fontStyle: 'italic',
  },
  deleteButton: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  deleteButtonText: {
    fontSize: 28,
  },
});
