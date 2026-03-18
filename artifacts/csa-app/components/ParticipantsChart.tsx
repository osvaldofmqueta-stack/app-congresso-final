import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import Colors from "@/constants/colors";
import { Participant, SPECTATOR_LABELS, SpectatorType } from "@/contexts/EventContext";

const C = Colors.light;

const DONUT_RADIUS = 70;
const STROKE_WIDTH = 22;
const CENTER = DONUT_RADIUS + STROKE_WIDTH / 2 + 4;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function DonutSlice({
  color,
  percentage,
  offset,
  total,
}: {
  color: string;
  percentage: number;
  offset: number;
  total: number;
}) {
  const dash = (percentage / 100) * CIRCUMFERENCE;
  const gap = CIRCUMFERENCE - dash;
  return (
    <Circle
      cx={CENTER}
      cy={CENTER}
      r={DONUT_RADIUS}
      fill="none"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      strokeDasharray={`${dash} ${gap}`}
      strokeDashoffset={-offset}
      strokeLinecap="round"
    />
  );
}

function AnimatedBar({
  value,
  total,
  color,
  label,
  count,
  delay = 0,
}: {
  value: number;
  total: number;
  color: string;
  label: string;
  count: number;
  delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = total > 0 ? value / total : 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 700,
      delay,
      useNativeDriver: false,
    }).start();
  }, [value, total]);

  const pctLabel = total > 0 ? Math.round(pct * 100) : 0;
  const barWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", `${Math.max(pctLabel, 0)}%`],
  });

  return (
    <View style={barStyles.row}>
      <View style={barStyles.labelRow}>
        <View style={[barStyles.dot, { backgroundColor: color }]} />
        <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
        <Text style={barStyles.count}>{count}</Text>
        <Text style={barStyles.pct}>{pctLabel}%</Text>
      </View>
      <View style={barStyles.track}>
        <Animated.View
          style={[
            barStyles.fill,
            {
              backgroundColor: color,
              width: barWidth,
            },
          ]}
        />
      </View>
    </View>
  );
}

type Props = {
  participants: Participant[];
};

export function ParticipantsChart({ participants }: Props) {
  const total = participants.length;
  const urnm = participants.filter((p) => p.origemTipo === "URNM").length;
  const externo = participants.filter((p) => p.origemTipo === "Externo").length;

  const pctUrnm = total > 0 ? (urnm / total) * 100 : 0;
  const pctExterno = total > 0 ? (externo / total) * 100 : 0;

  const statusData = [
    { label: "Aprovados", count: participants.filter((p) => p.status === "aprovado").length, color: "#16A34A" },
    { label: "Pendentes", count: participants.filter((p) => p.status === "pendente").length, color: "#F59E0B" },
    { label: "Rejeitados", count: participants.filter((p) => p.status === "rejeitado").length, color: "#EF4444" },
  ];

  const categories: { key: SpectatorType; color: string }[] = [
    { key: "docente_investigador", color: "#6366F1" },
    { key: "estudante", color: "#0EA5E9" },
    { key: "outro", color: "#8B5CF6" },
    { key: "prelector", color: "#F97316" },
  ];

  const svgSize = CENTER * 2;

  const gapDeg = 4;
  const gap = (gapDeg / 360) * CIRCUMFERENCE;

  const adjustedUrnm = pctUrnm > 0 ? Math.max(0, (pctUrnm / 100) * CIRCUMFERENCE - gap) : 0;
  const adjustedExterno = pctExterno > 0 ? Math.max(0, (pctExterno / 100) * CIRCUMFERENCE - gap) : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Visão Geral de Participantes</Text>

      <View style={styles.donutSection}>
        <View style={styles.donutWrap}>
          <Svg width={svgSize} height={svgSize}>
            <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
              {total === 0 ? (
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth={STROKE_WIDTH}
                />
              ) : (
                <>
                  {pctUrnm > 0 && (
                    <Circle
                      cx={CENTER}
                      cy={CENTER}
                      r={DONUT_RADIUS}
                      fill="none"
                      stroke={C.tint}
                      strokeWidth={STROKE_WIDTH}
                      strokeDasharray={`${adjustedUrnm} ${CIRCUMFERENCE - adjustedUrnm}`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                    />
                  )}
                  {pctExterno > 0 && (
                    <Circle
                      cx={CENTER}
                      cy={CENTER}
                      r={DONUT_RADIUS}
                      fill="none"
                      stroke={C.navy}
                      strokeWidth={STROKE_WIDTH}
                      strokeDasharray={`${adjustedExterno} ${CIRCUMFERENCE - adjustedExterno}`}
                      strokeDashoffset={-(adjustedUrnm + gap)}
                      strokeLinecap="round"
                    />
                  )}
                </>
              )}
            </G>
          </Svg>
          <View style={styles.donutCenter}>
            <Text style={styles.donutTotal}>{total}</Text>
            <Text style={styles.donutLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.legendCol}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.tint }]} />
            <View>
              <Text style={styles.legendValue}>{urnm}</Text>
              <Text style={styles.legendKey}>URNM</Text>
            </View>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.navy }]} />
            <View>
              <Text style={styles.legendValue}>{externo}</Text>
              <Text style={styles.legendKey}>Externo</Text>
            </View>
          </View>
          <View style={styles.legendDivider} />
          {statusData.map((s) => (
            <View key={s.label} style={styles.legendItemSmall}>
              <View style={[styles.legendDotSm, { backgroundColor: s.color }]} />
              <Text style={styles.legendSm}>{s.label}: <Text style={{ fontFamily: "Inter_700Bold", color: s.color }}>{s.count}</Text></Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.barsSection}>
        <Text style={styles.barsSectionTitle}>Por Origem</Text>
        <AnimatedBar value={urnm} total={total} color={C.tint} label="URNM" count={urnm} delay={0} />
        <AnimatedBar value={externo} total={total} color={C.navy} label="Externo" count={externo} delay={80} />
      </View>

      <View style={styles.barsSection}>
        <Text style={styles.barsSectionTitle}>Por Estado</Text>
        {statusData.map((s, i) => (
          <AnimatedBar key={s.label} value={s.count} total={total} color={s.color} label={s.label} count={s.count} delay={i * 80} />
        ))}
      </View>

      <View style={styles.barsSection}>
        <Text style={styles.barsSectionTitle}>Por Categoria</Text>
        {categories.map((cat, i) => {
          const count = participants.filter((p) => p.spectatorType === cat.key).length;
          return (
            <AnimatedBar
              key={cat.key}
              value={count}
              total={total}
              color={cat.color}
              label={SPECTATOR_LABELS[cat.key]}
              count={count}
              delay={i * 80}
            />
          );
        })}
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { gap: 5, marginBottom: 4 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  count: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.text },
  pct: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.textMuted, width: 32, textAlign: "right" },
  track: { height: 8, backgroundColor: C.backgroundTertiary, borderRadius: 6, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 6 },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    gap: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: -0.2,
  },
  donutSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  donutWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  donutTotal: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: C.text,
    lineHeight: 32,
  },
  donutLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  legendCol: {
    flex: 1,
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: C.text,
    lineHeight: 22,
  },
  legendKey: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  legendDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 2,
  },
  legendItemSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDotSm: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendSm: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  barsSection: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 14,
  },
  barsSectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
});
