import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  AppState,
  Category,
  Transaction,
  BudgetConfig,
  SecuritySettings,
  EncryptedPayload,
} from '../types';
import { DEFAULT_CATEGORIES, getSampleTransactions, getCurrentMonthKey } from '../utils/formatters';
import { encryptData, decryptData, sha256, generateSalt } from '../utils/crypto';

interface AppContextType {
  // Data
  state: AppState;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  filteredTransactions: Transaction[];
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  monthlyBudgetUsagePercent: number;
  isBudgetExceeded: boolean;
  isBudgetWarning: boolean;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (cat: Category) => void;
  deleteCategory: (id: string) => void;
  updateBudgetConfig: (config: Partial<BudgetConfig>) => void;
  toggleBengaliDigits: () => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;

  // Security & Lock
  isLocked: boolean;
  unlockAppWithPin: (pin: string) => Promise<boolean>;
  unlockAppWithBiometrics: () => Promise<boolean>;
  lockApp: () => void;
  setupPin: (pin: string, enableE2EE: boolean) => Promise<boolean>;
  removePin: () => void;
  toggleBiometrics: (enabled: boolean, credentialId?: string) => void;
  toggleE2EE: (enabled: boolean) => Promise<boolean>;
  currentPin: string | null;

  // Backup & Reset
  exportBackup: (encryptWithPassword?: string) => Promise<string>;
  importBackup: (backupJson: string, password?: string) => Promise<{ success: boolean; message: string }>;
  loadSampleData: () => void;
  resetAllData: () => void;
}

const STORAGE_KEY_UNENCRYPTED = 'hishab_khata_state_v1';
const STORAGE_KEY_ENCRYPTED = 'hishab_khata_vault_v1';
const STORAGE_KEY_SETTINGS = 'hishab_khata_sec_settings_v1';

const defaultBudgetConfig: BudgetConfig = {
  monthlyOverallBudget: 35000,
  warningThresholdPercent: 80,
  dangerThresholdPercent: 100,
  alertSoundEnabled: true,
};

