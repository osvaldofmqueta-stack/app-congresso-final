import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import {
  EIXOS,
  NIVEL_ACADEMICO,
  SPECTATOR_LABELS,
  SpectatorType,
  EixoType,
  OrigemType,
  calcTarifa,
  useEvent,
} from "@/contexts/EventContext";

const C = Colors.light;

const STEPS = [
  { id: 1, label: "Dados Pessoais" },
  { id: 2, label: "Perfil Académico" },
  { id: 3, label: "Participação" },
  { id: 4, label: "Acesso" },
  { id: 5, label: "Confirmação" },
];

type FormData = {
  nomeCompleto: string;
  username: string;
  nivelAcademico: string;
  origemInstitucional: string;
  origemTipo: OrigemType;
  eixo: EixoType | null;
  spectatorType: SpectatorType | null;
  email: string;
  password: string;
  confirmPassword: string;
};

const INITIAL: FormData = {
  nomeCompleto: "",
  username: "",
  nivelAcademico: "",
  origemInstitucional: "",
  origemTipo: "URNM",
  eixo: null,
  spectatorType: null,
  email: "",
  password: "",
  confirmPassword: "",
};

const DRAFT_KEY = "@csa_register_draft";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { registerParticipant } = useEvent();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (raw) {
        try {
          const draft = JSON.parse(raw);
          setForm((prev) => ({ ...prev, ...draft }));
        } catch {}
      }
    });
  }, []);

  const saveDraft = useCallback((updated: FormData) => {
    const toSave = { ...updated, password: "", confirmPassword: "" };
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(toSave)).catch(() => {});
  }, []);

  const scrollRef = useRef<ScrollView>(null);

  const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      saveDraft(updated);
      return updated;
    });
  }, [saveDraft]);

  const clearError = useCallback((key: keyof FormData) => {
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }, []);

  function validateStep(s: number): boolean {
    const e: typeof errors = {};
    if (s === 1) {
      if (!form.nomeCompleto.trim()) e.nomeCompleto = "Nome completo é obrigatório";
      if (!form.username.trim()) e.username = "Nome de usuário é obrigatório";
      else if (form.username.length < 3) e.username = "Mínimo 3 caracteres";
      else if (/\s/.test(form.username)) e.username = "Sem espaços no nome de usuário";
    }
    if (s === 2) {
      if (!form.nivelAcademico) e.nivelAcademico = "Selecione o nível académico";
      if (!form.origemInstitucional.trim()) e.origemInstitucional = "Origem institucional é obrigatória";
    }
    if (s === 3) {
      if (!form.eixo) e.eixo = "Selecione o eixo temático" as any;
      if (!form.spectatorType) e.spectatorType = "Selecione o tipo de participação" as any;
    }
    if (s === 4) {
      if (!form.email.trim()) e.email = "Email é obrigatório";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Email inválido";
      if (!form.password) e.password = "Senha é obrigatória";
      else if (form.password.length < 6) e.password = "Mínimo 6 caracteres";
      if (!form.confirmPassword) e.confirmPassword = "Confirme a senha";
      else if (form.password !== form.confirmPassword) e.confirmPassword = "As senhas não coincidem";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (!validateStep(step)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => s + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function prevStep() {
    setErrors({});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => s - 1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  async function handleSubmit() {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await registerParticipant({
      nomeCompleto: form.nomeCompleto.trim(),
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      nivelAcademico: form.nivelAcademico,
      origemInstitucional: form.origemInstitucional.trim(),
      origemTipo: form.origemTipo,
      eixo: form.eixo!,
      spectatorType: form.spectatorType!,
      tarifa: calcTarifa(form.spectatorType!, form.origemTipo),
    });
    setLoading(false);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
      setShowSuccess(true);
    } else {
      setErrors({ email: result.error });
      setStep(4);
    }
  }

  const tarifa = useMemo(
    () => (form.spectatorType ? calcTarifa(form.spectatorType, form.origemTipo) : null),
    [form.spectatorType, form.origemTipo]
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => (step === 1 ? router.back() : prevStep())}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Registo — Congresso 2026</Text>
          <Text style={styles.topSub}>Passo {step} de {STEPS.length}</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <View style={[styles.progressDot, step >= s.id && styles.progressDotActive]}>
              {step > s.id ? (
                <Text style={styles.progressCheck}>✓</Text>
              ) : (
                <Text style={[styles.progressNum, step === s.id && styles.progressNumActive]}>
                  {s.id}
                </Text>
              )}
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.progressLine, step > s.id && styles.progressLineActive]} />
            )}
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.stepLabel}>{STEPS[step - 1].label}</Text>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <StepDadosPessoais form={form} errors={errors} setField={setField} clearError={clearError} />
        )}
        {step === 2 && (
          <StepPerfil form={form} errors={errors} setField={setField} clearError={clearError} />
        )}
        {step === 3 && (
          <StepParticipacao form={form} errors={errors} setField={setField} />
        )}
        {step === 4 && (
          <StepAcesso form={form} errors={errors} setField={setField} clearError={clearError} />
        )}
        {step === 5 && <StepConfirmacao form={form} tarifa={tarifa} />}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {step < STEPS.length ? (
          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.88 }]}
            onPress={nextStep}
          >
            <Text style={styles.nextBtnText}>Continuar</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.88 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.nextBtnText}>Concluir Registo</Text>
            }
          </Pressable>
        )}
      </View>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIcon}>
              <Text style={{ fontSize: 40 }}>🎉</Text>
            </View>
            <Text style={styles.modalTitle}>Registo Submetido!</Text>
            <Text style={styles.modalText}>
              O seu registo foi submetido com sucesso.{"\n\n"}
              <Text style={{ fontFamily: "Inter_600SemiBold", color: C.navy }}>
                Aguarde a aprovação da organização.
              </Text>
              {"\n\n"}
              Será notificado quando a sua participação for confirmada no Congresso de Alimento 2026.
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

