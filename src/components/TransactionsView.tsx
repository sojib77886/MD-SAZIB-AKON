import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatTaka, formatBengaliDate, toBengaliNumber } from '../utils/formatters';
import { renderCategoryIcon } from './TransactionModal';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  Tag,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';

interface TransactionsViewProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenAddModal,
  onEditTransaction,
}) => {
  const { state, filteredTransactions, deleteTransaction } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Filtered and sorted transactions
  const processedTransactions = useMemo(() => {
    return filteredTransactions
      .filter((tx) => {
        // Type filter
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        // Category filter
        if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
        // Payment filter
        if (paymentFilter !== 'all' && tx.paymentMethod !== paymentFilter) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const cat = state.categories.find((c) => c.id === tx.categoryId);
          const matchNote = tx.note?.toLowerCase().includes(q);
          const matchCat = cat?.name.toLowerCase().includes(q);
          const matchMethod = tx.paymentMethod.toLowerCase().includes(q);
          const matchAmount = String(tx.amount).includes(q);
          return matchNote || matchCat || matchMethod || matchAmount;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [filteredTransactions, typeFilter, categoryFilter, paymentFilter, searchQuery, sortBy, state.categories]);

  // Aggregate stats for filtered result
  const { totalExpense, totalIncome } = useMemo(() => {
    let exp = 0;
    let inc = 0;
    processedTransactions.forEach((tx) => {
      if (tx.type === 'expense') exp += tx.amount;
      else inc += tx.amount;
    });
    return { totalExpense: exp, totalIncome: inc };
  }, [processedTransactions]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['তারিখ', 'ধরন', 'ক্যাটাগরি', 'পেমেন্ট মাধ্যম', 'পরিমাণ (টাকা)', 'বিবরণ'];
    const rows = processedTransactions.map((tx) => {
      const cat = state.categories.find((c) => c.id === tx.categoryId);
      return [
        tx.date,
        tx.type === 'expense' ? 'খরচ' : 'আয়',
        `"${cat?.name || ''}"`,
        `"${tx.paymentMethod}"`,
        tx.amount,
        `"${(tx.note || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    // Add BOM for proper Bengali UTF-8 encoding in Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hishab-khata-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 font-['Hind_Siliguri','Inter',sans-serif]">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            সকল লেনদেনের তালিকা
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            নির্দিষ্ট মাসের আয়-ব্যয়ের হিসাব খুঁজুন, ফিল্টার করুন এবং এক্সপোর্ট করুন
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition cursor-pointer"
            title="CSV ফাইলে ডাউনলোড করুন"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>CSV এক্সপোর্ট</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>হিসাব যোগ</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বিবরণ, ক্যাটাগরি বা মাধ্যম দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | TransactionType)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">সকল ধরন</option>
              <option value="expense">শুধু খরচ (Expense)</option>
              <option value="income">শুধু আয় (Income)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              {state.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'expense' ? 'খরচ' : 'আয়'})
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="date-desc">তারিখ: নতুন আগে</option>
              <option value="date-asc">তারিখ: পুরাতন আগে</option>
              <option value="amount-desc">পরিমাণ: সর্বোচ্চ আগে</option>
              <option value="amount-asc">পরিমাণ: সর্বনিম্ন আগে</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span>ফলাফল:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {toBengaliNumber(processedTransactions.length, state.useBengaliDigits)} টি লেনদেন
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              মোট আয়: {formatTaka(totalIncome, state.useBengaliDigits)}
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              মোট খরচ: {formatTaka(totalExpense, state.useBengaliDigits)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Table / List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {processedTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            কোন লেনদেনের রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">তারিখ</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4">পেমেন্ট মাধ্যম</th>
                  <th className="py-3 px-4">বিবরণ / নোট</th>
                  <th className="py-3 px-4 text-right">পরিমাণ</th>
                  <th className="py-3 px-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {processedTransactions.map((tx) => {
                  const cat = state.categories.find((c) => c.id === tx.categoryId);
                  const isExpense = tx.type === 'expense';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {formatBengaliDate(tx.date, state.useBengaliDigits)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1.5 rounded-lg text-white shrink-0"
                            style={{ backgroundColor: cat?.color || '#64748b' }}
                          >
                            {renderCategoryIcon(cat?.icon || 'Tag', 'w-3.5 h-3.5')}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {cat?.name || 'অজ্ঞাত'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {tx.note || '-'}
                      </td>
                      <td
                        className={`py-3 px-4 text-right whitespace-nowrap font-bold ${
                          isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatTaka(tx.amount, state.useBengaliDigits)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
