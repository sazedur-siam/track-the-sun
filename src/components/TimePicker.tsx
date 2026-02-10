import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface TimePickerProps {
  label: string;
  selectedTime: Date;
  onTimeChange: (time: Date) => void;
}

export default function TimePicker({
  label,
  selectedTime,
  onTimeChange,
}: TimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const colorScheme = useColorScheme();

  const formatTime = (date: Date) => {
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday && Math.abs(date.getTime() - now.getTime()) < 60000) {
      return 'Now';
    }

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const handleChange = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (date) {
      onTimeChange(date);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>

      <TouchableOpacity
        style={[
          styles.timeButton,
          {
            backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7',
          },
        ]}
        onPress={() => setShowPicker(true)}
      >
        <ThemedText style={styles.timeText}>{formatTime(selectedTime)}</ThemedText>
        <ThemedText style={styles.icon}>🕐</ThemedText>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={selectedTime}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={new Date()}
        />
      )}

      {Platform.OS === 'ios' && showPicker && (
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => setShowPicker(false)}
        >
          <ThemedText style={styles.doneText}>Done</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeButton: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 16,
  },
  icon: {
    fontSize: 20,
  },
  doneButton: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  doneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
