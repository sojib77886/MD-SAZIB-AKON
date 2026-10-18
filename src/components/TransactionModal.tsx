import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { formatTaka } from '../utils/formatters';
import {
  X,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  FileText,
  Tag,
  Home,
  Zap,
  Utensils,
  Wallet,
  Cigarette,
  Droplet,
  Car,
  ShoppingBag,
  HeartPulse,
  Wifi,
  Briefcase,
  Laptop,
  Store,
  Gift,
  HelpCircle,
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
  onOpenCategoryManager?: () => void;
}

// Icon mapper helper
export const renderCategoryIcon = (iconName: string, className = 'w-4 h-4') => {
  switch (iconName) {
    case 'Home':
      return <Home className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    case 'Cigarette':
      return <Cigarette className={className} />;
    case 'Droplet':
      return <Droplet className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Wifi':
      return <Wifi className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Laptop':
      return <Laptop className={className} />;
    case 'Store':
      return <Store className={className} />;
    case 'Gift':
      return <Gift className={className} />;
    default:
      return <Tag className={className} />;
  }
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editTransaction,
  onOpenCategoryManager,
}) => {
  const { state, addTransaction, updateTransaction, selectedMonth } = useApp();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('নগদ');
  const [date, setDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Sync state on open or edit change
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(String(editTransaction.amount));
      setCategoryId(editTransaction.categoryId);
      setPaymentMethod(editTransaction.paymentMethod);
      setDate(editTransaction.date);
      setNote(editTransaction.note || '');
    } else {
      setType('expense');
      setAmount('');
      // Default to first matching category
      const defaultCat = state.categories.find((c) => c.type === 'expense');
      setCategoryId(defaultCat ? defaultCat.id : 'cat-food');
      setPaymentMethod('নগদ');
      
      // Default date to today, or first of selected month if selected month is different
      const today = new Date().toISOString().split('T')[0];
      if (today.startsWith(selectedMonth)) {
        setDate(today);
      } else {
        setDate(`${selectedMonth}-01`);
      }
      setNote('');
    }
    setError('');
  }, [isOpen, editTransaction, selectedMonth, state.categories]);

  if (!isOpen) return null;

  const filteredCategories = state.categories.filter((c) => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('সঠিক টাকার পরিমাণ লিখুন (০ এর বেশি হতে হবে)');
      return;
    }

    if (!categoryId) {
      setError('একটি ক্যাটাগরি নির্বাচন করুন');
      return;
    }

    if (!date) {
      setError('তারিখ নির্বাচন করুন');
      return;
    }

    if (editTransaction) {
      updateTransaction({
        ...editTransaction,
        type,
        amount: numAmount,
        categoryId,
        paymentMethod,
        date,
        note: note.trim() || undefined,
      });
    } else {
      addTransaction({
        type,
        amount: numAmount,
        categoryId,
        paymentMethod,
        date,
        note: note.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto font-['Hind_Siliguri','Inter',sans-serif]">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-800 dark:text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            {editTransaction ? 'হিসাব পরিবর্তন করুন' : 'নতুন হিসাব যোগ করুন'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Toggle: Expense / Income */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const cat = state.categories.find((c) => c.type === 'expense');
                if (cat) setCategoryId(cat.id);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>খরচ (Expense)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                const cat = state.categories.find((c) => c.type === 'income');
                if (cat) setCategoryId(cat.id);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>আয় (Income)</span>
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              টাকার পরিমাণ (৳)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 dark:text-slate-500">
                ৳
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/80 py-3 pl-12 pr-4 text-2xl font-bold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                autoFocus
              />
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                ক্যাটাগরি নির্বাচন
              </label>
              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  নতুন ক্যাটাগরি তৈরি
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
              {filteredCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className="p-1.5 rounded-lg text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                    </div>
                    <span className="text-xs truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              পেমেন্ট মাধ্যম
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(['নগদ', 'বিকাশ', 'রকেট', 'উপায়', 'ব্যাংক', 'অন্যান্য'] as PaymentMethod[]).map(
                (method) => {
                  const isSelected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-500 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {method}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              তারিখ
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/80 py-2 px-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Note / Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              নোট বা বিবরণ (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="যেমন: মাসিক ডেসকো বিল পরিশোধ / বসুন্ধরা সিটি কেনাকাটা"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/80 py-2 px-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">{error}</p>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              {editTransaction ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
