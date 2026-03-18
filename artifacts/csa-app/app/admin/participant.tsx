import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { EIXOS, SPECTATOR_LABELS, useEvent } from "@/contexts/EventContext";

const C = Colors.light;

export default function ParticipantDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { participants } = useEvent();

  const p = participants.find((x) => x.id === id);

  if (!p) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.topTitle}>Participante</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.notFoundText}>Participante não encontrado.</Text>
        </View>
      </View>
    );
  }

  const qrJson = p.qrData
    ? JSON.parse(p.qrData)
    : null;

  const statusColor = p.status === "aprovado" ? C.tint : p.status === "pendente" ? "#F59E0B" : C.error;
  const statusBg = p.status === "aprovado" ? "#F0FDF4" : p.status === "pendente" ? "#FFFBEB" : "#FEF2F2";
  const statusLabel = { aprovado: "Aprovado", pendente: "Pendente", rejeitado: "Rejeitado" }[p.status];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>Ficha do Participante</Text>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{p.nomeCompleto.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{p.nomeCompleto}</Text>
          <Text style={styles.username}>@{p.username}</Text>
          <Text style={styles.email}>{p.email}</Text>
        </View>

        {p.status === "aprovado" && p.qrData && (
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>Credencial de Acesso — QR Code</Text>
            <View style={styles.qrCard}>
              <View style={styles.qrWrap}>
                <QRCode
                  value={p.qrData}
                  size={200}
                  color={C.navy}
                  backgroundColor="#fff"
                />
              </View>
              <View style={styles.qrInfo}>
                <Text style={styles.qrEventName}>Congresso de Alimento 2026</Text>
                <Text style={styles.qrParticipantName}>{p.nomeCompleto}</Text>
                <View style={styles.qrBadgeRow}>
                  <View style={styles.qrBadge}>
                    <Text style={styles.qrBadgeText}>{SPECTATOR_LABELS[p.spectatorType]}</Text>
                  </View>
                  <View style={[styles.qrBadge, { backgroundColor: C.navy }]}>
                    <Text style={styles.qrBadgeText}>{p.origemTipo}</Text>
                  </View>
                </View>
                <Text style={styles.qrEixo}>Eixo {p.eixo}: {EIXOS[p.eixo]}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Nome Completo" value={p.nomeCompleto} />
            <Sep />
            <InfoRow label="Nome de Usuário" value={`@${p.username}`} />
            <Sep />
            <InfoRow label="Email" value={p.email} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil Académico</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Nível Académico" value={p.nivelAcademico} />
            <Sep />
            <InfoRow label="Origem Institucional" value={p.origemInstitucional} />
            <Sep />
            <InfoRow label="Tipo de Origem" value={p.origemTipo} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participação no Congresso</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Tipo de Participante" value={SPECTATOR_LABELS[p.spectatorType]} />
            <Sep />
            <InfoRow label="Eixo Temático" value={`Eixo ${p.eixo} — ${EIXOS[p.eixo]}`} />
            <Sep />
            <InfoRow label="Tarifário" value={`${p.tarifa.toLocaleString()} Kz`} highlight />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Registo</Text>
          <View style={styles.infoCard}>
            <InfoRow label="ID do Registo" value={p.id} mono />
            <Sep />
            <InfoRow label="Data de Registo" value={new Date(p.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
            <Sep />
            <InfoRow label="Última Actualização" value={new Date(p.updatedAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Sep() {
  return <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 16 }} />;
}

function InfoRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          highlight && { color: C.tint, fontFamily: "Inter_700Bold" },
          mono && { fontFamily: "Inter_400Regular", fontSize: 10, color: C.textMuted },
        ]}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.backgroundSecondary },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16, fontFamily: "Inter_400Regular", color: C.textSecondary },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border, gap: 8 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 30, color: C.tint, lineHeight: 36 },
  topTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_700Bold", color: C.text },
  statusPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  content: { padding: 16, gap: 16 },
  identityCard: { backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center", gap: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarText: { fontSize: 30, fontFamily: "Inter_700Bold", color: "#fff" },
  name: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  username: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.tint },
  email: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  qrSection: { gap: 10 },
  qrCard: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  qrWrap: { alignItems: "center", backgroundColor: "#F8FAFC", padding: 24, borderBottomWidth: 1, borderBottomColor: C.border },
  qrInfo: { padding: 16, gap: 8 },
  qrEventName: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8 },
  qrParticipantName: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  qrBadgeRow: { flexDirection: "row", gap: 8 },
  qrBadge: { backgroundColor: C.tint, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  qrBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  qrEixo: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.text, textTransform: "uppercase", letterSpacing: 0.8, marginLeft: 4 },
  infoCard: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, flexShrink: 0 },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text, textAlign: "right", flex: 1 },
});
