import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type AdminRole = "ceo" | "supervisor" | "conselho" | null;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  participantId?: string;
  avatar?: string;
};

export type PermissionSet = {
  label: string;
  canManageParticipants: boolean;
  canDeleteParticipants: boolean;
  canManagePasswords: boolean;
  canManageProgram: boolean;
  canMarkPresence: boolean;
  canViewSubmissions: boolean;
  canApproveSubmissions: boolean;
  canMessageParticipants: boolean;
  canViewDashboard: boolean;
};

export const ROLE_PERMISSIONS: Record<string, PermissionSet> = {
  ceo: {
    label: "CEO — Director Geral",
    canManageParticipants: true,
    canDeleteParticipants: true,
    canManagePasswords: true,
    canManageProgram: true,
    canMarkPresence: true,
    canViewSubmissions: true,
    canApproveSubmissions: true,
    canMessageParticipants: true,
    canViewDashboard: true,
  },
  supervisor: {
    label: "Supervisor de Eventos",
    canManageParticipants: true,
    canDeleteParticipants: false,
    canManagePasswords: false,
    canManageProgram: true,
    canMarkPresence: true,
    canViewSubmissions: true,
    canApproveSubmissions: false,
    canMessageParticipants: true,
    canViewDashboard: true,
  },
  conselho: {
    label: "Conselho Científico",
    canManageParticipants: false,
    canDeleteParticipants: false,
    canManagePasswords: false,
    canManageProgram: false,
    canMarkPresence: false,
    canViewSubmissions: true,
    canApproveSubmissions: true,
    canMessageParticipants: true,
    canViewDashboard: false,
  },
  participant: {
    label: "Participante",
    canManageParticipants: false,
    canDeleteParticipants: false,
    canManagePasswords: false,
    canManageProgram: false,
    canMarkPresence: false,
    canViewSubmissions: false,
    canApproveSubmissions: false,
    canMessageParticipants: false,
    canViewDashboard: false,
  },
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCEO: boolean;
  isConselho: boolean;
  permissions: PermissionSet;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithParticipant: (participant: { id: string; email: string; nomeCompleto: string; password: string }) => Promise<void>;
  logout: () => void;
  updateAvatar: (uri: string) => Promise<void>;
  updateAdminPassword: (currentPwd: string, newPwd: string) => Promise<{ success: boolean; error?: string }>;
  storedCredentials: { email: string; password: string } | null;
  biometricEnabled: boolean;
  toggleBiometric: (enabled: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "@csa_auth_user";
const CREDENTIALS_KEY = "@csa_credentials";
const ADMIN_PWD_OVERRIDES_KEY = "@csa_admin_pwd_overrides";
const BIOMETRIC_KEY = "@csa_biometric_enabled";

export const ADMIN_USERS: AuthUser[] = [
  { id: "admin-1", email: "ceo@csa.com", name: "CEO - Director Geral", role: "ceo" },
  { id: "admin-2", email: "supervisor@csa.com", name: "Supervisor de Eventos", role: "supervisor" },
  { id: "admin-3", email: "conselho@csa.com", name: "Conselho Científico", role: "conselho" },
];

const ADMIN_PASSWORDS: Record<string, string> = {
  "ceo@csa.com": "ceo2026",
  "supervisor@csa.com": "super2026",
  "conselho@csa.com": "conselho2026",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storedCredentials, setStoredCredentials] = useState<{ email: string; password: string } | null>(null);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 3000);
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(CREDENTIALS_KEY),
      AsyncStorage.getItem(BIOMETRIC_KEY),
    ])
      .then(([stored, creds, bio]) => {
        try {
          if (stored) setUser(JSON.parse(stored));
          if (creds) setStoredCredentials(JSON.parse(creds));
          if (bio !== null) setBiometricEnabledState(JSON.parse(bio));
        } catch {}
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false))
      .finally(() => clearTimeout(timeout));
  }, []);

  const toggleBiometric = useCallback(async (enabled: boolean) => {
    await AsyncStorage.setItem(BIOMETRIC_KEY, JSON.stringify(enabled));
    setBiometricEnabledState(enabled);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const adminUser = ADMIN_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (adminUser) {
      const overridesRaw = await AsyncStorage.getItem(ADMIN_PWD_OVERRIDES_KEY);
      const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
      const correctPwd = overrides[adminUser.email] ?? ADMIN_PASSWORDS[adminUser.email];
      if (password !== correctPwd) return { success: false, error: "Senha incorreta para administrador." };
      const storedUserRaw = await AsyncStorage.getItem(STORAGE_KEY);
      let finalUser = adminUser;
      if (storedUserRaw) {
        const storedUser = JSON.parse(storedUserRaw);
        if (storedUser.id === adminUser.id && storedUser.avatar) {
          finalUser = { ...adminUser, avatar: storedUser.avatar };
        }
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalUser));
      await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ email, password }));
      setStoredCredentials({ email, password });
      setUser(finalUser);
      return { success: true };
    }
    return { success: false, error: "Email ou senha incorretos." };
  }, []);

  const loginWithParticipant = useCallback(async (p: { id: string; email: string; nomeCompleto: string; password: string }) => {
    const u: AuthUser = {
      id: p.id,
      email: p.email,
      name: p.nomeCompleto,
      role: null,
      participantId: p.id,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ email: p.email, password: p.password }));
    setStoredCredentials({ email: p.email, password: p.password });
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const updateAvatar = useCallback(async (uri: string) => {
    if (!user) return;
    const updatedUser = { ...user, avatar: uri };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  const updateAdminPassword = useCallback(async (currentPwd: string, newPwd: string) => {
    if (!user || user.role === null) return { success: false, error: "Não autenticado como administrador." };
    const overridesRaw = await AsyncStorage.getItem(ADMIN_PWD_OVERRIDES_KEY);
    const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
    const storedPwd = overrides[user.email] ?? ADMIN_PASSWORDS[user.email];
    if (currentPwd !== storedPwd) return { success: false, error: "A senha actual está incorreta." };
    if (newPwd.length < 6) return { success: false, error: "A nova senha deve ter pelo menos 6 caracteres." };
    overrides[user.email] = newPwd;
    await AsyncStorage.setItem(ADMIN_PWD_OVERRIDES_KEY, JSON.stringify(overrides));
    await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ email: user.email, password: newPwd }));
    setStoredCredentials({ email: user.email, password: newPwd });
    return { success: true };
  }, [user]);

  const permissions: PermissionSet = user?.role
    ? ROLE_PERMISSIONS[user.role]
    : ROLE_PERMISSIONS["participant"];

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAdmin: user?.role === "ceo" || user?.role === "supervisor",
      isCEO: user?.role === "ceo",
      isConselho: user?.role === "conselho",
      permissions,
      login,
      loginWithParticipant,
      logout,
      updateAvatar,
      updateAdminPassword,
      storedCredentials,
      biometricEnabled,
      toggleBiometric,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
