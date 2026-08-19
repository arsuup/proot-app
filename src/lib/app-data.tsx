import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DailyTask } from './daily-missions';
import type { RootNutriments } from './root-score';

const USER_STORAGE_KEY = '@proot/user';
const HISTORY_STORAGE_KEY = '@proot/scan-history';
const MISSION_ACTIVITY_STORAGE_KEY = '@proot/daily-mission-activity-v1';
const WALLET_STORAGE_KEY = '@proot/wallet-v1';
const LEGACY_MISSION_PROGRESS_STORAGE_KEY = '@proot/daily-mission-progress-v2';
const MISSION_ALERT_HISTORY_STORAGE_KEY = '@proot/mission-alert-history-v1';
const MAX_HISTORY_ITEMS = 100;

export type AppUser = {
  name: string;
  email?: string;
  picture?: string;
};

export type ScanHistoryItem = {
  id: string;
  isFavorite?: boolean;
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

export type MissionActivityKind = 'chat' | 'historySeconds' | 'impossibleEquation' | 'nutrition' | 'rootGame';
export type RootSkin = 'classic' | 'drip-basic' | 'drip-full' | 'bling-basic' | 'bling-full';

type RootWallet = {
  equippedRootSkin: RootSkin;
  gems: number;
  ownedRootSkins: RootSkin[];
};

type LegacyRootWallet = {
  equippedRootSkin: 'classic' | 'drip';
  gems: number;
  ownedRootSkins: Array<'classic' | 'drip'>;
};

type MissionCompletionAlert = {
  id: string;
  reward: number;
  title: string;
};

type MissionAlertHistory = {
  date: string;
  taskIds: string[];
};

type StoredMissionProgress = {
  completedTaskIds: string[];
  date: string;
  tasks: DailyTask[];
};

export type DailyMissionActivity = {
  bleach: number;
  chat: number;
  cocaZero: number;
  date: string;
  historySeconds: number;
  impossibleEquation: number;
  nutella: number;
  nutrition: number;
  rootGame: number;
  scan: number;
  scanBarcodes: Record<string, number>;
};

type AppDataContextValue = {
  isReady: boolean;
  user: AppUser | null;
  history: ScanHistoryItem[];
  signIn: (user: AppUser) => Promise<void>;
  signOut: () => Promise<void>;
  addScan: (scan: NewScanHistoryItem) => void;
  clearHistory: () => Promise<void>;
  favoriteHistoryScan: (scanId: string) => void;
  removeHistoryScan: (scanId: string) => void;
  missionActivity: DailyMissionActivity;
  recordMissionActivity: (kind: MissionActivityKind) => void;
  recordMissionScan: (barcode: string, productName: string) => void;
  resetMissionActivity: () => Promise<void>;
  missionCompletionAlert: MissionCompletionAlert | null;
  dismissMissionCompletionAlert: (alertId?: string) => void;
  resetMissionCompletionAlerts: () => Promise<void>;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  buyRootDripBasicSkin: () => PurchaseResult;
  buyRootDripFullUpgrade: () => PurchaseResult;
  buyRootBlingBasicSkin: () => PurchaseResult;
  buyRootBlingFullUpgrade: () => PurchaseResult;
  equippedRootSkin: RootSkin;
  equipRootSkin: (skin: RootSkin) => void;
  gems: number;
  ownedRootSkins: RootSkin[];
  resetGems: () => void;
};

type PurchaseResult = 'equipped' | 'insufficient_gems' | 'purchased' | 'requires_basic';

const AppDataContext = createContext<AppDataContextValue | null>(null);

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getLocalDateKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const createEmptyMissionActivity = (date = getLocalDateKey()): DailyMissionActivity => ({
  bleach: 0,
  chat: 0,
  cocaZero: 0,
  date,
  historySeconds: 0,
  impossibleEquation: 0,
  nutella: 0,
  nutrition: 0,
  rootGame: 0,
  scan: 0,
  scanBarcodes: {},
});

const createDefaultWallet = (gems = 0): RootWallet => ({
  equippedRootSkin: 'classic',
  gems,
  ownedRootSkins: ['classic'],
});

const isRootSkin = (value: unknown): value is RootSkin =>
  value === 'classic'
    || value === 'drip-basic'
    || value === 'drip-full'
    || value === 'bling-basic'
    || value === 'bling-full';

const isRootWallet = (value: unknown): value is RootWallet => {
  if (!value || typeof value !== 'object') return false;
  const wallet = value as Partial<RootWallet>;
  return typeof wallet.gems === 'number'
    && isRootSkin(wallet.equippedRootSkin)
    && Array.isArray(wallet.ownedRootSkins)
    && wallet.ownedRootSkins.every(isRootSkin)
    && wallet.ownedRootSkins.includes('classic');
};

const isLegacyRootWallet = (value: unknown): value is LegacyRootWallet => {
  if (!value || typeof value !== 'object') return false;
  const wallet = value as Partial<LegacyRootWallet>;
  return typeof wallet.gems === 'number'
    && (wallet.equippedRootSkin === 'classic' || wallet.equippedRootSkin === 'drip')
    && Array.isArray(wallet.ownedRootSkins)
    && wallet.ownedRootSkins.every((skin) => skin === 'classic' || skin === 'drip')
    && wallet.ownedRootSkins.includes('classic');
};

const migrateLegacyWallet = (wallet: LegacyRootWallet): RootWallet => ({
  equippedRootSkin: wallet.equippedRootSkin === 'drip' ? 'drip-full' : 'classic',
  gems: Math.max(0, Math.floor(wallet.gems)),
  ownedRootSkins: wallet.ownedRootSkins.includes('drip')
    ? ['classic', 'drip-basic', 'drip-full']
    : ['classic'],
});

const getLegacyGems = (value: string | null) => {
  try {
    const parsed = value ? (JSON.parse(value) as { gems?: unknown }) : null;
    return typeof parsed?.gems === 'number' && parsed.gems > 0 ? Math.floor(parsed.gems) : 0;
  } catch {
    return 0;
  }
};

const isMissionActivity = (value: unknown): value is DailyMissionActivity => {
  if (!value || typeof value !== 'object') return false;
  const activity = value as Partial<DailyMissionActivity>;
  return typeof activity.date === 'string'
    && typeof activity.chat === 'number'
    && typeof activity.historySeconds === 'number'
    && typeof activity.impossibleEquation === 'number'
    && typeof activity.nutrition === 'number'
    && typeof activity.rootGame === 'number'
    && typeof activity.scan === 'number'
    && typeof activity.cocaZero === 'number'
    && typeof activity.nutella === 'number'
    && typeof activity.bleach === 'number'
    && typeof activity.scanBarcodes === 'object'
    && activity.scanBarcodes !== null;
};

const isStoredMissionProgress = (value: unknown): value is StoredMissionProgress => {
  if (!value || typeof value !== 'object') return false;
  const progress = value as Partial<StoredMissionProgress>;
  return typeof progress.date === 'string'
    && Array.isArray(progress.completedTaskIds)
    && progress.completedTaskIds.every((id) => typeof id === 'string')
    && Array.isArray(progress.tasks)
    && progress.tasks.every((task) =>
      task
      && typeof task.id === 'string'
      && typeof task.kind === 'string'
      && typeof task.target === 'number'
      && task.target > 0
      && typeof task.reward === 'number'
      && typeof task.title === 'string');
};

const isMissionAlertHistory = (value: unknown): value is MissionAlertHistory => {
  if (!value || typeof value !== 'object') return false;
  const history = value as Partial<MissionAlertHistory>;
  return typeof history.date === 'string'
    && Array.isArray(history.taskIds)
    && history.taskIds.every((taskId) => typeof taskId === 'string');
};

const getMissionTaskProgress = (task: DailyTask, activity: DailyMissionActivity, date: string) => {
  if (activity.date !== date) return 0;
  switch (task.kind) {
    case 'bleach': return activity.bleach;
    case 'chat': return activity.chat;
    case 'coca-zero': return activity.cocaZero;
    case 'history-time': return activity.historySeconds;
    case 'impossible-equation': return activity.impossibleEquation;
    case 'nutrition': return activity.nutrition;
    case 'nutella': return activity.nutella;
    case 'repeat-scan': return Math.max(0, ...Object.values(activity.scanBarcodes));
    case 'root-game': return activity.rootGame;
    case 'scan': return activity.scan;
  }
};

const normalizeProductName = (name: string) => name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const normalizeHistory = (items: ScanHistoryItem[]) =>
  [...items]
    .sort((first, second) => Date.parse(first.scannedAt) - Date.parse(second.scannedAt))
    .reduce<ScanHistoryItem[]>((uniqueItems, item) => {
      const previousIndex = uniqueItems.findIndex((existing) => existing.barcode === item.barcode);
      const previousItem = previousIndex === -1 ? undefined : uniqueItems[previousIndex];
      if (previousIndex !== -1) uniqueItems.splice(previousIndex, 1);
      uniqueItems.push({
        ...item,
        isFavorite: item.isFavorite ?? previousItem?.isFavorite,
      });
      return uniqueItems;
    }, [])
    .slice(-MAX_HISTORY_ITEMS)
    .sort((first, second) => Number(Boolean(second.isFavorite)) - Number(Boolean(first.isFavorite))
      || Date.parse(first.scannedAt) - Date.parse(second.scannedAt));

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
  const [missionActivity, setMissionActivity] = useState<DailyMissionActivity>(createEmptyMissionActivity);
  const [missionCompletionAlert, setMissionCompletionAlert] = useState<MissionCompletionAlert | null>(null);
  const [wallet, setWallet] = useState<RootWallet>(createDefaultWallet);
  const missionAlertHistoryRef = useRef<MissionAlertHistory>({ date: getLocalDateKey(), taskIds: [] });

  const checkMissionCompletion = useCallback((activity: DailyMissionActivity) => {
    void AsyncStorage.getItem(LEGACY_MISSION_PROGRESS_STORAGE_KEY).then((storedProgress) => {
      let progress: StoredMissionProgress | null = null;
      try {
        const parsed = storedProgress ? JSON.parse(storedProgress) : null;
        progress = isStoredMissionProgress(parsed) ? parsed : null;
      } catch {
        progress = null;
      }

      if (!progress || progress.date !== activity.date) return;
      if (missionAlertHistoryRef.current.date !== activity.date) {
        missionAlertHistoryRef.current = { date: activity.date, taskIds: [] };
      }

      const alreadyAlerted = new Set(missionAlertHistoryRef.current.taskIds);
      const completedTask = progress.tasks.find((task) =>
        !progress.completedTaskIds.includes(task.id)
        && !alreadyAlerted.has(task.id)
        && getMissionTaskProgress(task, activity, progress.date) >= task.target
      );
      if (!completedTask) return;

      const nextHistory: MissionAlertHistory = {
        date: activity.date,
        taskIds: [...alreadyAlerted, completedTask.id],
      };
      missionAlertHistoryRef.current = nextHistory;
      void persist(MISSION_ALERT_HISTORY_STORAGE_KEY, nextHistory);
      setMissionCompletionAlert({
        id: `${activity.date}-${completedTask.id}`,
        reward: completedTask.reward,
        title: completedTask.title,
      });
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      AsyncStorage.getItem(USER_STORAGE_KEY),
      AsyncStorage.getItem(HISTORY_STORAGE_KEY),
      AsyncStorage.getItem(MISSION_ACTIVITY_STORAGE_KEY),
      AsyncStorage.getItem(WALLET_STORAGE_KEY),
      AsyncStorage.getItem(LEGACY_MISSION_PROGRESS_STORAGE_KEY),
      AsyncStorage.getItem(MISSION_ALERT_HISTORY_STORAGE_KEY),
    ]).then(([storedUser, storedHistory, storedMissionActivity, storedWallet, storedLegacyProgress, storedMissionAlertHistory]) => {
      if (!isMounted) return;

      try {
        setUser(storedUser ? (JSON.parse(storedUser) as AppUser) : null);
        const parsedHistory = storedHistory ? (JSON.parse(storedHistory) as ScanHistoryItem[]) : [];
        const cleanedHistory = normalizeHistory(parsedHistory);
        setHistory(cleanedHistory);
        if (storedHistory) void persist(HISTORY_STORAGE_KEY, cleanedHistory);

        const parsedActivity = storedMissionActivity ? JSON.parse(storedMissionActivity) : null;
        const nextActivity = isMissionActivity(parsedActivity) && parsedActivity.date === getLocalDateKey()
          ? parsedActivity
          : createEmptyMissionActivity();
        setMissionActivity(nextActivity);
        if (!storedMissionActivity || nextActivity !== parsedActivity) void persist(MISSION_ACTIVITY_STORAGE_KEY, nextActivity);

        const parsedWallet = storedWallet ? JSON.parse(storedWallet) : null;
        const nextWallet = isRootWallet(parsedWallet)
          ? { ...parsedWallet, gems: Math.max(0, Math.floor(parsedWallet.gems)) }
          : isLegacyRootWallet(parsedWallet)
            ? migrateLegacyWallet(parsedWallet)
            : createDefaultWallet(getLegacyGems(storedLegacyProgress));
        setWallet(nextWallet);
        if (!storedWallet || !isRootWallet(parsedWallet)) void persist(WALLET_STORAGE_KEY, nextWallet);

        const parsedMissionAlertHistory = storedMissionAlertHistory ? JSON.parse(storedMissionAlertHistory) : null;
        missionAlertHistoryRef.current = isMissionAlertHistory(parsedMissionAlertHistory)
          && parsedMissionAlertHistory.date === getLocalDateKey()
          ? parsedMissionAlertHistory
          : { date: getLocalDateKey(), taskIds: [] };
      } catch {
        setUser(null);
        setHistory([]);
        setMissionActivity(createEmptyMissionActivity());
        setWallet(createDefaultWallet());
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

  const favoriteHistoryScan = useCallback((scanId: string) => {
    setHistory((current) => {
      const nextHistory = normalizeHistory(current.map((scan) => scan.id === scanId
        ? { ...scan, isFavorite: true }
        : scan));
      void persist(HISTORY_STORAGE_KEY, nextHistory);
      return nextHistory;
    });
  }, []);

  const removeHistoryScan = useCallback((scanId: string) => {
    setHistory((current) => {
      const nextHistory = current.filter((scan) => scan.id !== scanId);
      void persist(HISTORY_STORAGE_KEY, nextHistory);
      return nextHistory;
    });
  }, []);

  const recordMissionActivity = useCallback((kind: MissionActivityKind) => {
    setMissionActivity((current) => {
      const base = current.date === getLocalDateKey() ? current : createEmptyMissionActivity();
      const nextActivity: DailyMissionActivity = {
        ...base,
        [kind]: base[kind] + 1,
      };
      void persist(MISSION_ACTIVITY_STORAGE_KEY, nextActivity);
      checkMissionCompletion(nextActivity);
      return nextActivity;
    });
  }, [checkMissionCompletion]);

  const recordMissionScan = useCallback((barcode: string, productName: string) => {
    const normalizedProductName = normalizeProductName(productName);
    const isCocaZero = normalizedProductName.includes('coca')
      && (normalizedProductName.includes('zero') || normalizedProductName.includes('sans sucre'));
    const isNutella = normalizedProductName.includes('nutella');
    const isBleach = normalizedProductName.includes('javel') || normalizedProductName.includes('bleach');

    setMissionActivity((current) => {
      const base = current.date === getLocalDateKey() ? current : createEmptyMissionActivity();
      const nextActivity: DailyMissionActivity = {
        ...base,
        bleach: base.bleach + (isBleach ? 1 : 0),
        cocaZero: base.cocaZero + (isCocaZero ? 1 : 0),
        nutella: base.nutella + (isNutella ? 1 : 0),
        scan: base.scan + 1,
        scanBarcodes: {
          ...base.scanBarcodes,
          [barcode]: (base.scanBarcodes[barcode] ?? 0) + 1,
        },
      };
      void persist(MISSION_ACTIVITY_STORAGE_KEY, nextActivity);
      checkMissionCompletion(nextActivity);
      return nextActivity;
    });
  }, [checkMissionCompletion]);

  const resetMissionActivity = useCallback(async () => {
    const nextActivity = createEmptyMissionActivity();
    setMissionActivity(nextActivity);
    await persist(MISSION_ACTIVITY_STORAGE_KEY, nextActivity);
  }, []);

  const dismissMissionCompletionAlert = useCallback((alertId?: string) => {
    setMissionCompletionAlert((current) => !alertId || current?.id === alertId ? null : current);
  }, []);

  const resetMissionCompletionAlerts = useCallback(async () => {
    missionAlertHistoryRef.current = { date: getLocalDateKey(), taskIds: [] };
    setMissionCompletionAlert(null);
    try {
      await AsyncStorage.removeItem(MISSION_ALERT_HISTORY_STORAGE_KEY);
    } catch (error) {
      console.warn('Échec de la réinitialisation des alertes de mission', error);
    }
  }, []);

  const updateWallet = useCallback((update: (wallet: RootWallet) => RootWallet) => {
    setWallet((current) => {
      const nextWallet = update(current);
      void persist(WALLET_STORAGE_KEY, nextWallet);
      return nextWallet;
    });
  }, []);

  const addGems = useCallback((amount: number) => {
    const safeAmount = Math.max(0, Math.floor(amount));
    if (!safeAmount) return;
    updateWallet((current) => ({ ...current, gems: current.gems + safeAmount }));
  }, [updateWallet]);

  const spendGems = useCallback((amount: number) => {
    const safeAmount = Math.max(0, Math.floor(amount));
    if (!safeAmount) return true;
    let wasSpent = false;
    updateWallet((current) => {
      if (current.gems < safeAmount) return current;
      wasSpent = true;
      return { ...current, gems: current.gems - safeAmount };
    });
    return wasSpent;
  }, [updateWallet]);

  const resetGems = useCallback(() => {
    updateWallet((current) => ({ ...current, gems: 0 }));
  }, [updateWallet]);

  const equipRootSkin = useCallback((skin: RootSkin) => {
    updateWallet((current) => current.ownedRootSkins.includes(skin)
      ? { ...current, equippedRootSkin: skin }
      : current);
  }, [updateWallet]);

  const buyRootDripBasicSkin = useCallback(() => {
    let result: PurchaseResult = 'insufficient_gems';
    updateWallet((current) => {
      if (current.ownedRootSkins.includes('drip-basic')) {
        result = 'equipped';
        return { ...current, equippedRootSkin: 'drip-basic' };
      }
      if (current.gems < 10) return current;
      result = 'purchased';
      return {
        ...current,
        equippedRootSkin: 'drip-basic',
        gems: current.gems - 10,
        ownedRootSkins: [...current.ownedRootSkins, 'drip-basic'],
      };
    });
    return result;
  }, [updateWallet]);

  const buyRootDripFullUpgrade = useCallback(() => {
    let result: PurchaseResult = 'insufficient_gems';
    updateWallet((current) => {
      if (current.ownedRootSkins.includes('drip-full')) {
        result = 'equipped';
        return { ...current, equippedRootSkin: 'drip-full' };
      }
      if (!current.ownedRootSkins.includes('drip-basic')) {
        result = 'requires_basic';
        return current;
      }
      if (current.gems < 20) return current;
      result = 'purchased';
      return {
        ...current,
        equippedRootSkin: 'drip-full',
        gems: current.gems - 20,
        ownedRootSkins: [...current.ownedRootSkins, 'drip-full'],
      };
    });
    return result;
  }, [updateWallet]);

  const buyRootBlingBasicSkin = useCallback(() => {
    let result: PurchaseResult = 'insufficient_gems';
    updateWallet((current) => {
      if (current.ownedRootSkins.includes('bling-basic')) {
        result = 'equipped';
        return { ...current, equippedRootSkin: 'bling-basic' };
      }
      if (current.gems < 50) return current;
      result = 'purchased';
      return {
        ...current,
        equippedRootSkin: 'bling-basic',
        gems: current.gems - 50,
        ownedRootSkins: [...current.ownedRootSkins, 'bling-basic'],
      };
    });
    return result;
  }, [updateWallet]);

  const buyRootBlingFullUpgrade = useCallback(() => {
    let result: PurchaseResult = 'insufficient_gems';
    updateWallet((current) => {
      if (current.ownedRootSkins.includes('bling-full')) {
        result = 'equipped';
        return { ...current, equippedRootSkin: 'bling-full' };
      }
      if (!current.ownedRootSkins.includes('bling-basic')) {
        result = 'requires_basic';
        return current;
      }
      if (current.gems < 100) return current;
      result = 'purchased';
      return {
        ...current,
        equippedRootSkin: 'bling-full',
        gems: current.gems - 100,
        ownedRootSkins: [...current.ownedRootSkins, 'bling-full'],
      };
    });
    return result;
  }, [updateWallet]);

  const value = useMemo<AppDataContextValue>(() => ({
    isReady,
    user,
    history,
    signIn,
    signOut,
    addScan,
    clearHistory,
    favoriteHistoryScan,
    removeHistoryScan,
    missionActivity,
    recordMissionActivity,
    recordMissionScan,
    resetMissionActivity,
    missionCompletionAlert,
    dismissMissionCompletionAlert,
    resetMissionCompletionAlerts,
    addGems,
    spendGems,
    buyRootDripBasicSkin,
    buyRootDripFullUpgrade,
    buyRootBlingBasicSkin,
    buyRootBlingFullUpgrade,
    equippedRootSkin: wallet.equippedRootSkin,
    equipRootSkin,
    gems: wallet.gems,
    ownedRootSkins: wallet.ownedRootSkins,
    resetGems,
  }), [addGems, addScan, buyRootBlingBasicSkin, buyRootBlingFullUpgrade, buyRootDripBasicSkin, buyRootDripFullUpgrade, clearHistory, dismissMissionCompletionAlert, equipRootSkin, favoriteHistoryScan, history, isReady, missionActivity, missionCompletionAlert, recordMissionActivity, recordMissionScan, removeHistoryScan, resetGems, resetMissionActivity, resetMissionCompletionAlerts, signIn, signOut, spendGems, user, wallet]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData doit être utilisé dans AppDataProvider.');
  return value;
}
