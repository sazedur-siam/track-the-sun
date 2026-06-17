import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface TimePickerProps {
  label: string;
  selectedTime: Date;
  onTimeChange: (time: Date) => void;
}

export default function TimePicker({ label, selectedTime, onTimeChange }: TimePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t } = useTranslation();
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
      return `${month}/${day} · ${displayHours}:${displayMinutes} ${ampm}`;
    } catch {
      return t('time.invalidDate');
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

  const handleNow = () => onTimeChange(new Date());

  const handleChangeIOS = (event: any, date?: Date) => {
    if (date) onTimeChange(date);
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
      const finalDate = new Date(tempDate);
      finalDate.setHours(date.getHours());
      finalDate.setMinutes(date.getMinutes());
      onTimeChange(finalDate);
      setTempDate(null);
    }
  };

  const handleWebDateChange = (e: any) => {
    const value = e.target.value;
    if (value) onTimeChange(new Date(value));
  };

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{label}</ThemedText>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.nowButton, { backgroundColor: theme.accentSoft }]}
          onPress={handleNow}
          accessibilityRole="button"
          accessibilityLabel={t('time.nowA11y')}
        >
          <ThemedText style={[styles.nowText, { color: theme.text }]}>{t('time.now')}</ThemedText>
        </TouchableOpacity>

        {isWeb ? (
          <View style={[styles.pickButton, { backgroundColor: theme.inputBackground }]}>
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
                color: theme.text,
                fontSize: 16,
                paddingLeft: 0,
              }}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.pickButton, { backgroundColor: theme.inputBackground }]}
            onPress={() => setShowDatePicker(true)}
            accessibilityRole="button"
            accessibilityLabel={t('time.changeA11y', { time: formatTime(selectedTime) })}
          >
            <ThemedText style={[styles.timeText, { color: theme.text }]}>{formatTime(selectedTime)}</ThemedText>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {isIOS && showDatePicker && (
        <>
          <DateTimePicker value={selectedTime} mode="datetime" display="spinner" onChange={handleChangeIOS} />
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowDatePicker(false)}
            accessibilityRole="button"
            accessibilityLabel={t('time.doneA11y')}
          >
            <ThemedText style={[styles.doneText, { color: theme.onPrimary }]}>{t('time.done')}</ThemedText>
          </TouchableOpacity>
        </>
      )}

      {isAndroid && showDatePicker && (
        <DateTimePicker value={selectedTime} mode="date" display="default" onChange={handleDateChange} />
      )}

      {isAndroid && showTimePicker && tempDate && (
        <DateTimePicker value={tempDate} mode="time" display="default" onChange={handleTimeChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  nowButton: {
    height: 52,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nowText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pickButton: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  doneButton: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
