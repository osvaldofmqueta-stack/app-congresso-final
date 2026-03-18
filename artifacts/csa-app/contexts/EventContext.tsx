import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type SpectatorType = "docente_investigador" | "estudante" | "outro" | "prelector";
export type OrigemType = "URNM" | "Externo";
export type EixoType = 1 | 2 | 3;
export type StatusType = "pendente" | "aprovado" | "rejeitado";
export type SubmissionStatus = "pendente" | "aprovado" | "rejeitado";
export type NotificationType = "new_registration" | "message" | "submission_approved" | "submission_rejected";

export const EIXOS = {
  1: "Ensino e Investigação aplicada ao sector agro-alimentar",
  2: "Contribuição sector agro na economia nacional",
  3: "Integração empresarial na criação de políticas de desenvolvimento do sector agro em Angola",
};

export const SPECTATOR_LABELS: Record<SpectatorType, string> = {
  docente_investigador: "Docente/Investigador",
  estudante: "Estudante",
  outro: "Outro",
  prelector: "Prelector (Autor)",
};

export const NIVEL_ACADEMICO = [
  "Básico",
  "Médio",
  "Licenciatura",
  "Mestrado",
  "Doutoramento",
  "Pós-Doutoramento",
];

export const EIXOS_LIST: EixoType[] = [1, 2, 3];

export function calcTarifa(spectator: SpectatorType, origem: OrigemType): number {
  if (spectator === "prelector") return 20000;
  const table: Record<SpectatorType, Record<OrigemType, number>> = {
    docente_investigador: { URNM: 5000, Externo: 7000 },
    estudante: { URNM: 3000, Externo: 4000 },
    outro: { URNM: 5000, Externo: 10000 },
    prelector: { URNM: 20000, Externo: 20000 },
  };
  return table[spectator][origem];
}

