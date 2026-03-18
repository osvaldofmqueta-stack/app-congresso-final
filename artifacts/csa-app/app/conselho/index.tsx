import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmModal } from "@/components/ConfirmModal";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { Submission, SubmissionStatus, useEvent } from "@/contexts/EventContext";

const C = Colors.light;

type Tab = "pendentes" | "todas";

export default function ConselhoScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { submissions, approveSubmission, rejectSubmission, sendConselhoMessage } = useEvent();

  const [activeTab, setActiveTab] = useState<Tab>("pendentes");
  const [messageModal, setMessageModal] = useState<{ visible: boolean; participantId: string; participantName: string }>({ visible: false, participantId: "", participantName: "" });
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [subActionModal, setSubActionModal] = useState<{ visible: boolean; type: "approve" | "reject"; sub: Submission | null }>({ visible: false, type: "approve", sub: null });
  const [infoModal, setInfoModal] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: "", message: "" });

  function showInfo(title: string, message: string) {
    setInfoModal({ visible: true, title, message });
  }

  function handleLogout() {
    logout();
    router.replace("/");
  }

  const pendingSubmissions = submissions.filter((s) => s.status === "pendente");
  const allSubmissions = activeTab === "pendentes" ? pendingSubmissions : submissions;

  function handleApprove(sub: Submission) {
    setSubActionModal({ visible: true, type: "approve", sub });
  }

  function handleReject(sub: Submission) {
    setSubActionModal({ visible: true, type: "reject", sub });
  }

  async function executeSubAction() {
    if (!subActionModal.sub) return;
    const { type, sub } = subActionModal;
    setSubActionModal((p) => ({ ...p, visible: false }));
    if (type === "approve") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await approveSubmission(sub.id);
      showInfo("Apresentação Aprovada ✓", `A apresentação de ${sub.participantName} foi aprovada com sucesso.`);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await rejectSubmission(sub.id);
      showInfo("Apresentação Rejeitada", `A apresentação de ${sub.participantName} foi rejeitada.`);
    }
  }

  async function handleSendMessage() {
    if (!message.trim()) {
      showInfo("Mensagem Vazia", "Por favor escreva uma mensagem antes de enviar.");
      return;
    }
    setSendingMessage(true);
    await sendConselhoMessage(messageModal.participantId, messageModal.participantName, message.trim());
    setSendingMessage(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMessageModal({ visible: false, participantId: "", participantName: "" });
    setMessage("");
    showInfo("Mensagem Enviada ✓", "A mensagem foi enviada ao participante com sucesso.");
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require("@/assets/images/csa-logo.png")} style={styles.headerLogo} resizeMode="contain" />
          <View>
            <Text style={styles.headerTitle}>Conselho Científico</Text>
            <Text style={styles.headerSub}>{user?.name}</Text>
          </View>
        </View>
        <Pressable onPress={() => setLogoutModalVisible(true)} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: "#F59E0B", borderTopWidth: 3 }]}>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>{pendingSubmissions.length}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: C.tint, borderTopWidth: 3 }]}>
          <Text style={[styles.statValue, { color: C.tint }]}>{submissions.filter((s) => s.status === "aprovado").length}</Text>
          <Text style={styles.statLabel}>Aprovadas</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: C.error, borderTopWidth: 3 }]}>
          <Text style={[styles.statValue, { color: C.error }]}>{submissions.filter((s) => s.status === "rejeitado").length}</Text>
          <Text style={styles.statLabel}>Rejeitadas</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: C.navy, borderTopWidth: 3 }]}>
          <Text style={[styles.statValue, { color: C.navy }]}>{submissions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {([
          { id: "pendentes", label: "Pendentes", badge: pendingSubmissions.length },
          { id: "todas", label: "Todas", badge: null },
        ] as { id: Tab; label: string; badge: number | null }[]).map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            {tab.badge !== null && tab.badge > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.badge}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {allSubmissions.length === 0 ? (
          <EmptyState
            icon="📋"
            title={activeTab === "pendentes" ? "Sem submissões pendentes" : "Nenhuma submissão encontrada"}
            sub={activeTab === "pendentes" ? "Todas as submissões foram avaliadas." : "Os participantes ainda não submeteram apresentações."}
          />
        ) : (
          allSubmissions.map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              onApprove={() => handleApprove(sub)}
              onReject={() => handleReject(sub)}
              onMessage={() => {
                setMessageModal({ visible: true, participantId: sub.participantId, participantName: sub.participantName });
                setMessage("");
              }}
            />
          ))
        )}
      </ScrollView>

      <Modal visible={messageModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enviar Mensagem</Text>
            <Text style={styles.modalSub}>
              Para: <Text style={{ fontFamily: "Inter_700Bold" }}>{messageModal.participantName}</Text>
            </Text>
            <View style={styles.messageInputBox}>
              <TextInput
                style={styles.messageInput}
                placeholder="Escreva a sua mensagem..."
                placeholderTextColor={C.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
              />
            </View>
            <View style={styles.modalBtns}>
              <Pressable
                style={styles.modalBtnCancel}
                onPress={() => setMessageModal({ visible: false, participantId: "", participantName: "" })}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtnConfirm, sendingMessage && { opacity: 0.7 }]}
                onPress={handleSendMessage}
                disabled={sendingMessage}
              >
                <Text style={styles.modalBtnConfirmText}>
                  {sendingMessage ? "A enviar..." : "Enviar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={subActionModal.visible && subActionModal.type === "approve"}
        title="Aprovar Apresentação"
        message={`Deseja aprovar a apresentação de ${subActionModal.sub?.participantName ?? ""}?`}
        confirmText="Aprovar"
        cancelText="Cancelar"
        onConfirm={executeSubAction}
        onCancel={() => setSubActionModal((p) => ({ ...p, visible: false }))}
      />
      <ConfirmModal
        visible={subActionModal.visible && subActionModal.type === "reject"}
        title="Rejeitar Apresentação"
        message={`Deseja rejeitar a apresentação de ${subActionModal.sub?.participantName ?? ""}?`}
        confirmText="Rejeitar"
        cancelText="Cancelar"
        confirmDestructive
        onConfirm={executeSubAction}
        onCancel={() => setSubActionModal((p) => ({ ...p, visible: false }))}
      />
      <ConfirmModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        confirmText="OK"
        hideCancel
        onConfirm={() => setInfoModal((p) => ({ ...p, visible: false }))}
      />
      <ConfirmModal
        visible={logoutModalVisible}
        title="Sair do Painel"
        message="Tem a certeza que deseja terminar a sessão do Conselho Científico?"
        confirmText="Sair"
        cancelText="Cancelar"
        confirmDestructive
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />
    </View>
  );
}

