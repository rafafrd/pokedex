import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

export interface HealthBarProps {
  name: string;
  currentHp: number;
  maxHp: number;
  label?: string;
}

function clampPercentage(currentHp: number, maxHp: number): number {
  if (!Number.isFinite(currentHp) || !Number.isFinite(maxHp) || maxHp <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (currentHp / maxHp) * 100));
}

export function HealthBar({ name, currentHp, maxHp, label = "PV" }: HealthBarProps) {
  const percentage = clampPercentage(currentHp, maxHp);
  const fillColor = percentage <= 20 ? colors.commandRed : percentage <= 50 ? "#D99A18" : "#3C9B63";
  const safeMax = Number.isFinite(maxHp) ? Math.max(0, maxHp) : 0;
  const safeCurrent = Number.isFinite(currentHp) ? Math.max(0, Math.min(currentHp, safeMax)) : 0;
  const fillProgress = useRef(new Animated.Value(percentage)).current;

  useEffect(() => {
    const animation = Animated.timing(fillProgress, {
      toValue: percentage,
      duration: 420,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [fillProgress, percentage]);

  const fillWidth = fillProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hpText}>{Math.round(safeCurrent)} / {Math.round(safeMax)}</Text>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${name} pontos de vida`}
        accessibilityValue={{ min: 0, max: safeMax, now: safeCurrent, text: `${Math.round(safeCurrent)} de ${Math.round(safeMax)} pontos de vida` }}
        style={styles.track}
      >
        <Animated.View style={[styles.fill, { width: fillWidth, backgroundColor: fillColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
    width: "100%",
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    ...typography.overline,
    color: colors.textSecondary,
    fontSize: 10,
  },
  hpText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  track: {
    backgroundColor: "rgba(16, 42, 67, 0.14)",
    borderRadius: radius.pill,
    height: 11,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    borderRadius: radius.pill,
    height: "100%",
    minWidth: 0,
  },
});
