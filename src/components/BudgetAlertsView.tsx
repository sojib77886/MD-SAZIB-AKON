import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatTaka, toBengaliNumber } from '../utils/formatters';
import { renderCategoryIcon } from './TransactionModal';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Sliders,
  BellRing,
  PieChart,
  Save,
  Info,
} from 'lucide-react';

export const BudgetAlertsView: React.FC = () => {
  const {
    state,
    filteredTransactions,
    monthlyExpense,
    updateBudgetConfig,
    updateCategory,
  } = useApp();

  const [overallBudget, setOverallBudget] = useState(
    String(state.budgetConfig.monthlyOverallBudget)
  );
  const [warningThreshold, setWarningThreshold] = useState(
    String(state.budgetConfig.warningThresholdPercent)
  );
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Group actual expenses by category
  const categoryExpenses: Record<string, number> = {};
  filteredTransactions.forEach((tx) => {
    if (tx.type === 'expense') {
      categoryExpenses[tx.categoryId] = (categoryExpenses[tx.categoryId] || 0) + tx.amount;
    }
  });

  const expenseCategories = state.categories.filter((c) => c.type === 'expense');

  // Handle saving overall budget config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const numBudget = parseFloat(overallBudget);
    const numWarning = parseInt(warningThreshold, 10);
    if (!isNaN(numBudget) && numBudget > 0) {
      updateBudgetConfig({
        monthlyOverallBudget: numBudget,
        warningThresholdPercent: !isNaN(numWarning) ? numWarning : 80,
      });
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 3000);
    }
  };

  // Quick edit category budget
  const handleCategoryBudgetChange = (catId: string, newBudgetStr: string) => {
    const val = parseFloat(newBudgetStr);
    const targetCat = state.categories.find((c) => c.id === catId);
    if (targetCat) {
      updateCategory({
        ...targetCat,
        budget: isNaN(val) || val <= 0 ? undefined : val,
      });
    }
  };

  const overallBudgetNum = state.budgetConfig.monthlyOverallBudget;
  const overallUsage = Math.round((monthlyExpense / overallBudgetNum) * 100);

  return (
    <div className="space-y-6 pb-12 font-['Hind_Siliguri','Inter',sans-serif]">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BellRing className="w-5 h-5 text-emerald-500" />
          <span>বাজেট ব্যবস্থাপনা ও অ্যালার্ট নোটিফিকেশন</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          মাসিক সর্বোচ্চ খরচের সীমা নির্ধারণ করুন এবং অতিরিক্ত খরচের তাৎক্ষণিক সতর্কতা পান
        </p>
      </div>

      {/* Main Budget Status Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">
              চলতি মাসের মোট বাজেট অবস্থা
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatTaka(monthlyExpense, state.useBengaliDigits)}
              </h3>
              <span className="text-sm text-slate-400">
                / {formatTaka(overallBudgetNum, state.useBengaliDigits)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                overallUsage >= 100
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  : overallUsage >= state.budgetConfig.warningThresholdPercent
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              }`}
            >
              {overallUsage >= 100 ? (
                <ShieldAlert className="w-4 h-4" />
              ) : overallUsage >= state.budgetConfig.warningThresholdPercent ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>
                {overallUsage >= 100
                  ? 'বাজেট সীমা শেষ!'
                  : overallUsage >= state.budgetConfig.warningThresholdPercent
                  ? 'সতর্কতা অঞ্চল'
                  : 'নিয়ন্ত্রণে রয়েছে'}
              </span>
            </span>
          </div>
        </div>

        {/* Big Progress Gauge Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">ব্যয়িত হয়েছে</span>
            <span
              className={
                overallUsage >= 100
                  ? 'text-rose-500 font-bold'
                  : overallUsage >= 80
                  ? 'text-amber-500 font-bold'
                  : 'text-emerald-500 font-bold'
              }
            >
              {toBengaliNumber(overallUsage, state.useBengaliDigits)}%
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallUsage >= 100
                  ? 'bg-rose-500'
                  : overallUsage >= state.budgetConfig.warningThresholdPercent
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallUsage)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>০%</span>
            <span>সতর্কতা সীমা ({toBengaliNumber(state.budgetConfig.warningThresholdPercent, state.useBengaliDigits)}%)</span>
            <span>১০০% ({formatTaka(overallBudgetNum, state.useBengaliDigits)})</span>
          </div>
        </div>
      </div>

      {/* Settings Grid: Left = Overall Budget Configuration, Right = Smart Budget Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form (1 col): Configure Monthly Budget */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-emerald-500" />
            <span>মাসিক সামগ্রিক বাজেট নির্ধারণ</span>
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                মাসিক মোট বাজেট সীমা (টাকা)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  ৳
                </span>
                <input
                  type="number"
                  min="500"
                  required
                  value={overallBudget}
                  onChange={(e) => setOverallBudget(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                সতর্কতা নোটিফিকেশন শতাংশ (%)
              </label>
              <select
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="70">৭০% খরচ হলে অ্যালার্ট দিন</option>
                <option value="80">৮০% খরচ হলে অ্যালার্ট দিন (প্রস্তাবিত)</option>
                <option value="85">৮৫% খরচ হলে অ্যালার্ট দিন</option>
                <option value="90">৯০% খরচ হলে অ্যালার্ট দিন</option>
              </select>
            </div>

            {isSavedNotice && (
              <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                বাজেট সফলভাবে আপডেট হয়েছে!
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>বাজেট সংরক্ষণ করুন</span>
            </button>
          </form>
        </div>

        {/* Right Info (2 cols): Category-wise Budgets */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                ক্যাটাগরিভিত্তিক বাজেট ট্র্যাকিং
              </h3>
              <p className="text-xs text-slate-400">
                প্রতিটি খাতের (যেমন ঘর ভাড়া, খাবার, সিগারেট, অনলাইন শপিং) আলাদা সীমা
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {toBengaliNumber(expenseCategories.length, state.useBengaliDigits)} টি খাত
            </span>
          </div>

          <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {expenseCategories.map((cat) => {
              const spent = categoryExpenses[cat.id] || 0;
              const catBudget = cat.budget || 0;
              const hasBudget = catBudget > 0;
              const percent = hasBudget ? Math.round((spent / catBudget) * 100) : 0;
              const isOver = hasBudget && spent > catBudget;
              const isWarning = hasBudget && percent >= state.budgetConfig.warningThresholdPercent && !isOver;

              return (
                <div
                  key={cat.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-1.5 rounded-lg text-white shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatTaka(spent, state.useBengaliDigits)}
                      </span>
                      <span className="text-slate-400">/</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">বাজেট:</span>
                        <input
                          type="number"
                          placeholder="সীমা লিখুন"
                          value={cat.budget || ''}
                          onChange={(e) => handleCategoryBudgetChange(cat.id, e.target.value)}
                          className="w-20 px-2 py-0.5 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Progress bar if budget configured */}
                  {hasBudget ? (
                    <div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] mt-1">
                        <span
                          className={
                            isOver
                              ? 'text-rose-500 font-bold'
                              : isWarning
                              ? 'text-amber-500 font-bold'
                              : 'text-slate-400'
                          }
                        >
                          {isOver
                            ? `সীমা ছাড়িয়ে গেছে (${toBengaliNumber(percent, state.useBengaliDigits)}%)`
                            : `${toBengaliNumber(percent, state.useBengaliDigits)}% খরচ হয়েছে`}
                        </span>
                        <span className="text-slate-400">
                          অবশিষ্ট: {formatTaka(Math.max(0, catBudget - spent), state.useBengaliDigits)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic">
                      কোন বাজেট সীমা নির্ধারণ করা হয়নি
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
