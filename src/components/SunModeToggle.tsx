import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { SunAvoidance } from '@/src/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface SunModeToggleProps {
  value: SunAvoidance;
  onChange: (mode: SunAvoidance) => void;
}

const OPTIONS: { mode: SunAvoidance; icon: 'weather-sunny-off' | 'weather-sunny' }[] = [
  { mode: 'avoid', icon: 'weather-sunny-off' },
  { mode: 'seek', icon: 'weather-sunny' },
];

/** Segmented control: avoid the sun (default) or get the sun. */
export default function SunModeToggle({ value, onChange }: SunModeToggleProps) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();

  return (
    <View>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{t('home.modeLabel')}</ThemedText>
      <View
        style={[styles.track, { backgroundColor: theme.inputBackground }]}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('home.modeLabel')}
      >
        {OPTIONS.map(({ mode, icon }) => {
          const active = value === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.option, active && { backgroundColor: theme.primary }]}
              onPress={() => {
                if (active) return;
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                onChange(mode);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={t(mode === 'avoid' ? 'home.modeAvoid' : 'home.modeSeek')}
            >
              <MaterialCommunityIcons name={icon} size={18} color={active ? theme.onPrimary : theme.textSecondary} />
              <ThemedText style={[styles.optionText, { color: active ? theme.onPrimary : theme.textSecondary }]}>
                {t(mode === 'avoid' ? 'home.modeAvoid' : 'home.modeSeek')}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  track: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
