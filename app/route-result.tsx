import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import RouteResultScreen from '@/src/screens/RouteResultScreen';
import { Stack } from 'expo-router';

export default function RouteResult() {
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen
        options={{
          title: t('result.headerTitle'),
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }}
      />
      <RouteResultScreen />
    </>
  );
}
