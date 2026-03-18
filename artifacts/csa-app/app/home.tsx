import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmModal } from "@/components/ConfirmModal";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { EIXOS, Notification, SPECTATOR_LABELS, Submission, useEvent } from "@/contexts/EventContext";
import { ProgramDay, useProgram } from "@/contexts/ProgramContext";

const C = Colors.light;

type Tab = "inicio" | "credencial" | "apresentacao" | "notificacoes" | "programa";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const {
    participants,
    submissions,
    notifications,
    submitPresentation,
    markAllReadForTarget,
    markNotificationRead,
    getUnreadCount,
  } = useEvent();
  const { days } = useProgram();

  const [activeTab, setActiveTab] = useState<Tab>("inicio");
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const participant = user?.participantId
    ? participants.find((p) => p.id === user.participantId)
    : null;

  const mySubmission = submissions.find((s) => s.participantId === user?.participantId);
  const myNotifications = notifications.filter((n) => n.targetId === user?.participantId);
  const unreadCount = user?.participantId ? getUnreadCount(user.participantId) : 0;

  function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logout();
    router.replace("/");
  }

  function handleOpenNotifications() {
    setActiveTab("notificacoes");
    if (user?.participantId && unreadCount > 0) markAllReadForTarget(user.participantId);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require("@/assets/images/csa-logo.png")} style={styles.headerLogo} resizeMode="contain" />
          <View>
            <Text style={styles.headerGreeting}>Congresso de Alimento 2026</Text>
            <Text style={styles.headerName} numberOfLines={1}>{participant?.nomeCompleto ?? user?.name}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={handleOpenNotifications} style={styles.notifBtn}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => router.push("/profile")} style={styles.profileBtn}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileAvatarFallback}>
                <Text style={styles.profileAvatarText}>
                  {(user?.name ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => setLogoutModalVisible(true)} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabs}>
        {([
          { id: "inicio", label: "Início" },
          { id: "credencial", label: "Credencial" },
          { id: "programa", label: "Programa" },
          { id: "apresentacao", label: "Submissão" },
          { id: "notificacoes", label: "Notif.", badge: unreadCount },
        ] as { id: Tab; label: string; badge?: number }[]).map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => {
              setActiveTab(tab.id);
              if (tab.id === "notificacoes" && user?.participantId && unreadCount > 0) {
                markAllReadForTarget(user.participantId);
              }
            }}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            {(tab.badge ?? 0) > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.badge}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "inicio" && (
          <InicioTab
            participant={participant}
            mySubmission={mySubmission}
            days={days}
            unreadCount={unreadCount}
            onGoCredencial={() => setActiveTab("credencial")}
            onGoPrograma={() => setActiveTab("programa")}
            onGoApresentacao={() => setActiveTab("apresentacao")}
            onGoNotificacoes={() => {
              setActiveTab("notificacoes");
              if (user?.participantId && unreadCount > 0) markAllReadForTarget(user.participantId);
            }}
            onGoPerfil={() => router.push("/profile")}
          />
        )}
        {activeTab === "credencial" && (
          <CredentialTab participant={participant} />
        )}
        {activeTab === "programa" && (
          <ProgramaTab days={days} />
        )}
        {activeTab === "apresentacao" && participant && (
          <ApresentacaoTab
            participant={participant}
            mySubmission={mySubmission}
            onSubmit={submitPresentation}
          />
        )}
        {activeTab === "notificacoes" && (
          <NotificacoesTab notifications={myNotifications} onMarkRead={markNotificationRead} />
        )}
      </ScrollView>

      <ConfirmModal
        visible={logoutModalVisible}
        title="Sair do Sistema"
        message="Tem a certeza que deseja terminar a sessão?"
        confirmText="Sair"
        cancelText="Cancelar"
        confirmDestructive
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />
    </View>
  );
}

