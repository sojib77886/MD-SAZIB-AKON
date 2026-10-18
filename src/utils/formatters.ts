import { Category, Transaction } from '../types';

export const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Converts numbers or strings of numbers to Bengali digits if useBengali is true
 */
export function toBengaliNumber(val: number | string, useBengali: boolean = true): string {
  const str = String(val);
  if (!useBengali) return str;
  return str.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)] || digit);
}

/**
 * Formats a currency amount in Bangladeshi Taka (৳)
 */
export function formatTaka(amount: number, useBengali: boolean = true): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Format with standard thousands separator (e.g. 12,345)
  const formattedEn = absAmount.toLocaleString('en-BD', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  const displayDigits = useBengali ? toBengaliNumber(formattedEn, true) : formattedEn;
  return `${isNegative ? '-' : ''}৳ ${displayDigits}`;
}

/**
 * Formats date to Bengali readable format (e.g. ১৭ অক্টোবর ২০২৬)
 */
export function formatBengaliDate(dateStr: string, useBengali: boolean = true): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const monthName = BENGALI_MONTHS[monthIdx] || parts[1];
  const dayStr = toBengaliNumber(day, useBengali);
  const yearStr = toBengaliNumber(year, useBengali);

  return `${dayStr} ${monthName}, ${yearStr}`;
}

/**
 * Gets the current month in YYYY-MM format
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Default categories matching the user's explicit request
 */
export const DEFAULT_CATEGORIES: Category[] = [
  // User explicitly requested categories
  {
    id: 'cat-rent',
    name: 'ঘর ভাড়া',
    englishName: 'House Rent',
    type: 'expense',
    icon: 'Home',
    color: '#3b82f6', // blue
    budget: 12000,
    isDefault: true,
  },
  {
    id: 'cat-electric',
    name: 'কারেন্ট বিল',
    englishName: 'Electricity Bill',
    type: 'expense',
    icon: 'Zap',
    color: '#eab308', // yellow
    budget: 2000,
    isDefault: true,
  },
  {
    id: 'cat-food',
    name: 'খাবার খরচ',
    englishName: 'Food & Groceries',
    type: 'expense',
    icon: 'Utensils',
    color: '#ef4444', // red
    budget: 8000,
    isDefault: true,
  },
  {
    id: 'cat-pocket',
    name: 'হাত খরচ',
    englishName: 'Pocket Money',
    type: 'expense',
    icon: 'Wallet',
    color: '#8b5cf6', // purple
    budget: 3000,
    isDefault: true,
  },
  {
    id: 'cat-cigarette',
    name: 'সিগারেট',
    englishName: 'Cigarettes / Smoking',
    type: 'expense',
    icon: 'Cigarette',
    color: '#f97316', // orange
    budget: 1500,
    isDefault: true,
  },
  {
    id: 'cat-water',
    name: 'পানি',
    englishName: 'Water Bill',
    type: 'expense',
    icon: 'Droplet',
    color: '#06b6d4', // cyan
    budget: 500,
    isDefault: true,
  },
  {
    id: 'cat-transport',
    name: 'গাড়ি ভাড়া',
    englishName: 'Transport & Fare',
    type: 'expense',
    icon: 'Car',
    color: '#14b8a6', // teal
    budget: 3500,
    isDefault: true,
  },
  {
    id: 'cat-shopping',
    name: 'অনলাইন শপিং',
    englishName: 'Online Shopping',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#ec4899', // pink
    budget: 4000,
    isDefault: true,
  },
  {
    id: 'cat-medical',
    name: 'ওষুধ ও চিকিৎসা',
    englishName: 'Medical & Healthcare',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#f43f5e', // rose
    budget: 2000,
    isDefault: true,
  },
  {
    id: 'cat-internet',
    name: 'ইন্টারনেট ও মোবাইল',
    englishName: 'Internet & Mobile',
    type: 'expense',
    icon: 'Wifi',
    color: '#6366f1', // indigo
    budget: 1200,
    isDefault: true,
  },

  // Income categories
  {
    id: 'cat-salary',
    name: 'মাসিক বেতন',
    englishName: 'Monthly Salary',
    type: 'income',
    icon: 'Briefcase',
    color: '#10b981', // emerald
    isDefault: true,
  },
  {
    id: 'cat-freelance',
    name: 'ফ্রিল্যান্সিং',
    englishName: 'Freelancing',
    type: 'income',
    icon: 'Laptop',
    color: '#0ea5e9', // sky
    isDefault: true,
  },
  {
    id: 'cat-business',
    name: 'ব্যবসা',
    englishName: 'Business',
    type: 'income',
    icon: 'Store',
    color: '#8b5cf6', // violet
    isDefault: true,
  },
  {
    id: 'cat-gift',
    name: 'বোনাস ও উপহার',
    englishName: 'Bonus & Gifts',
    type: 'income',
    icon: 'Gift',
    color: '#f59e0b', // amber
    isDefault: true,
  },
  {
    id: 'cat-other-income',
    name: 'অন্যান্য আয়',
    englishName: 'Other Income',
    type: 'income',
    icon: 'PlusCircle',
    color: '#10b981',
    isDefault: true,
  },
];

