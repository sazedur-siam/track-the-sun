import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import LanguagePicker from '@/src/components/LanguagePicker';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { RoutingProvider, testGoogleApiKey } from '@/src/services/routingService';
import {
  AppSettings,
  effectiveGoogleKey,
  getBuiltInGoogleKey,
  getSettings,
  googleKeySource,
  maskKey,
  updateSettings,
} from '@/src/services/settingsService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Status = { kind: 'ok' | 'error'; text: string } | null;

/** Routes API page in Google Cloud Console (enable the API there, then create a key). */
const CONSOLE_URL = 'https://console.cloud.google.com/apis/library/routes.googleapis.com';

/** Google API keys are 39 characters starting with "AIza". */
const looksLikeGoogleKey = (value: string) => /^AIza[0-9A-Za-z_-]{35}$/.test(value.trim());

export default function SettingsScreen() {
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [guideOpen, setGuideOpen] = useState<boolean | null>(null);
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const keyCardY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      getSettings().then(setSettings);
    }, [])
  );

  /** Scroll to the key field and focus it (used by deep links and "Google" without a key). */
  const focusKeyInput = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(keyCardY.current - 16, 0), animated: true });
    setTimeout(() => inputRef.current?.focus(), 250);
  }, []);

  // /settings?focus=key → open the guide and jump to the key field.
  useEffect(() => {
    if (focus === 'key' && settings) {
      setGuideOpen(true);
      focusKeyInput();
    }
  }, [focus, settings, focusKeyInput]);

  if (!settings) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  const keySource = googleKeySource(settings);
  const currentKey = effectiveGoogleKey(settings);

  const selectProvider = async (provider: RoutingProvider) => {
    if (provider === settings.routingProvider) return;
    if (provider === 'google' && !currentKey) {
      setStatus({ kind: 'error', text: t('settings.googleNeedsKey') });
      setGuideOpen(true);
      focusKeyInput();
      return;
    }
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setStatus(null);
    setSettings(await updateSettings({ routingProvider: provider }));
  };

  const reasonText = (code: string) => t(`routingError.${code}`);

  const handleTestAndSave = async () => {
    const key = keyInput.trim();
    if (!key) return;
    setBusy('save');
    setStatus(null);
    const result = await testGoogleApiKey(key);
    if (result.ok) {
      setSettings(await updateSettings({ googleApiKey: key, routingProvider: 'google' }));
      setKeyInput('');
      setShowKey(false);
      setStatus({ kind: 'ok', text: t('settings.keySaved') });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setStatus({ kind: 'error', text: t('settings.keyFailed', { reason: reasonText(result.code) }) });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setBusy(null);
  };

  const handleTestCurrent = async () => {
    if (!currentKey) return;
    setBusy('test');
    setStatus(null);
    const result = await testGoogleApiKey(currentKey);
    setStatus(
      result.ok
        ? { kind: 'ok', text: t('settings.keyOk') }
        : { kind: 'error', text: t('settings.keyFailed', { reason: reasonText(result.code) }) }
    );
    setBusy(null);
  };

  const handlePaste = async () => {
    try {
      const text = (await Clipboard.getStringAsync()).trim();
      if (text) {
        setKeyInput(text);
        setStatus(null);
      }
    } catch {
      // Clipboard access denied (e.g. browser permission); the user can type instead.
    }
  };

  const handleRemoveKey = async () => {
    // Without a built-in key there is nothing left to call Google with.
    const provider = getBuiltInGoogleKey() ? settings.routingProvider : 'osrm';
    setSettings(await updateSettings({ googleApiKey: null, routingProvider: provider }));
    setStatus(null);
  };

  const providerOption = (provider: RoutingProvider, icon: 'map-outline' | 'google-maps') => {
    const selected = settings.routingProvider === provider;
    return (
      <TouchableOpacity
        key={provider}
        style={[
          styles.option,
          { backgroundColor: theme.inputBackground, borderColor: selected ? theme.primary : 'transparent' },
        ]}
        onPress={() => selectProvider(provider)}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={t(`settings.${provider}Title`)}
      >
        <MaterialCommunityIcons name={icon} size={26} color={selected ? theme.primary : theme.textSecondary} />
        <View style={styles.optionText}>
          <ThemedText style={[styles.optionTitle, { color: theme.text }]}>{t(`settings.${provider}Title`)}</ThemedText>
          <ThemedText style={[styles.optionDesc, { color: theme.textSecondary }]}>
            {t(`settings.${provider}Desc`)}
          </ThemedText>
        </View>
        <MaterialCommunityIcons
          name={selected ? 'radiobox-marked' : 'radiobox-blank'}
          size={22}
          color={selected ? theme.primary : theme.textMuted}
        />
      </TouchableOpacity>
    );
  };

  const keyStatusText =
    keySource === 'user'
      ? t('settings.keyUsingUser', { key: maskKey(currentKey) })
      : keySource === 'builtIn'
        ? t('settings.keyUsingBuiltIn', { key: maskKey(currentKey) })
        : t('settings.keyNone');

  const canSave = keyInput.trim().length > 0 && busy === null;
  const showFormatHint = keyInput.trim().length > 0 && !looksLikeGoogleKey(keyInput);
  // The guide starts open when there is no key at all.
  const isGuideOpen = guideOpen ?? keySource === 'none';

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <ThemedText type="title">{t('settings.title')}</ThemedText>
            <LanguagePicker />
          </View>

          {/* Route provider */}
          <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }, Shadows.sm]}>
            <ThemedText type="subtitle">{t('settings.providerSection')}</ThemedText>
            <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>{t('settings.providerHint')}</ThemedText>
            <View accessibilityRole="radiogroup" style={styles.options}>
              {providerOption('google', 'google-maps')}
              {providerOption('osrm', 'map-outline')}
            </View>
          </View>

          {/* Google key */}
          <View
            style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }, Shadows.sm]}
            onLayout={(e) => {
              keyCardY.current = e.nativeEvent.layout.y;
            }}
          >
            <ThemedText type="subtitle">{t('settings.keySection')}</ThemedText>

            <View style={styles.keyStatusRow}>
              <MaterialCommunityIcons
                name={keySource === 'none' ? 'key-remove' : 'key-variant'}
                size={18}
                color={keySource === 'none' ? theme.textMuted : theme.success}
              />
              <ThemedText style={[styles.keyStatus, { color: theme.text }]}>{keyStatusText}</ThemedText>
            </View>

            {/* How to get a key */}
            <View style={[styles.guide, { borderColor: theme.border }]}>
              <TouchableOpacity
                style={styles.guideHeader}
                onPress={() => setGuideOpen(!isGuideOpen)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isGuideOpen }}
                accessibilityLabel={t('settings.guideTitle')}
              >
                <MaterialCommunityIcons name="help-circle-outline" size={18} color={theme.secondary} />
                <ThemedText style={[styles.guideTitle, { color: theme.secondary }]}>{t('settings.guideTitle')}</ThemedText>
                <MaterialCommunityIcons
                  name={isGuideOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.secondary}
                />
              </TouchableOpacity>
              {isGuideOpen && (
                <View style={styles.guideBody}>
                  {(['settings.guideStep1', 'settings.guideStep2', 'settings.guideStep3'] as const).map((key, i) => (
                    <View key={key} style={styles.guideStep}>
                      <View style={[styles.stepNumber, { backgroundColor: theme.accentSoft }]}>
                        <ThemedText style={[styles.stepNumberText, { color: theme.warning }]}>{i + 1}</ThemedText>
                      </View>
                      <ThemedText style={[styles.guideText, { color: theme.text }]}>{t(key)}</ThemedText>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[styles.consoleButton, { backgroundColor: theme.inputBackground }]}
                    onPress={() => Linking.openURL(CONSOLE_URL)}
                    accessibilityRole="link"
                    accessibilityLabel={t('settings.openConsole')}
                  >
                    <MaterialCommunityIcons name="open-in-new" size={18} color={theme.text} />
                    <ThemedText style={[styles.consoleButtonText, { color: theme.text }]}>
                      {t('settings.openConsole')}
                    </ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={[styles.hint, { color: theme.textMuted }]}>{t('settings.restrictTip')}</ThemedText>
                </View>
              )}
            </View>

            <View style={[styles.inputRow, { backgroundColor: theme.inputBackground }]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: theme.text }]}
                value={keyInput}
                onChangeText={(text) => {
                  setKeyInput(text);
                  setStatus(null);
                }}
                placeholder={t('settings.keyPlaceholder')}
                placeholderTextColor={theme.placeholder}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                returnKeyType="done"
                onSubmitEditing={handleTestAndSave}
                accessibilityLabel={t('settings.keyInputA11y')}
              />
              <TouchableOpacity
                onPress={handlePaste}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('settings.pasteA11y')}
              >
                <MaterialCommunityIcons name="content-paste" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowKey((v) => !v)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t(showKey ? 'settings.hideKeyA11y' : 'settings.showKeyA11y')}
              >
                <MaterialCommunityIcons
                  name={showKey ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {showFormatHint && (
              <ThemedText style={[styles.hint, { color: theme.warning }]}>{t('settings.keyFormatHint')}</ThemedText>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: canSave ? theme.primary : theme.inputBackground }]}
                onPress={handleTestAndSave}
                disabled={!canSave}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSave, busy: busy === 'save' }}
                accessibilityLabel={t('settings.testAndSave')}
              >
                {busy === 'save' ? (
                  <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                  <ThemedText style={[styles.buttonText, { color: canSave ? theme.onPrimary : theme.textMuted }]}>
                    {t('settings.testAndSave')}
                  </ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.inputBackground }]}
                onPress={handleTestCurrent}
                disabled={!currentKey || busy !== null}
                accessibilityRole="button"
                accessibilityState={{ disabled: !currentKey || busy !== null, busy: busy === 'test' }}
                accessibilityLabel={t('settings.testCurrent')}
              >
                {busy === 'test' ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <ThemedText style={[styles.buttonText, { color: currentKey ? theme.text : theme.textMuted }]}>
                    {t('settings.testCurrent')}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>

            {status && (
              <View style={styles.statusRow} accessibilityLiveRegion="polite">
                <MaterialCommunityIcons
                  name={status.kind === 'ok' ? 'check-circle' : 'alert-circle'}
                  size={18}
                  color={status.kind === 'ok' ? theme.success : theme.danger}
                />
                <ThemedText
                  style={[styles.statusText, { color: status.kind === 'ok' ? theme.success : theme.danger }]}
                >
                  {status.text}
                </ThemedText>
              </View>
            )}

            {keySource === 'user' && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemoveKey}
                accessibilityRole="button"
                accessibilityLabel={t('settings.removeKey')}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.danger} />
                <ThemedText style={[styles.removeText, { color: theme.danger }]}>{t('settings.removeKey')}</ThemedText>
              </TouchableOpacity>
            )}

            <View style={[styles.note, { backgroundColor: theme.accentSoft }]}>
              <MaterialCommunityIcons name="information-outline" size={18} color={theme.warning} />
              <ThemedText style={[styles.noteText, { color: theme.text }]}>{t('settings.keyFallbackNote')}</ThemedText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl + Spacing.xl,
    gap: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  options: {
    gap: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 2,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  keyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  keyStatus: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },
  removeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  guide: {
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  guideTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  guideBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  guideStep: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  guideText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  consoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  consoleButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
