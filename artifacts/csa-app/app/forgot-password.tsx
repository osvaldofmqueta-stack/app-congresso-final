import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

import Colors from "@/constants/colors";
import { useEvent } from "@/contexts/EventContext";

const C = Colors.light;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { requestPasswordReset } = useEvent();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit() {
    setEmailError("");
    if (!email.trim()) { setEmailError("Insira o seu email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailError("Email inválido"); return; }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await requestPasswordReset(email.trim().toLowerCase());
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
    } else {
      setEmailError(result.error || "Erro ao processar pedido");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>Recuperar Acesso</Text>
      </View>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <Text style={{ fontSize: 48 }}>🔐</Text>
        </View>

        <View style={styles.textGroup}>
          <Text style={styles.title}>Esqueceu a senha?</Text>
          <Text style={styles.subtitle}>
            Introduza o seu email registado. O CEO irá analisar o seu pedido e redefinir o acesso ao sistema.
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email Registado</Text>
          <View style={[styles.inputBox, !!emailError && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="email@exemplo.com"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); setEmailError(""); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>
          {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.88 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Enviar Pedido de Redefinição</Text>
          }
        </Pressable>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            O processo de redefinição de senha requer aprovação manual pelo CEO do sistema. Após a aprovação, poderá aceder normalmente com a nova senha.
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIcon}>
              <Text style={{ fontSize: 36 }}>📧</Text>
            </View>
            <Text style={styles.modalTitle}>Pedido Enviado!</Text>
            <Text style={styles.modalText}>
              O seu pedido de redefinição de senha foi submetido com sucesso.{"\n\n"}
              <Text style={{ fontFamily: "Inter_600SemiBold", color: C.navy }}>
                Aguarde a aprovação do CEO.
              </Text>
              {"\n\n"}
              O acesso será reativado após análise e aprovação pela administração do sistema.
            </Text>
            <Pressable
              style={styles.modalBtn}
              onPress={() => { setShowSuccess(false); router.replace("/"); }}
            >
              <Text style={styles.modalBtnText}>Voltar ao Login</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.backgroundSecondary },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border, gap: 8 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 30, color: C.tint, lineHeight: 36 },
  topTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text },
  content: { padding: 24, gap: 24 },
  iconWrap: { alignItems: "center", width: 90, height: 90, borderRadius: 45, backgroundColor: "#EFF6FF", alignSelf: "center", justifyContent: "center" },
  textGroup: { gap: 8 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 22 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text, marginLeft: 2 },
  inputBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 16, height: 54 },
  inputError: { borderColor: C.error, backgroundColor: "#FFF5F5" },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: C.text },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.error, marginLeft: 2 },
  submitBtn: { backgroundColor: C.tint, borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", shadowColor: C.tint, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  infoCard: { flexDirection: "row", backgroundColor: "#FFFBEB", borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: "#FDE68A" },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#92400E", lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", gap: 14, width: "100%" },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  modalText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", lineHeight: 22 },
  modalBtn: { backgroundColor: C.tint, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignSelf: "stretch", alignItems: "center" },
  modalBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
