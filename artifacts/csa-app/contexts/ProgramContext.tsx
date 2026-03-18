import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ProgramItemStatus = "pendente" | "ativo" | "concluido";

export type ProgramItem = {
  id: string;
  tema: string;
  horaInicio: string;
  horaFim: string;
  status: ProgramItemStatus;
  concluidoEm?: string;
  ativadoEm?: string;
  ordem: number;
};

export type ProgramDay = {
  id: string;
  data: string;
  titulo: string;
  itens: ProgramItem[];
  createdAt: string;
};

const STORAGE_PROGRAMA = "@csa_programa";

type ProgramContextType = {
  days: ProgramDay[];
  addDay: (data: string, titulo: string) => Promise<void>;
  updateDay: (id: string, data: string, titulo: string) => Promise<void>;
  deleteDay: (id: string) => Promise<void>;
  addItem: (dayId: string, tema: string, horaInicio: string, horaFim: string) => Promise<void>;
  updateItem: (dayId: string, itemId: string, tema: string, horaInicio: string, horaFim: string) => Promise<void>;
  deleteItem: (dayId: string, itemId: string) => Promise<void>;
  markItemAtivo: (dayId: string, itemId: string) => Promise<void>;
  markItemConcluido: (dayId: string, itemId: string) => Promise<void>;
  markItemPendente: (dayId: string, itemId: string) => Promise<void>;
  refreshPrograma: () => Promise<void>;
};

const ProgramContext = createContext<ProgramContextType | null>(null);

export function ProgramProvider({ children }: { children: React.ReactNode }) {
  const [days, setDays] = useState<ProgramDay[]>([]);

  const loadData = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_PROGRAMA);
      if (raw) setDays(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const saveDays = useCallback(async (list: ProgramDay[]) => {
    await AsyncStorage.setItem(STORAGE_PROGRAMA, JSON.stringify(list));
    setDays(list);
  }, []);

  const addDay = useCallback(async (data: string, titulo: string) => {
    const id = await Crypto.randomUUID();
    const newDay: ProgramDay = {
      id,
      data,
      titulo,
      itens: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...days, newDay].sort((a, b) => a.data.localeCompare(b.data));
    await saveDays(updated);
  }, [days, saveDays]);

  const updateDay = useCallback(async (id: string, data: string, titulo: string) => {
    const updated = days
      .map((d) => d.id === id ? { ...d, data, titulo } : d)
      .sort((a, b) => a.data.localeCompare(b.data));
    await saveDays(updated);
  }, [days, saveDays]);

  const deleteDay = useCallback(async (id: string) => {
    const updated = days.filter((d) => d.id !== id);
    await saveDays(updated);
  }, [days, saveDays]);

  const addItem = useCallback(async (dayId: string, tema: string, horaInicio: string, horaFim: string) => {
    const id = await Crypto.randomUUID();
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      const ordem = d.itens.length > 0 ? Math.max(...d.itens.map((i) => i.ordem)) + 1 : 0;
      const newItem: ProgramItem = {
        id,
        tema,
        horaInicio,
        horaFim,
        status: "pendente",
        ordem,
      };
      return { ...d, itens: [...d.itens, newItem] };
    });
    await saveDays(updated);
  }, [days, saveDays]);

  const updateItem = useCallback(async (dayId: string, itemId: string, tema: string, horaInicio: string, horaFim: string) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        itens: d.itens.map((i) => i.id === itemId ? { ...i, tema, horaInicio, horaFim } : i),
      };
    });
    await saveDays(updated);
  }, [days, saveDays]);

  const deleteItem = useCallback(async (dayId: string, itemId: string) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      return { ...d, itens: d.itens.filter((i) => i.id !== itemId) };
    });
    await saveDays(updated);
  }, [days, saveDays]);

  const markItemAtivo = useCallback(async (dayId: string, itemId: string) => {
    const now = new Date().toISOString();
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        itens: d.itens.map((i) => {
          if (i.id === itemId) return { ...i, status: "ativo" as ProgramItemStatus, ativadoEm: now };
          if (i.status === "ativo") return { ...i, status: "pendente" as ProgramItemStatus };
          return i;
        }),
      };
    });
    await saveDays(updated);
  }, [days, saveDays]);

  const markItemConcluido = useCallback(async (dayId: string, itemId: string) => {
    const now = new Date().toISOString();
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        itens: d.itens.map((i) =>
          i.id === itemId ? { ...i, status: "concluido" as ProgramItemStatus, concluidoEm: now } : i
        ),
      };
    });
    await saveDays(updated);
  }, [days, saveDays]);

  const markItemPendente = useCallback(async (dayId: string, itemId: string) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        itens: d.itens.map((i) =>
          i.id === itemId ? { ...i, status: "pendente" as ProgramItemStatus, concluidoEm: undefined, ativadoEm: undefined } : i
        ),
      };
    });
    await saveDays(updated);
  }, [days, saveDays]);

  return (
    <ProgramContext.Provider value={{
      days,
      addDay,
      updateDay,
      deleteDay,
      addItem,
      updateItem,
      deleteItem,
      markItemAtivo,
      markItemConcluido,
      markItemPendente,
      refreshPrograma: loadData,
    }}>
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  const ctx = useContext(ProgramContext);
  if (!ctx) throw new Error("useProgram must be used within ProgramProvider");
  return ctx;
}
