import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmModal } from "@/components/ConfirmModal";
import { ParticipantsChart } from "@/components/ParticipantsChart";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import {
  EIXOS,
  Notification,
  Participant,
  PasswordResetRequest,
  SPECTATOR_LABELS,
  Submission,
  SubmissionStatus,
  StatusType,
  useEvent,
} from "@/contexts/EventContext";
import { useCongress } from "@/contexts/CongressContext";
import { ProgramDay, ProgramItem, useProgram } from "@/contexts/ProgramContext";

const C = Colors.light;

type Tab = "dashboard" | "participantes" | "apresentacoes" | "presenca" | "senhas" | "programa";

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, isCEO, permissions } = useAuth();
  const {
    participants,
    resetRequests,
    notifications,
    submissions,
    approveParticipant,
    rejectParticipant,
    deleteParticipant,
    approvePasswordReset,
    rejectPasswordReset,
    approveSubmission,
    rejectSubmission,
    sendConselhoMessage,
    markAllReadForTarget,
    getUnreadCount,
    markAttendance,
  } = useEvent();

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [filterStatus, setFilterStatus] = useState<StatusType | "all">("all");
  const [newPasswordModal, setNewPasswordModal] = useState<{ visible: boolean; requestId: string; username: string }>({ visible: false, requestId: "", username: "" });
  const [newPassword, setNewPassword] = useState("");
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [actionModal, setActionModal] = useState<{ visible: boolean; type: "approve" | "reject" | "delete" | "rejectPwd"; id: string; nome: string }>({ visible: false, type: "approve", id: "", nome: "" });
  const [infoModal, setInfoModal] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: "", message: "" });
  const [subActionModal, setSubActionModal] = useState<{ visible: boolean; type: "approve" | "reject"; sub: Submission | null }>({ visible: false, type: "approve", sub: null });
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanResult, setScanResult] = useState<{ visible: boolean; success: boolean; name: string; alreadyPresent: boolean } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [adminMsgModal, setAdminMsgModal] = useState<{ visible: boolean; participantId: string; participantName: string }>({ visible: false, participantId: "", participantName: "" });
  const [adminMsg, setAdminMsg] = useState("");
  const [sendingAdminMsg, setSendingAdminMsg] = useState(false);

  const { days, addDay, updateDay, deleteDay, addItem, updateItem, deleteItem, markItemAtivo, markItemConcluido, markItemPendente } = useProgram();

  function showInfo(title: string, message: string) {
    setInfoModal({ visible: true, title, message });
  }

  function handleLogout() {
    logout();
    router.replace("/");
  }

  const pendingCount = participants.filter((p) => p.status === "pendente").length;
  const approvedCount = participants.filter((p) => p.status === "aprovado").length;
  const rejectedCount = participants.filter((p) => p.status === "rejeitado").length;
  const pendingResets = resetRequests.filter((r) => r.status === "pendente");
  const adminNotifications = notifications.filter((n) => n.targetId === "admin");
  const unreadCount = getUnreadCount("admin");
  const pendingSubmissions = submissions.filter((s) => s.status === "pendente").length;
  const approvedParticipants = participants.filter((p) => p.status === "aprovado");
  const presentCount = approvedParticipants.filter((p) => p.presente).length;

  const filtered = filterStatus === "all"
    ? participants
    : participants.filter((p) => p.status === filterStatus);

  function handleApprove(id: string, nome: string) {
    setActionModal({ visible: true, type: "approve", id, nome });
  }

  function handleReject(id: string, nome: string) {
    setActionModal({ visible: true, type: "reject", id, nome });
  }

  function handleDelete(id: string, nome: string) {
    setActionModal({ visible: true, type: "delete", id, nome });
  }

  function handleRejectPwd(id: string, username: string) {
    setActionModal({ visible: true, type: "rejectPwd", id, nome: username });
  }

  async function executeAction() {
    const { type, id, nome } = actionModal;
    setActionModal((prev) => ({ ...prev, visible: false }));
    if (type === "approve") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await approveParticipant(id);
      showInfo("Participante Aprovado", `A inscrição de ${nome} foi aprovada com sucesso.`);
    } else if (type === "reject") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await rejectParticipant(id);
      showInfo("Inscrição Rejeitada", `A inscrição de ${nome} foi rejeitada.`);
    } else if (type === "delete") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await deleteParticipant(id);
      showInfo("Registo Eliminado", `O registo de ${nome} foi eliminado permanentemente.`);
    } else if (type === "rejectPwd") {
      await rejectPasswordReset(id);
      showInfo("Pedido Rejeitado", `O pedido de redefinição de ${nome} foi rejeitado.`);
    }
  }

  async function handlePasswordApprove() {
    if (!newPassword || newPassword.length < 6) {
      showInfo("Senha Inválida", "A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    await approvePasswordReset(newPasswordModal.requestId, newPassword);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewPasswordModal({ visible: false, requestId: "", username: "" });
    setNewPassword("");
    showInfo("Senha Redefinida", "A nova senha foi definida com sucesso.");
  }

  function handleSubApprove(sub: Submission) {
    setSubActionModal({ visible: true, type: "approve", sub });
  }

  function handleSubReject(sub: Submission) {
    setSubActionModal({ visible: true, type: "reject", sub });
  }

  async function executeSubAction() {
    if (!subActionModal.sub) return;
    const { type, sub } = subActionModal;
    setSubActionModal((p) => ({ ...p, visible: false }));
    if (type === "approve") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await approveSubmission(sub.id);
      showInfo("Apresentação Aprovada", `A apresentação de ${sub.participantName} foi aprovada.`);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await rejectSubmission(sub.id);
      showInfo("Apresentação Rejeitada", `A apresentação de ${sub.participantName} foi rejeitada.`);
    }
  }

  async function handleOpenScanner() {
    if (Platform.OS === "web") {
      showInfo("Indisponível na Web", "Use a aplicação móvel para leitura de QR Codes.");
      return;
    }
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        showInfo("Permissão Negada", "É necessário acesso à câmara para usar o leitor de QR Code.");
        return;
      }
    }
    setScanning(false);
    setScannerVisible(true);
  }

  async function handleQRScanned(data: string) {
    if (scanning) return;
    setScanning(true);
    try {
      const parsed = JSON.parse(data);
      const participantId = parsed.id;
      if (!participantId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setScannerVisible(false);
        showInfo("QR Inválido", "Este QR Code não corresponde a nenhum participante.");
        return;
      }
      const result = await markAttendance(participantId);
      setScannerVisible(false);
      if (result.success) {
        Haptics.notificationAsync(
          result.alreadyPresent ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
        );
        setScanResult({ visible: true, success: true, name: result.participantName ?? "", alreadyPresent: result.alreadyPresent ?? false });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showInfo("Não Encontrado", "Este QR Code não corresponde a nenhum participante registado.");
      }
    } catch {
      setScannerVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showInfo("QR Inválido", "Não foi possível ler este QR Code.");
    }
  }

  async function handleAdminSendMessage() {
    if (!adminMsg.trim()) { showInfo("Mensagem Vazia", "Escreva uma mensagem antes de enviar."); return; }
    setSendingAdminMsg(true);
    await sendConselhoMessage(adminMsgModal.participantId, adminMsgModal.participantName, adminMsg.trim());
    setSendingAdminMsg(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAdminMsgModal({ visible: false, participantId: "", participantName: "" });
    setAdminMsg("");
    showInfo("Mensagem Enviada ✓", "A mensagem foi enviada ao participante.");
  }

  const roleLabel = user?.role === "ceo" ? "CEO · Director Geral" : user?.role === "supervisor" ? "Supervisor Geral" : "Conselho Científico";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require("@/assets/images/csa-logo.png")} style={styles.headerLogo} resizeMode="contain" />
          <View>
            <Text style={styles.headerTitle}>Painel Admin</Text>
            <Text style={styles.headerSub}>{roleLabel}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              setNotifModalVisible(true);
              if (unreadCount > 0) markAllReadForTarget("admin");
            }}
            style={styles.iconBtn}
          >
            <Ionicons name="notifications-outline" size={22} color={C.text} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => router.push("/profile")} style={styles.iconBtn}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: 28, height: 28, borderRadius: 14 }} />
            ) : (
              <Feather name="user" size={20} color={C.text} />
            )}
          </Pressable>
          <Pressable onPress={() => setLogoutModalVisible(true)} style={styles.iconBtn}>
            <Feather name="log-out" size={20} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "dashboard" && <DashboardTab
          pendingCount={pendingCount}
          approvedCount={approvedCount}
          rejectedCount={rejectedCount}
          presentCount={presentCount}
          totalApproved={approvedParticipants.length}
          pendingResets={pendingResets.length}
          pendingSubmissions={pendingSubmissions}
          participants={participants}
          isCEO={isCEO}
          onGoParticipantes={(s) => { setActiveTab("participantes"); setFilterStatus(s); }}
          onGoPresenca={() => setActiveTab("presenca")}
          onGoSenhas={() => setActiveTab("senhas")}
          onGoApresentacoes={() => setActiveTab("apresentacoes")}
        />}

        {activeTab === "participantes" && (
          <>
            <ParticipantsChart participants={participants} />
            <View style={styles.filterRow}>
              {(["all", "pendente", "aprovado", "rejeitado"] as const).map((s) => (
                <Pressable key={s} onPress={() => setFilterStatus(s)} style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, filterStatus === s && styles.filterChipTextActive]}>
                    {s === "all" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1) + "s"}
                  </Text>
                </Pressable>
              ))}
            </View>
            {filtered.length === 0
              ? <EmptyState icon="users" title="Nenhum participante" sub="Nenhum resultado para este filtro." />
              : filtered.map((p) => (
                <ParticipantCard
                  key={p.id}
                  participant={p}
                  canDelete={permissions.canDeleteParticipants}
                  onApprove={() => handleApprove(p.id, p.nomeCompleto)}
                  onReject={() => handleReject(p.id, p.nomeCompleto)}
                  onDelete={() => handleDelete(p.id, p.nomeCompleto)}
                  onView={() => router.push({ pathname: "/admin/participant", params: { id: p.id } })}
                />
              ))}
          </>
        )}

        {activeTab === "apresentacoes" && (
          submissions.length === 0
            ? <EmptyState icon="file-text" title="Sem submissões" sub="Os participantes ainda não submeteram apresentações." />
            : submissions.map((sub) => (
              <AdminSubmissionCard
                key={sub.id}
                submission={sub}
                canApprove={permissions.canApproveSubmissions}
                onApprove={() => handleSubApprove(sub)}
                onReject={() => handleSubReject(sub)}
                onMessage={() => {
                  setAdminMsgModal({ visible: true, participantId: sub.participantId, participantName: sub.participantName });
                  setAdminMsg("");
                }}
              />
            ))
        )}

        {activeTab === "presenca" && (
          <>
            <View style={styles.presenceStatsRow}>
              <PresenceStat value={presentCount} label="Presentes" color="#16A34A" bg="#DCFCE7" />
              <PresenceStat value={approvedParticipants.length - presentCount} label="Ausentes" color="#D97706" bg="#FEF9C3" />
              <PresenceStat value={approvedParticipants.length} label="Total" color={C.navy} bg="#EEF2FF" />
            </View>
            <Pressable style={styles.scannerBtn} onPress={handleOpenScanner}>
              <View style={styles.scannerBtnIcon}>
                <Ionicons name="qr-code-outline" size={26} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scannerBtnText}>Marcar Presença</Text>
                <Text style={styles.scannerBtnSub}>Leia o QR Code do crachá do participante</Text>
              </View>
              <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
            {approvedParticipants.length === 0
              ? <EmptyState icon="users" title="Sem aprovados" sub="Aprove participantes para gerir a sua presença." />
              : approvedParticipants.map((p) => (
                <View key={p.id} style={[styles.presenceCard, p.presente && styles.presenceCardPresent]}>
                  <View style={[styles.presenceDot, p.presente ? styles.presenceDotPresent : styles.presenceDotAbsent]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.presenceName} numberOfLines={1}>{p.nomeCompleto}</Text>
                    <Text style={styles.presenceMeta}>{SPECTATOR_LABELS[p.spectatorType]} · {p.origemTipo}</Text>
                    {p.presente && p.presenceMarkedAt && (
                      <Text style={styles.presenceTime}>
                        Entrada: {new Date(p.presenceMarkedAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.presenceBadge, p.presente ? styles.presenceBadgePresent : styles.presenceBadgeAbsent]}>
                    <Text style={[styles.presenceBadgeText, { color: p.presente ? "#16A34A" : "#6B7280" }]}>
                      {p.presente ? "Presente" : "Ausente"}
                    </Text>
                  </View>
                </View>
              ))}
          </>
        )}

        {activeTab === "senhas" && (
          pendingResets.length === 0
            ? <EmptyState icon="key" title="Sem pedidos de senha" sub="Nenhum pedido de redefinição pendente." />
            : pendingResets.map((req) => (
              <ResetRequestCard
                key={req.id}
                request={req}
                onApprove={() => { setNewPasswordModal({ visible: true, requestId: req.id, username: req.username }); setNewPassword(""); }}
                onReject={() => handleRejectPwd(req.id, req.username)}
              />
            ))
        )}

        {activeTab === "programa" && (
          <AdminProgramaTab
            days={days}
            onAddDay={addDay}
            onUpdateDay={updateDay}
            onDeleteDay={deleteDay}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onMarkAtivo={markItemAtivo}
            onMarkConcluido={markItemConcluido}
            onMarkPendente={markItemPendente}
          />
        )}
      </ScrollView>

      {/* ── BOTTOM NAV ── */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 6 }]}>
        <NavItem icon="grid" label="Início" active={activeTab === "dashboard"} onPress={() => setActiveTab("dashboard")} />
        <NavItem icon="users" label="Participantes" active={activeTab === "participantes"} badge={pendingCount} onPress={() => setActiveTab("participantes")} />
        {!isCEO && (
          <NavItem icon="file-text" label="Apresentações" active={activeTab === "apresentacoes"} badge={pendingSubmissions} onPress={() => setActiveTab("apresentacoes")} />
        )}
        <NavItem icon="calendar" label="Programa" active={activeTab === "programa"} onPress={() => setActiveTab("programa")} />
        <NavItem icon="check-circle" label="Presença" active={activeTab === "presenca"} onPress={() => setActiveTab("presenca")} />
        {isCEO && (
          <NavItem icon="key" label="Senhas" active={activeTab === "senhas"} badge={pendingResets.length} onPress={() => setActiveTab("senhas")} />
        )}
      </View>

      {/* ── NOTIFICATIONS MODAL ── */}
      <Modal visible={notifModalVisible} animationType="slide" transparent onRequestClose={() => setNotifModalVisible(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setNotifModalVisible(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Notificações</Text>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {adminNotifications.length === 0
                ? (
                  <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
                    <Ionicons name="notifications-off-outline" size={40} color={C.textMuted} />
                    <Text style={{ fontSize: 15, fontFamily: "Inter_500Medium", color: C.textSecondary }}>Sem notificações</Text>
                  </View>
                )
                : adminNotifications.map((n) => <NotificationCard key={n.id} notification={n} />)}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── SCANNER MODAL ── */}
      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <View style={styles.scannerModal}>
          <View style={[styles.scannerHeader, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.scannerTitle}>Marcar Presença</Text>
            <Text style={styles.scannerSub}>Aponte a câmara ao QR Code do crachá</Text>
          </View>
          {Platform.OS !== "web" && (
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanning ? undefined : (e) => handleQRScanned(e.data)}
            />
          )}
          <View style={styles.scannerFrame}>
            <View style={[styles.scannerCorner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[styles.scannerCorner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
            <View style={[styles.scannerCorner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[styles.scannerCorner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
          </View>
          <Pressable style={[styles.scannerCloseBtn, { paddingBottom: insets.bottom + 20 }]} onPress={() => setScannerVisible(false)}>
            <Feather name="x" size={18} color="#fff" />
            <Text style={styles.scannerCloseBtnText}>Cancelar</Text>
          </Pressable>
        </View>
      </Modal>

      {/* ── SCAN RESULT MODAL ── */}
      <Modal visible={!!scanResult?.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { alignItems: "center" }]}>
            <View style={[styles.resultIcon, { backgroundColor: scanResult?.alreadyPresent ? "#FEF9C3" : "#DCFCE7" }]}>
              <Ionicons name={scanResult?.alreadyPresent ? "warning-outline" : "checkmark-circle-outline"} size={44} color={scanResult?.alreadyPresent ? "#D97706" : "#16A34A"} />
            </View>
            <Text style={[styles.modalTitle, { textAlign: "center" }]}>
              {scanResult?.alreadyPresent ? "Já Registado" : "Presença Confirmada!"}
            </Text>
            <Text style={[styles.modalSub, { textAlign: "center" }]}>
              {scanResult?.alreadyPresent
                ? `${scanResult.name} já tem a presença registada.`
                : `A presença de ${scanResult?.name} foi registada com sucesso.`}
            </Text>
            <Pressable style={[styles.modalBtnConfirm, { width: "100%", height: 48, marginTop: 4 }]} onPress={() => { setScanResult(null); setScanning(false); }}>
              <Text style={styles.modalBtnConfirmText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── PASSWORD MODAL ── */}
      <Modal visible={newPasswordModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRow}>
              <View style={styles.modalIconWrap}><Feather name="key" size={22} color={C.navy} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Nova Senha</Text>
                <Text style={styles.modalSub}>Para: <Text style={{ fontFamily: "Inter_600SemiBold", color: C.text }}>@{newPasswordModal.username}</Text></Text>
              </View>
            </View>
            <View style={styles.pwdInputBox}>
              <Feather name="lock" size={16} color={C.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.pwdInput}
                placeholder="Nova senha (mín. 6 caracteres)"
                placeholderTextColor={C.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setNewPasswordModal({ visible: false, requestId: "", username: "" })}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.modalBtnConfirm} onPress={handlePasswordApprove}>
                <Text style={styles.modalBtnConfirmText}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── ADMIN MESSAGE MODAL ── */}
      <Modal visible={adminMsgModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enviar Mensagem</Text>
            <Text style={styles.modalSub}>
              Para: <Text style={{ fontFamily: "Inter_600SemiBold", color: C.text }}>{adminMsgModal.participantName}</Text>
            </Text>
            <View style={styles.pwdInputBox}>
              <TextInput
                style={[styles.pwdInput, { minHeight: 80, textAlignVertical: "top" }]}
                placeholder="Escreva a sua mensagem..."
                placeholderTextColor={C.textMuted}
                value={adminMsg}
                onChangeText={setAdminMsg}
                multiline
              />
            </View>
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setAdminMsgModal({ visible: false, participantId: "", participantName: "" })}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtnConfirm, sendingAdminMsg && { opacity: 0.6 }]} onPress={handleAdminSendMessage} disabled={sendingAdminMsg}>
                <Text style={styles.modalBtnConfirmText}>{sendingAdminMsg ? "A enviar..." : "Enviar"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal visible={actionModal.visible && actionModal.type === "approve"} title="Aprovar Participante" message={`Deseja aprovar a inscrição de ${actionModal.nome}?`} confirmText="Aprovar" cancelText="Cancelar" onConfirm={executeAction} onCancel={() => setActionModal((p) => ({ ...p, visible: false }))} />
      <ConfirmModal visible={actionModal.visible && actionModal.type === "reject"} title="Rejeitar Inscrição" message={`Deseja rejeitar a inscrição de ${actionModal.nome}?`} confirmText="Rejeitar" cancelText="Cancelar" confirmDestructive onConfirm={executeAction} onCancel={() => setActionModal((p) => ({ ...p, visible: false }))} />
      <ConfirmModal visible={actionModal.visible && actionModal.type === "delete"} title="Eliminar Registo" message={`Tem a certeza que deseja eliminar ${actionModal.nome}? Esta acção não pode ser desfeita.`} confirmText="Eliminar" cancelText="Cancelar" confirmDestructive onConfirm={executeAction} onCancel={() => setActionModal((p) => ({ ...p, visible: false }))} />
      <ConfirmModal visible={actionModal.visible && actionModal.type === "rejectPwd"} title="Rejeitar Pedido" message={`Rejeitar o pedido de redefinição de @${actionModal.nome}?`} confirmText="Rejeitar" cancelText="Cancelar" confirmDestructive onConfirm={executeAction} onCancel={() => setActionModal((p) => ({ ...p, visible: false }))} />
      <ConfirmModal visible={subActionModal.visible && subActionModal.type === "approve"} title="Aprovar Apresentação" message={`Deseja aprovar a apresentação de ${subActionModal.sub?.participantName ?? ""}?`} confirmText="Aprovar" cancelText="Cancelar" onConfirm={executeSubAction} onCancel={() => setSubActionModal((p) => ({ ...p, visible: false }))} />
      <ConfirmModal visible={subActionModal.visible && subActionModal.type === "reject"} title="Rejeitar Apresentação" message={`Deseja rejeitar a apresentação de ${subActionModal.sub?.participantName ?? ""}?`} confirmText="Rejeitar" cancelText="Cancelar" confirmDestructive onConfirm={executeSubAction} onCancel={() => setSubActionModal((p) => ({ ...p, visible: false }))} />
      <ConfirmModal visible={infoModal.visible} title={infoModal.title} message={infoModal.message} confirmText="OK" hideCancel onConfirm={() => setInfoModal((p) => ({ ...p, visible: false }))} />
      <ConfirmModal visible={logoutModalVisible} title="Terminar Sessão" message="Tem a certeza que deseja sair do painel administrativo?" confirmText="Sair" cancelText="Cancelar" confirmDestructive onConfirm={handleLogout} onCancel={() => setLogoutModalVisible(false)} />
    </View>
  );
}

// ── ADMIN PROGRAMA TAB ──
function AdminProgramaTab({
  days, onAddDay, onUpdateDay, onDeleteDay,
  onAddItem, onUpdateItem, onDeleteItem,
  onMarkAtivo, onMarkConcluido, onMarkPendente,
}: {
  days: ProgramDay[];
  onAddDay: (data: string, titulo: string) => Promise<void>;
  onUpdateDay: (id: string, data: string, titulo: string) => Promise<void>;
  onDeleteDay: (id: string) => Promise<void>;
  onAddItem: (dayId: string, tema: string, horaInicio: string, horaFim: string) => Promise<void>;
  onUpdateItem: (dayId: string, itemId: string, tema: string, horaInicio: string, horaFim: string) => Promise<void>;
  onDeleteItem: (dayId: string, itemId: string) => Promise<void>;
  onMarkAtivo: (dayId: string, itemId: string) => Promise<void>;
  onMarkConcluido: (dayId: string, itemId: string) => Promise<void>;
  onMarkPendente: (dayId: string, itemId: string) => Promise<void>;
}) {
  const [addDayModal, setAddDayModal] = useState(false);
  const [editDayModal, setEditDayModal] = useState<{ visible: boolean; day: ProgramDay | null }>({ visible: false, day: null });
  const [deleteDayModal, setDeleteDayModal] = useState<{ visible: boolean; dayId: string; titulo: string }>({ visible: false, dayId: "", titulo: "" });
  const [addItemModal, setAddItemModal] = useState<{ visible: boolean; dayId: string }>({ visible: false, dayId: "" });
  const [editItemModal, setEditItemModal] = useState<{ visible: boolean; dayId: string; item: ProgramItem | null }>({ visible: false, dayId: "", item: null });
  const [deleteItemModal, setDeleteItemModal] = useState<{ visible: boolean; dayId: string; itemId: string; tema: string }>({ visible: false, dayId: "", itemId: "", tema: "" });

  const [dayData, setDayData] = useState("");
  const [dayTitulo, setDayTitulo] = useState("");
  const [itemTema, setItemTema] = useState("");
  const [itemInicio, setItemInicio] = useState("");
  const [itemFim, setItemFim] = useState("");
  const [saving, setSaving] = useState(false);

  function openAddDay() {
    setDayData("");
    setDayTitulo("");
    setAddDayModal(true);
  }

  function openEditDay(day: ProgramDay) {
    setDayData(day.data);
    setDayTitulo(day.titulo);
    setEditDayModal({ visible: true, day });
  }

  function openAddItem(dayId: string) {
    setItemTema("");
    setItemInicio("");
    setItemFim("");
    setAddItemModal({ visible: true, dayId });
  }

  function openEditItem(dayId: string, item: ProgramItem) {
    setItemTema(item.tema);
    setItemInicio(item.horaInicio);
    setItemFim(item.horaFim);
    setEditItemModal({ visible: true, dayId, item });
  }

  function validateDate(d: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(d);
  }

  function validateTime(t: string) {
    return /^\d{2}:\d{2}$/.test(t);
  }

  async function handleSaveDay() {
    if (!dayData.trim() || !validateDate(dayData.trim())) {
      Alert.alert("Erro", "Data inválida. Use o formato AAAA-MM-DD.");
      return;
    }
    setSaving(true);
    try {
      await onAddDay(dayData.trim(), dayTitulo.trim() || "Dia do Congresso");
      setAddDayModal(false);
    } finally { setSaving(false); }
  }

  async function handleUpdateDay() {
    if (!editDayModal.day) return;
    if (!dayData.trim() || !validateDate(dayData.trim())) {
      Alert.alert("Erro", "Data inválida. Use o formato AAAA-MM-DD.");
      return;
    }
    setSaving(true);
    try {
      await onUpdateDay(editDayModal.day.id, dayData.trim(), dayTitulo.trim() || "Dia do Congresso");
      setEditDayModal({ visible: false, day: null });
    } finally { setSaving(false); }
  }

  async function handleSaveItem() {
    if (!itemTema.trim()) { Alert.alert("Erro", "O tema é obrigatório."); return; }
    if (!validateTime(itemInicio)) { Alert.alert("Erro", "Hora de início inválida. Use HH:MM."); return; }
    if (!validateTime(itemFim)) { Alert.alert("Erro", "Hora de fim inválida. Use HH:MM."); return; }
    setSaving(true);
    try {
      await onAddItem(addItemModal.dayId, itemTema.trim(), itemInicio.trim(), itemFim.trim());
      setAddItemModal({ visible: false, dayId: "" });
    } finally { setSaving(false); }
  }

  async function handleUpdateItem() {
    if (!editItemModal.item) return;
    if (!itemTema.trim()) { Alert.alert("Erro", "O tema é obrigatório."); return; }
    if (!validateTime(itemInicio)) { Alert.alert("Erro", "Hora de início inválida. Use HH:MM."); return; }
    if (!validateTime(itemFim)) { Alert.alert("Erro", "Hora de fim inválida. Use HH:MM."); return; }
    setSaving(true);
    try {
      await onUpdateItem(editItemModal.dayId, editItemModal.item.id, itemTema.trim(), itemInicio.trim(), itemFim.trim());
      setEditItemModal({ visible: false, dayId: "", item: null });
    } finally { setSaving(false); }
  }

  const statusColor = { ativo: "#16A34A", concluido: "#6B7280", pendente: "#D97706" };
  const statusLabel = { ativo: "Em curso", concluido: "Concluído", pendente: "Pendente" };
  const statusBg = { ativo: "#DCFCE7", concluido: "#F3F4F6", pendente: "#FFFBEB" };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={styles.sectionTitle}>Programa do Congresso</Text>
        <Pressable
          style={[styles.addBtn]}
          onPress={openAddDay}
        >
          <Feather name="plus" size={14} color="#fff" />
          <Text style={styles.addBtnText}>Novo Dia</Text>
        </Pressable>
      </View>

      {days.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="calendar" size={40} color={C.textMuted} />
          <Text style={styles.emptyTitle}>Sem programa configurado</Text>
          <Text style={styles.emptySub}>Adicione dias e itens para configurar o programa do congresso.</Text>
        </View>
      )}

      {days.map((day) => {
        const sortedItens = [...day.itens].sort((a, b) => {
          if (a.horaInicio < b.horaInicio) return -1;
          if (a.horaInicio > b.horaInicio) return 1;
          return a.ordem - b.ordem;
        });
        return (
          <View key={day.id} style={styles.progDayCard}>
            <View style={styles.progDayHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.progDayTitle}>{day.titulo}</Text>
                <Text style={styles.progDayDate}>
                  {new Date(day.data + "T12:00:00").toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => openEditDay(day)} style={styles.progIconBtn}>
                  <Feather name="edit-2" size={14} color={C.navy} />
                </Pressable>
                <Pressable onPress={() => setDeleteDayModal({ visible: true, dayId: day.id, titulo: day.titulo })} style={[styles.progIconBtn, { backgroundColor: "#FEE2E2" }]}>
                  <Feather name="trash-2" size={14} color="#DC2626" />
                </Pressable>
              </View>
            </View>

            {sortedItens.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && <View style={{ height: 1, backgroundColor: C.border }} />}
                <View style={[styles.progItemRow, item.status === "ativo" && { backgroundColor: "#F0FDF4" }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.progItemTema} numberOfLines={2}>{item.tema}</Text>
                    <Text style={styles.progItemHora}>{item.horaInicio} – {item.horaFim}</Text>
                  </View>
                  <View style={[styles.progStatusBadge, { backgroundColor: statusBg[item.status] }]}>
                    {item.status === "ativo" && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A" }} />}
                    <Text style={[styles.progStatusText, { color: statusColor[item.status] }]}>{statusLabel[item.status]}</Text>
                  </View>
                  <View style={styles.progItemActions}>
                    {item.status !== "ativo" && item.status !== "concluido" && (
                      <Pressable style={[styles.progActionBtn, { backgroundColor: "#DCFCE7" }]} onPress={() => { Haptics.selectionAsync(); onMarkAtivo(day.id, item.id); }}>
                        <Feather name="play" size={12} color="#16A34A" />
                      </Pressable>
                    )}
                    {item.status === "ativo" && (
                      <Pressable style={[styles.progActionBtn, { backgroundColor: C.navy }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onMarkConcluido(day.id, item.id); }}>
                        <Feather name="check" size={12} color="#fff" />
                      </Pressable>
                    )}
                    {item.status === "concluido" && (
                      <Pressable style={[styles.progActionBtn, { backgroundColor: "#FFFBEB" }]} onPress={() => { Haptics.selectionAsync(); onMarkPendente(day.id, item.id); }}>
                        <Feather name="rotate-ccw" size={12} color="#D97706" />
                      </Pressable>
                    )}
                    <Pressable style={styles.progActionBtn} onPress={() => openEditItem(day.id, item)}>
                      <Feather name="edit-2" size={12} color={C.textSecondary} />
                    </Pressable>
                    <Pressable style={[styles.progActionBtn, { backgroundColor: "#FEE2E2" }]} onPress={() => setDeleteItemModal({ visible: true, dayId: day.id, itemId: item.id, tema: item.tema })}>
                      <Feather name="trash-2" size={12} color="#DC2626" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            <Pressable style={styles.progAddItemBtn} onPress={() => openAddItem(day.id)}>
              <Feather name="plus" size={14} color={C.tint} />
              <Text style={styles.progAddItemText}>Adicionar Item</Text>
            </Pressable>
          </View>
        );
      })}

      {/* ADD DAY MODAL */}
      <Modal visible={addDayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo Dia do Programa</Text>
            <View style={{ gap: 10 }}>
              <View style={{ gap: 4 }}>
                <Text style={styles.progFormLabel}>Data (AAAA-MM-DD) *</Text>
                <TextInput style={styles.progFormInput} placeholder="Ex: 2026-05-15" placeholderTextColor={C.textMuted} value={dayData} onChangeText={setDayData} keyboardType="numbers-and-punctuation" />
              </View>
              <View style={{ gap: 4 }}>
                <Text style={styles.progFormLabel}>Título do Dia</Text>
                <TextInput style={styles.progFormInput} placeholder="Ex: Dia 1 – Abertura" placeholderTextColor={C.textMuted} value={dayTitulo} onChangeText={setDayTitulo} />
              </View>
            </View>
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setAddDayModal(false)}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtnConfirm, saving && { opacity: 0.6 }]} onPress={handleSaveDay} disabled={saving}>
                <Text style={styles.modalBtnConfirmText}>{saving ? "A guardar..." : "Guardar"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT DAY MODAL */}
      <Modal visible={editDayModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar Dia</Text>
            <View style={{ gap: 10 }}>
              <View style={{ gap: 4 }}>
                <Text style={styles.progFormLabel}>Data (AAAA-MM-DD) *</Text>
                <TextInput style={styles.progFormInput} placeholder="Ex: 2026-05-15" placeholderTextColor={C.textMuted} value={dayData} onChangeText={setDayData} keyboardType="numbers-and-punctuation" />
              </View>
              <View style={{ gap: 4 }}>
                <Text style={styles.progFormLabel}>Título do Dia</Text>
                <TextInput style={styles.progFormInput} placeholder="Ex: Dia 1 – Abertura" placeholderTextColor={C.textMuted} value={dayTitulo} onChangeText={setDayTitulo} />
              </View>
            </View>
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setEditDayModal({ visible: false, day: null })}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtnConfirm, saving && { opacity: 0.6 }]} onPress={handleUpdateDay} disabled={saving}>
                <Text style={styles.modalBtnConfirmText}>{saving ? "A guardar..." : "Guardar"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD ITEM MODAL */}
      <Modal visible={addItemModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo Item do Programa</Text>
            <View style={{ gap: 10 }}>
              <View style={{ gap: 4 }}>
                <Text style={styles.progFormLabel}>Tema *</Text>
                <TextInput style={[styles.progFormInput, { minHeight: 60 }]} placeholder="Descrição do tema ou actividade" placeholderTextColor={C.textMuted} value={itemTema} onChangeText={setItemTema} multiline />
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.progFormLabel}>Início (HH:MM) *</Text>
                  <TextInput style={styles.progFormInput} placeholder="08:00" placeholderTextColor={C.textMuted} value={itemInicio} onChangeText={setItemInicio} keyboardType="numbers-and-punctuation" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.progFormLabel}>Fim (HH:MM) *</Text>
                  <TextInput style={styles.progFormInput} placeholder="09:30" placeholderTextColor={C.textMuted} value={itemFim} onChangeText={setItemFim} keyboardType="numbers-and-punctuation" />
                </View>
              </View>
            </View>
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setAddItemModal({ visible: false, dayId: "" })}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtnConfirm, saving && { opacity: 0.6 }]} onPress={handleSaveItem} disabled={saving}>
                <Text style={styles.modalBtnConfirmText}>{saving ? "A guardar..." : "Adicionar"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT ITEM MODAL */}
      <Modal visible={editItemModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar Item</Text>
            <View style={{ gap: 10 }}>
              <View style={{ gap: 4 }}>
                <Text style={styles.progFormLabel}>Tema *</Text>
                <TextInput style={[styles.progFormInput, { minHeight: 60 }]} placeholder="Descrição do tema ou actividade" placeholderTextColor={C.textMuted} value={itemTema} onChangeText={setItemTema} multiline />
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.progFormLabel}>Início (HH:MM) *</Text>
                  <TextInput style={styles.progFormInput} placeholder="08:00" placeholderTextColor={C.textMuted} value={itemInicio} onChangeText={setItemInicio} keyboardType="numbers-and-punctuation" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.progFormLabel}>Fim (HH:MM) *</Text>
                  <TextInput style={styles.progFormInput} placeholder="09:30" placeholderTextColor={C.textMuted} value={itemFim} onChangeText={setItemFim} keyboardType="numbers-and-punctuation" />
                </View>
              </View>
            </View>
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setEditItemModal({ visible: false, dayId: "", item: null })}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtnConfirm, saving && { opacity: 0.6 }]} onPress={handleUpdateItem} disabled={saving}>
                <Text style={styles.modalBtnConfirmText}>{saving ? "A guardar..." : "Guardar"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={deleteDayModal.visible}
        title="Eliminar Dia"
        message={`Deseja eliminar "${deleteDayModal.titulo}" e todos os seus itens? Esta acção não pode ser desfeita.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmDestructive
        onConfirm={async () => { await onDeleteDay(deleteDayModal.dayId); setDeleteDayModal({ visible: false, dayId: "", titulo: "" }); }}
        onCancel={() => setDeleteDayModal({ visible: false, dayId: "", titulo: "" })}
      />
      <ConfirmModal
        visible={deleteItemModal.visible}
        title="Eliminar Item"
        message={`Deseja eliminar "${deleteItemModal.tema}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmDestructive
        onConfirm={async () => { await onDeleteItem(deleteItemModal.dayId, deleteItemModal.itemId); setDeleteItemModal({ visible: false, dayId: "", itemId: "", tema: "" }); }}
        onCancel={() => setDeleteItemModal({ visible: false, dayId: "", itemId: "", tema: "" })}
      />
    </View>
  );
}

