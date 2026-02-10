import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FavoriteRoute, deleteFavoriteRoute, getFavoriteRoutes } from '@/src/services/favoritesService';
import { Location } from '@/src/types';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface FavoritesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFavorite: (from: Location, to: Location) => void;
}

export default function FavoritesModal({
  visible,
  onClose,
  onSelectFavorite,
}: FavoritesModalProps) {
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (visible) {
      loadFavorites();
    }
  }, [visible]);

  const loadFavorites = async () => {
    const data = await getFavoriteRoutes();
    setFavorites(data);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Favorite',
      'Are you sure you want to remove this favorite route?',
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

  const handleSelect = (favorite: FavoriteRoute) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectFavorite(favorite.fromLocation, favorite.toLocation);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView
          style={[
            styles.modalContent,
            { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' },
          ]}
        >
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              ⭐ Favorite Routes
            </ThemedText>
            <TouchableOpacity onPress={onClose}>
              <ThemedText style={styles.closeButton}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.favoritesList}>
            {favorites.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>
                  No favorite routes yet
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  Save your frequent routes for quick access
                </ThemedText>
              </View>
            ) : (
              favorites.map((favorite) => (
                <View key={favorite.id} style={styles.favoriteItem}>
                  <TouchableOpacity
                    style={styles.favoriteContent}
                    onPress={() => handleSelect(favorite)}
                  >
                    <ThemedText style={styles.favoriteName}>
                      {favorite.name}
                    </ThemedText>
                    <ThemedText style={styles.favoriteDetails}>
                      {favorite.fromLocation.name}
                    </ThemedText>
                    <ThemedText style={styles.favoriteDetails}>
                      → {favorite.toLocation.name}
                    </ThemedText>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
  },
  closeButton: {
    fontSize: 28,
    opacity: 0.6,
  },
  favoritesList: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.7,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
  },
  favoriteItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  favoriteContent: {
    flex: 1,
    padding: 16,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  favoriteDetails: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  deleteButton: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  deleteButtonText: {
    fontSize: 24,
  },
});