/**
 * Generate rich starter sample transactions for immediate visualization
 */
export function getSampleTransactions(): Transaction[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const makeDate = (day: number) => `${year}-${month}-${String(day).padStart(2, '0')}`;

  return [
    {
      id: 'tx-1',
      type: 'income',
      amount: 45000,
      categoryId: 'cat-salary',
      date: makeDate(1),
      paymentMethod: 'ব্যাংক',
      note: 'অক্টোবর মাসের মূল বেতন',
      createdAt: Date.now() - 15 * 86400000,
      updatedAt: Date.now() - 15 * 86400000,
    },
    {
      id: 'tx-2',
      type: 'income',
      amount: 15000,
      categoryId: 'cat-freelance',
      date: makeDate(5),
      paymentMethod: 'বিকাশ',
      note: 'ওয়েব ডিজাইন ক্লায়েন্ট প্রজেক্ট পেমেন্ট',
      createdAt: Date.now() - 12 * 86400000,
      updatedAt: Date.now() - 12 * 86400000,
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 12000,
      categoryId: 'cat-rent',
      date: makeDate(2),
      paymentMethod: 'ব্যাংক',
      note: 'ফ্ল্যাটের মাসিক ঘর ভাড়া পরিশোধ',
      createdAt: Date.now() - 14 * 86400000,
      updatedAt: Date.now() - 14 * 86400000,
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 1650,
      categoryId: 'cat-electric',
      date: makeDate(4),
      paymentMethod: 'বিকাশ',
      note: 'ডেসকো পোস্টপেইড বিদ্যুৎ বিল',
      createdAt: Date.now() - 13 * 86400000,
      updatedAt: Date.now() - 13 * 86400000,
    },
    {
      id: 'tx-5',
      type: 'expense',
      amount: 5200,
      categoryId: 'cat-food',
      date: makeDate(6),
      paymentMethod: 'নগদ',
      note: 'মাসিক কাঁচাবাজার ও মুদি কেনাকাটা',
      createdAt: Date.now() - 11 * 86400000,
      updatedAt: Date.now() - 11 * 86400000,
    },
    {
      id: 'tx-6',
      type: 'expense',
      amount: 450,
      categoryId: 'cat-water',
      date: makeDate(7),
      paymentMethod: 'বিকাশ',
      note: 'ওয়াসা পানির বিল',
      createdAt: Date.now() - 10 * 86400000,
      updatedAt: Date.now() - 10 * 86400000,
    },
    {
      id: 'tx-7',
      type: 'expense',
      amount: 1200,
      categoryId: 'cat-cigarette',
      date: makeDate(8),
      paymentMethod: 'নগদ',
      note: 'সিগারেট ও চায়ের স্টলের খরচ',
      createdAt: Date.now() - 9 * 86400000,
      updatedAt: Date.now() - 9 * 86400000,
    },
    {
      id: 'tx-8',
      type: 'expense',
      amount: 2100,
      categoryId: 'cat-transport',
      date: makeDate(10),
      paymentMethod: 'উপায়',
      note: 'অফিস যাতায়াতের বাস ও সিএনজি ভাড়া',
      createdAt: Date.now() - 7 * 86400000,
      updatedAt: Date.now() - 7 * 86400000,
    },
    {
      id: 'tx-9',
      type: 'expense',
      amount: 3250,
      categoryId: 'cat-shopping',
      date: makeDate(12),
      paymentMethod: 'বিকাশ',
      note: 'অনলাইন শপিং থেকে পোশাক ও গ্যাজেট ক্রয়',
      createdAt: Date.now() - 5 * 86400000,
      updatedAt: Date.now() - 5 * 86400000,
    },
    {
      id: 'tx-10',
      type: 'expense',
      amount: 1800,
      categoryId: 'cat-pocket',
      date: makeDate(14),
      paymentMethod: 'নগদ',
      note: 'বন্ধুদের সাথে আড্ডা ও হাত খরচ',
      createdAt: Date.now() - 3 * 86400000,
      updatedAt: Date.now() - 3 * 86400000,
    },
    {
      id: 'tx-11',
      type: 'expense',
      amount: 1150,
      categoryId: 'cat-internet',
      date: makeDate(15),
      paymentMethod: 'রকেট',
      note: 'মাসিক ব্রডব্যান্ড ওয়াইফাই বিল',
      createdAt: Date.now() - 2 * 86400000,
      updatedAt: Date.now() - 2 * 86400000,
    },
  ];
}
