import React from 'react';
import { useApp } from '../context/AppContext';
import { BENGALI_MONTHS, toBengaliNumber, getCurrentMonthKey } from '../utils/formatters';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Lock,
  Wifi,
  WifiOff,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAddModal }) => {
  const {
    state,
    selectedMonth,
    setSelectedMonth,
    toggleBengaliDigits,
    setTheme,
    lockApp,
  } = useApp();
  const isOnline = useOnlineStatus();

  // Parse current selected month
  const [yearStr, monthStr] = selectedMonth.split('-');
  const yearNum = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;

  const currentMonthLabel = `${BENGALI_MONTHS[monthIdx]} ${toBengaliNumber(yearNum, state.useBengaliDigits)}`;

  // Month navigation handlers
  const handlePrevMonth = () => {
    let nextMonth = monthIdx - 1;
    let nextYear = yearNum;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    }
    const mStr = String(nextMonth + 1).padStart(2, '0');
    setSelectedMonth(`${nextYear}-${mStr}`);
  };

  const handleNextMonth = () => {
    let nextMonth = monthIdx + 1;
    let nextYear = yearNum;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    const mStr = String(nextMonth + 1).padStart(2, '0');
    setSelectedMonth(`${nextYear}-${mStr}`);
  };

  const isCurrentMonth = selectedMonth === getCurrentMonthKey();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
                ৳
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                    হিসাব-খাতা
                  </span>
                  {state.securitySettings.isE2EEncrypted && (
                    <span
                      title="এন্ড-টু-এন্ড এনক্রিপশন সক্রিয়"
                      className="text-emerald-500 hover:text-emerald-400"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1 hidden sm:block">
                  মাসিক আয় ও খরচের নির্ভরযোগ্য হিসাব
                </p>
              </div>
            </div>
          </div>

          {/* Month Selector in Header */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="পূর্ববর্তী মাস"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 min-w-[110px] sm:min-w-[130px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{currentMonthLabel}</span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="পরবর্তী মাস"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentMonth && (
              <button
                onClick={() => setSelectedMonth(getCurrentMonthKey())}
                className="hidden md:inline-flex ml-1 px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-500/20 transition cursor-pointer"
              >
                চলতি মাস
              </button>
            )}
          </div>

          {/* Action Tools & Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Online / Offline badge */}
            <div
              className={`hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'অনলাইন' : 'অফলাইন'}</span>
            </div>

            {/* PWA Install */}
            <PWAInstallButton />

            {/* Toggle Bengali Digits (১২৩ vs 123) */}
            <button
              onClick={toggleBengaliDigits}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 transition cursor-pointer"
              title="সংখ্যা ফরম্যাট পরিবর্তন করুন (বাংলা / ইংরেজি)"
            >
              {state.useBengaliDigits ? '১২৩' : '123'}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer"
              title={state.theme === 'dark' ? 'লাইট মোডে পরিবর্তন করুন' : 'ডার্ক মোডে পরিবর্তন করুন'}
            >
              {state.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* Lock Button (if PIN enabled) */}
            {state.securitySettings.isPinEnabled && (
              <button
                onClick={lockApp}
                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/20 transition cursor-pointer"
                title="অ্যাপটি তাৎক্ষণিক লক করুন"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Add Transaction Button */}
            <button
              onClick={onOpenAddModal}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-2 text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
            >
              <span className="text-base leading-none">+</span>
              <span>হিসাব যোগ</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav aria-label="প্রধান নেভিগেশন মেনু" className="flex items-center space-x-1 sm:space-x-2 py-2 overflow-x-auto scrollbar-none border-t border-slate-100 dark:border-slate-800/60 text-xs sm:text-sm">
          {[
            { id: 'dashboard', label: 'ড্যাশবোর্ড' },
            { id: 'transactions', label: 'সকল লেনদেন' },
            { id: 'budget', label: 'বাজেট ও অ্যালার্ট' },
            { id: 'charts', label: 'চার্ট ও রিপোর্ট' },
            { id: 'annual', label: 'বার্ষিক রিপোর্ট' },
            { id: '3d-scene', label: '৩ডি ভল্ট দৃশ্য' },
            { id: 'backup-security', label: 'ব্যাকআপ ও নিরাপত্তা' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
