import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BENGALI_MONTHS,
  toBengaliNumber,
  formatTaka,
} from '../utils/formatters';
import {
  CalendarRange,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Printer,
  ChevronDown,
  Award,
  AlertCircle,
} from 'lucide-react';

export const AnnualReportView: React.FC = () => {
  const { state } = useApp();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    state.transactions.forEach((tx) => {
      const y = parseInt(tx.date.split('-')[0], 10);
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [state.transactions, currentYear]);

  // Aggregate monthly data for the selected year
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthStr = String(i + 1).padStart(2, '0');
      const yearMonth = `${selectedYear}-${monthStr}`;

      let income = 0;
      let expense = 0;

      state.transactions.forEach((tx) => {
        if (tx.date.startsWith(yearMonth)) {
          if (tx.type === 'income') income += tx.amount;
          else expense += tx.amount;
        }
      });

      const balance = income - expense;
      const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

      return {
        monthIndex: i,
        monthName: BENGALI_MONTHS[i],
        income,
        expense,
        balance,
        savingsRate,
      };
    });

    return months;
  }, [state.transactions, selectedYear]);

  // Annual Totals
  const annualSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    monthlyData.forEach((m) => {
      totalIncome += m.income;
      totalExpense += m.expense;
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    const avgMonthlyExpense = Math.round(totalExpense / 12);

    // Find highest expense month
    const highestExpenseMonth = [...monthlyData].sort((a, b) => b.expense - a.expense)[0];

    // Find top annual category
    const catMap: Record<string, number> = {};
    state.transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.date.startsWith(String(selectedYear))) {
        catMap[tx.categoryId] = (catMap[tx.categoryId] || 0) + tx.amount;
      }
    });

    const topCategories = Object.entries(catMap)
      .map(([id, total]) => {
        const cat = state.categories.find((c) => c.id === id);
        return { name: cat?.name || 'অন্যান্য', total, color: cat?.color || '#3b82f6' };
      })
      .sort((a, b) => b.total - a.total);

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      avgMonthlyExpense,
      highestExpenseMonth,
      topCategories,
    };
  }, [monthlyData, state.transactions, state.categories, selectedYear]);

  const maxMonthValue = Math.max(
    1,
    ...monthlyData.map((m) => Math.max(m.income, m.expense))
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 font-['Hind_Siliguri','Inter',sans-serif]">
      {/* Title & Year Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-emerald-500" />
            <span>বার্ষিক আর্থিক রিপোর্ট ({toBengaliNumber(selectedYear, state.useBengaliDigits)})</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            সমগ্র বছরের আয়, মোট ব্যয় এবং সার্বিক সঞ্চয়ের গতিপ্রকৃতি
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Year selector dropdown */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              aria-label="বছর নির্বাচন করুন"
              className="py-2 pl-3 pr-8 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer shadow-sm"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  বছর {toBengaliNumber(yr, state.useBengaliDigits)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition cursor-pointer"
            title="প্রিন্ট বা পিডিএফ আকারে সংরক্ষণ করুন"
          >
            <Printer className="w-4 h-4 text-emerald-500" />
            <span>প্রিন্ট / রিপোর্ট সেভ</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Year Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">বার্ষিক মোট আয়</span>
          <div className="mt-2 flex items-center justify-between">
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatTaka(annualSummary.totalIncome, state.useBengaliDigits)}
            </h3>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Total Year Expense */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">বার্ষিক মোট খরচ</span>
          <div className="mt-2 flex items-center justify-between">
            <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {formatTaka(annualSummary.totalExpense, state.useBengaliDigits)}
            </h3>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Net Savings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">বার্ষিক নীট সঞ্চয়</span>
          <div className="mt-2 flex items-center justify-between">
            <h3
              className={`text-2xl font-extrabold ${
                annualSummary.netSavings >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatTaka(annualSummary.netSavings, state.useBengaliDigits)}
            </h3>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Savings Rate % */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">সঞ্চয়ের হার</span>
          <div className="mt-2 flex items-center justify-between">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {toBengaliNumber(annualSummary.savingsRate, state.useBengaliDigits)}%
            </h3>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 12-Month Comparative Bar Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            মাসওয়ারি আয় ও ব্যয় চিত্র ({toBengaliNumber(selectedYear, state.useBengaliDigits)})
          </h3>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span>মাসিক আয়</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span>মাসিক খরচ</span>
            </div>
          </div>
        </div>

        {/* 12 Months Side-by-Side Bars */}
        <div className="mt-8">
          <div className="flex items-end gap-2 sm:gap-4 h-52 border-b border-slate-200 dark:border-slate-800 pb-1">
            {monthlyData.map((m) => {
              const incHeight = maxMonthValue > 0 ? (m.income / maxMonthValue) * 100 : 0;
              const expHeight = maxMonthValue > 0 ? (m.expense / maxMonthValue) * 100 : 0;

              return (
                <div key={m.monthIndex} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Income Bar */}
                    <div
                      className="w-1/2 max-w-[18px] rounded-t-sm bg-emerald-500 group-hover:bg-emerald-400 transition"
                      style={{ height: `${Math.max(2, incHeight)}%` }}
                      title={`${m.monthName} আয়: ৳${m.income}`}
                    />
                    {/* Expense Bar */}
                    <div
                      className="w-1/2 max-w-[18px] rounded-t-sm bg-rose-500 group-hover:bg-rose-400 transition"
                      style={{ height: `${Math.max(2, expHeight)}%` }}
                      title={`${m.monthName} খরচ: ৳${m.expense}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month Labels */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 font-medium">
            {monthlyData.map((m) => (
              <span key={m.monthIndex} className="flex-1 text-center truncate">
                {m.monthName.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Month-by-Month Detailed Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            ১২ মাসের পূর্ণাঙ্গ হিসাব বিবরণী
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">মাস</th>
                <th className="py-3 px-4 text-right">আয়</th>
                <th className="py-3 px-4 text-right">খরচ</th>
                <th className="py-3 px-4 text-right">সঞ্চয় / উদ্বৃত্ত</th>
                <th className="py-3 px-4 text-center">সঞ্চয় হার</th>
                <th className="py-3 px-4 text-center">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {monthlyData.map((m) => (
                <tr key={m.monthIndex} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {m.monthName}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    {formatTaka(m.income, state.useBengaliDigits)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 font-semibold">
                    {formatTaka(m.expense, state.useBengaliDigits)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-bold ${
                      m.balance >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatTaka(m.balance, state.useBengaliDigits)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-300">
                    {toBengaliNumber(m.savingsRate, state.useBengaliDigits)}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        m.balance > 0
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : m.balance < 0
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {m.balance > 0 ? 'উদ্বৃত্ত' : m.balance < 0 ? 'ঘাটতি' : 'শূন্য'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
