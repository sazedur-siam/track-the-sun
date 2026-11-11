import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import {
  deleteFavoriteRoute,
  FavoriteRoute,
  getFavoriteRoutes,
  resolveDepartureTime,
} from '@/src/services/favoritesService';
import { formatClock } from '@/src/utils/time';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface FavoritesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFavorite: (favorite: FavoriteRoute) => void;
}

export default function FavoritesModal({ visible, onClose, onSelectFavorite }: FavoritesModalProps) {
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) loadFavorites();
  }, [visible]);

  const loadFavorites = async () => setFavorites(await getFavoriteRoutes());

  const handleDelete = async (id: string) => {
    Alert.alert(t('favorites.deleteTitle'), t('favorites.deleteMsg'), [
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

  const handleSelect = (favorite: FavoriteRoute) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectFavorite(favorite);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.grabber}>
            <View style={[styles.grabberBar, { backgroundColor: theme.border }]} />
          </View>

          <View style={[styles.modalHeader, { borderBottomColor: theme.separator }]}>
            <ThemedText type="subtitle">{t('favorites.title')}</ThemedText>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={t('favorites.closeA11y')} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.favoritesList}>
            {favorites.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="star-outline" size={40} color={theme.textMuted} />
                <ThemedText style={[styles.emptyStateText, { color: theme.text }]}>{t('favorites.empty')}</ThemedText>
                <ThemedText style={[styles.emptyStateSubtext, { color: theme.textMuted }]}>
                  {t('favorites.emptySub')}
                </ThemedText>
              </View>
            ) : (
              favorites.map((favorite) => (
                <View
                  key={favorite.id}
                  style={[styles.favoriteItem, { backgroundColor: theme.inputBackground }]}
                >
                  <TouchableOpacity
                    style={styles.favoriteContent}
                    onPress={() => handleSelect(favorite)}
                    accessibilityRole="button"
                    accessibilityLabel={t('favorites.useA11y', { name: favorite.name })}
                  >
                    <ThemedText style={[styles.favoriteName, { color: theme.text }]}>{favorite.name}</ThemedText>
                    <ThemedText style={[styles.favoriteDetails, { color: theme.textSecondary }]} numberOfLines={1}>
                      {favorite.fromLocation.name}
                    </ThemedText>
                    <ThemedText style={[styles.favoriteDetails, { color: theme.textSecondary }]} numberOfLines={1}>
                      → {favorite.toLocation.name}
                    </ThemedText>
                    {favorite.departureTime && (
                      <View style={styles.timeRow}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={theme.primary} />
                        <ThemedText style={[styles.timeText, { color: theme.primary }]}>
                          {t('common.departsAt', { time: formatClock(resolveDepartureTime(favorite.departureTime)) })}
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(favorite.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t('favorites.deleteA11y', { name: favorite.name })}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
    maxHeight: '80%',
  },
  grabber: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  grabberBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  favoritesList: {
    padding: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  favoriteItem: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  favoriteContent: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  favoriteDetails: {
    fontSize: 14,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
