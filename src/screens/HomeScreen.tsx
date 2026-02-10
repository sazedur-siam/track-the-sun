import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          ☀️ TrackTheSun
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Which side of the bus should you sit on?
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText type="subtitle" style={styles.comingSoon}>
          Phase 1 Coming Soon
        </ThemedText>
        <ThemedText style={styles.description}>
          Location input and route planning features will be added in Phase 1.
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Phase 0: Complete ✅
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  comingSoon: {
    fontSize: 24,
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.5,
  },
});