const defaultSecuritySettings: SecuritySettings = {
  isPinEnabled: false,
  isBiometricsEnabled: false,
  isE2EEncrypted: false,
  autoLockMinutes: 5,
  lastActiveTimestamp: Date.now(),
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [activeSessionPin, setActiveSessionPin] = useState<string | null>(null);

  // App core state
  const [state, setState] = useState<AppState>(() => {
    // Check security settings first
    let sec: SecuritySettings = defaultSecuritySettings;
    try {
      const savedSec = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSec) {
        sec = { ...defaultSecuritySettings, ...JSON.parse(savedSec) };
      }
    } catch {
      // fallback
    }

    // If E2EE is enabled, we cannot load data until unlocked!
    if (sec.isPinEnabled && sec.isE2EEncrypted) {
      return {
        transactions: [],
        categories: DEFAULT_CATEGORIES,
        budgetConfig: defaultBudgetConfig,
        securitySettings: sec,
        useBengaliDigits: true,
        theme: 'dark',
      };
    }

    // Try unencrypted load
    try {
      const raw = localStorage.getItem(STORAGE_KEY_UNENCRYPTED);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          transactions: parsed.transactions || getSampleTransactions(),
          categories: parsed.categories || DEFAULT_CATEGORIES,
          budgetConfig: parsed.budgetConfig || defaultBudgetConfig,
          securitySettings: sec,
          useBengaliDigits: parsed.useBengaliDigits !== false,
          theme: parsed.theme || 'dark',
        };
      }
    } catch {
      // ignore
    }

    // Default initial state with sample data
    return {
      transactions: getSampleTransactions(),
      categories: DEFAULT_CATEGORIES,
      budgetConfig: defaultBudgetConfig,
      securitySettings: sec,
      useBengaliDigits: true,
      theme: 'dark',
    };
  });

  // Check if app should be initially locked
  useEffect(() => {
    if (state.securitySettings.isPinEnabled) {
      setIsLocked(true);
    }
  }, []);

  // Theme synchronization with HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else if (state.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [state.theme]);

  // Persistent save helper
  const saveStateToStorage = useCallback(
    async (newState: AppState, pinToUse: string | null) => {
      try {
        // Save security settings separately so app knows lock state on reload
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newState.securitySettings));

        if (newState.securitySettings.isE2EEncrypted && pinToUse) {
          // Encrypt entire payload with AES-GCM
          const encrypted = await encryptData(
            {
              transactions: newState.transactions,
              categories: newState.categories,
              budgetConfig: newState.budgetConfig,
              useBengaliDigits: newState.useBengaliDigits,
              theme: newState.theme,
            },
            pinToUse
          );
          localStorage.setItem(STORAGE_KEY_ENCRYPTED, JSON.stringify(encrypted));
          localStorage.removeItem(STORAGE_KEY_UNENCRYPTED);
        } else {
          // Save unencrypted
          const dataToSave = {
            transactions: newState.transactions,
            categories: newState.categories,
            budgetConfig: newState.budgetConfig,
            useBengaliDigits: newState.useBengaliDigits,
            theme: newState.theme,
          };
          localStorage.setItem(STORAGE_KEY_UNENCRYPTED, JSON.stringify(dataToSave));
          localStorage.removeItem(STORAGE_KEY_ENCRYPTED);
        }
      } catch (err) {
        console.error('Storage save failed:', err);
      }
    },
    []
  );

  // Sync state whenever it changes (if not in locked empty state)
  useEffect(() => {
    if (!isLocked) {
      saveStateToStorage(state, activeSessionPin);
    }
  }, [state, isLocked, activeSessionPin, saveStateToStorage]);

  // Auto-lock timer based on user settings
  useEffect(() => {
    if (!state.securitySettings.isPinEnabled || isLocked) return;

    let timeoutId: number | undefined;
    const lockMinutes = state.securitySettings.autoLockMinutes;

    if (lockMinutes > 0) {
      const resetTimer = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          setIsLocked(true);
        }, lockMinutes * 60 * 1000);
      };

      const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      events.forEach((ev) => window.addEventListener(ev, resetTimer));
      resetTimer();

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      };
    }
  }, [state.securitySettings.isPinEnabled, state.securitySettings.autoLockMinutes, isLocked]);

  // Unlock with PIN
  const unlockAppWithPin = async (enteredPin: string): Promise<boolean> => {
    const { pinHash, salt, isE2EEncrypted } = state.securitySettings;
    if (!pinHash || !salt) return false;

    const computedHash = await sha256(enteredPin, salt);
    if (computedHash !== pinHash) {
      return false;
    }

    setActiveSessionPin(enteredPin);

    // If E2EE, decrypt vault
    if (isE2EEncrypted) {
      try {
        const encryptedRaw = localStorage.getItem(STORAGE_KEY_ENCRYPTED);
        if (encryptedRaw) {
          const payload = JSON.parse(encryptedRaw) as EncryptedPayload;
          const decrypted = await decryptData<{
            transactions: Transaction[];
            categories: Category[];
            budgetConfig: BudgetConfig;
            useBengaliDigits?: boolean;
            theme?: 'dark' | 'light' | 'system';
          }>(payload, enteredPin);

          setState((prev) => ({
            ...prev,
            transactions: decrypted.transactions || [],
            categories: decrypted.categories || DEFAULT_CATEGORIES,
            budgetConfig: decrypted.budgetConfig || defaultBudgetConfig,
            useBengaliDigits: decrypted.useBengaliDigits !== false,
            theme: decrypted.theme || 'dark',
          }));
        }
      } catch (err) {
        console.error('Decryption failed:', err);
        return false;
      }
    }

    setIsLocked(false);
    return true;
  };

  // Unlock with Biometrics
  const unlockAppWithBiometrics = async (): Promise<boolean> => {
    if (!state.securitySettings.isBiometricsEnabled) return false;
    // Biometric success unlocks session
    setIsLocked(false);
    return true;
  };

  // Lock manually
  const lockApp = () => {
    if (state.securitySettings.isPinEnabled) {
      setIsLocked(true);
    }
  };

  // Setup PIN and optionally enable E2E Encryption
  const setupPin = async (pin: string, enableE2EE: boolean): Promise<boolean> => {
    try {
      const salt = generateSalt(16);
      const pinHash = await sha256(pin, salt);

      const updatedSecurity: SecuritySettings = {
        ...state.securitySettings,
        isPinEnabled: true,
        pinHash,
        salt,
        isE2EEncrypted: enableE2EE,
        lastActiveTimestamp: Date.now(),
      };

      setActiveSessionPin(pin);

      const newState: AppState = {
        ...state,
        securitySettings: updatedSecurity,
      };

      setState(newState);
      await saveStateToStorage(newState, pin);
      return true;
    } catch (err) {
      console.error('Failed to setup PIN:', err);
      return false;
    }
  };

  // Remove PIN & encryption
  const removePin = () => {
    const updatedSecurity: SecuritySettings = {
      ...state.securitySettings,
      isPinEnabled: false,
      pinHash: undefined,
      salt: undefined,
      isBiometricsEnabled: false,
      biometricCredentialId: undefined,
      isE2EEncrypted: false,
    };

    setActiveSessionPin(null);
    const newState: AppState = {
      ...state,
      securitySettings: updatedSecurity,
    };
    setState(newState);
    saveStateToStorage(newState, null);
  };

  // Toggle biometrics
  const toggleBiometrics = (enabled: boolean, credentialId?: string) => {
    setState((prev) => {
      const updatedSecurity = {
        ...prev.securitySettings,
        isBiometricsEnabled: enabled,
        biometricCredentialId: credentialId || prev.securitySettings.biometricCredentialId,
      };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updatedSecurity));
      return { ...prev, securitySettings: updatedSecurity };
    });
  };

  // Toggle E2EE
  const toggleE2EE = async (enabled: boolean): Promise<boolean> => {
    if (!state.securitySettings.isPinEnabled) return false;
    if (!activeSessionPin) return false;

    const updatedSecurity = {
      ...state.securitySettings,
      isE2EEncrypted: enabled,
    };

    const newState = {
      ...state,
      securitySettings: updatedSecurity,
    };

    setState(newState);
    await saveStateToStorage(newState, activeSessionPin);
    return true;
  };

  // Filtered transactions for selected month
  const filteredTransactions = useMemo(() => {
    return state.transactions
      .filter((tx) => tx.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, selectedMonth]);

  // Monthly stats
  const { monthlyIncome, monthlyExpense, monthlyBalance, monthlyBudgetUsagePercent, isBudgetExceeded, isBudgetWarning } =
    useMemo(() => {
      let income = 0;
      let expense = 0;
      filteredTransactions.forEach((tx) => {
        if (tx.type === 'income') income += tx.amount;
        else expense += tx.amount;
      });

      const balance = income - expense;
      const budget = state.budgetConfig.monthlyOverallBudget || 1;
      const usagePercent = Math.round((expense / budget) * 100);

      const isWarning = usagePercent >= state.budgetConfig.warningThresholdPercent && usagePercent < 100;
      const isExceeded = usagePercent >= state.budgetConfig.dangerThresholdPercent;

      return {
        monthlyIncome: income,
        monthlyExpense: expense,
        monthlyBalance: balance,
        monthlyBudgetUsagePercent: usagePercent,
        isBudgetExceeded: isExceeded,
        isBudgetWarning: isWarning,
      };
    }, [filteredTransactions, state.budgetConfig]);

  // Transaction CRUD
  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setState((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) =>
        tx.id === updatedTx.id ? { ...updatedTx, updatedAt: Date.now() } : tx
      ),
    }));
  };

  const deleteTransaction = (id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((tx) => tx.id !== id),
    }));
  };

  // Category CRUD
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: 'cat-custom-' + Date.now(),
    };
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
  };

  const updateCategory = (updatedCat: Category) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === updatedCat.id ? updatedCat : c)),
    }));
  };

  const deleteCategory = (id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  };

  const updateBudgetConfig = (config: Partial<BudgetConfig>) => {
    setState((prev) => ({
      ...prev,
      budgetConfig: { ...prev.budgetConfig, ...config },
    }));
  };

  const toggleBengaliDigits = () => {
    setState((prev) => ({
      ...prev,
      useBengaliDigits: !prev.useBengaliDigits,
    }));
  };

  const setTheme = (theme: 'dark' | 'light' | 'system') => {
    setState((prev) => ({ ...prev, theme }));
  };

  // Export backup JSON
  const exportBackup = async (encryptWithPassword?: string): Promise<string> => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'Hishab-Khata',
      transactions: state.transactions,
      categories: state.categories,
      budgetConfig: state.budgetConfig,
      useBengaliDigits: state.useBengaliDigits,
    };

    if (encryptWithPassword && encryptWithPassword.trim().length > 0) {
      const encrypted = await encryptData(backupData, encryptWithPassword);
      return JSON.stringify({ isEncrypted: true, payload: encrypted }, null, 2);
    }

    return JSON.stringify({ isEncrypted: false, data: backupData }, null, 2);
  };

  // Import backup JSON
  const importBackup = async (
    backupJson: string,
    password?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const parsed = JSON.parse(backupJson);

      let dataToRestore: {
        transactions: Transaction[];
        categories: Category[];
        budgetConfig: BudgetConfig;
        useBengaliDigits?: boolean;
      };

      if (parsed.isEncrypted) {
        if (!password) {
          return { success: false, message: 'এই ব্যাকআপ ফাইলটি পাসওয়ার্ড দিয়ে এনক্রিপ্ট করা। দয়া করে পাসওয়ার্ড প্রদান করুন।' };
        }
        try {
          dataToRestore = await decryptData(parsed.payload, password);
        } catch {
          return { success: false, message: 'ভুল পাসওয়ার্ড! ব্যাকআপ ফাইলটি ডিক্রিপ্ট করা যায়নি।' };
        }
      } else if (parsed.data) {
        dataToRestore = parsed.data;
      } else {
        dataToRestore = parsed;
      }

      if (!Array.isArray(dataToRestore.transactions) || !Array.isArray(dataToRestore.categories)) {
        return { success: false, message: 'অকার্যকর ব্যাকআপ ফাইল ফরম্যাট।' };
      }

      setState((prev) => ({
        ...prev,
        transactions: dataToRestore.transactions,
        categories: dataToRestore.categories,
        budgetConfig: dataToRestore.budgetConfig || prev.budgetConfig,
        useBengaliDigits: dataToRestore.useBengaliDigits !== false,
      }));

      return { success: true, message: 'ডাটা সফলভাবে ব্যাকআপ থেকে রিস্টোর করা হয়েছে!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: 'ব্যাকআপ ফাইল পড়তে সমস্যা হয়েছে: ' + msg };
    }
  };

  const loadSampleData = () => {
    setState((prev) => ({
      ...prev,
      transactions: getSampleTransactions(),
      categories: DEFAULT_CATEGORIES,
      budgetConfig: defaultBudgetConfig,
    }));
  };

  const resetAllData = () => {
    setState((prev) => ({
      ...prev,
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      budgetConfig: defaultBudgetConfig,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        selectedMonth,
        setSelectedMonth,
        filteredTransactions,
        monthlyIncome,
        monthlyExpense,
        monthlyBalance,
        monthlyBudgetUsagePercent,
        isBudgetExceeded,
        isBudgetWarning,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        updateBudgetConfig,
        toggleBengaliDigits,
        setTheme,
        isLocked,
        unlockAppWithPin,
        unlockAppWithBiometrics,
        lockApp,
        setupPin,
        removePin,
        toggleBiometrics,
        toggleE2EE,
        currentPin: activeSessionPin,
        exportBackup,
        importBackup,
        loadSampleData,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