function InicioTab({
  participant,
  mySubmission,
  days,
  unreadCount,
  onGoCredencial,
  onGoPrograma,
  onGoApresentacao,
  onGoNotificacoes,
  onGoPerfil,
}: {
  participant: ReturnType<typeof useEvent>["participants"][0] | null | undefined;
  mySubmission: ReturnType<typeof useEvent>["submissions"][0] | undefined;
  days: ProgramDay[];
  unreadCount: number;
  onGoCredencial: () => void;
  onGoPrograma: () => void;
  onGoApresentacao: () => void;
  onGoNotificacoes: () => void;
  onGoPerfil: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const todayDay = days.find((d) => d.data === today);
  const activeItem = todayDay?.itens.find((i) => i.status === "ativo");

  const statusColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    pendente: { bg: "#FFFBEB", border: "#F59E0B", text: "#92400E", label: "Pendente de aprovação" },
    aprovado: { bg: "#F0FDF4", border: "#22C55E", text: "#166534", label: "Participação Aprovada ✓" },
    rejeitado: { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B", label: "Inscrição Rejeitada" },
  };

  const subStatusColors: Record<string, { bg: string; text: string; label: string }> = {
    pendente: { bg: "#FFFBEB", text: "#92400E", label: "Aguarda avaliação" },
    aprovado: { bg: "#F0FDF4", text: "#166534", label: "Aprovada ✓" },
    rejeitado: { bg: "#FEF2F2", text: "#991B1B", label: "Rejeitada" },
  };

  const pStatus = participant?.status ?? "pendente";
  const pStyle = statusColors[pStatus] ?? statusColors["pendente"];

  return (
    <View style={{ gap: 16 }}>
      {/* Welcome */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>
          Bem-vindo(a), {(participant?.nomeCompleto ?? "").split(" ")[0]}! 👋
        </Text>
        <Text style={styles.welcomeSub}>Congresso de Alimento 2026 · URNM</Text>
      </View>

      {/* Participation Status */}
      <View style={[styles.statusCard, { borderColor: pStyle.border, backgroundColor: pStyle.bg }]}>
        <Text style={[styles.statusCardLabel, { color: pStyle.text }]}>Estado da Inscrição</Text>
        <Text style={[styles.statusCardValue, { color: pStyle.text }]}>{pStyle.label}</Text>
        {pStatus === "aprovado" && (
          <Pressable onPress={onGoCredencial} style={styles.statusCardAction}>
            <Text style={styles.statusCardActionText}>Ver Credencial →</Text>
          </Pressable>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Pressable style={styles.statCard} onPress={onGoNotificacoes}>
          <Text style={styles.statIcon}>🔔</Text>
          <Text style={[styles.statValue, unreadCount > 0 ? { color: "#EF4444" } : {}]}>{unreadCount}</Text>
          <Text style={styles.statLabel}>Notif. não lidas</Text>
        </Pressable>
        <Pressable style={styles.statCard} onPress={onGoPrograma}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statValue}>{days.length}</Text>
          <Text style={styles.statLabel}>Dias no programa</Text>
        </Pressable>
        <Pressable style={styles.statCard} onPress={onGoApresentacao}>
          <Text style={styles.statIcon}>📄</Text>
          <Text style={styles.statValue}>{mySubmission ? "1" : "0"}</Text>
          <Text style={styles.statLabel}>Submissões</Text>
        </Pressable>
      </View>

      {/* Submission Status */}
      {mySubmission && (
        <View style={styles.dashCard}>
          <Text style={styles.dashCardTitle}>Minha Apresentação</Text>
          <View style={styles.dashCardRow}>
            <Text style={styles.dashCardLabel}>Tema:</Text>
            <Text style={styles.dashCardValue} numberOfLines={2}>{mySubmission.tema}</Text>
          </View>
          <View style={styles.dashCardRow}>
            <Text style={styles.dashCardLabel}>Estado:</Text>
            <View style={[styles.subStatusBadge, { backgroundColor: subStatusColors[mySubmission.status]?.bg ?? "#F3F4F6" }]}>
              <Text style={[styles.subStatusText, { color: subStatusColors[mySubmission.status]?.text ?? "#374151" }]}>
                {subStatusColors[mySubmission.status]?.label ?? mySubmission.status}
              </Text>
            </View>
          </View>
          <Pressable onPress={onGoApresentacao} style={styles.dashCardBtn}>
            <Text style={styles.dashCardBtnText}>Ver detalhes →</Text>
          </Pressable>
        </View>
      )}

      {/* Today's Program */}
      {todayDay && (
        <View style={styles.dashCard}>
          <Text style={styles.dashCardTitle}>Programa de Hoje</Text>
          <Text style={styles.dashCardSub}>{todayDay.titulo}</Text>
          {activeItem ? (
            <View style={styles.activeItemRow}>
              <View style={styles.activeItemDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeItemLabel}>Em curso agora:</Text>
                <Text style={styles.activeItemTema} numberOfLines={2}>{activeItem.tema}</Text>
                <Text style={styles.activeItemTime}>{activeItem.horaInicio} – {activeItem.horaFim}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.dashCardSub2}>Nenhum item em curso neste momento.</Text>
          )}
          <Pressable onPress={onGoPrograma} style={styles.dashCardBtn}>
            <Text style={styles.dashCardBtnText}>Ver programa completo →</Text>
          </Pressable>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Acesso Rápido</Text>
        <View style={styles.quickActionsGrid}>
          {[
            { icon: "🎫", label: "Credencial", onPress: onGoCredencial },
            { icon: "📅", label: "Programa", onPress: onGoPrograma },
            { icon: "📄", label: "Submissão", onPress: onGoApresentacao },
            { icon: "👤", label: "Perfil", onPress: onGoPerfil },
          ].map((a) => (
            <Pressable key={a.label} style={styles.quickActionItem} onPress={a.onPress}>
              <Text style={{ fontSize: 28 }}>{a.icon}</Text>
              <Text style={styles.quickActionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function CredentialTab({ participant }: { participant: ReturnType<typeof useEvent>["participants"][0] | null | undefined }) {
  if (!participant) return null;
  return (
    <>
      <View style={styles.approvedBanner}>
        <View style={styles.approvedDot} />
        <Text style={styles.approvedText}>Participação Aprovada</Text>
      </View>

      {participant.qrData && (
        <View style={styles.qrCard}>
          <View style={styles.qrHeader}>
            <Image source={require("@/assets/images/urnm-logo.png")} style={{ width: 40, height: 40 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.qrEventTitle}>Congresso de Alimento 2026</Text>
              <Text style={styles.qrOrg}>Universidade Rainha Njinga a Mbande</Text>
            </View>
          </View>
          <View style={styles.qrCenter}>
            <QRCode value={participant.qrData} size={220} color={C.navy} backgroundColor="#fff" />
          </View>
          <View style={styles.qrDetails}>
            <Text style={styles.qrName}>{participant.nomeCompleto}</Text>
            <Text style={styles.qrUsername}>@{participant.username}</Text>
            <View style={styles.qrBadgeRow}>
              <View style={styles.qrBadge}>
                <Text style={styles.qrBadgeText}>{SPECTATOR_LABELS[participant.spectatorType]}</Text>
              </View>
              <View style={[styles.qrBadge, { backgroundColor: C.navy }]}>
                <Text style={styles.qrBadgeText}>{participant.origemTipo}</Text>
              </View>
            </View>
            <View style={styles.qrMetaRow}>
              <Text style={styles.qrMetaLabel}>Eixo Temático:</Text>
              <Text style={styles.qrMetaValue} numberOfLines={2}>
                {participant.eixo} — {EIXOS[participant.eixo]}
              </Text>
            </View>
            <View style={styles.qrMetaRow}>
              <Text style={styles.qrMetaLabel}>Tarifário:</Text>
              <Text style={[styles.qrMetaValue, { color: C.tint, fontFamily: "Inter_700Bold" }]}>
                {participant.tarifa.toLocaleString()} Kz
              </Text>
            </View>
          </View>
          <View style={styles.qrFooter}>
            <Text style={styles.qrFooterText}>Apresente este QR Code na entrada do congresso</Text>
          </View>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Os Meus Dados</Text>
        <InfoRow label="Email" value={participant.email} />
        <View style={styles.sep} />
        <InfoRow label="Nível Académico" value={participant.nivelAcademico} />
        <View style={styles.sep} />
        <InfoRow label="Instituição" value={participant.origemInstitucional} />
        <View style={styles.sep} />
        <InfoRow label="Estado" value="Aprovado" highlight />
      </View>
    </>
  );
}

function ApresentacaoTab({
  participant,
  mySubmission,
  onSubmit,
}: {
  participant: NonNullable<ReturnType<typeof useEvent>["participants"][0]>;
  mySubmission: Submission | undefined;
  onSubmit: ReturnType<typeof useEvent>["submitPresentation"];
}) {
  const [tema, setTema] = useState(mySubmission?.tema ?? "");
  const [palavraChave, setPalavraChave] = useState(mySubmission?.palavraChave ?? "");
  const [resumo, setResumo] = useState(mySubmission?.resumo ?? "");
  const [fileName, setFileName] = useState(mySubmission?.fileName ?? "");
  const [fileUri, setFileUri] = useState(mySubmission?.fileUri ?? "");
  const [fileSize, setFileSize] = useState<number | undefined>(mySubmission?.fileSize);
  const [loading, setLoading] = useState(false);

  const MIN_FILE_SIZE = 5 * 1024 * 1024;

  const isSubmitted = mySubmission && mySubmission.status === "pendente";
  const isApproved = mySubmission?.status === "aprovado";
  const isRejected = mySubmission?.status === "rejeitado";
  const canSubmit = !isSubmitted;

  async function handlePickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const size = asset.size ?? 0;
        if (size > 0 && size < MIN_FILE_SIZE) {
          Alert.alert(
            "Ficheiro Muito Pequeno",
            `O ficheiro deve ter pelo menos 5 MB. O ficheiro seleccionado tem ${(size / (1024 * 1024)).toFixed(2)} MB.`
          );
          return;
        }
        setFileName(asset.name);
        setFileUri(asset.uri);
        setFileSize(size || undefined);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível seleccionar o ficheiro.");
    }
  }

  async function handleSubmit() {
    if (!tema.trim()) { Alert.alert("Erro", "Por favor insira o tema da apresentação."); return; }
    if (!palavraChave.trim()) { Alert.alert("Erro", "Por favor insira as palavras-chave."); return; }
    if (!resumo.trim() || resumo.trim().length < 50) { Alert.alert("Erro", "O resumo deve ter pelo menos 50 caracteres."); return; }

    setLoading(true);
    try {
      const result = await onSubmit(participant.id, participant.nomeCompleto, {
        tema: tema.trim(),
        palavraChave: palavraChave.trim(),
        resumo: resumo.trim(),
        fileName: fileName || undefined,
        fileUri: fileUri || undefined,
        fileSize: fileSize,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Submissão Recebida",
          "A sua apresentação foi submetida com sucesso e está a aguardar aprovação do Conselho Científico.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Erro", result.error ?? "Ocorreu um erro ao submeter.");
      }
    } catch {
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ gap: 16 }}>
      {isSubmitted && (
        <View style={styles.pendingSubmissionBanner}>
          <Text style={{ fontSize: 22 }}>⏳</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingBannerTitle}>Aguarda Aprovação</Text>
            <Text style={styles.pendingBannerSub}>
              A sua apresentação está a ser avaliada pelo Conselho Científico. Receberá uma notificação quando houver uma decisão.
            </Text>
          </View>
        </View>
      )}

      {isApproved && (
        <View style={styles.approvedSubmissionBanner}>
          <Text style={{ fontSize: 22 }}>✅</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pendingBannerTitle, { color: "#16A34A" }]}>Apresentação Aprovada</Text>
            <Text style={styles.pendingBannerSub}>A sua apresentação foi aprovada pelo Conselho Científico.</Text>
          </View>
        </View>
      )}

      {isRejected && (
        <View style={styles.rejectedSubmissionBanner}>
          <Text style={{ fontSize: 22 }}>❌</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pendingBannerTitle, { color: "#DC2626" }]}>Não Aprovada</Text>
            <Text style={styles.pendingBannerSub}>A sua apresentação não foi aprovada. Pode submeter uma nova apresentação.</Text>
          </View>
        </View>
      )}

      {mySubmission && (
        <View style={styles.submissionCard}>
          <Text style={styles.sectionTitle}>Submissão Actual</Text>
          <View style={styles.submField}>
            <Text style={styles.submLabel}>Tema</Text>
            <Text style={styles.submValue}>{mySubmission.tema}</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.submField}>
            <Text style={styles.submLabel}>Palavras-chave</Text>
            <Text style={styles.submValue}>{mySubmission.palavraChave}</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.submField}>
            <Text style={styles.submLabel}>Resumo</Text>
            <Text style={styles.submValue}>{mySubmission.resumo}</Text>
          </View>
          {mySubmission.fileName && (
            <>
              <View style={styles.sep} />
              <View style={styles.fileRow}>
                <Text style={{ fontSize: 18 }}>📄</Text>
                <Text style={styles.submValue} numberOfLines={1}>{mySubmission.fileName}</Text>
              </View>
            </>
          )}
        </View>
      )}

      {canSubmit && (
        <View style={styles.submissionForm}>
          <Text style={styles.sectionTitle}>
            {isRejected ? "Nova Submissão" : "Submeter Apresentação"}
          </Text>
          <Text style={styles.formDesc}>
            Preencha os dados da sua apresentação para o Congresso de Alimento 2026.
          </Text>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>Tema da Apresentação *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Introduza o tema da sua apresentação"
              placeholderTextColor={C.textMuted}
              value={tema}
              onChangeText={setTema}
              multiline={false}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>Palavras-chave *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ex: nutrição, agro-alimentar, sustentabilidade"
              placeholderTextColor={C.textMuted}
              value={palavraChave}
              onChangeText={setPalavraChave}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>Resumo *</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="Escreva um resumo da sua apresentação (mín. 50 caracteres)..."
              placeholderTextColor={C.textMuted}
              value={resumo}
              onChangeText={setResumo}
              multiline
              textAlignVertical="top"
              numberOfLines={5}
            />
            <Text style={styles.charCount}>{resumo.length} caracteres</Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>Ficheiro PDF/DOC <Text style={{ color: "#6B7280", fontSize: 12 }}>(mín. 5 MB)</Text></Text>
            <Pressable style={styles.filePickerBtn} onPress={handlePickFile}>
              <Text style={{ fontSize: 18 }}>📎</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.filePickerText} numberOfLines={1}>
                  {fileName ? fileName : "Seleccionar ficheiro PDF ou DOC"}
                </Text>
                {fileSize ? (
                  <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                    {(fileSize / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                ) : null}
              </View>
            </Pressable>
            <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
              O ficheiro deve ter pelo menos 5 MB
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? "A submeter..." : "Submeter Apresentação"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function NotificacoesTab({
  notifications,
  onMarkRead,
}: {
  notifications: Notification[];
  onMarkRead: (id: string) => Promise<void>;
}) {
  if (notifications.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ fontSize: 40 }}>🔔</Text>
        <Text style={styles.emptyTitle}>Sem notificações</Text>
        <Text style={styles.emptySub}>Receberá notificações do Conselho Científico aqui.</Text>
      </View>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      {notifications.map((n) => {
        const typeIcons: Record<string, string> = {
          message: "✉️",
          submission_approved: "✅",
          submission_rejected: "❌",
          new_registration: "👤",
        };
        return (
          <Pressable
            key={n.id}
            style={[styles.notifCard, !n.read && styles.notifCardUnread]}
            onPress={() => { if (!n.read) onMarkRead(n.id); }}
          >
            <View style={styles.notifIcon}>
              <Text style={{ fontSize: 20 }}>{typeIcons[n.type] ?? "🔔"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.notifTitleRow}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                {!n.read && <View style={styles.newDot} />}
              </View>
              <Text style={styles.notifBody}>{n.body}</Text>
              <Text style={styles.notifTime}>
                {new Date(n.createdAt).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function ProgramaTab({ days }: { days: ProgramDay[] }) {
  if (days.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ fontSize: 40 }}>📅</Text>
        <Text style={styles.emptyTitle}>Programa ainda não disponível</Text>
        <Text style={styles.emptySub}>O programa do congresso será publicado em breve.</Text>
      </View>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <View style={{ gap: 20 }}>
      {days.map((day) => {
        const isToday = day.data === today;
        const activeItem = day.itens.find((i) => i.status === "ativo");
        const sortedItens = [...day.itens].sort((a, b) => {
          if (a.horaInicio < b.horaInicio) return -1;
          if (a.horaInicio > b.horaInicio) return 1;
          return a.ordem - b.ordem;
        });
        return (
          <View key={day.id} style={[styles.programDayCard, isToday && styles.programDayCardToday]}>
            <View style={[styles.programDayHeader, isToday && styles.programDayHeaderToday]}>
              <View>
                <Text style={[styles.programDayTitle, isToday && { color: "#fff" }]}>
                  {day.titulo || "Dia do Congresso"}
                </Text>
                <Text style={[styles.programDayDate, isToday && { color: "rgba(255,255,255,0.75)" }]}>
                  {new Date(day.data + "T12:00:00").toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </Text>
              </View>
              {isToday && (
                <View style={styles.programTodayBadge}>
                  <Text style={styles.programTodayBadgeText}>HOJE</Text>
                </View>
              )}
            </View>

            {activeItem && (
              <View style={styles.programActiveBanner}>
                <View style={styles.programActiveDot} />
                <Text style={styles.programActiveBannerText}>A decorrer: {activeItem.tema}</Text>
              </View>
            )}

            {sortedItens.length === 0 ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: C.textMuted, fontSize: 13, fontFamily: "Inter_400Regular" }}>Sem itens no programa</Text>
              </View>
            ) : (
              <View>
                {sortedItens.map((item, idx) => {
                  const isAtivo = item.status === "ativo";
                  const isConcluido = item.status === "concluido";
                  return (
                    <View key={item.id}>
                      {idx > 0 && <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 16 }} />}
                      <View style={[styles.programItem, isAtivo && styles.programItemAtivo]}>
                        <View style={[styles.programItemIndicator, isAtivo && styles.programItemIndicatorAtivo, isConcluido && styles.programItemIndicatorConcluido]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.programItemTema, isConcluido && styles.programItemTemaConcluido]} numberOfLines={2}>
                            {item.tema}
                          </Text>
                          <Text style={styles.programItemHora}>
                            {item.horaInicio} – {item.horaFim}
                          </Text>
                        </View>
                        <View style={[
                          styles.programItemBadge,
                          isAtivo && styles.programItemBadgeAtivo,
                          isConcluido && styles.programItemBadgeConcluido,
                        ]}>
                          {isAtivo && <View style={styles.programPulseDot} />}
                          <Text style={[
                            styles.programItemBadgeText,
                            isAtivo && { color: "#16A34A" },
                            isConcluido && { color: "#6B7280" },
                          ]}>
                            {isAtivo ? "Em curso" : isConcluido ? "Concluído" : "Pendente"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && { color: C.tint, fontFamily: "Inter_700Bold" }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.backgroundSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerLogo: { width: 40, height: 28 },
  headerGreeting: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  headerName: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text, maxWidth: 180 },
  notifBtn: { position: "relative", width: 38, height: 38, alignItems: "center", justifyContent: "center", backgroundColor: C.backgroundSecondary, borderRadius: 19 },
  notifBadge: { position: "absolute", top: 2, right: 2, backgroundColor: "#EF4444", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  notifBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  logoutBtn: { backgroundColor: "#FEE2E2", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#DC2626" },
  tabs: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 5, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: C.tint },
  tabText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary },
  tabTextActive: { fontFamily: "Inter_700Bold", color: C.tint },
  tabBadge: { backgroundColor: "#EF4444", borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  content: { padding: 16, gap: 16 },
  approvedBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F0FDF4", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#86EFAC" },
  approvedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  approvedText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#16A34A" },
  qrCard: { backgroundColor: "#fff", borderRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 },
  qrHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: C.navy },
  qrEventTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  qrOrg: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  qrCenter: { alignItems: "center", paddingVertical: 24, backgroundColor: "#F8FAFC" },
  qrDetails: { padding: 16, gap: 10 },
  qrName: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  qrUsername: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.tint, marginTop: -6 },
  qrBadgeRow: { flexDirection: "row", gap: 8 },
  qrBadge: { backgroundColor: C.tint, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  qrBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  qrMetaRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  qrMetaLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary, width: 110 },
  qrMetaValue: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: C.text, lineHeight: 20 },
  qrFooter: { padding: 14, backgroundColor: C.backgroundTertiary, borderTopWidth: 1, borderTopColor: C.border, alignItems: "center" },
  qrFooterText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  infoCard: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  infoTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.text, textTransform: "uppercase", letterSpacing: 0.8, padding: 16, paddingBottom: 12 },
  sep: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  infoLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  pendingSubmissionBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#FFFBEB", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#FDE68A" },
  approvedSubmissionBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#F0FDF4", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#86EFAC" },
  rejectedSubmissionBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#FEF2F2", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#FECACA" },
  pendingBannerTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#D97706", marginBottom: 2 },
  pendingBannerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 19 },
  submissionCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 0, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.text, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  submField: { paddingVertical: 10 },
  submLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  submValue: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.text, lineHeight: 20 },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  submissionForm: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  formDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 19, marginTop: -6 },
  formField: { gap: 6 },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text },
  formInput: { backgroundColor: C.inputBackground, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", color: C.text },
  textArea: { minHeight: 110, paddingTop: 12 },
  charCount: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "right" },
  filePickerBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.inputBackground, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed", padding: 14 },
  filePickerText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  submitBtn: { backgroundColor: C.tint, borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center", shadowColor: C.tint, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  submitBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  notifCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, gap: 0, flexDirection: "row", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  notifCardUnread: { backgroundColor: "#F0FDF4", borderLeftWidth: 3, borderLeftColor: C.tint },
  notifIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  notifTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  notifTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text },
  newDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.tint },
  notifBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 19 },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 4 },
  emptyState: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", lineHeight: 22 },
  programDayCard: { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  programDayCardToday: { shadowOpacity: 0.12, elevation: 5 },
  programDayHeader: { padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.backgroundTertiary, borderBottomWidth: 1, borderBottomColor: C.border },
  programDayHeaderToday: { backgroundColor: C.tint, borderBottomColor: "transparent" },
  programDayTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text },
  programDayDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2, textTransform: "capitalize" },
  programTodayBadge: { backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  programTodayBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.5 },
  programActiveBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F0FDF4", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#BBF7D0" },
  programActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16A34A" },
  programActiveBannerText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#16A34A", flex: 1 },
  programItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  programItemAtivo: { backgroundColor: "#F0FDF4" },
  programItemIndicator: { width: 4, height: 36, borderRadius: 2, backgroundColor: C.border },
  programItemIndicatorAtivo: { backgroundColor: "#16A34A" },
  programItemIndicatorConcluido: { backgroundColor: "#D1D5DB" },
  programItemTema: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text, lineHeight: 20 },
  programItemTemaConcluido: { color: C.textMuted, textDecorationLine: "line-through" },
  programItemHora: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  programItemBadge: { backgroundColor: C.backgroundTertiary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 4 },
  programItemBadgeAtivo: { backgroundColor: "#DCFCE7" },
  programItemBadgeConcluido: { backgroundColor: "#F3F4F6" },
  programItemBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.textSecondary },
  programPulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A" },
  profileBtn: { width: 34, height: 34, borderRadius: 17, overflow: "hidden" },
  profileAvatar: { width: 34, height: 34, borderRadius: 17 },
  profileAvatarFallback: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  profileAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  welcomeCard: { backgroundColor: C.navy, borderRadius: 18, padding: 18, gap: 4 },
  welcomeTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  welcomeSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  statusCard: { borderRadius: 14, padding: 16, borderWidth: 2, gap: 6 },
  statusCardLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  statusCardValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statusCardAction: { marginTop: 4 },
  statusCardActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#166534" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, alignItems: "center", gap: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: C.textSecondary, textAlign: "center" },
  dashCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  dashCardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text },
  dashCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  dashCardSub2: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, fontStyle: "italic" },
  dashCardRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  dashCardLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  dashCardValue: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.text, flex: 1 },
  dashCardBtn: { marginTop: 4 },
  dashCardBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.tint },
  subStatusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  subStatusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  activeItemRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#F0FDF4", borderRadius: 10, padding: 10 },
  activeItemDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#16A34A", marginTop: 4 },
  activeItemLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#16A34A", textTransform: "uppercase" },
  activeItemTema: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text, marginTop: 2 },
  activeItemTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  quickActions: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  quickActionsTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.text },
  quickActionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickActionItem: { flex: 1, minWidth: "40%", backgroundColor: C.backgroundSecondary, borderRadius: 14, padding: 14, alignItems: "center", gap: 8 },
  quickActionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text },
});
