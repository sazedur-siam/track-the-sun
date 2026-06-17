import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AnimatedProgressCircle } from '@/src/components/AnimatedProgressCircle';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { Side } from '@/src/services/sunCalcService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface BusDiagramProps {
  leftPercentage: number;
  rightPercentage: number;
  recommendation: Side;
  /** Side the sun is predominantly on. */
  sunnySide?: Side;
  /** Compass direction the sunny side faces, e.g. "W". */
  sunnySideCompass?: string | null;
}

const CIRCLE_SIZE = 56;
const COLUMN_WIDTH = CIRCLE_SIZE * 2; // matches AnimatedProgressCircle's wrapper box
const BUS_WIDTH = 58;
const HOT_COLOR = '#EF4444';
const COLD_COLOR = '#0891B2';

export default function BusDiagram({
  leftPercentage,
  rightPercentage,
  recommendation,
  sunnySide,
  sunnySideCompass,
}: BusDiagramProps) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();

  const leftHot = leftPercentage > rightPercentage;
  const rightHot = rightPercentage > leftPercentage;

  const compassSuffix = (side: Side) =>
    sunnySide === side && sunnySideCompass ? ` (${t(`compassShort.${sunnySideCompass}`)})` : '';

  const renderLabel = (side: 'left' | 'right', hot: boolean) => {
    const cold = !hot && leftPercentage !== rightPercentage;
    const color = hot ? HOT_COLOR : cold ? COLD_COLOR : theme.textSecondary;
    return (
      <ThemedText style={[styles.sideLabel, { color }]}>
        {hot ? '🔥 ' : cold ? '❄️ ' : ''}
        {t(`diagram.${side}`)}
        {compassSuffix(side)}
      </ThemedText>
    );
  };

  const renderBadge = (side: Side) =>
    recommendation === side ? (
      <View style={[styles.seatBadge, { backgroundColor: theme.success }]}>
        <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
        <ThemedText style={styles.seatBadgeText}>{t('diagram.sitHere')}</ThemedText>
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      {/* Travel-direction hint so "left" / "right" is unambiguous */}
      <View style={styles.frontHint}>
        <MaterialCommunityIcons name="chevron-up" size={18} color={theme.textMuted} />
        <ThemedText style={[styles.frontText, { color: theme.textMuted }]}>{t('diagram.front')}</ThemedText>
      </View>

      {/* Circles + bus, all aligned on one center line */}
      <View style={styles.diagramRow}>
        <View style={styles.circleSlot}>
          <AnimatedProgressCircle
            percentage={leftPercentage}
            color={theme.primary}
            textColor={theme.onPrimary}
            label=""
            delay={100}
            size={CIRCLE_SIZE}
            isHot={leftHot}
            isCold={!leftHot && leftPercentage !== rightPercentage}
          />
        </View>

        <View style={[styles.busBody, { height: COLUMN_WIDTH }]}>
          <View style={[styles.busFront, { backgroundColor: theme.secondary }]} />
          <View style={[styles.busMiddle, { backgroundColor: theme.secondary }]}>
            <View style={[styles.window, { backgroundColor: 'rgba(255,255,255,0.85)' }]} />
            <View style={[styles.window, { backgroundColor: 'rgba(255,255,255,0.85)' }]} />
            <View style={[styles.window, { backgroundColor: 'rgba(255,255,255,0.85)' }]} />
            <ThemedText style={styles.busEmoji}>🚌</ThemedText>
          </View>
          <View style={[styles.busBack, { backgroundColor: theme.secondary }]} />
        </View>

        <View style={styles.circleSlot}>
          <AnimatedProgressCircle
            percentage={rightPercentage}
            color={theme.secondary}
            textColor={theme.onSecondary}
            label=""
            delay={400}
            size={CIRCLE_SIZE}
            isHot={rightHot}
            isCold={!rightHot && leftPercentage !== rightPercentage}
          />
        </View>
      </View>

      {/* Labels + recommended badge, aligned under each column */}
      <View style={styles.labelsRow}>
        <View style={styles.labelCol}>
          {renderLabel('left', leftHot)}
          {renderBadge('left')}
        </View>
        <View style={styles.busSpacer} />
        <View style={styles.labelCol}>
          {renderLabel('right', rightHot)}
          {renderBadge('right')}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
          <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>{t('diagram.legendSun')}</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
          <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>{t('diagram.legendSeat')}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  frontHint: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  frontText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  diagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSlot: {
    width: COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  labelCol: {
    width: COLUMN_WIDTH,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  busSpacer: {
    width: BUS_WIDTH,
  },
  sideLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  seatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  seatBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  busBody: {
    width: BUS_WIDTH,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  busFront: {
    width: 50,
    height: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  busMiddle: {
    width: 50,
    flex: 1,
    gap: 7,
    paddingVertical: 9,
    alignItems: 'center',
  },
  window: {
    width: 34,
    height: 12,
    borderRadius: 3,
  },
  busBack: {
    width: 50,
    height: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  busEmoji: {
    position: 'absolute',
    top: '52%',
    fontSize: 20,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
  },
});