function SubmissionCard({
  submission: s,
  onApprove,
  onReject,
  onMessage,
}: {
  submission: Submission;
  onApprove: () => void;
  onReject: () => void;
  onMessage: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<SubmissionStatus, string> = { pendente: "#F59E0B", aprovado: C.tint, rejeitado: C.error };
  const statusBg: Record<SubmissionStatus, string> = { pendente: "#FFFBEB", aprovado: "#F0FDF4", rejeitado: "#FEF2F2" };
  const statusLabels: Record<SubmissionStatus, string> = { pendente: "Pendente", aprovado: "Aprovada", rejeitado: "Rejeitada" };

  return (
    <View style={styles.submCard}>
      <Pressable onPress={() => setExpanded((v) => !v)}>
        <View style={styles.submCardTop}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{s.participantName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.submParticipantName} numberOfLines={1}>{s.participantName}</Text>
            <Text style={styles.submTema} numberOfLines={1}>{s.tema}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg[s.status] }]}>
            <Text style={[styles.statusBadgeText, { color: statusColors[s.status] }]}>
              {statusLabels[s.status]}
            </Text>
          </View>
        </View>
        <Text style={styles.submDate}>
          Submetida em {new Date(s.submittedAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}
        </Text>
        <Text style={styles.expandHint}>{expanded ? "▲ Recolher" : "▼ Ver detalhes"}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.submDetails}>
          <View style={styles.detailField}>
            <Text style={styles.detailLabel}>Palavras-chave</Text>
            <Text style={styles.detailValue}>{s.palavraChave}</Text>
          </View>
          <View style={styles.detailField}>
            <Text style={styles.detailLabel}>Resumo</Text>
            <Text style={styles.detailValue}>{s.resumo}</Text>
          </View>
          {s.fileName && (
            <View style={styles.fileRow}>
              <Text style={{ fontSize: 16 }}>📄</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{s.fileName}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.submActions}>
        <Pressable style={styles.msgBtn} onPress={onMessage}>
          <Text style={styles.msgBtnText}>✉ Mensagem</Text>
        </Pressable>
        {s.status === "pendente" && (
          <>
            <Pressable style={styles.rejectBtn} onPress={onReject}>
              <Text style={styles.rejectBtnText}>✕ Rejeitar</Text>
            </Pressable>
            <Pressable style={styles.approveBtn} onPress={onApprove}>
              <Text style={styles.approveBtnText}>✓ Aprovar</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 40 }}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.backgroundSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 40, height: 28 },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  logoutBtn: { backgroundColor: "#FEE2E2", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#DC2626" },
  statsRow: { flexDirection: "row", gap: 10, padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border },
  statCard: { flex: 1, backgroundColor: C.backgroundSecondary, borderRadius: 12, padding: 10, alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: C.textSecondary, textAlign: "center" },
  tabs: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 6, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: C.tint },
  tabText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  tabTextActive: { fontFamily: "Inter_700Bold", color: C.tint },
  tabBadge: { backgroundColor: "#EF4444", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  list: { padding: 14, gap: 12 },
  submCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  submCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  submParticipantName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  submTema: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  submDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  expandHint: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.tint, marginTop: 6 },
  submDetails: { backgroundColor: C.backgroundSecondary, borderRadius: 12, padding: 12, gap: 10, marginTop: 4 },
  detailField: { gap: 3 },
  detailLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.text, lineHeight: 19, flex: 1 },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  submActions: { flexDirection: "row", gap: 8 },
  msgBtn: { flex: 1, height: 38, borderRadius: 10, backgroundColor: "#EEF2FF", borderWidth: 1, borderColor: "#C7D2FE", alignItems: "center", justifyContent: "center" },
  msgBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#4F46E5" },
  rejectBtn: { flex: 1, height: 38, borderRadius: 10, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", alignItems: "center", justifyContent: "center" },
  rejectBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#DC2626" },
  approveBtn: { flex: 1, height: 38, borderRadius: 10, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#86EFAC", alignItems: "center", justifyContent: "center" },
  approveBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#16A34A" },
  emptyState: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 24, width: "100%", gap: 14 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  messageInputBox: { backgroundColor: C.inputBackground, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, padding: 14, minHeight: 100 },
  messageInput: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.text, minHeight: 80 },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalBtnCancel: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  modalBtnCancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  modalBtnConfirm: { flex: 1, height: 46, borderRadius: 12, backgroundColor: C.tint, alignItems: "center", justifyContent: "center" },
  modalBtnConfirmText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
