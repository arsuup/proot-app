import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { RootNutriments } from './root-score';

const USER_STORAGE_KEY = '@proot/user';
const HISTORY_STORAGE_KEY = '@proot/scan-history';
const MAX_HISTORY_ITEMS = 100;

export type AppUser = {
  name: string;
  email?: string;
  picture?: string;
};

export type ScanHistoryItem = {
  id: string;
  scannedAt: string;
  barcode: string;
  productName: string;
  brand?: string;
  image?: string;
  rootScore: number;
  verdictTitle: string;
  verdictColor: string;
  nutritionGrade?: string;
  nutriments?: RootNutriments;
};

type NewScanHistoryItem = Omit<ScanHistoryItem, 'id' | 'scannedAt'>;

type AppDataContextValue = {
  isReady: boolean;
  user: AppUser | null;
  history: ScanHistoryItem[];
  signIn: (user: AppUser) => Promise<void>;
  signOut: () => Promise<void>;
  addScan: (scan: NewScanHistoryItem) => void;
  clearHistory: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

const normalizeHistory = (items: ScanHistoryItem[]) =>
  [...items]
    .sort((first, second) => Date.parse(first.scannedAt) - Date.parse(second.scannedAt))
    .reduce<ScanHistoryItem[]>((uniqueItems, item) => {
      const previousIndex = uniqueItems.findIndex((existing) => existing.barcode === item.barcode);
      if (previousIndex !== -1) uniqueItems.splice(previousIndex, 1);
      uniqueItems.push(item);
      return uniqueItems;
    }, [])
    .slice(-MAX_HISTORY_ITEMS);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      AsyncStorage.getItem(USER_STORAGE_KEY),
      AsyncStorage.getItem(HISTORY_STORAGE_KEY),
    ]).then(([storedUser, storedHistory]) => {
      if (!isMounted) return;

      try {
        setUser(storedUser ? (JSON.parse(storedUser) as AppUser) : null);
        const parsedHistory = storedHistory ? (JSON.parse(storedHistory) as ScanHistoryItem[]) : [];
        const cleanedHistory = normalizeHistory(parsedHistory);
        setHistory(cleanedHistory);
        if (storedHistory) void AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(cleanedHistory));
      } catch {
        setUser(null);
        setHistory([]);
      } finally {
        setIsReady(true);
      }
    }).catch(() => {
      if (isMounted) setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (nextUser: AppUser) => {
    setUser(nextUser);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  const addScan = useCallback((scan: NewScanHistoryItem) => {
    const item: ScanHistoryItem = {
      ...scan,
      id: `${scan.barcode}-${Date.now()}`,
      scannedAt: new Date().toISOString(),
    };
    setHistory((current) => {
      // Un même code-barres n'apparaît qu'une fois. Le nouveau scan est replacé à la fin,
      // comme dans l'exemple : brocolis → coca → brocolis devient coca → brocolis.
      const withoutSameProduct = current.filter((existing) => existing.barcode !== scan.barcode);
      const nextHistory = [...withoutSameProduct, item].slice(-MAX_HISTORY_ITEMS);
      void AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
      return nextHistory;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  }, []);

  const value = useMemo<AppDataContextValue>(() => ({
    isReady,
    user,
    history,
    signIn,
    signOut,
    addScan,
    clearHistory,
  }), [addScan, clearHistory, history, isReady, signIn, signOut, user]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData doit être utilisé dans AppDataProvider.');
  return value;
}
