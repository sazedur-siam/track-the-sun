import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDebounce } from '@/src/hooks/useDebounce';
import { searchLocation, SearchResult } from '@/src/services/geocodingService';
import { Location } from '@/src/types';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
      ActivityIndicator,
      FlatList,
      Platform,
      StyleSheet,
      TextInput,
      TouchableOpacity,
      View,
} from 'react-native';

interface LocationInputProps {
  label: string;
  placeholder: string;
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
}

export default function LocationInput({
  label,
  placeholder,
  onLocationSelect,
  selectedLocation,
}: LocationInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debouncedQuery = useDebounce(query, 600);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (debouncedQuery.trim().length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    searchLocation(debouncedQuery)
      .then((data) => {
        setResults(data);
        setShowResults(true);
      })
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  const handleSelectLocation = (result: SearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLocationSelect({
      lat: result.lat,
      lng: result.lng,
      name: result.displayName,
    });
    setQuery(result.displayName);
    setShowResults(false);
    setResults([]);
    // Dismiss keyboard
    if (Platform.OS !== 'web') {
      require('react-native').Keyboard.dismiss();
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onLocationSelect(null as any);
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7',
              color: colorScheme === 'dark' ? '#fff' : '#000',
            },
            isSearching && styles.inputSearching,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colorScheme === 'dark' ? '#8e8e93' : '#8e8e93'}
          value={selectedLocation ? selectedLocation.name : query}
          onChangeText={setQuery}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
        />
        
        {isSearching && (
          <ActivityIndicator
            style={styles.searchingIndicator}
            color="#007AFF"
            size="large"
          />
        )}
        
        {(selectedLocation || query) && !isSearching && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <ThemedText style={styles.clearText}>✕</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {isSearching && (
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>🔍 Searching...</ThemedText>
        </View>
      )}

      {showResults && results.length > 0 && (
        <ThemedView style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectLocation(item)}
              >
                <ThemedText style={styles.resultText} numberOfLines={2}>
                  {item.displayName}
                </ThemedText>
              </TouchableOpacity>
            )}
            style={styles.resultsList}
          />
        </ThemedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingRight: 50,
    fontSize: 16,
  },
  inputSearching: {
    opacity: 0.7,
  },
  searchingIndicator: {
    position: 'absolute',
    right: 12,
    top: 8,
  },
  loadingContainer: {
    marginTop: 8,
    marginBottom: 5,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 20,
    opacity: 0.5,
  },
  resultsContainer: {
    marginTop: 5,
    borderRadius: 10,
    maxHeight: 200,
    overflow: 'hidden',
  },
  resultsList: {
    maxHeight: 200,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  resultText: {
    fontSize: 14,
  },
});
