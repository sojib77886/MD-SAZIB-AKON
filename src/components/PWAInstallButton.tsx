import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>অ্যাপ ইন্সটলড</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
        title="অ্যাপটি ডিভাইসে সরাসরি ইন্সটল করুন"
      >
        <Download className="w-3.5 h-3.5" />
        <span>ইন্সটল করুন</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-xs font-medium transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>iOS এ ইন্সটল</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  iPhone / iPad এ ইন্সটল নিয়ম
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                    ১
                  </span>
                  <p>Safari ব্রাউজারে নিচের <strong>শেয়ার (Share)</strong> বাটনে ট্যাপ করুন।</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                    ২
                  </span>
                  <p>নিচে স্ক্রল করে <strong>'Add to Home Screen'</strong> সিলেক্ট করুন।</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                    ৩
                  </span>
                  <p>উপরে <strong>'Add'</strong> চাপলেই আপনার হোম স্ক্রিনে হিসাব-খাতা যোগ হয়ে যাবে।</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
              >
                বুঝেছি, বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
