import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { searchLocation, SearchResult } from '@/src/services/geocodingService';
import { Location } from '@/src/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface LocationInputProps {
  label: string;
  placeholder: string;
  onLocationSelect: (location: Location | null) => void;
  selectedLocation: Location | null;
}

export default function LocationInput({
  label,
  placeholder,
  onLocationSelect,
  selectedLocation,
}: LocationInputProps) {
  const [query, setQuery] = useState(selectedLocation?.name ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const requestId = useRef(0);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t } = useTranslation();

  // Keep the field text in sync when the selection is set from outside
  // (swap, favorites, current location).
  useEffect(() => {
    if (selectedLocation && selectedLocation.name !== query) {
      setQuery(selectedLocation.name);
      setShowResults(false);
      setResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    // Skip when too short or when the text already matches the chosen place.
    if (q.length < 3 || q === selectedLocation?.name) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const id = ++requestId.current;
    setIsSearching(true);
    searchLocation(debouncedQuery)
      .then((data) => {
        if (id !== requestId.current) return; // ignore stale responses
        setResults(data);
        setShowResults(data.length > 0);
      })
      .finally(() => {
        if (id === requestId.current) setIsSearching(false);
      });
  }, [debouncedQuery, selectedLocation]);

  const handleChangeText = (text: string) => {
    setQuery(text);
    // Editing invalidates a previously chosen location.
    if (selectedLocation) onLocationSelect(null);
  };

  const handleSelectLocation = (result: SearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    requestId.current++; // cancel any in-flight search
    onLocationSelect({ lat: result.lat, lng: result.lng, name: result.displayName });
    setQuery(result.displayName);
    setShowResults(false);
    setResults([]);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    requestId.current++;
    setQuery('');
    setResults([]);
    setShowResults(false);
    setIsSearching(false);
    onLocationSelect(null);
  };

  const hasValue = query.length > 0;

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{label}</ThemedText>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.inputBackground, color: theme.text },
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          accessibilityLabel={t('location.fieldA11y', { label })}
          returnKeyType="search"
        />

        {isSearching ? (
          <ActivityIndicator style={styles.trailingIcon} color={theme.primary} size="small" />
        ) : (
          hasValue && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.trailingIcon}
              accessibilityRole="button"
              accessibilityLabel={t('location.clearA11y', { label })}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          )
        )}
      </View>

      {showResults && results.length > 0 && (
        <ThemedView
          style={[styles.resultsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultItem, { borderBottomColor: theme.separator }]}
                onPress={() => handleSelectLocation(item)}
                accessibilityRole="button"
                accessibilityLabel={item.displayName}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={18} color={theme.textMuted} />
                <ThemedText style={[styles.resultText, { color: theme.text }]} numberOfLines={2}>
                  {item.displayName}
                </ThemedText>
              </TouchableOpacity>
            )}
            style={styles.resultsList}
            scrollEnabled={false}
            keyboardShouldPersistTaps="handled"
          />
        </ThemedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    position: 'relative',
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingRight: 44,
    fontSize: 16,
  },
  trailingIcon: {
    position: 'absolute',
    right: Spacing.md,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsContainer: {
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    maxHeight: 220,
    overflow: 'hidden',
  },
  resultsList: {
    maxHeight: 220,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
  },
});
