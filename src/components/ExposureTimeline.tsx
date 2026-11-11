import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { Side } from '@/src/services/sunCalcService';
import { sideRuns, TimelineRun } from '@/src/services/timeline';
import { sideColor } from '@/src/utils/sideColors';
import { formatClock } from '@/src/utils/time';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ExposureTimelineProps {
  runs: TimelineRun[];
}

const LEGEND: Side[] = ['left', 'right', 'neutral'];

/** Horizontal bar of the trip, coloured by which side the sun is on. */
export default function ExposureTimeline({ runs }: ExposureTimelineProps) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();

  if (runs.length === 0) return null;

  const start = runs[0].start;
  const end = runs[runs.length - 1].end;
  const total = end.getTime() - start.getTime();
  const middle = new Date(start.getTime() + total / 2);
  const listed = sideRuns(runs).slice(0, 6);

  const label = (side: Side) => t(`timeline.${side}`);
  const a11ySummary = listed
    .map((run) => `${formatClock(run.start)}–${formatClock(run.end)}: ${label(run.side)}`)
    .join('. ');

  return (
    <View accessible accessibilityLabel={`${t('timeline.a11y')}. ${a11ySummary}`}>
      <View style={[styles.bar, { backgroundColor: theme.inputBackground }]}>
        {runs.map((run, i) => (
          <View
            key={`${run.start.getTime()}-${i}`}
            style={{
              flex: Math.max(run.end.getTime() - run.start.getTime(), 1),
              backgroundColor: sideColor(theme, run.side),
            }}
          />
        ))}
      </View>

      <View style={styles.ticks}>
        <ThemedText style={[styles.tick, { color: theme.textMuted }]}>{formatClock(start)}</ThemedText>
        <ThemedText style={[styles.tick, { color: theme.textMuted }]}>{formatClock(middle)}</ThemedText>
        <ThemedText style={[styles.tick, { color: theme.textMuted }]}>{formatClock(end)}</ThemedText>
      </View>

      <View style={styles.legend}>
        {LEGEND.map((side) => (
          <View key={side} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: sideColor(theme, side) }]} />
            <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>{label(side)}</ThemedText>
          </View>
        ))}
      </View>

      {listed.length > 0 && (
        <View style={[styles.list, { borderTopColor: theme.separator }]}>
          {listed.map((run, i) => (
            <View key={`${run.start.getTime()}-${i}`} style={styles.listRow}>
              <View style={[styles.dot, { backgroundColor: sideColor(theme, run.side) }]} />
              <ThemedText style={[styles.listTime, { color: theme.text }]}>
                {formatClock(run.start)}–{formatClock(run.end)}
              </ThemedText>
              <ThemedText style={[styles.listLabel, { color: theme.textSecondary }]}>{label(run.side)}</ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  tick: {
    fontSize: 12,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  list: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  listTime: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  listLabel: {
    flex: 1,
    fontSize: 14,
  },
});
