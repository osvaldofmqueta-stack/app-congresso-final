import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { ROLE_PERMISSIONS, useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/contexts/EventContext";

const C = Colors.light;

const ROLE_LABELS: Record<string, string> = {
  ceo: "CEO — Director Geral",
  supervisor: "Supervisor de Eventos",
  conselho: "Conselho Científico",
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  ceo: { bg: "#FEF3C7", text: "#92400E" },
  supervisor: { bg: "#DBEAFE", text: "#1E40AF" },
  conselho: { bg: "#F3E8FF", text: "#6B21A8" },
};

type PermItem = {
  label: string;
  allowed: boolean;
};

function getPermissions(role: string | null): PermItem[] {
  const key = role ?? "participant";
  const p = ROLE_PERMISSIONS[key] ?? ROLE_PERMISSIONS["participant"];
  return [
    { label: "Gerir participantes", allowed: p.canManageParticipants },
    { label: "Eliminar participantes", allowed: p.canDeleteParticipants },
    { label: "Gerir senhas", allowed: p.canManagePasswords },
    { label: "Gerir programa", allowed: p.canManageProgram },
    { label: "Marcar presenças", allowed: p.canMarkPresence },
    { label: "Ver apresentações", allowed: p.canViewSubmissions },
    { label: "Aprovar / rejeitar apresentações", allowed: p.canApproveSubmissions },
    { label: "Enviar mensagens a participantes", allowed: p.canMessageParticipants },
    { label: "Dashboard de evento", allowed: p.canViewDashboard },
  ];
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateAvatar, updateAdminPassword, permissions, biometricEnabled, toggleBiometric } = useAuth();
  const { changeParticipantPassword, participants } = useEvent();

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [showPwdSection, setShowPwdSection] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [bioType, setBioType] = useState<"fingerprint" | "face" | "iris" | null>(null);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        setBiometricAvailable(true);
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBioType("face");
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBioType("iris");
        } else {
          setBioType("fingerprint");
        }
      }
    })();
  }, []);

  async function handleToggleBiometric(value: boolean) {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirme a sua identidade para activar a biometria",
        cancelLabel: "Cancelar",
        fallbackLabel: "Usar senha",
      });
      if (!result.success) return;
    }
    await toggleBiometric(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const isAdmin = user?.role === "ceo" || user?.role === "supervisor";
  const isConselho = user?.role === "conselho";
  const isParticipant = user?.role === null;

  const participant = isParticipant
    ? participants.find((p) => p.id === user?.participantId)
    : null;

  const roleKey = user?.role ?? null;
  const roleLabel = roleKey ? ROLE_LABELS[roleKey] : "Participante";
  const roleStyle = roleKey ? ROLE_COLORS[roleKey] : { bg: "#F0FDF4", text: "#166534" };
  const perms = getPermissions(roleKey);

  const initials = (user?.name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  async function handlePickAvatar() {
    setPickingAvatar(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Permita acesso à galeria nas definições do dispositivo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        await updateAvatar(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setPickingAvatar(false);
    }
  }

  async function handleChangePassword() {
    setPwdError("");
    setPwdSuccess(false);
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError("Preencha todos os campos.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("As novas senhas não coincidem.");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setChangingPwd(true);
    try {
      let result: { success: boolean; error?: string };
      if (isParticipant && user?.participantId) {
        result = await changeParticipantPassword(user.participantId, currentPwd, newPwd);
      } else {
        result = await updateAdminPassword(currentPwd, newPwd);
      }
      if (result.success) {
        setPwdSuccess(true);
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setPwdSuccess(false), 3000);
      } else {
        setPwdError(result.error ?? "Erro ao alterar senha.");
      }
    } finally {
      setChangingPwd(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickAvatar} disabled={pickingAvatar} style={styles.avatarWrapper}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>✎</Text>
            </View>
          </Pressable>
          <Text style={styles.avatarName}>{user?.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
            <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>{roleLabel}</Text>
          </View>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        {/* Participant Info */}
        {isParticipant && participant && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            <InfoRow label="Nome completo" value={participant.nomeCompleto} />
            <InfoRow label="Email" value={participant.email} />
            <InfoRow label="Instituição" value={participant.instituicao} />
            <InfoRow label="Telefone" value={participant.telefone} />
            <InfoRow label="Categoria" value={participant.categoria} />
            <InfoRow
              label="Estado da inscrição"
              value={
                participant.status === "aprovado"
                  ? "Aprovado ✓"
                  : participant.status === "rejeitado"
                  ? "Rejeitado ✕"
                  : "Pendente de aprovação"
              }
              valueColor={
                participant.status === "aprovado"
                  ? "#16A34A"
                  : participant.status === "rejeitado"
                  ? "#DC2626"
                  : "#B45309"
              }
            />
          </View>
        )}

        {/* Admin Info */}
        {(isAdmin || isConselho) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações da Conta</Text>
            <InfoRow label="Email" value={user?.email ?? ""} />
            <InfoRow label="Nível de acesso" value={roleLabel} />
          </View>
        )}

        {/* Biometric Authentication */}
        {biometricAvailable && (
          <View style={styles.section}>
            <View style={styles.bioRow}>
              <View style={styles.bioIconWrap}>
                <Text style={styles.bioIcon}>
                  {bioType === "face" ? "🪪" : bioType === "iris" ? "👁" : "🫆"}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.sectionTitle}>
                  {bioType === "face"
                    ? "Reconhecimento Facial"
                    : bioType === "iris"
                    ? "Reconhecimento de Íris"
                    : "Impressão Digital"}
                </Text>
                <Text style={styles.bioSubtitle}>
                  {biometricEnabled
                    ? "Acesso biométrico activo no login"
                    : "Inactive — ative para entrar sem senha"}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                thumbColor={biometricEnabled ? C.tint : "#9CA3AF"}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
            {biometricEnabled && (
              <View style={styles.bioActiveBanner}>
                <Text style={styles.bioActiveBannerText}>
                  ✓ A biometria está activa. No próximo login poderá entrar sem digitar a senha.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Change Password */}
        <View style={styles.section}>
          <Pressable
            onPress={() => {
              setShowPwdSection((v) => !v);
              setPwdError("");
              setPwdSuccess(false);
            }}
            style={styles.sectionHeader}
          >
            <Text style={styles.sectionTitle}>Alterar Senha</Text>
            <Text style={styles.sectionToggle}>{showPwdSection ? "▲" : "▼"}</Text>
          </Pressable>

          {showPwdSection && (
            <View style={{ gap: 12, marginTop: 8 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senha actual</Text>
                <TextInput
                  style={styles.input}
                  value={currentPwd}
                  onChangeText={setCurrentPwd}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={C.textMuted}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nova senha</Text>
                <TextInput
                  style={styles.input}
                  value={newPwd}
                  onChangeText={setNewPwd}
                  secureTextEntry
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={C.textMuted}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirmar nova senha</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPwd}
                  onChangeText={setConfirmPwd}
                  secureTextEntry
                  placeholder="Repita a nova senha"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              {pwdError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{pwdError}</Text>
                </View>
              ) : null}

              {pwdSuccess ? (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>Senha alterada com sucesso! ✓</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.saveBtn, changingPwd && { opacity: 0.6 }]}
                onPress={handleChangePassword}
                disabled={changingPwd}
              >
                <Text style={styles.saveBtnText}>
                  {changingPwd ? "A alterar..." : "Guardar Nova Senha"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissões de Acesso</Text>
          <Text style={styles.permSubtitle}>
            O que pode fazer com este nível de acesso:
          </Text>
          <View style={styles.permList}>
            {perms.map((p) => (
              <View key={p.label} style={styles.permRow}>
                <View style={[styles.permDot, { backgroundColor: p.allowed ? "#22C55E" : "#E5E7EB" }]}>
                  <Text style={styles.permDotIcon}>{p.allowed ? "✓" : "✕"}</Text>
                </View>
                <Text style={[styles.permLabel, !p.allowed && { color: C.textMuted }]}>
                  {p.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor, fontFamily: "Inter_600SemiBold" } : null]}>
        {value || "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.backgroundSecondary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, width: 70 },
  backArrow: { fontSize: 28, color: C.tint, lineHeight: 30, marginTop: -2 },
  backText: { fontSize: 15, fontFamily: "Inter_500Medium", color: C.tint },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.text },
  content: { padding: 16, gap: 16 },
  avatarSection: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrapper: { position: "relative" },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: C.tint },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.tint,
  },
  avatarInitials: { fontSize: 34, fontFamily: "Inter_700Bold", color: "#fff" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarEditIcon: { fontSize: 14, color: "#fff" },
  avatarName: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text, textAlign: "center" },
  roleBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  roleBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emailText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text },
  sectionToggle: { fontSize: 12, color: C.textSecondary },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 10,
  },
  infoLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary, flex: 1 },
  infoValue: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.text, flex: 1.5, textAlign: "right" },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.4 },
  input: {
    height: 46,
    backgroundColor: C.inputBackground,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  errorBanner: { backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12 },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#DC2626" },
  successBanner: { backgroundColor: "#F0FDF4", borderRadius: 10, padding: 12 },
  successText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#16A34A" },
  saveBtn: {
    height: 48,
    backgroundColor: C.tint,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  permSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  permList: { gap: 8, marginTop: 4 },
  permRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  permDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  permDotIcon: { fontSize: 11, color: "#fff", fontFamily: "Inter_700Bold" },
  permLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.text, flex: 1 },
  bioRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bioIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.navy + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  bioIcon: { fontSize: 24 },
  bioSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  bioActiveBanner: {
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#22C55E",
  },
  bioActiveBannerText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#166534" },
});