// ── NAV ITEM ──
function NavItem({ icon, label, active, badge, onPress }: { icon: string; label: string; active: boolean; badge?: number; onPress: () => void }) {
  return (
    <Pressable style={styles.navItem} onPress={() => { Haptics.selectionAsync(); onPress(); }}>
      <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
        <Feather name={icon as any} size={20} color={active ? "#fff" : C.textSecondary} />
        {!!badge && badge > 0 && (
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>{badge > 9 ? "9+" : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

// ── DASHBOARD TAB ──
function DashboardTab({
  pendingCount, approvedCount, rejectedCount, presentCount, totalApproved,
  pendingResets, pendingSubmissions, participants, isCEO, onGoParticipantes, onGoPresenca, onGoSenhas, onGoApresentacoes,
}: {
  pendingCount: number; approvedCount: number; rejectedCount: number;
  presentCount: number; totalApproved: number; pendingResets: number;
  pendingSubmissions: number; participants: Participant[];
  isCEO: boolean;
  onGoParticipantes: (s: StatusType | "all") => void;
  onGoPresenca: () => void; onGoSenhas: () => void; onGoApresentacoes: () => void;
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>Visão Geral</Text>
      <View style={styles.statsGrid}>
        <Pressable style={[styles.statCard, { borderLeftColor: "#F59E0B" }]} onPress={() => onGoParticipantes("pendente")}>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
          <Feather name="clock" size={14} color="#F59E0B" style={{ marginTop: 2 }} />
        </Pressable>
        <Pressable style={[styles.statCard, { borderLeftColor: C.tint }]} onPress={() => onGoParticipantes("aprovado")}>
          <Text style={[styles.statValue, { color: C.tint }]}>{approvedCount}</Text>
          <Text style={styles.statLabel}>Aprovados</Text>
          <Feather name="check-circle" size={14} color={C.tint} style={{ marginTop: 2 }} />
        </Pressable>
        <Pressable style={[styles.statCard, { borderLeftColor: "#EF4444" }]} onPress={() => onGoParticipantes("rejeitado")}>
          <Text style={[styles.statValue, { color: "#EF4444" }]}>{rejectedCount}</Text>
          <Text style={styles.statLabel}>Rejeitados</Text>
          <Feather name="x-circle" size={14} color="#EF4444" style={{ marginTop: 2 }} />
        </Pressable>
        <Pressable style={[styles.statCard, { borderLeftColor: "#8B5CF6" }]} onPress={onGoPresenca}>
          <Text style={[styles.statValue, { color: "#8B5CF6" }]}>{presentCount}/{totalApproved}</Text>
          <Text style={styles.statLabel}>Presença</Text>
          <Feather name="users" size={14} color="#8B5CF6" style={{ marginTop: 2 }} />
        </Pressable>
      </View>

      <ParticipantsChart participants={participants} />

      <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Acções Rápidas</Text>
      <View style={styles.quickActions}>
        <QuickAction icon="file-text" label="Apresentações" badge={pendingSubmissions} color="#6366F1" onPress={onGoApresentacoes} />
        <QuickAction icon="key" label="Redefinições de Senha" badge={pendingResets} color="#F59E0B" onPress={onGoSenhas} />
        <QuickAction icon="qr-code" label="Marcar Presença" color={C.navy} onPress={onGoPresenca} isIonicons />
      </View>

      {isCEO && <CongressConfigSection />}
    </>
  );
}

function CongressConfigSection() {
  const { congressDates, updateCongressDates, formatPeriodo } = useCongress();
  const [modalVisible, setModalVisible] = useState(false);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [local, setLocal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function parseDateInput(input: string): string | null {
    const trimmed = input.trim();
    const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (ddmmyyyy.test(trimmed)) {
      const [, d, m, y] = trimmed.match(ddmmyyyy)!;
      return `${y}-${m}-${d}`;
    }
    if (yyyymmdd.test(trimmed)) return trimmed;
    return null;
  }

  function formatForDisplay(iso: string) {
    const d = new Date(iso + "T12:00:00Z");
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function openModal() {
    setInicio(formatForDisplay(congressDates.dataInicio));
    setFim(formatForDisplay(congressDates.dataFim));
    setLocal(congressDates.localNome);
    setError("");
    setModalVisible(true);
  }

  async function handleSave() {
    const parsedInicio = parseDateInput(inicio);
    const parsedFim = parseDateInput(fim);
    if (!parsedInicio) { setError("Data de início inválida. Use DD/MM/AAAA."); return; }
    if (!parsedFim) { setError("Data de fim inválida. Use DD/MM/AAAA."); return; }
    if (parsedInicio >= parsedFim) { setError("A data de início deve ser anterior à data de fim."); return; }
    setSaving(true);
    await updateCongressDates({ dataInicio: parsedInicio, dataFim: parsedFim, localNome: local.trim() || congressDates.localNome });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    setModalVisible(false);
  }

  return (
    <>
      <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Configuração do Congresso</Text>
      <Pressable style={styles.congressCard} onPress={openModal}>
        <View style={styles.congressCardIcon}>
          <Feather name="calendar" size={22} color={C.tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.congressCardLabel}>Período do Congresso</Text>
          <Text style={styles.congressCardValue} numberOfLines={2}>{formatPeriodo()}</Text>
          <Text style={styles.congressCardLocal} numberOfLines={1}>{congressDates.localNome}</Text>
        </View>
        <Feather name="edit-2" size={16} color={C.textMuted} />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.congressModalOverlay}>
          <View style={styles.congressModal}>
            <View style={styles.congressModalHeader}>
              <Feather name="calendar" size={20} color={C.tint} />
              <Text style={styles.congressModalTitle}>Datas do Congresso</Text>
            </View>

            {!!error && (
              <View style={styles.congressError}>
                <Text style={styles.congressErrorText}>{error}</Text>
              </View>
            )}

            <View style={styles.congressField}>
              <Text style={styles.congressFieldLabel}>Data de Início (DD/MM/AAAA)</Text>
              <TextInput
                style={styles.congressInput}
                value={inicio}
                onChangeText={(t) => { setInicio(t); setError(""); }}
                placeholder="20/03/2026"
                placeholderTextColor={C.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View style={styles.congressField}>
              <Text style={styles.congressFieldLabel}>Data de Fim (DD/MM/AAAA)</Text>
              <TextInput
                style={styles.congressInput}
                value={fim}
                onChangeText={(t) => { setFim(t); setError(""); }}
                placeholder="30/04/2026"
                placeholderTextColor={C.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View style={styles.congressField}>
              <Text style={styles.congressFieldLabel}>Local</Text>
              <TextInput
                style={styles.congressInput}
                value={local}
                onChangeText={setLocal}
                placeholder="Universidade Rainha Njinga a Mbande"
                placeholderTextColor={C.textMuted}
              />
            </View>

            <View style={styles.congressModalBtns}>
              <Pressable
                style={[styles.congressModalBtn, styles.congressModalBtnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.congressModalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.congressModalBtn, styles.congressModalBtnSave, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.congressModalBtnSaveText}>{saving ? "A guardar…" : "Guardar"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function QuickAction({ icon, label, badge, color, onPress, isIonicons }: { icon: string; label: string; badge?: number; color: string; onPress: () => void; isIonicons?: boolean }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + "18" }]}>
        {isIonicons
          ? <Ionicons name={icon as any} size={22} color={color} />
          : <Feather name={icon as any} size={22} color={color} />}
        {!!badge && badge > 0 && (
          <View style={styles.navBadge}><Text style={styles.navBadgeText}>{badge}</Text></View>
        )}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
      <Feather name="chevron-right" size={16} color={C.textMuted} style={{ marginLeft: "auto" }} />
    </Pressable>
  );
}

function PresenceStat({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <View style={[styles.presenceStatCard, { backgroundColor: bg }]}>
      <Text style={[styles.presenceStatValue, { color }]}>{value}</Text>
      <Text style={[styles.presenceStatLabel, { color }]}>{label}</Text>
    </View>
  );
}

function ParticipantCard({ participant: p, canDelete, onApprove, onReject, onDelete, onView }: { participant: Participant; canDelete: boolean; onApprove: () => void; onReject: () => void; onDelete: () => void; onView: () => void }) {
  const statusColors: Record<StatusType, string> = { pendente: "#D97706", aprovado: "#16A34A", rejeitado: "#DC2626" };
  const statusBg: Record<StatusType, string> = { pendente: "#FEF9C3", aprovado: "#DCFCE7", rejeitado: "#FEE2E2" };
  const statusLabels: Record<StatusType, string> = { pendente: "Pendente", aprovado: "Aprovado", rejeitado: "Rejeitado" };

  return (
    <View style={styles.card}>
      <Pressable onPress={onView}>
        <View style={styles.cardTop}>
          <View style={[styles.avatarCircle, { backgroundColor: C.navy }]}>
            <Text style={styles.avatarText}>{p.nomeCompleto.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.participantName} numberOfLines={1}>{p.nomeCompleto}</Text>
            <Text style={styles.participantEmail} numberOfLines={1}>{p.email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg[p.status] }]}>
            <Text style={[styles.statusBadgeText, { color: statusColors[p.status] }]}>{statusLabels[p.status]}</Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <MetaPill label={SPECTATOR_LABELS[p.spectatorType]} />
          <MetaPill label={p.origemTipo} />
          <MetaPill label={`Eixo ${p.eixo}`} />
          <MetaPill label={`${p.tarifa.toLocaleString()} Kz`} />
        </View>
        <Text style={styles.cardDate}>{new Date(p.createdAt).toLocaleDateString("pt-PT")}</Text>
      </Pressable>
      {p.status === "pendente" && (
        <View style={styles.cardActions}>
          <Pressable style={styles.rejectBtn} onPress={onReject}>
            <Feather name="x" size={14} color="#DC2626" />
            <Text style={styles.rejectBtnText}>Rejeitar</Text>
          </Pressable>
          <Pressable style={styles.approveBtn} onPress={onApprove}>
            <Feather name="check" size={14} color="#16A34A" />
            <Text style={styles.approveBtnText}>Aprovar</Text>
          </Pressable>
        </View>
      )}
      {p.status === "aprovado" && (
        <Pressable style={styles.viewQrBtn} onPress={onView}>
          <Ionicons name="qr-code-outline" size={14} color={C.tint} />
          <Text style={styles.viewQrText}>Ver QR Code</Text>
          <Feather name="chevron-right" size={14} color={C.tint} />
        </Pressable>
      )}
      {canDelete && (
        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Feather name="trash-2" size={13} color="#DC2626" />
          <Text style={styles.deleteBtnText}>Eliminar registo</Text>
        </Pressable>
      )}
    </View>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <View style={styles.metaPill}>
      <Text style={styles.metaPillText}>{label}</Text>
    </View>
  );
}

function ResetRequestCard({ request: r, onApprove, onReject }: { request: PasswordResetRequest; onApprove: () => void; onReject: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatarCircle, { backgroundColor: "#EEF2FF" }]}>
          <Feather name="key" size={18} color="#6366F1" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.participantName}>@{r.username}</Text>
          <Text style={styles.participantEmail}>{r.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: "#FEF9C3" }]}>
          <Text style={[styles.statusBadgeText, { color: "#D97706" }]}>Pendente</Text>
        </View>
      </View>
      <Text style={styles.cardDate}>
        Solicitado em {new Date(r.requestedAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}
      </Text>
      <View style={styles.cardActions}>
        <Pressable style={styles.rejectBtn} onPress={onReject}>
          <Feather name="x" size={14} color="#DC2626" />
          <Text style={styles.rejectBtnText}>Rejeitar</Text>
        </Pressable>
        <Pressable style={styles.approveBtn} onPress={onApprove}>
          <Feather name="check" size={14} color="#16A34A" />
          <Text style={styles.approveBtnText}>Definir Senha</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NotificationCard({ notification: n }: { notification: Notification }) {
  return (
    <View style={[styles.notifCard, !n.read && styles.notifCardUnread]}>
      <View style={styles.notifIcon}>
        <Ionicons name={n.type === "new_registration" ? "person-add-outline" : "notifications-outline"} size={18} color={C.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.notifTitle}>{n.title}</Text>
          {!n.read && <View style={styles.newDot} />}
        </View>
        <Text style={styles.notifBody}>{n.body}</Text>
        <Text style={styles.notifTime}>
          {new Date(n.createdAt).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  );
}

function AdminSubmissionCard({ submission: s, canApprove, onApprove, onReject, onMessage }: { submission: Submission; canApprove: boolean; onApprove: () => void; onReject: () => void; onMessage: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const statusColors: Record<SubmissionStatus, string> = { pendente: "#D97706", aprovado: "#16A34A", rejeitado: "#DC2626" };
  const statusBg: Record<SubmissionStatus, string> = { pendente: "#FEF9C3", aprovado: "#DCFCE7", rejeitado: "#FEE2E2" };
  const statusLabels: Record<SubmissionStatus, string> = { pendente: "Pendente", aprovado: "Aprovada", rejeitado: "Rejeitada" };

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setExpanded((v) => !v)}>
        <View style={styles.cardTop}>
          <View style={[styles.avatarCircle, { backgroundColor: "#EEF2FF" }]}>
            <Feather name="file-text" size={18} color="#6366F1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.participantName} numberOfLines={1}>{s.participantName}</Text>
            <Text style={styles.participantEmail} numberOfLines={1}>{s.tema}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg[s.status] }]}>
            <Text style={[styles.statusBadgeText, { color: statusColors[s.status] }]}>{statusLabels[s.status]}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Text style={styles.cardDate}>
            {new Date(s.submittedAt).toLocaleDateString("pt-PT")}
          </Text>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={13} color={C.textMuted} />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.expandedBox}>
          <Text style={styles.expandedLabel}>Palavras-chave</Text>
          <Text style={styles.expandedText}>{s.palavraChave}</Text>
          <Text style={[styles.expandedLabel, { marginTop: 8 }]}>Resumo</Text>
          <Text style={styles.expandedText}>{s.resumo}</Text>
          {s.fileName && (
            <View style={{ marginTop: 8, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Feather name="paperclip" size={13} color={C.textSecondary} />
                <Text style={[styles.expandedText, { flex: 1 }]} numberOfLines={1}>{s.fileName}</Text>
                {s.fileSize ? <Text style={styles.cardDate}>({(s.fileSize / (1024 * 1024)).toFixed(1)} MB)</Text> : null}
              </View>
              {s.fileUri ? (
                <Pressable
                  onPress={() => Linking.openURL(s.fileUri!).catch(() =>
                    Alert.alert("Documento não disponível", "O ficheiro só é acessível no dispositivo onde foi submetido.")
                  )}
                  style={styles.openDocBtn}
                >
                  <Feather name="external-link" size={12} color={C.tint} />
                  <Text style={styles.openDocText}>Abrir documento</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      )}

      <View style={styles.cardActions}>
        <Pressable style={styles.msgBtn} onPress={onMessage}>
          <Feather name="message-circle" size={13} color="#6366F1" />
          <Text style={styles.msgBtnText}>Mensagem</Text>
        </Pressable>
        {s.status === "pendente" && canApprove && (
          <>
            <Pressable style={styles.rejectBtn} onPress={onReject}>
              <Feather name="x" size={14} color="#DC2626" />
              <Text style={styles.rejectBtnText}>Rejeitar</Text>
            </Pressable>
            <Pressable style={styles.approveBtn} onPress={onApprove}>
              <Feather name="check" size={14} color="#16A34A" />
              <Text style={styles.approveBtnText}>Aprovar</Text>
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
      <View style={styles.emptyIconWrap}>
        <Feather name={icon as any} size={32} color={C.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6FA" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerLogo: { width: 38, height: 26 },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text },
  headerSub: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F4F6FA",
  },
  notifBadge: {
    position: "absolute", top: 1, right: 1,
    backgroundColor: "#EF4444", borderRadius: 8,
    minWidth: 15, height: 15, alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: "#fff",
  },
  notifBadgeText: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#fff" },

  // Content
  content: { padding: 14, gap: 12 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 },

  // Stats grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47%", backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderLeftWidth: 4, gap: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.textSecondary },

  // Quick actions
  quickActions: { gap: 8 },
  quickAction: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  quickActionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text, flex: 1 },

  // Filter
  filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: "#E5E7EB", backgroundColor: "#fff" },
  filterChipActive: { backgroundColor: C.tint, borderColor: C.tint },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary },
  filterChipTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },

  // Cards
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  participantName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  participantEmail: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaPill: { backgroundColor: "#F4F6FA", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  metaPillText: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.textSecondary },
  cardDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted },
  cardActions: { flexDirection: "row", gap: 10 },
  rejectBtn: { flex: 1, height: 40, borderRadius: 10, backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FECACA", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  rejectBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#DC2626" },
  approveBtn: { flex: 1, height: 40, borderRadius: 10, backgroundColor: "#DCFCE7", borderWidth: 1, borderColor: "#86EFAC", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  approveBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#16A34A" },
  viewQrBtn: { backgroundColor: "#F0FDF4", borderRadius: 10, height: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#86EFAC", flexDirection: "row", gap: 6 },
  viewQrText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.tint },
  deleteBtn: { borderRadius: 10, height: 36, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  deleteBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#DC2626" },
  expandedBox: { backgroundColor: "#F4F6FA", borderRadius: 12, padding: 12, gap: 4 },
  expandedLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  expandedText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.text, lineHeight: 19 },

  // Presence
  presenceStatsRow: { flexDirection: "row", gap: 10 },
  presenceStatCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 2 },
  presenceStatValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  presenceStatLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  scannerBtn: {
    backgroundColor: C.navy, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  scannerBtnIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  scannerBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  scannerBtnSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  presenceCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  presenceCardPresent: { backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#86EFAC" },
  presenceDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  presenceDotPresent: { backgroundColor: "#22C55E" },
  presenceDotAbsent: { backgroundColor: "#D1D5DB" },
  presenceName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  presenceMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  presenceTime: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#16A34A", marginTop: 2 },
  presenceBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  presenceBadgePresent: { backgroundColor: "#DCFCE7" },
  presenceBadgeAbsent: { backgroundColor: "#F3F4F6" },
  presenceBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  // Notifications
  notifCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14, gap: 10, flexDirection: "row",
    marginBottom: 8,
  },
  notifCardUnread: { backgroundColor: "#F0FDF4", borderLeftWidth: 3, borderLeftColor: C.tint },
  notifIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center" },
  notifTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text },
  newDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.tint },
  notifBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 19, marginTop: 2 },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },

  // Empty state
  emptyState: { alignItems: "center", gap: 10, paddingVertical: 60 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#F4F6FA", alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: C.text },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", lineHeight: 20, maxWidth: 260 },

  // Bottom nav
  bottomNav: {
    flexDirection: "row", backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#E5E7EB",
    paddingTop: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10,
  },
  navItem: { flex: 1, alignItems: "center", gap: 4 },
  navIconWrap: { width: 40, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navIconWrapActive: { backgroundColor: C.navy },
  navBadge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: "#EF4444", borderRadius: 8, minWidth: 15, height: 15,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: "#fff",
  },
  navBadgeText: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#fff" },
  navLabel: { fontSize: 9, fontFamily: "Inter_500Medium", color: C.textSecondary },
  navLabelActive: { color: C.navy, fontFamily: "Inter_700Bold" },

  // Bottom sheet (notifications)
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetHandle: { width: 40, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 12 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 24, width: "100%", gap: 14 },
  modalIconRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  resultIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 19, fontFamily: "Inter_700Bold", color: C.text },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  pwdInputBox: { backgroundColor: "#F4F6FA", borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB", paddingHorizontal: 14, height: 50, flexDirection: "row", alignItems: "center" },
  pwdInput: { flex: 1, height: "100%", fontSize: 15, fontFamily: "Inter_400Regular", color: C.text },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalBtnCancel: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  modalBtnCancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  modalBtnConfirm: { flex: 1, height: 46, borderRadius: 12, backgroundColor: C.tint, alignItems: "center", justifyContent: "center" },
  modalBtnConfirmText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  // Programa
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.tint, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  progDayCard: { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  progDayHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.backgroundTertiary, borderBottomWidth: 1, borderBottomColor: C.border },
  progDayTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.text },
  progDayDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2, textTransform: "capitalize" },
  progIconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  progItemRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  progItemTema: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text, lineHeight: 18 },
  progItemHora: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  progStatusBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 },
  progStatusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  progItemActions: { flexDirection: "row", gap: 5 },
  progActionBtn: { width: 28, height: 28, borderRadius: 7, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  progAddItemBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
  progAddItemText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.tint },
  progFormLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.text },
  progFormInput: { backgroundColor: C.inputBackground, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", color: C.text },

  // Scanner
  scannerModal: { flex: 1, backgroundColor: "#000" },
  scannerHeader: { paddingHorizontal: 20, paddingBottom: 20, backgroundColor: C.navy, alignItems: "center", gap: 4 },
  scannerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  scannerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", textAlign: "center" },
  scannerFrame: { position: "absolute", top: "35%", left: "15%", right: "15%", aspectRatio: 1, zIndex: 10 },
  scannerCorner: { position: "absolute", width: 32, height: 32, borderColor: "#22C55E" },
  scannerCloseBtn: { backgroundColor: C.navy, paddingTop: 20, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  scannerCloseBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },

  // Congress Config
  congressCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    borderLeftWidth: 4, borderLeftColor: C.tint,
  },
  congressCardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#EEF6F1", alignItems: "center", justifyContent: "center" },
  congressCardLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.textSecondary, marginBottom: 2 },
  congressCardValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text, lineHeight: 18 },
  congressCardLocal: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  congressModalOverlay: { flex: 1, backgroundColor: "rgba(10,25,50,0.65)", alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  congressModal: { backgroundColor: "#fff", borderRadius: 24, padding: 22, width: "100%", gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 },
  congressModalHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  congressModalTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.text },
  congressError: { backgroundColor: "#FEF2F2", borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: "#EF4444" },
  congressErrorText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#991B1B" },
  congressField: { gap: 6 },
  congressFieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.text },
  congressInput: { backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14, height: 48, fontSize: 14, fontFamily: "Inter_400Regular", color: C.text },
  congressModalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  congressModalBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  congressModalBtnCancel: { borderWidth: 1.5, borderColor: "#E5E7EB" },
  congressModalBtnCancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  congressModalBtnSave: { backgroundColor: C.tint },
  congressModalBtnSaveText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
