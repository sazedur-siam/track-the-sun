import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { DepartureSlot, DepartureWindow } from '@/src/services/departurePlanner';
import { SunAvoidance } from '@/src/types';
import { formatClock } from '@/src/utils/time';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

interface DepartureChartProps {
  slots: DepartureSlot[];
  best: DepartureWindow | null;
  current: Date;
  mode: SunAvoidance;
  onSelect: (departure: Date) => void;
}

const CHART_HEIGHT = 96;
const MIN_BAR = 4;

/** Bar chart of sun on the sunnier side for each possible departure time. */
export default function DepartureChart({ slots, best, current, mode, onSelect }: DepartureChartProps) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();

  if (slots.length === 0) return null;

  const inBest = (s: DepartureSlot) =>
    !!best &&
    s.hasSun &&
    s.departure.getTime() >= best.start.getTime() &&
    s.departure.getTime() <= best.end.getTime();
  const isCurrent = (s: DepartureSlot) => s.departure.getTime() === current.getTime();

  const seek = mode === 'seek';
  const headline = !best
    ? t('best.noSun')
    : best.start.getTime() === best.end.getTime()
      ? t(seek ? 'best.sunniestAt' : 'best.shadiestAt', { time: formatClock(best.start) })
      : t(seek ? 'best.sunniest' : 'best.shadiest', {
          start: formatClock(best.start),
          end: formatClock(best.end),
        });

  const middle = slots[Math.floor(slots.length / 2)];

  return (
    <View>
      <View style={[styles.headline, { backgroundColor: best ? theme.accentSoft : theme.inputBackground }]}>
        <MaterialCommunityIcons
          name={best ? 'clock-check-outline' : 'weather-night'}
          size={20}
          color={best ? theme.warning : theme.textSecondary}
        />
        <ThemedText style={[styles.headlineText, { color: theme.text }]}>{headline}</ThemedText>
      </View>

      <View style={styles.chart}>
        {slots.map((s) => {
          const height = s.hasSun ? MIN_BAR + ((CHART_HEIGHT - MIN_BAR) * s.score) / 100 : MIN_BAR;
          const color = !s.hasSun ? theme.border : inBest(s) ? theme.success : theme.primary;
          const current = isCurrent(s);
          return (
            <Pressable
              key={s.departure.getTime()}
              style={styles.slot}
              onPress={() => {
                if (current) return;
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                onSelect(s.departure);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: current }}
              accessibilityLabel={
                s.hasSun
                  ? t('best.slotA11y', { time: formatClock(s.departure), score: s.score })
                  : t('best.slotNightA11y', { time: formatClock(s.departure) })
              }
              hitSlop={{ top: 8, bottom: 8 }}
            >
              <View
                style={[
                  styles.bar,
                  { height, backgroundColor: color, opacity: inBest(s) || current ? 1 : 0.55 },
                  current && { borderWidth: 2, borderColor: theme.text },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.axis}>
        <ThemedText style={[styles.axisText, { color: theme.textMuted }]}>{formatClock(slots[0].departure)}</ThemedText>
        <ThemedText style={[styles.axisText, { color: theme.textMuted }]}>{formatClock(middle.departure)}</ThemedText>
        <ThemedText style={[styles.axisText, { color: theme.textMuted }]}>
          {formatClock(slots[slots.length - 1].departure)}
        </ThemedText>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: theme.success }]} />
          <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>{t('best.best')}</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.text }]} />
          <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>{t('best.current')}</ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.footnote, { color: theme.textMuted }]}>
        {t('best.hint')} {t('best.footnote')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  headlineText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  chart: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  slot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  axisText: {
    fontSize: 12,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
