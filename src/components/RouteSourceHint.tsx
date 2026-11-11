import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { effectiveGoogleKey, getSettings } from '@/src/services/settingsService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

/**
 * One-line hint under the Home button: which route provider is active, or a
 * nudge to add a Google Maps key. Tapping opens Settings at the key field.
 */
export default function RouteSourceHint() {
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();
  const [usingGoogle, setUsingGoogle] = useState<boolean | null>(null);

  // Re-check whenever Home regains focus (the user may have changed Settings).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSettings().then((settings) => {
        if (active) setUsingGoogle(settings.routingProvider === 'google' && !!effectiveGoogleKey(settings));
      });
      return () => {
        active = false;
      };
    }, [])
  );

  if (usingGoogle === null) return null;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() =>
        usingGoogle ? router.push('/settings') : router.push({ pathname: '/settings', params: { focus: 'key' } })
      }
      accessibilityRole="button"
      accessibilityLabel={t('home.sourceA11y')}
      hitSlop={6}
    >
      <MaterialCommunityIcons
        name={usingGoogle ? 'google-maps' : 'map-outline'}
        size={15}
        color={usingGoogle ? theme.textMuted : theme.secondary}
      />
      {usingGoogle ? (
        <ThemedText style={[styles.text, { color: theme.textMuted }]}>{t('home.sourceGoogle')}</ThemedText>
      ) : (
        <ThemedText style={[styles.text, { color: theme.textMuted }]}>
          {t('home.sourceOsrm')}{' '}
          <ThemedText style={[styles.text, styles.link, { color: theme.secondary }]}>{t('home.sourceAddKey')} →</ThemedText>
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    flexShrink: 1,
  },
  link: {
    fontWeight: '700',
  },
});
