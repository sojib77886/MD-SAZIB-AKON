import React from 'react';
import { useApp } from '../context/AppContext';
import { formatTaka, formatBengaliDate, toBengaliNumber } from '../utils/formatters';
import { renderCategoryIcon } from './TransactionModal';
import { Transaction } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Plus,
  ShieldCheck,
  CreditCard,
  Edit2,
  Trash2,
  Box,
} from 'lucide-react';

interface DashboardProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  setActiveTab: (tab: string) => void;
  onOpenCategoryManager: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenAddModal,
  onEditTransaction,
  setActiveTab,
  onOpenCategoryManager,
}) => {
  const {
    state,
    filteredTransactions,
    monthlyIncome,
    monthlyExpense,
    monthlyBalance,
    monthlyBudgetUsagePercent,
    isBudgetExceeded,
    isBudgetWarning,
    deleteTransaction,
    loadSampleData,
  } = useApp();

  const budget = state.budgetConfig.monthlyOverallBudget;
  const remainingBudget = Math.max(0, budget - monthlyExpense);
  const exceededAmount = Math.max(0, monthlyExpense - budget);

  // Group expenses by category for quick breakdown
  const categoryExpenses: Record<string, number> = {};
  filteredTransactions.forEach((tx) => {
    if (tx.type === 'expense') {
      categoryExpenses[tx.categoryId] = (categoryExpenses[tx.categoryId] || 0) + tx.amount;
    }
  });

  const sortedCategories = Object.entries(categoryExpenses)
    .map(([catId, total]) => {
      const cat = state.categories.find((c) => c.id === catId);
      return {
        catId,
        cat,
        total,
        percent: monthlyExpense > 0 ? Math.round((total / monthlyExpense) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Check category-level budget alerts
  const categoryAlerts = state.categories
    .filter((cat) => cat.type === 'expense' && cat.budget && cat.budget > 0)
    .map((cat) => {
      const spent = categoryExpenses[cat.id] || 0;
      const budgetLimit = cat.budget || 0;
      const usage = Math.round((spent / budgetLimit) * 100);
      return {
        cat,
        spent,
        budgetLimit,
        usage,
        isOver: spent > budgetLimit,
        isWarning: usage >= 80 && spent <= budgetLimit,
      };
    })
    .filter((alert) => alert.isOver || alert.isWarning);

  return (
    <div className="space-y-6 pb-12 font-['Hind_Siliguri','Inter',sans-serif]">
      {/* Budget Alert Banner */}
      {(isBudgetExceeded || isBudgetWarning || categoryAlerts.length > 0) && (
        <div
          className={`p-4 rounded-2xl border shadow-lg transition duration-200 ${
            isBudgetExceeded
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-start gap-3">
            {isBudgetExceeded ? (
              <AlertOctagon className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {isBudgetExceeded
                  ? 'বাজেট সীমা অতিক্রম করেছে!'
                  : 'বাজেট সতর্কতা! খরচের গতি নিয়ন্ত্রণে রাখুন'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                {isBudgetExceeded ? (
                  <span>
                    আপনি মাসিক বাজেটের চেয়ে{' '}
                    <strong>{formatTaka(exceededAmount, state.useBengaliDigits)}</strong> বেশি খরচ
                    করেছেন। মোট বাজেট ছিল {formatTaka(budget, state.useBengaliDigits)}।
                  </span>
                ) : (
                  <span>
                    চলতি মাসে আপনি মোট বাজেটের{' '}
                    <strong>
                      {toBengaliNumber(monthlyBudgetUsagePercent, state.useBengaliDigits)}%
                    </strong>{' '}
                    ইতিমধ্যে খরচ করে ফেলেছেন। অবশিষ্ট বাজেট:{' '}
                    {formatTaka(remainingBudget, state.useBengaliDigits)}।
                  </span>
                )}
              </p>

              {/* Specific category alerts if any */}
              {categoryAlerts.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1">
                  {categoryAlerts.slice(0, 3).map((item) => (
                    <div
                      key={item.cat.id}
                      className="text-xs flex items-center justify-between font-medium"
                    >
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.cat.color }}
                        />
                        {item.cat.name}:
                      </span>
                      <span
                        className={
                          item.isOver ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-amber-500'
                        }
                      >
                        {formatTaka(item.spent, state.useBengaliDigits)} /{' '}
                        {formatTaka(item.budgetLimit, state.useBengaliDigits)} (
                        {toBengaliNumber(item.usage, state.useBengaliDigits)}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('budget')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition shrink-0 cursor-pointer"
            >
              বাজেট দেখুন
            </button>
          </div>
        </div>
      )}

      {/* Hero Financial Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              মাসিক মোট আয়
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatTaka(monthlyIncome, state.useBengaliDigits)}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <span>চলতি মাসের সক্রিয় আয়</span>
            </p>
          </div>
        </div>

        {/* Expense Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              মাসিক মোট খরচ
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatTaka(monthlyExpense, state.useBengaliDigits)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              বাজেটের{' '}
              <span
                className={
                  isBudgetExceeded
                    ? 'text-rose-500 font-bold'
                    : isBudgetWarning
                    ? 'text-amber-500 font-bold'
                    : 'text-slate-700 dark:text-slate-300'
                }
              >
                {toBengaliNumber(monthlyBudgetUsagePercent, state.useBengaliDigits)}%
              </span>{' '}
              ব্যয়িত
            </p>
          </div>
        </div>

        {/* Balance / Savings Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              অবশিষ্ট ব্যালেন্স / সঞ্চয়
            </span>
            <div
              className={`p-2 rounded-xl ${
                monthlyBalance >= 0
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                monthlyBalance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatTaka(monthlyBalance, state.useBengaliDigits)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {monthlyIncome > 0 ? (
                <span>
                  সঞ্চয়ের হার:{' '}
                  {toBengaliNumber(
                    Math.max(0, Math.round((monthlyBalance / monthlyIncome) * 100)),
                    state.useBengaliDigits
                  )}
                  %
                </span>
              ) : (
                'আয়ের হিসাব বাকি'
              )}
            </p>
          </div>
        </div>

        {/* Monthly Budget Progress Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              বাজেট প্রগ্রেস
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>{formatTaka(budget, state.useBengaliDigits)}</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {toBengaliNumber(monthlyBudgetUsagePercent, state.useBengaliDigits)}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                অবশিষ্ট: {formatTaka(remainingBudget, state.useBengaliDigits)}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isBudgetExceeded
                    ? 'bg-rose-500'
                    : isBudgetWarning
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, monthlyBudgetUsagePercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Dock */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-teal-950/40 border border-emerald-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            +
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">দ্রুত হিসাব লিপিবদ্ধ করুন</h4>
            <p className="text-xs text-slate-400">
              ঘর ভাড়া, খাবার, বিদ্যুৎ বা কেনাকাটা এক ক্লিকে যোগ করুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন হিসাব যোগ</span>
          </button>

          <button
            onClick={() => setActiveTab('3d-scene')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition cursor-pointer"
            title="৩ডি ভিজ্যুয়ালাইজারে ব্যয় বিশ্লেষণ দেখুন"
          >
            <Box className="w-4 h-4 text-emerald-400" />
            <span>৩ডি ভল্ট</span>
          </button>
        </div>
      </div>

      {/* Middle Section: Category Breakdown + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 col): Category Spending Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>খাতভিত্তিক খরচের অনুপাত</span>
              </h3>
              <button
                onClick={() => setActiveTab('charts')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>চার্ট দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {sortedCategories.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                চলতি মাসে এখনও কোন খরচের হিসাব নেই
              </div>
            ) : (
              <div className="mt-4 space-y-3.5">
                {sortedCategories.slice(0, 5).map(({ catId, cat, total, percent }) => (
                  <div key={catId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat?.color || '#3b82f6' }}
                        />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {cat?.name || 'অন্যান্য'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatTaka(total, state.useBengaliDigits)}
                        </span>
                        <span className="text-[11px] text-slate-400 w-8 text-right">
                          {toBengaliNumber(percent, state.useBengaliDigits)}%
                        </span>
                      </div>
                    </div>
                    {/* Category bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: cat?.color || '#3b82f6',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>ক্যাটাগরি কাস্টমাইজেশন</span>
            <button
              onClick={onOpenCategoryManager}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              ক্যাটাগরি ম্যানেজ করুন
            </button>
          </div>
        </div>

        {/* Right Column (2 cols): Recent Transactions */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>সাম্প্রতিক লেনদেনসমূহ</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                {toBengaliNumber(filteredTransactions.length, state.useBengaliDigits)} টি
              </span>
            </h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>সকল লেনদেন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p>এই মাসে এখনও কোন লেনদেন যুক্ত করা হয়নি।</p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={onOpenAddModal}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer"
                >
                  প্রথম হিসাব যোগ করুন
                </button>
                <button
                  onClick={loadSampleData}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition cursor-pointer"
                >
                  নমুনা ডাটা লোড করুন
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTransactions.slice(0, 6).map((tx) => {
                const cat = state.categories.find((c) => c.id === tx.categoryId);
                const isExpense = tx.type === 'expense';
                return (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2.5 rounded-xl text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: cat?.color || '#64748b' }}
                      >
                        {renderCategoryIcon(cat?.icon || 'Tag', 'w-4 h-4')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {cat?.name || 'অজ্ঞাত'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {tx.paymentMethod}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatBengaliDate(tx.date, state.useBengaliDigits)}</span>
                          {tx.note && <span className="truncate max-w-[180px] sm:max-w-xs text-slate-400">| {tx.note}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold text-xs sm:text-sm ${
                          isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatTaka(tx.amount, state.useBengaliDigits)}
                      </span>

                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 rounded text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          title="মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
