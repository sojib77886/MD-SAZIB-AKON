import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { registerBiometrics, checkBiometricsSupport } from '../utils/biometrics';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Fingerprint,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileCheck,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react';

export const BackupSecurityView: React.FC = () => {
  const {
    state,
    setupPin,
    removePin,
    toggleBiometrics,
    toggleE2EE,
    exportBackup,
    importBackup,
    loadSampleData,
    resetAllData,
    lockApp,
  } = useApp();

  // Biometrics hardware check
  const [hasBiometricsHardware, setHasBiometricsHardware] = useState(false);
  useEffect(() => {
    checkBiometricsSupport().then((res) => setHasBiometricsHardware(res.isSupported));
  }, []);

  // PIN setup state
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinE2EE, setPinE2EE] = useState(true);
  const [pinMessage, setPinMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Backup state
  const [backupPassword, setBackupPassword] = useState('');
  const [showBackupPassword, setShowBackupPassword] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [importNotice, setImportNotice] = useState<{ text: string; isError: boolean } | null>(null);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle PIN save
  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setPinMessage({ text: 'পিন অবশ্যই ৪ ডিজিটের সংখ্যা হতে হবে (যেমন: ১২৩৪)', isError: true });
      return;
    }

    if (pinInput !== pinConfirm) {
      setPinMessage({ text: 'দুটো পিন নম্বর মিলছে না! আবার টাইপ করুন।', isError: true });
      return;
    }

    const success = await setupPin(pinInput, pinE2EE);
    if (success) {
      setPinMessage({
        text: 'পিন কোড এবং এন্ড-টু-এন্ড এনক্রিপশন সফলভাবে সেটআপ করা হয়েছে!',
        isError: false,
      });
      setPinInput('');
      setPinConfirm('');
    } else {
      setPinMessage({ text: 'পিন সেটআপ করতে ব্যর্থ হয়েছে।', isError: true });
    }
  };

  // Handle Biometrics toggle
  const handleToggleBiometrics = async () => {
    if (!state.securitySettings.isBiometricsEnabled) {
      const reg = await registerBiometrics();
      if (reg.success) {
        toggleBiometrics(true, reg.credentialId);
        setPinMessage({ text: 'বায়োমেট্রিক সফলভাবে যুক্ত হয়েছে!', isError: false });
      } else {
        setPinMessage({ text: reg.error || 'বায়োমেট্রিক নিবন্ধন ব্যর্থ হয়েছে।', isError: true });
      }
    } else {
      toggleBiometrics(false);
      setPinMessage({ text: 'বায়োমেট্রিক নিষ্ক্রিয় করা হয়েছে।', isError: false });
    }
  };

  // Handle Export
  const handleExportDownload = async () => {
    const jsonStr = await exportBackup(backupPassword);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `hishab-khata-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle File Upload Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await importBackup(content, importPassword);
      setImportNotice({ text: res.message, isError: !res.success });
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 font-['Hind_Siliguri','Inter',sans-serif]">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span>ডেটা ব্যাকআপ, নিরাপত্তা ও গোপনীয়তা</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          আপনার আর্থিক তথ্যের ১০০% সুরক্ষা ও ব্যাকআপ নিশ্চিত করুন
        </p>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Security, PIN & Biometrics */}
        <div className="space-y-6">
          {/* Master PIN & Biometric Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    মাস্টার পিন ও বায়োমেট্রিক লক
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    অ্যাপ খোলার সময় ফিঙ্গারপ্রিন্ট বা ৪-ডিজিটের পিন চাইবে
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  state.securitySettings.isPinEnabled
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {state.securitySettings.isPinEnabled ? 'সুরক্ষিত' : 'নিষ্ক্রিয়'}
              </span>
            </div>

            {pinMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  pinMessage.isError
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}
              >
                {pinMessage.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{pinMessage.text}</span>
              </div>
            )}

            {/* If PIN is already enabled */}
            {state.securitySettings.isPinEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      পিন কোড সক্রিয় রয়েছে
                    </span>
                  </div>
                  <button
                    onClick={removePin}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    পিন মুছুন
                  </button>
                </div>

                {/* Biometrics Toggle Button */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-emerald-500" />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                        বায়োমেট্রিক ফিঙ্গারপ্রিন্ট / ফেস আনলক
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {hasBiometricsHardware
                          ? 'ডিভাইস সেন্সর দিয়ে দ্রুত আনলক করুন'
                          : 'ডিভাইস সেন্সর পরীক্ষা করা হচ্ছে'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleBiometrics}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      state.securitySettings.isBiometricsEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {state.securitySettings.isBiometricsEnabled ? 'সক্রিয়' : 'চালু করুন'}
                  </button>
                </div>

                {/* Quick Lock Now button */}
                <button
                  onClick={lockApp}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>এখনই অ্যাপ লক করুন</span>
                </button>
              </div>
            ) : (
              /* Set new PIN Form */
              <form onSubmit={handleSetupPin} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      ৪ ডিজিট পিন নম্বর
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="****"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full py-2 px-3 text-center tracking-widest text-base font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      পিন নিশ্চিত করুন
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="****"
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value)}
                      className="w-full py-2 px-3 text-center tracking-widest text-base font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="e2eeCheckbox"
                    checked={pinE2EE}
                    onChange={(e) => setPinE2EE(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="e2eeCheckbox" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    এন্ড-টু-এন্ড এনক্রিপশন সক্রিয় করুন (AES-256 বিট)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition active:scale-95 cursor-pointer mt-2"
                >
                  পিন সেটআপ সম্পন্ন করুন
                </button>
              </form>
            )}
          </div>

          {/* End-to-End Encryption Architecture Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                তথ্য নিরাপত্তা ও গোপনীয়তা প্রযুক্তি
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              আপনার সকল লেনদেন, আয়-ব্যয় এবং ব্যক্তিগত নোট ব্রাউজারের ভেতর <strong>Web Crypto API AES-GCM 256-bit</strong> দিয়ে এনক্রিপ্ট হয়ে সংরক্ষিত থাকে। কোন তৃতীয় পক্ষ বা বাহ্যিক সার্ভার আপনার তথ্যে প্রবেশ করতে পারে না।
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                ✓ <strong>PBKDF2</strong> (১,০০,০০০ ইটারেশন)
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                ✓ <strong>AES-GCM</strong> (২৫৬ বিট কী)
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Data Backup & Restore */}
        <div className="space-y-6">
          {/* Export Backup Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  ডাটা ব্যাকআপ ডাউনলোড (Export)
                </h3>
                <p className="text-[11px] text-slate-400">
                  আপনার সকল হিসাব JSON ফাইলে নিরাপদ ব্যাকআপ নিন
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ব্যাকআপ এনক্রিপশন পাসওয়ার্ড (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <input
                    type={showBackupPassword ? 'text' : 'password'}
                    placeholder="পাসওয়ার্ড দিলে ব্যাকআপ ফাইল এনক্রিপ্ট থাকবে"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    className="w-full py-2 pl-3 pr-9 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBackupPassword(!showBackupPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showBackupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleExportDownload}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ব্যাকআপ ফাইল ডাউনলোড করুন (.json)</span>
              </button>
            </div>
          </div>

          {/* Import / Restore Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  ডাটা রিস্টোর করুন (Restore)
                </h3>
                <p className="text-[11px] text-slate-400">
                  পূর্বে ডাউনলোড করা ব্যাকআপ ফাইল থেকে ডাটা ফিরিয়ে আনুন
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  যদি ফাইলটি পাসওয়ার্ড দিয়ে এনক্রিপ্ট করা থাকে:
                </label>
                <input
                  type="password"
                  placeholder="ফাইলের পাসওয়ার্ড লিখুন"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/60 transition">
                <div className="flex flex-col items-center justify-center pt-2 pb-3">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    ব্যাকআপ ফাইল সিলেক্ট করুন (.json)
                  </p>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {importNotice && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    importNotice.isError
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}
                >
                  {importNotice.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{importNotice.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone & Reset */}
          <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-rose-500 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>ডেটা ম্যানেজমেন্ট ও রিসেট</span>
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={loadSampleData}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                <span>নমুনা ডাটা লোড করুন</span>
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সকল লেনদেন মুছুন</span>
              </button>
            </div>

            {showResetConfirm && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 space-y-2">
                <p>আপনি কি নিশ্চিত যে সকল লেনদেনের হিসাব মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না!</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      resetAllData();
                      setShowResetConfirm(false);
                    }}
                    className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold"
                  >
                    হ্যাঁ, মুছে ফেলুন
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold"
                  >
                    বাতিল
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
