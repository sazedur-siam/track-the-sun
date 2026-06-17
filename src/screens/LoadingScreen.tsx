import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import SunAnimation from '@/src/components/SunAnimation';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingScreenProps {
  onLoadComplete?: () => void;
}

export default function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      onLoadComplete?.();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  return (
    <ThemedView style={styles.container}>
      <SunAnimation />
      <ThemedText type="title" style={styles.title}>
        TrackTheSun
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        {t('common.tagline')}
      </ThemedText>
      <ActivityIndicator size="large" color={theme.primary} style={styles.spinner} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
  },
  spinner: {
    marginTop: Spacing.lg,
  },
});
