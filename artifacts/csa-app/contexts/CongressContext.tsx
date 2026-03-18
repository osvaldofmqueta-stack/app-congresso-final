import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type CongressDates = {
  dataInicio: string;
  dataFim: string;
  localNome: string;
};

const DEFAULT_DATES: CongressDates = {
  dataInicio: "2026-03-20",
  dataFim: "2026-04-30",
  localNome: "Universidade Rainha Njinga a Mbande",
};

const STORAGE_KEY = "@csa_congress_dates";

type CongressContextType = {
  congressDates: CongressDates;
  updateCongressDates: (dates: CongressDates) => Promise<void>;
  formatPeriodo: () => string;
};

const CongressContext = createContext<CongressContextType | null>(null);

export function CongressProvider({ children }: { children: React.ReactNode }) {
  const [congressDates, setCongressDates] = useState<CongressDates>(DEFAULT_DATES);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setCongressDates(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const updateCongressDates = useCallback(async (dates: CongressDates) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
    setCongressDates(dates);
  }, []);

  const formatPeriodo = useCallback(() => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    const ini = new Date(congressDates.dataInicio + "T12:00:00Z").toLocaleDateString("pt-PT", opts);
    const fim = new Date(congressDates.dataFim + "T12:00:00Z").toLocaleDateString("pt-PT", opts);
    return `${ini} – ${fim}`;
  }, [congressDates]);

  return (
    <CongressContext.Provider value={{ congressDates, updateCongressDates, formatPeriodo }}>
      {children}
    </CongressContext.Provider>
  );
}

export function useCongress() {
  const ctx = useContext(CongressContext);
  if (!ctx) throw new Error("useCongress must be used within CongressProvider");
  return ctx;
}