type StepProps = {
  form: FormData;
  errors: Partial<Record<keyof FormData, string>>;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  clearError?: (key: keyof FormData) => void;
};

function StepDadosPessoais({ form, errors, setField, clearError }: StepProps) {
  const usernameRef = useRef<TextInput>(null);
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepDesc}>Introduza os seus dados pessoais para o registo no congresso.</Text>
      <FieldWrap label="Nome Completo" error={errors.nomeCompleto}>
        <TextInput
          style={[styles.textInput, !!errors.nomeCompleto && styles.inputError]}
          placeholder="Isaias Fernando Muondo Queta"
          placeholderTextColor={C.textMuted}
          value={form.nomeCompleto}
          onChangeText={(t) => {
            setField("nomeCompleto", t);
            clearError?.("nomeCompleto");
          }}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => usernameRef.current?.focus()}
        />
      </FieldWrap>
      <FieldWrap
        label="Nome de Usuário"
        error={errors.username}
        hint="Sem espaços, apenas letras minúsculas e pontos"
      >
        <TextInput
          ref={usernameRef}
          style={[styles.textInput, !!errors.username && styles.inputError]}
          placeholder="isaias.queta"
          placeholderTextColor={C.textMuted}
          value={form.username}
          onChangeText={(t) => {
            setField("username", t.toLowerCase().replace(/\s/g, ""));
            clearError?.("username");
          }}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
      </FieldWrap>
    </View>
  );
}

