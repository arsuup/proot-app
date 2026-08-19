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

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

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

const persist = async (key: string, value: unknown) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Échec de sauvegarde pour ${key}`, error);
  }
};

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
        if (storedHistory) void persist(HISTORY_STORAGE_KEY, cleanedHistory);
      } catch {
        setUser(null);
        setHistory([]);
      } finally {
        setIsReady(true);
      }
    }).catch((error) => {
      console.warn('Échec du chargement des données locales', error);
      if (isMounted) setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (nextUser: AppUser) => {
    setUser(nextUser);
    await persist(USER_STORAGE_KEY, nextUser);
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
      console.warn('Échec de la suppression de l\'utilisateur', error);
    }
  }, []);

  const addScan = useCallback((scan: NewScanHistoryItem) => {
    const item: ScanHistoryItem = {
      ...scan,
      id: generateId(),
      scannedAt: new Date().toISOString(),
    };
    setHistory((current) => {
      const nextHistory = normalizeHistory([...current, item]);
      void persist(HISTORY_STORAGE_KEY, nextHistory);
      return nextHistory;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
      console.warn('Échec de la suppression de l\'historique', error);
    }
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