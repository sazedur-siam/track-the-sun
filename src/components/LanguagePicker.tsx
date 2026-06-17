import { ThemedText } from '@/components/themed-text';
import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { Language, LANGUAGE_LABELS } from '@/src/i18n/translations';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

const OPTIONS: Language[] = ['en', 'bn'];

export default function LanguagePicker() {
  const { language, setLanguage, t } = useTranslation();
  const theme = Colors[useColorScheme() ?? 'light'];

  const handleSelect = (lang: Language) => {
    if (lang === language) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setLanguage(lang);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.inputBackground }]}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('lang.label')}
    >
      {OPTIONS.map((lang) => {
        const active = lang === language;
        return (
          <TouchableOpacity
            key={lang}
            style={[styles.option, active && { backgroundColor: theme.primary }]}
            onPress={() => handleSelect(lang)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={lang === 'en' ? 'English' : 'বাংলা'}
          >
            <ThemedText
              style={[
                styles.optionText,
                { color: active ? theme.onPrimary : theme.textSecondary },
              ]}
            >
              {LANGUAGE_LABELS[lang]}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    padding: 3,
  },
  option: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    minWidth: 40,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