function StepPerfil({ form, errors, setField, clearError }: StepProps) {
  const origemRef = useRef<TextInput>(null);
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepDesc}>Indique o seu perfil académico e instituição de origem.</Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Nível Académico</Text>
        <View style={styles.optionGrid}>
          {NIVEL_ACADEMICO.map((n) => (
            <Pressable
              key={n}
              onPress={() => {
                setField("nivelAcademico", n);
                clearError?.("nivelAcademico");
              }}
              style={[styles.optionChip, form.nivelAcademico === n && styles.optionChipActive]}
            >
              <Text style={[styles.optionChipText, form.nivelAcademico === n && styles.optionChipTextActive]}>
                {n}
              </Text>
            </Pressable>
          ))}
        </View>
        {!!errors.nivelAcademico && <Text style={styles.fieldErr}>{errors.nivelAcademico}</Text>}
      </View>

      <FieldWrap label="Origem Institucional" error={errors.origemInstitucional}>
        <TextInput
          ref={origemRef}
          style={[styles.textInput, !!errors.origemInstitucional && styles.inputError]}
          placeholder="Ex: URNM, Universidade Agostinho Neto..."
          placeholderTextColor={C.textMuted}
          value={form.origemInstitucional}
          onChangeText={(t) => {
            setField("origemInstitucional", t);
            clearError?.("origemInstitucional");
          }}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
        />
      </FieldWrap>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Tipo de Origem</Text>
        <View style={styles.toggleRow}>
          {(["URNM", "Externo"] as OrigemType[]).map((o) => (
            <Pressable
              key={o}
              onPress={() => setField("origemTipo", o)}
              style={[styles.toggleOpt, form.origemTipo === o && styles.toggleOptActive]}
            >
              <Text style={[styles.toggleText, form.origemTipo === o && styles.toggleTextActive]}>
                {o === "URNM" ? "🎓 URNM" : "🌐 Externo"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function StepParticipacao({ form, errors, setField }: StepProps) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepDesc}>Selecione o seu eixo temático e tipo de participação no congresso.</Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Eixo Temático</Text>
        {([1, 2, 3] as EixoType[]).map((e) => (
          <Pressable
            key={e}
            onPress={() => setField("eixo", e)}
            style={[styles.eixoCard, form.eixo === e && styles.eixoCardActive]}
          >
            <View style={[styles.eixoBadge, form.eixo === e && styles.eixoBadgeActive]}>
              <Text style={[styles.eixoBadgeText, form.eixo === e && styles.eixoBadgeTextActive]}>{e}</Text>
            </View>
            <Text style={[styles.eixoText, form.eixo === e && styles.eixoTextActive]}>{EIXOS[e]}</Text>
          </Pressable>
        ))}
        {!!errors.eixo && <Text style={styles.fieldErr}>{errors.eixo}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Tipo de Participante</Text>
        <View style={styles.spectatorGrid}>
          {(Object.entries(SPECTATOR_LABELS) as [SpectatorType, string][]).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setField("spectatorType", key)}
              style={[styles.spectatorCard, form.spectatorType === key && styles.spectatorCardActive]}
            >
              <Text style={styles.spectatorIcon}>
                {key === "docente_investigador" ? "🎓" : key === "estudante" ? "📚" : key === "outro" ? "👤" : "🎤"}
              </Text>
              <Text style={[styles.spectatorLabel, form.spectatorType === key && styles.spectatorLabelActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        {!!errors.spectatorType && <Text style={styles.fieldErr}>{errors.spectatorType}</Text>}
      </View>

      {form.spectatorType && (
        <View style={styles.tarifaCard}>
          <Text style={styles.tarifaTitle}>Tarifário Aplicável</Text>
          <Text style={styles.tarifaValue}>
            {calcTarifa(form.spectatorType, form.origemTipo).toLocaleString()} Kz
          </Text>
          <Text style={styles.tarifaSub}>
            {SPECTATOR_LABELS[form.spectatorType]} · {form.origemTipo}
          </Text>
        </View>
      )}

      {form.spectatorType !== "prelector" && (
        <View style={styles.tarifaTable}>
          <Text style={styles.tableTitle}>Tabela de Preços (Kwanza)</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.5 }]}>Categoria</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader]}>URNM</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader]}>Externo</Text>
          </View>
          {[
            { label: "Doc./Invest.", urnm: 5000, ext: 7000 },
            { label: "Estudantes", urnm: 3000, ext: 4000 },
            { label: "Outros", urnm: 5000, ext: 10000 },
          ].map((row) => (
            <View key={row.label} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.label}</Text>
              <Text style={styles.tableCell}>{row.urnm.toLocaleString()}</Text>
              <Text style={styles.tableCell}>{row.ext.toLocaleString()}</Text>
            </View>
          ))}
          <View style={[styles.tableRow, { backgroundColor: "#F0F9FF" }]}>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>Prelectores</Text>
            <Text style={[styles.tableCell, { flex: 2, textAlign: "center" }]}>20.000</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function StepAcesso({ form, errors, setField, clearError }: StepProps) {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepDesc}>Defina as suas credenciais de acesso ao sistema.</Text>

      <FieldWrap label="Email" error={errors.email}>
        <TextInput
          style={[styles.textInput, !!errors.email && styles.inputError]}
          placeholder="email@exemplo.com"
          placeholderTextColor={C.textMuted}
          value={form.email}
          onChangeText={(t) => {
            setField("email", t);
            clearError?.("email");
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
      </FieldWrap>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Senha</Text>
        <View style={[styles.inputRow, !!errors.password && styles.inputRowError]}>
          <TextInput
            ref={passwordRef}
            style={[styles.textInput, { flex: 1 }]}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={C.textMuted}
            value={form.password}
            onChangeText={(t) => {
              setField("password", t);
              clearError?.("password");
            }}
            secureTextEntry={!showPwd}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          <Pressable onPress={() => setShowPwd((v) => !v)} hitSlop={10} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{showPwd ? "🙈" : "👁"}</Text>
          </Pressable>
        </View>
        {!!errors.password && <Text style={styles.fieldErr}>{errors.password}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Confirmar Senha</Text>
        <View style={[styles.inputRow, !!errors.confirmPassword && styles.inputRowError]}>
          <TextInput
            ref={confirmRef}
            style={[styles.textInput, { flex: 1 }]}
            placeholder="Repita a senha"
            placeholderTextColor={C.textMuted}
            value={form.confirmPassword}
            onChangeText={(t) => {
              setField("confirmPassword", t);
              clearError?.("confirmPassword");
            }}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            returnKeyType="done"
          />
          <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={10} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{showConfirm ? "🙈" : "👁"}</Text>
          </Pressable>
        </View>
        {!!errors.confirmPassword && <Text style={styles.fieldErr}>{errors.confirmPassword}</Text>}
      </View>
    </View>
  );
}

function StepConfirmacao({ form, tarifa }: { form: FormData; tarifa: number | null }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepDesc}>Reveja os seus dados antes de submeter o registo.</Text>
      <View style={styles.summaryCard}>
        <SummaryRow icon="👤" label="Nome" value={form.nomeCompleto} />
        <SummaryRow icon="🪪" label="Username" value={`@${form.username}`} />
        <SummaryRow icon="📧" label="Email" value={form.email} />
        <SummaryRow icon="🎓" label="Nível Académico" value={form.nivelAcademico} />
        <SummaryRow icon="🏛" label="Instituição" value={form.origemInstitucional} />
        <SummaryRow icon="📍" label="Origem" value={form.origemTipo} />
        <SummaryRow icon="📋" label="Eixo Temático" value={`Eixo ${form.eixo}: ${EIXOS[form.eixo!]}`} />
        <SummaryRow icon="🎭" label="Participação" value={SPECTATOR_LABELS[form.spectatorType!]} />
        {tarifa !== null && (
          <SummaryRow icon="💰" label="Tarifário" value={`${tarifa.toLocaleString()} Kz`} highlight />
        )}
      </View>
      <View style={styles.noticeCard}>
        <Text style={styles.noticeText}>
          ℹ️ Após submeter, o seu registo ficará pendente até aprovação da organização do congresso.
        </Text>
      </View>
    </View>
  );
}

function SummaryRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text
          style={[styles.summaryValue, highlight && { color: C.tint, fontFamily: "Inter_700Bold" }]}
          numberOfLines={3}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function FieldWrap({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {!!hint && <Text style={styles.hintText}>{hint}</Text>}
      {!!error && <Text style={styles.fieldErr}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.backgroundSecondary },
  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border, gap: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 30, color: C.tint, lineHeight: 36 },
  topTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text },
  topSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  progressBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#fff",
  },
  progressDot: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  progressDotActive: { backgroundColor: C.tint },
  progressNum: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textMuted },
  progressNumActive: { color: "#fff" },
  progressCheck: { fontSize: 14, color: "#fff", fontFamily: "Inter_700Bold" },
  progressLine: { flex: 1, height: 3, backgroundColor: C.border, marginHorizontal: 4 },
  progressLineActive: { backgroundColor: C.tint },
  stepLabel: {
    fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.tint,
    paddingHorizontal: 20, paddingBottom: 4, backgroundColor: "#fff",
    textTransform: "uppercase", letterSpacing: 0.8,
  },
  content: { padding: 20 },
  stepContent: { gap: 18 },
  stepDesc: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 22 },

  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text, marginLeft: 2 },
  fieldErr: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.error, marginLeft: 2 },
  hintText: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginLeft: 2 },

  textInput: {
    backgroundColor: "#fff",
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 16, height: 52,
    fontSize: 15, fontFamily: "Inter_400Regular", color: C.text,
  },
  inputError: { borderColor: C.error, backgroundColor: "#FFF5F5" },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    paddingLeft: 16, paddingRight: 10, height: 52,
  },
  inputRowError: { borderColor: C.error, backgroundColor: "#FFF5F5" },
  eyeBtn: { padding: 6 },
  eyeText: { fontSize: 18 },

  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: C.border,
  },
  optionChipActive: { backgroundColor: C.tint, borderColor: C.tint },
  optionChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.text },
  optionChipTextActive: { color: "#fff" },

  toggleRow: { flexDirection: "row", gap: 10 },
  toggleOpt: {
    flex: 1, height: 50, borderRadius: 14,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  toggleOptActive: { backgroundColor: C.tint, borderColor: C.tint },
  toggleText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  toggleTextActive: { color: "#fff" },

  eixoCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: C.border,
  },
  eixoCardActive: { borderColor: C.tint, backgroundColor: "#F0FAF4" },
  eixoBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.border, alignItems: "center", justifyContent: "center",
  },
  eixoBadgeActive: { backgroundColor: C.tint },
  eixoBadgeText: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.textMuted },
  eixoBadgeTextActive: { color: "#fff" },
  eixoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 20, paddingTop: 5 },
  eixoTextActive: { color: C.text, fontFamily: "Inter_500Medium" },

  spectatorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  spectatorCard: {
    width: "47%", backgroundColor: "#fff",
    borderRadius: 14, padding: 14, alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: C.border,
  },
  spectatorCardActive: { borderColor: C.tint, backgroundColor: "#F0FAF4" },
  spectatorIcon: { fontSize: 26 },
  spectatorLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary, textAlign: "center" },
  spectatorLabelActive: { color: C.tint, fontFamily: "Inter_600SemiBold" },

  tarifaCard: {
    backgroundColor: C.tint, borderRadius: 16, padding: 18, alignItems: "center", gap: 4,
  },
  tarifaTitle: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)", letterSpacing: 0.5, textTransform: "uppercase" },
  tarifaValue: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff" },
  tarifaSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)" },

  tarifaTable: {
    backgroundColor: "#fff", borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
  },
  tableTitle: {
    fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#F8FAFC",
  },
  tableHeader: { flexDirection: "row", backgroundColor: "#F1F5F9", paddingHorizontal: 14, paddingVertical: 8 },
  tableRow: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  tableCell: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: C.text, textAlign: "center" },
  tableCellHeader: { fontFamily: "Inter_600SemiBold", color: C.textSecondary },

  summaryCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 18, gap: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  summaryRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  summaryIcon: { fontSize: 20, width: 28 },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.3 },
  summaryValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text, marginTop: 2 },

  noticeCard: {
    backgroundColor: "#FFFBEB", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#FDE68A",
  },
  noticeText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#92400E", lineHeight: 20 },

  footer: {
    padding: 16, backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: C.border,
  },
  nextBtn: {
    backgroundColor: C.tint, borderRadius: 14, height: 54,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.tint, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  submitBtn: {
    backgroundColor: C.navy, borderRadius: 14, height: 54,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", gap: 14, width: "100%" },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#F0FAF4", alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  modalText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", lineHeight: 22 },
  modalBtn: { backgroundColor: C.tint, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignSelf: "stretch", alignItems: "center" },
  modalBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
