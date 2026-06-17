import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface NameInputModalProps {
  visible: boolean;
  defaultName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export default function NameInputModal({ visible, defaultName, onSave, onCancel }: NameInputModalProps) {
  const [name, setName] = useState(defaultName);
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();

  // Refresh the suggested name each time the modal opens.
  useEffect(() => {
    if (visible) setName(defaultName);
  }, [visible, defaultName]);

  const handleSave = () => {
    if (name.trim()) onSave(name.trim());
  };

  const canSave = name.trim().length > 0;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <ThemedText type="subtitle" style={styles.title}>
            {t('nameModal.title')}
          </ThemedText>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{t('nameModal.label')}</ThemedText>

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            placeholder={t('nameModal.placeholder')}
            placeholderTextColor={theme.placeholder}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={50}
            accessibilityLabel={t('nameModal.a11y')}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.inputBackground }]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <ThemedText style={[styles.buttonText, { color: theme.text }]}>{t('common.cancel')}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }, !canSave && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={!canSave}
              accessibilityRole="button"
              accessibilityLabel={t('common.save')}
              accessibilityState={{ disabled: !canSave }}
            >
              <ThemedText style={[styles.buttonText, { color: theme.onPrimary }]}>{t('common.save')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