export type Participant = {
  id: string;
  nomeCompleto: string;
  username: string;
  email: string;
  password: string;
  nivelAcademico: string;
  origemInstitucional: string;
  origemTipo: OrigemType;
  eixo: EixoType;
  spectatorType: SpectatorType;
  tarifa: number;
  status: StatusType;
  qrData?: string;
  presente: boolean;
  presenceMarkedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PasswordResetRequest = {
  id: string;
  email: string;
  username: string;
  requestedAt: string;
  status: "pendente" | "aprovado" | "rejeitado";
  newPassword?: string;
};

export type Submission = {
  id: string;
  participantId: string;
  participantName: string;
  tema: string;
  palavraChave: string;
  resumo: string;
  fileName?: string;
  fileUri?: string;
  fileSize?: number;
  status: SubmissionStatus;
  submittedAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  targetId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

const STORAGE_PARTICIPANTS = "@csa_participants";
const STORAGE_RESET_REQUESTS = "@csa_reset_requests";
const STORAGE_SUBMISSIONS = "@csa_submissions";
const STORAGE_NOTIFICATIONS = "@csa_notifications";

type EventContextType = {
  participants: Participant[];
  resetRequests: PasswordResetRequest[];
  submissions: Submission[];
  notifications: Notification[];
  registerParticipant: (data: Omit<Participant, "id" | "status" | "qrData" | "presente" | "presenceMarkedAt" | "createdAt" | "updatedAt">) => Promise<{ success: boolean; error?: string }>;
  approveParticipant: (id: string) => Promise<void>;
  rejectParticipant: (id: string) => Promise<void>;
  deleteParticipant: (id: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  approvePasswordReset: (requestId: string, newPassword: string) => Promise<void>;
  rejectPasswordReset: (requestId: string) => Promise<void>;
  getParticipantByEmail: (email: string, password: string) => Participant | undefined;
  submitPresentation: (participantId: string, participantName: string, data: { tema: string; palavraChave: string; resumo: string; fileName?: string; fileUri?: string; fileSize?: number }) => Promise<{ success: boolean; error?: string }>;
  approveSubmission: (id: string) => Promise<void>;
  rejectSubmission: (id: string) => Promise<void>;
  sendConselhoMessage: (participantId: string, participantName: string, message: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllReadForTarget: (targetId: string) => Promise<void>;
  getUnreadCount: (targetId: string) => number;
  markAttendance: (participantId: string) => Promise<{ success: boolean; alreadyPresent?: boolean; participantName?: string }>;
  changeParticipantPassword: (participantId: string, oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
};

const EventContext = createContext<EventContextType | null>(null);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [pRaw, rRaw, sRaw, nRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_PARTICIPANTS),
        AsyncStorage.getItem(STORAGE_RESET_REQUESTS),
        AsyncStorage.getItem(STORAGE_SUBMISSIONS),
        AsyncStorage.getItem(STORAGE_NOTIFICATIONS),
      ]);
      if (pRaw) setParticipants(JSON.parse(pRaw));
      if (rRaw) setResetRequests(JSON.parse(rRaw));
      if (sRaw) setSubmissions(JSON.parse(sRaw));
      if (nRaw) setNotifications(JSON.parse(nRaw));
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [loadData]);

  const saveParticipants = useCallback(async (list: Participant[]) => {
    await AsyncStorage.setItem(STORAGE_PARTICIPANTS, JSON.stringify(list));
    setParticipants(list);
  }, []);

  const saveResetRequests = useCallback(async (list: PasswordResetRequest[]) => {
    await AsyncStorage.setItem(STORAGE_RESET_REQUESTS, JSON.stringify(list));
    setResetRequests(list);
  }, []);

  const saveSubmissions = useCallback(async (list: Submission[]) => {
    await AsyncStorage.setItem(STORAGE_SUBMISSIONS, JSON.stringify(list));
    setSubmissions(list);
  }, []);

  const saveNotifications = useCallback(async (list: Notification[]) => {
    await AsyncStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(list));
    setNotifications(list);
  }, []);

  const addNotification = useCallback(async (
    currentNotifications: Notification[],
    targetId: string,
    type: NotificationType,
    title: string,
    body: string
  ) => {
    const id = await Crypto.randomUUID();
    const notif: Notification = {
      id,
      targetId,
      type,
      title,
      body,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [notif, ...currentNotifications];
    await saveNotifications(updated);
    return updated;
  }, [saveNotifications]);

  const registerParticipant = useCallback(async (data: Omit<Participant, "id" | "status" | "qrData" | "presente" | "presenceMarkedAt" | "createdAt" | "updatedAt">) => {
    const existing = participants.find(
      (p) => p.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) return { success: false, error: "Este email já está registado no sistema." };

    const existingUsername = participants.find(
      (p) => p.username.toLowerCase() === data.username.toLowerCase()
    );
    if (existingUsername) return { success: false, error: "Este nome de usuário já está em uso." };

    const id = await Crypto.randomUUID();
    const now = new Date().toISOString();
    const newParticipant: Participant = {
      ...data,
      id,
      status: "pendente",
      presente: false,
      createdAt: now,
      updatedAt: now,
    };
    const updatedParticipants = [...participants, newParticipant];
    await saveParticipants(updatedParticipants);

    const notifId = await Crypto.randomUUID();
    const adminNotif: Notification = {
      id: notifId,
      targetId: "admin",
      type: "new_registration",
      title: "Novo Registo",
      body: `${data.nomeCompleto} acabou de se registar no congresso.`,
      read: false,
      createdAt: now,
    };
    await saveNotifications([adminNotif, ...notifications]);

    return { success: true };
  }, [participants, notifications, saveParticipants, saveNotifications]);

  const approveParticipant = useCallback(async (id: string) => {
    const updated = participants.map((p) => {
      if (p.id !== id) return p;
      const qrData = JSON.stringify({
        id: p.id,
        nome: p.nomeCompleto,
        categoria: SPECTATOR_LABELS[p.spectatorType],
        eixo: `Eixo ${p.eixo}`,
        origem: p.origemTipo,
        origemInstitucional: p.origemInstitucional,
        evento: "Congresso de Alimento 2026",
        tarifa: `${p.tarifa.toLocaleString()} Kz`,
        status: "APROVADO",
      });
      return { ...p, status: "aprovado" as StatusType, qrData, updatedAt: new Date().toISOString() };
    });
    await saveParticipants(updated);
  }, [participants, saveParticipants]);

  const rejectParticipant = useCallback(async (id: string) => {
    const updated = participants.map((p) =>
      p.id === id ? { ...p, status: "rejeitado" as StatusType, updatedAt: new Date().toISOString() } : p
    );
    await saveParticipants(updated);
  }, [participants, saveParticipants]);

  const deleteParticipant = useCallback(async (id: string) => {
    const updated = participants.filter((p) => p.id !== id);
    await saveParticipants(updated);
    const updatedSubs = submissions.filter((s) => s.participantId !== id);
    await saveSubmissions(updatedSubs);
    const updatedNotifs = notifications.filter((n) => n.targetId !== id);
    await saveNotifications(updatedNotifs);
  }, [participants, submissions, notifications, saveParticipants, saveSubmissions, saveNotifications]);

  const requestPasswordReset = useCallback(async (email: string) => {
    const participant = participants.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!participant) return { success: false, error: "Email não encontrado no sistema." };

    const existing = resetRequests.find(
      (r) => r.email.toLowerCase() === email.toLowerCase() && r.status === "pendente"
    );
    if (existing) return { success: false, error: "Já existe um pedido de redefinição pendente para este email." };

    const id = await Crypto.randomUUID();
    const newReq: PasswordResetRequest = {
      id,
      email: participant.email,
      username: participant.username,
      requestedAt: new Date().toISOString(),
      status: "pendente",
    };
    await saveResetRequests([...resetRequests, newReq]);
    return { success: true };
  }, [participants, resetRequests, saveResetRequests]);

  const approvePasswordReset = useCallback(async (requestId: string, newPassword: string) => {
    const req = resetRequests.find((r) => r.id === requestId);
    if (!req) return;
    const updatedReqs = resetRequests.map((r) =>
      r.id === requestId ? { ...r, status: "aprovado" as const, newPassword } : r
    );
    const updatedParticipants = participants.map((p) =>
      p.email.toLowerCase() === req.email.toLowerCase() ? { ...p, password: newPassword, updatedAt: new Date().toISOString() } : p
    );
    await Promise.all([saveResetRequests(updatedReqs), saveParticipants(updatedParticipants)]);
  }, [participants, resetRequests, saveParticipants, saveResetRequests]);

  const rejectPasswordReset = useCallback(async (requestId: string) => {
    const updatedReqs = resetRequests.map((r) =>
      r.id === requestId ? { ...r, status: "rejeitado" as const } : r
    );
    await saveResetRequests(updatedReqs);
  }, [resetRequests, saveResetRequests]);

  const getParticipantByEmail = useCallback((email: string, password: string) => {
    return participants.find(
      (p) => p.email.toLowerCase() === email.toLowerCase() && p.password === password
    );
  }, [participants]);

  const markAttendance = useCallback(async (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return { success: false };
    if (participant.presente) return { success: true, alreadyPresent: true, participantName: participant.nomeCompleto };
    const now = new Date().toISOString();
    const updated = participants.map((p) =>
      p.id === participantId ? { ...p, presente: true, presenceMarkedAt: now, updatedAt: now } : p
    );
    await saveParticipants(updated);
    return { success: true, alreadyPresent: false, participantName: participant.nomeCompleto };
  }, [participants, saveParticipants]);

  const changeParticipantPassword = useCallback(async (participantId: string, oldPassword: string, newPassword: string) => {
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return { success: false, error: "Participante não encontrado." };
    if (participant.password !== oldPassword) return { success: false, error: "A senha actual está incorreta." };
    if (newPassword.length < 6) return { success: false, error: "A nova senha deve ter pelo menos 6 caracteres." };
    const updated = participants.map((p) =>
      p.id === participantId ? { ...p, password: newPassword, updatedAt: new Date().toISOString() } : p
    );
    await saveParticipants(updated);
    return { success: true };
  }, [participants, saveParticipants]);

  const submitPresentation = useCallback(async (
    participantId: string,
    participantName: string,
    data: { tema: string; palavraChave: string; resumo: string; fileName?: string; fileUri?: string; fileSize?: number }
  ) => {
    const existing = submissions.find((s) => s.participantId === participantId);
    if (existing && existing.status === "pendente") {
      return { success: false, error: "Já tem uma submissão pendente de aprovação." };
    }

    const id = await Crypto.randomUUID();
    const now = new Date().toISOString();
    const newSub: Submission = {
      id,
      participantId,
      participantName,
      ...data,
      status: "pendente",
      submittedAt: now,
      updatedAt: now,
    };
    const updatedSubs = [newSub, ...submissions.filter((s) => s.participantId !== participantId || s.status !== "pendente")];
    await saveSubmissions(updatedSubs);
    return { success: true };
  }, [submissions, saveSubmissions]);

  const approveSubmission = useCallback(async (id: string) => {
    const sub = submissions.find((s) => s.id === id);
    if (!sub) return;
    const updated = submissions.map((s) =>
      s.id === id ? { ...s, status: "aprovado" as SubmissionStatus, updatedAt: new Date().toISOString() } : s
    );
    await saveSubmissions(updated);

    const notifId = await Crypto.randomUUID();
    const notif: Notification = {
      id: notifId,
      targetId: sub.participantId,
      type: "submission_approved",
      title: "Apresentação Aprovada",
      body: `A sua apresentação "${sub.tema}" foi aprovada pelo Conselho Científico.`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await saveNotifications([notif, ...notifications]);
  }, [submissions, notifications, saveSubmissions, saveNotifications]);

  const rejectSubmission = useCallback(async (id: string) => {
    const sub = submissions.find((s) => s.id === id);
    if (!sub) return;
    const updated = submissions.map((s) =>
      s.id === id ? { ...s, status: "rejeitado" as SubmissionStatus, updatedAt: new Date().toISOString() } : s
    );
    await saveSubmissions(updated);

    const notifId = await Crypto.randomUUID();
    const notif: Notification = {
      id: notifId,
      targetId: sub.participantId,
      type: "submission_rejected",
      title: "Apresentação Não Aprovada",
      body: `A sua apresentação "${sub.tema}" não foi aprovada pelo Conselho Científico.`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await saveNotifications([notif, ...notifications]);
  }, [submissions, notifications, saveSubmissions, saveNotifications]);

  const sendConselhoMessage = useCallback(async (participantId: string, participantName: string, message: string) => {
    const notifId = await Crypto.randomUUID();
    const notif: Notification = {
      id: notifId,
      targetId: participantId,
      type: "message",
      title: "Mensagem do Conselho Científico",
      body: message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await saveNotifications([notif, ...notifications]);
  }, [notifications, saveNotifications]);

  const markNotificationRead = useCallback(async (id: string) => {
    const updated = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    await saveNotifications(updated);
  }, [notifications, saveNotifications]);

  const markAllReadForTarget = useCallback(async (targetId: string) => {
    const updated = notifications.map((n) => n.targetId === targetId ? { ...n, read: true } : n);
    await saveNotifications(updated);
  }, [notifications, saveNotifications]);

  const getUnreadCount = useCallback((targetId: string) => {
    return notifications.filter((n) => n.targetId === targetId && !n.read).length;
  }, [notifications]);

  return (
    <EventContext.Provider value={{
      participants,
      resetRequests,
      submissions,
      notifications,
      registerParticipant,
      approveParticipant,
      rejectParticipant,
      deleteParticipant,
      requestPasswordReset,
      approvePasswordReset,
      rejectPasswordReset,
      getParticipantByEmail,
      submitPresentation,
      approveSubmission,
      rejectSubmission,
      sendConselhoMessage,
      markNotificationRead,
      markAllReadForTarget,
      getUnreadCount,
      markAttendance,
      changeParticipantPassword,
      refreshData: loadData,
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvent must be used within EventProvider");
  return ctx;
}
