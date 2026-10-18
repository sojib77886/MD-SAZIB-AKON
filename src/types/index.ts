export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'নগদ' | 'বিকাশ' | 'রকেট' | 'উপায়' | 'ব্যাংক' | 'অন্যান্য';

export interface Category {
  id: string;
  name: string; // Bengali name (e.g. 'ঘর ভাড়া')
  englishName?: string;
  type: TransactionType;
  icon: string; // lucide icon identifier
  color: string; // Tailwind/Hex color
  budget?: number; // Monthly budget limit in Taka
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  note?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface BudgetConfig {
  monthlyOverallBudget: number; // overall monthly expense budget limit
  warningThresholdPercent: number; // e.g. 80 (show warning at 80%)
  dangerThresholdPercent: number; // e.g. 100 (show danger at 100%)
  alertSoundEnabled: boolean;
}

export interface SecuritySettings {
  isPinEnabled: boolean;
  pinHash?: string; // SHA-256 hash of 4-digit PIN
  salt?: string;
  isBiometricsEnabled: boolean;
  biometricCredentialId?: string;
  isE2EEncrypted: boolean;
  autoLockMinutes: number; // 0 = immediately, 1, 5, 15, -1 = never
  lastActiveTimestamp: number;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  budgetConfig: BudgetConfig;
  securitySettings: SecuritySettings;
  useBengaliDigits: boolean; // toggle Bengali (১২৩৪) vs English (1234) digits
  theme: 'dark' | 'light' | 'system';
}

export interface EncryptedPayload {
  v: number;
  iv: string; // base64
  salt: string; // base64
  ciphertext: string; // base64
  hash: string; // HMAC or integrity hash
}
