import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import Colors from "@/constants/colors";
import { ADMIN_USERS, useAuth } from "@/contexts/AuthContext";
import { useCongress } from "@/contexts/CongressContext";
import { useEvent } from "@/contexts/EventContext";

const C = Colors.light;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, loginWithParticipant, user, isLoading: authLoading, isAdmin, isConselho, biometricEnabled } = useAuth();
  const { getParticipantByEmail } = useEvent();
  const { formatPeriodo } = useCongress();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [welcomeModal, setWelcomeModal] = useState<{ visible: boolean; name: string; destination: string } | null>(null);
  const welcomeScale = useRef(new Animated.Value(0.85)).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<"face" | "touch" | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(20)).current;
  const biometricScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (user && !welcomeModal) {
      if (isConselho) router.replace("/conselho");
      else if (isAdmin) router.replace("/admin");
      else router.replace("/home");
    }
  }, [user, isAdmin, isConselho, welcomeModal]);

  function showWelcome(name: string, destination: string) {
    setWelcomeModal({ visible: true, name, destination });
    Animated.parallel([
      Animated.spring(welcomeScale, { toValue: 1, useNativeDriver: true, tension: 55, friction: 7 }),
      Animated.timing(welcomeOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  function dismissWelcome() {
    Animated.parallel([
      Animated.timing(welcomeScale, { toValue: 0.9, duration: 200, useNativeDriver: true }),
      Animated.timing(welcomeOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      if (welcomeModal) {
        const dest = welcomeModal.destination;
        setWelcomeModal(null);
        welcomeScale.setValue(0.85);
        welcomeOpacity.setValue(0);
        router.replace(dest as any);
      }
    });
  }

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 55, friction: 8 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formTranslate, { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(formOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      ]),
    ]).start();
    checkBiometrics();
  }, []);

  async function checkBiometrics() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        setBiometricAvailable(true);
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricType(
          types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) ? "face" : "touch"
        );
      }
    } catch { }
  }

  function validate() {
    let ok = true;
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    if (!email.trim()) {
      setEmailError("Insira o seu email");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Formato de email inválido");
      ok = false;
    }
    if (!password) {
      setPasswordError("Insira a sua senha");
      ok = false;
    }
    return ok;
  }

  async function handleLogin() {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);

    const adminResult = await login(email.trim(), password);
    if (adminResult.success) {
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const adminUser = ADMIN_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      const adminName = adminUser?.name ?? "Administrador";
      const isConselhoUser = adminUser?.role === "conselho";
      showWelcome(adminName, isConselhoUser ? "/conselho" : "/admin");
      return;
    }

    const participant = getParticipantByEmail(email.trim(), password);
    if (participant) {
      if (participant.status === "pendente") {
        setLoading(false);
        setGeneralError("A sua conta ainda está pendente de aprovação.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      if (participant.status === "rejeitado") {
        setLoading(false);
        setGeneralError("A sua inscrição foi rejeitada. Contacte a organização.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      await loginWithParticipant(participant);
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showWelcome(participant.nomeCompleto, "/home");
      return;
    }

    setLoading(false);
    setGeneralError("Email ou senha incorretos.");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  async function handleBiometric() {
    Animated.sequence([
      Animated.timing(biometricScale, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.spring(biometricScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: biometricType === "face" ? "Autenticar com Face ID" : "Autenticar com Touch ID",
        cancelLabel: "Cancelar",
        fallbackLabel: "Usar Senha",
      });
      if (auth.success) {
        await handleLogin();
      }
    } catch { }
  }

  if (authLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.tint} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.headerWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logosRow}>
            <View style={styles.logoBox}>
              <Image source={require("@/assets/images/csa-logo.png")} style={styles.csaLogo} resizeMode="contain" />
            </View>
            <View style={styles.dividerV} />
            <View style={styles.logoBox}>
              <Image source={require("@/assets/images/urnm-logo.png")} style={styles.urnmLogo} resizeMode="contain" />
            </View>
          </View>
          <Text style={styles.systemLabel}>Sistema de Gestão de Eventos</Text>
          <View style={styles.eventBadge}>
            <Text style={styles.eventName}>Congresso de Alimento 2026</Text>
          </View>
          <Text style={styles.orgName}>Universidade Rainha Njinga a Mbande</Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: formOpacity, transform: [{ translateY: formTranslate }] }]}>
          <Text style={styles.cardTitle}>Acesso ao Sistema</Text>
          <Text style={styles.cardSub}>Entre com as suas credenciais</Text>

          {!!generalError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !!emailError && styles.inputError]}
              placeholder="email@exemplo.com"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(""); if (generalError) setGeneralError(""); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              editable={!loading}
            />
            {!!emailError && <Text style={styles.fieldErr}>{emailError}</Text>}
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Senha</Text>
              <Pressable onPress={() => router.push("/forgot-password")} hitSlop={10}>
                <Text style={styles.forgotLink}>Esqueceu a senha?</Text>
              </Pressable>
            </View>
            <View style={[styles.passwordWrap, !!passwordError && styles.inputError]}>
              <TextInput
                ref={passwordRef}
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={C.textMuted}
                value={password}
                onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(""); if (generalError) setGeneralError(""); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁"}</Text>
              </Pressable>
            </View>
            {!!passwordError && <Text style={styles.fieldErr}>{passwordError}</Text>}
          </View>

          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.loginBtnText}>Entrar no Sistema</Text>
            }
          </Pressable>

          {biometricAvailable && biometricEnabled && (
            <>
              <View style={styles.divRow}>
                <View style={styles.divLine} />
                <Text style={styles.divText}>ou</Text>
                <View style={styles.divLine} />
              </View>
              <Animated.View style={{ transform: [{ scale: biometricScale }] }}>
                <Pressable
                  style={({ pressed }) => [styles.bioBtn, pressed && { opacity: 0.8 }]}
                  onPress={handleBiometric}
                  disabled={loading}
                >
                  <View style={styles.bioIconBox}>
                    <Text style={{ fontSize: 22 }}>{biometricType === "face" ? "🪪" : "👆"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bioLabel}>
                      {biometricType === "face" ? "Entrar com Face ID" : "Entrar com Touch ID"}
                    </Text>
                    <Text style={styles.bioSub}>Autenticação biométrica segura</Text>
                  </View>
                  <Text style={{ fontSize: 20, color: C.tint }}>›</Text>
                </Pressable>
              </Animated.View>
            </>
          )}
        </Animated.View>

        <Animated.View style={[styles.registerSection, { opacity: formOpacity }]}>
          <Text style={styles.noAccountText}>Ainda não tem registo?</Text>
          <Pressable
            style={({ pressed }) => [styles.registerBtn, pressed && { opacity: 0.82 }]}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.registerBtnText}>Registar-se no Congresso</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>

      {/* Welcome Modal */}
      <Modal
        visible={!!welcomeModal?.visible}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View style={styles.welcomeOverlay}>
          <Animated.View style={[styles.welcomeCard, { opacity: welcomeOpacity, transform: [{ scale: welcomeScale }] }]}>
            <View style={styles.welcomeTop}>
              <Image source={require("@/assets/images/urnm-logo.png")} style={styles.welcomeLogo} resizeMode="contain" />
            </View>
            <View style={styles.welcomeBody}>
              <Text style={styles.welcomeGreeting}>Bem-vindo(a)!</Text>
              <Text style={styles.welcomeName} numberOfLines={2}>{welcomeModal?.name}</Text>
              <View style={styles.welcomeDivider} />
              <Text style={styles.welcomeEvent}>Congresso de Alimento 2026</Text>
              <Text style={styles.welcomePeriodo}>{formatPeriodo()}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.welcomeBtn, pressed && { opacity: 0.85 }]}
              onPress={dismissWelcome}
            >
              <Text style={styles.welcomeBtnText}>Entrar no Sistema</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.backgroundSecondary },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.backgroundSecondary },
  scrollContent: { paddingHorizontal: 20, gap: 18 },
  headerWrap: { alignItems: "center", gap: 8 },
  logosRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14, gap: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  logoBox: { alignItems: "center", justifyContent: "center" },
  csaLogo: { width: 100, height: 60 },
  urnmLogo: { width: 64, height: 64 },
  dividerV: { width: 1, height: 56, backgroundColor: C.border },
  systemLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary, letterSpacing: 0.3 },
  eventBadge: { backgroundColor: C.navy, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7 },
  eventName: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.2 },
  orgName: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, letterSpacing: 0.3 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 22, gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 5 },
  cardTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text, letterSpacing: -0.3 },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: -6 },
  errorBanner: { backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: C.error },
  errorBannerText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#991B1B", lineHeight: 19 },
  field: { gap: 7 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text, marginLeft: 2 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  forgotLink: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.tint },
  input: { backgroundColor: C.inputBackground, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 16, height: 52, fontSize: 15, fontFamily: "Inter_400Regular", color: C.text },
  inputError: { borderColor: C.error, backgroundColor: "#FFF5F5" },
  fieldErr: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.error, marginLeft: 2 },
  passwordWrap: { flexDirection: "row", alignItems: "center", backgroundColor: C.inputBackground, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingLeft: 16, paddingRight: 12, height: 52 },
  passwordInput: { flex: 1, height: "100%", fontSize: 15, fontFamily: "Inter_400Regular", color: C.text },
  eyeBtn: { padding: 6 },
  eyeText: { fontSize: 18 },
  loginBtn: { backgroundColor: C.tint, borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", shadowColor: C.tint, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6, marginTop: 2 },
  loginBtnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff", letterSpacing: 0.3 },
  divRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  bioBtn: { flexDirection: "row", alignItems: "center", backgroundColor: C.biometricBg, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: "rgba(26,124,63,0.15)" },
  bioIconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  bioLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.tint },
  bioSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  registerSection: { alignItems: "center", gap: 12 },
  noAccountText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  registerBtn: { backgroundColor: C.navy, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 28, alignSelf: "stretch", alignItems: "center", shadowColor: C.navy, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  registerBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  welcomeOverlay: { flex: 1, backgroundColor: "rgba(15,30,60,0.7)", alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  welcomeCard: { backgroundColor: "#fff", borderRadius: 28, width: "100%", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.2, shadowRadius: 32, elevation: 16 },
  welcomeTop: { backgroundColor: C.navy, paddingVertical: 28, alignItems: "center" },
  welcomeLogo: { width: 80, height: 80 },
  welcomeBody: { alignItems: "center", paddingHorizontal: 24, paddingTop: 22, paddingBottom: 18, gap: 6 },
  welcomeGreeting: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.tint, letterSpacing: -0.3 },
  welcomeName: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: C.text, textAlign: "center", marginTop: 2 },
  welcomeDivider: { width: 50, height: 2, backgroundColor: C.tint, borderRadius: 2, marginVertical: 10 },
  welcomeEvent: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.navy, textAlign: "center" },
  welcomePeriodo: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  welcomeBtn: { margin: 16, marginTop: 4, backgroundColor: C.tint, borderRadius: 14, height: 50, alignItems: "center", justifyContent: "center" },
  welcomeBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
