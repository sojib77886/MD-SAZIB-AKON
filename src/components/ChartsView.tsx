import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatTaka, toBengaliNumber } from '../utils/formatters';
import { renderCategoryIcon } from './TransactionModal';
import { PieChart, BarChart3, TrendingUp, TrendingDown, Layers, CreditCard } from 'lucide-react';

export const ChartsView: React.FC = () => {
  const { state, filteredTransactions, monthlyIncome, monthlyExpense, monthlyBalance } = useApp();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{ day: number; amount: number } | null>(null);

  // Group expenses by category
  const categoryExpenses: Record<string, number> = {};
  filteredTransactions.forEach((tx) => {
    if (tx.type === 'expense') {
      categoryExpenses[tx.categoryId] = (categoryExpenses[tx.categoryId] || 0) + tx.amount;
    }
  });

  const categoryData = Object.entries(categoryExpenses)
    .map(([catId, amount]) => {
      const cat = state.categories.find((c) => c.id === catId);
      return {
        catId,
        name: cat?.name || 'অন্যান্য',
        color: cat?.color || '#3b82f6',
        icon: cat?.icon || 'Tag',
        amount,
        percent: monthlyExpense > 0 ? (amount / monthlyExpense) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Daily expenses for the month (1 - 31)
  const dailyExpenses: Record<number, number> = {};
  filteredTransactions.forEach((tx) => {
    if (tx.type === 'expense') {
      const day = parseInt(tx.date.split('-')[2], 10);
      dailyExpenses[day] = (dailyExpenses[day] || 0) + tx.amount;
    }
  });

  const maxDailyExpense = Math.max(1, ...Object.values(dailyExpenses));
  const daysInMonth = 31;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Payment method distribution
  const paymentMethodExpenses: Record<string, number> = {};
  filteredTransactions.forEach((tx) => {
    if (tx.type === 'expense') {
      paymentMethodExpenses[tx.paymentMethod] =
        (paymentMethodExpenses[tx.paymentMethod] || 0) + tx.amount;
    }
  });

  // SVG Donut Slices calculation
  let cumulativePercent = 0;
  const donutSlices = categoryData.map((item) => {
    const startAngle = (cumulativePercent / 100) * 360;
    cumulativePercent += item.percent;
    const endAngle = (cumulativePercent / 100) * 360;

    // Convert polar coordinates to Cartesian
    const radius = 80;
    const innerRadius = 50;
    const cx = 110;
    const cy = 110;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);

    const largeArc = item.percent > 50 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');

    return {
      ...item,
      pathData,
    };
  });

  return (
    <div className="space-y-6 pb-12 font-['Hind_Siliguri','Inter',sans-serif]">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PieChart className="w-5 h-5 text-emerald-500" />
          <span>খরচের চার্ট ও দৃশ্যমান বিশ্লেষণ</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          চলতি মাসের ব্যয় বণ্টন, দৈনিক খরচের ওঠানামা এবং পেমেন্ট মাধ্যম বিশ্লেষণ
        </p>
      </div>

      {/* Top row: Donut Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Donut Chart Card (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center relative">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2 self-start">
            ক্যাটাগরি অনুযায়ী খরচের অনুপাত
          </h3>

          {monthlyExpense === 0 ? (
            <div className="py-16 text-slate-400 text-xs">এই মাসে খরচের হিসাব যোগ করা হয়নি</div>
          ) : (
            <div className="relative my-2">
              <svg width="220" height="220" viewBox="0 0 220 220" className="mx-auto drop-shadow-sm">
                {donutSlices.map((slice) => {
                  const isHovered = hoveredCategory === slice.catId;
                  return (
                    <path
                      key={slice.catId}
                      d={slice.pathData}
                      fill={slice.color}
                      className="cursor-pointer transition-all duration-200 hover:opacity-90"
                      style={{
                        transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                        transformOrigin: '110px 110px',
                      }}
                      onMouseEnter={() => setHoveredCategory(slice.catId)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">মোট খরচ</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {formatTaka(monthlyExpense, state.useBengaliDigits)}
                </span>
                {hoveredCategory && (
                  <span className="text-[10px] text-emerald-500 font-bold mt-0.5">
                    {categoryData.find((c) => c.catId === hoveredCategory)?.name}
                  </span>
                )}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-2">
            যেকোন বৃত্তাংশে কার্সর রেখে বা ট্যাপ করে বিস্তারিত দেখুন
          </p>
        </div>

        {/* Category Legend & Details (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            খাতভিত্তিক বিস্তারিত বিভাজন
          </h3>

          {categoryData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">কোন ডাটা নেই</div>
          ) : (
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {categoryData.map((item) => {
                const isHovered = hoveredCategory === item.catId;
                return (
                  <div
                    key={item.catId}
                    onMouseEnter={() => setHoveredCategory(item.catId)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      isHovered
                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                        : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="p-1.5 rounded-lg text-white shrink-0"
                          style={{ backgroundColor: item.color }}
                        >
                          {renderCategoryIcon(item.icon, 'w-3.5 h-3.5')}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatTaka(item.amount, state.useBengaliDigits)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 w-12 text-right">
                          {toBengaliNumber(item.percent.toFixed(1), state.useBengaliDigits)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress line */}
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Daily Spending Trend (Days 1 to 31) Bar Chart */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>দৈনিক খরচের ওঠা-নামা (মাসিক ট্রেন্ড)</span>
            </h3>
            <p className="text-xs text-slate-400">
              মাসের কোন দিনে কত খরচ হয়েছে তা একনজরে দেখুন
            </p>
          </div>

          {hoveredDay && (
            <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
              {toBengaliNumber(hoveredDay.day, state.useBengaliDigits)} তারিখের খরচ:{' '}
              {formatTaka(hoveredDay.amount, state.useBengaliDigits)}
            </div>
          )}
        </div>

        {/* 31 Day Bar Chart */}
        <div className="mt-6">
          <div className="flex items-end gap-1 sm:gap-1.5 h-44 pt-6 border-b border-slate-200 dark:border-slate-800">
            {daysArray.map((day) => {
              const amount = dailyExpenses[day] || 0;
              const heightPercent = amount > 0 ? Math.max(6, (amount / maxDailyExpense) * 100) : 0;
              const isHigh = amount > 0 && amount >= maxDailyExpense * 0.7;

              return (
                <div
                  key={day}
                  onMouseEnter={() => setHoveredDay({ day, amount })}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-slate-900 text-white text-[10px] font-semibold py-0.5 px-1.5 rounded shadow-lg whitespace-nowrap z-20 transition">
                    {toBengaliNumber(day, state.useBengaliDigits)} তারিখ: ৳{amount}
                  </div>

                  {/* The bar */}
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      amount === 0
                        ? 'bg-transparent'
                        : isHigh
                        ? 'bg-rose-500 group-hover:bg-rose-400'
                        : 'bg-emerald-500 group-hover:bg-emerald-400'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Day Numbers below the chart */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 px-1">
            <span>১ তারিখ</span>
            <span>১০ তারিখ</span>
            <span>২০ তারিখ</span>
            <span>৩১ তারিখ</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Payment Method Breakdown & Net Balance Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>পেমেন্ট মাধ্যম অনুযায়ী ব্যয়</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(paymentMethodExpenses).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">কোন ডাটা নেই</div>
            ) : (
              Object.entries(paymentMethodExpenses).map(([method, amount]) => {
                const percent =
                  monthlyExpense > 0 ? Math.round((amount / monthlyExpense) * 100) : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {method}
                      </span>
                      <div className="flex gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatTaka(amount, state.useBengaliDigits)}
                        </span>
                        <span className="text-slate-400">
                          ({toBengaliNumber(percent, state.useBengaliDigits)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Income vs Expense Balance Summary */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>আয় বনাম ব্যয় তুলনামূলক অবস্থান</span>
            </h3>

            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  মোট আয়
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatTaka(monthlyIncome, state.useBengaliDigits)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  মোট খরচ
                </span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  -{formatTaka(monthlyExpense, state.useBengaliDigits)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">মোট সঞ্চয়:</span>
            <span
              className={`text-base font-extrabold ${
                monthlyBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {formatTaka(monthlyBalance, state.useBengaliDigits)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
