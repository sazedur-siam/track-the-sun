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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const colorScheme = useColorScheme();
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  const formatTime = (date: Date) => {
    try {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}/${day} ${displayHours}:${displayMinutes} ${ampm}`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleNow = () => {
    onTimeChange(new Date());
  };

  const handleChangeIOS = (event: any, date?: Date) => {
    if (date) {
      onTimeChange(date);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && date) {
      setTempDate(date);
      setShowTimePicker(true);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && date && tempDate) {
      // Combine tempDate and time from date parameter
      const finalDate = new Date(tempDate);
      finalDate.setHours(date.getHours());
      finalDate.setMinutes(date.getMinutes());
      onTimeChange(finalDate);
      setTempDate(null);
    }
  };

  const handleWebDateChange = (e: any) => {
    const value = e.target.value;
    if (value) {
      const newDate = new Date(value);
      onTimeChange(newDate);
    }
  };

  const openPicker = () => {
    setShowDatePicker(true);
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.nowButton,
            {
              backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7',
            },
          ]}
          onPress={handleNow}
        >
          <ThemedText style={styles.buttonText}>Now</ThemedText>
        </TouchableOpacity>

        {isWeb ? (
          <View
            style={[
              styles.pickButton,
              {
                backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7',
              },
            ]}
          >
            <input
              type="datetime-local"
              value={formatDateTimeLocal(selectedTime)}
              onChange={handleWebDateChange}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: colorScheme === 'dark' ? '#fff' : '#000',
                fontSize: 16,
                paddingLeft: 0,
              }}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.pickButton,
              {
                backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7',
              },
            ]}
            onPress={openPicker}
          >
            <ThemedText style={styles.timeText}>{formatTime(selectedTime)}</ThemedText>
            <ThemedText style={styles.icon}>📅</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {isIOS && showDatePicker && (
        <>
          <DateTimePicker
            value={selectedTime}
            mode="datetime"
            display="spinner"
            onChange={handleChangeIOS}
          />
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setShowDatePicker(false)}
          >
            <ThemedText style={styles.doneText}>Done</ThemedText>
          </TouchableOpacity>
        </>
      )}

      {isAndroid && showDatePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {isAndroid && showTimePicker && tempDate && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nowButton: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickButton: {
    flex: 1,
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
