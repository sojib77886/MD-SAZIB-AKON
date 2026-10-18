import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { verifyBiometrics, checkBiometricsSupport } from '../utils/biometrics';
import { toBengaliNumber } from '../utils/formatters';
import { Lock, Fingerprint, ShieldCheck, AlertCircle, KeyRound, Delete } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { state, unlockAppWithPin, unlockAppWithBiometrics } = useApp();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);

  useEffect(() => {
    checkBiometricsSupport().then((res) => {
      setHasBiometrics(res.isSupported && state.securitySettings.isBiometricsEnabled);
    });
  }, [state.securitySettings.isBiometricsEnabled]);

  const handleBiometricAuth = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await verifyBiometrics(state.securitySettings.biometricCredentialId);
      if (result.success) {
        await unlockAppWithBiometrics();
      } else {
        setError(result.error || 'বায়োমেট্রিক যাচাই ব্যর্থ হয়েছে। পিন দিয়ে আনলক করুন।');
      }
    } catch {
      setError('বায়োমেট্রিক যাচাইয়ে ত্রুটি হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDigitPress = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');

      // Auto submit when 4 digits are reached (standard PIN)
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const verifyPin = async (enteredPin: string) => {
    setIsLoading(true);
    const success = await unlockAppWithPin(enteredPin);
    setIsLoading(false);
    if (!success) {
      setError('ভুল পিন নম্বর! আবার চেষ্টা করুন।');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 font-['Hind_Siliguri','Inter',sans-serif]">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900/90 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl text-center">
        {/* App Logo & Lock Icon */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
          <Lock className="h-10 w-10 stroke-[2.2]" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
          হিসাব-খাতা লক
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          আপনার আর্থিক তথ্যের সর্বোচ্চ সুরক্ষায় পিন বা বায়োমেট্রিক দিয়ে আনলক করুন
        </p>

        {/* E2EE badge */}
        {state.securitySettings.isE2EEncrypted && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-medium text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>এন্ড-টু-এন্ড এনক্রিপ্টেড (AES-256)</span>
          </div>
        )}

        {/* PIN Dots Display */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`h-4 w-4 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-emerald-400 scale-110 shadow-sm shadow-emerald-400/50'
                  : 'bg-slate-700/60 border border-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-center justify-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 py-1.5 px-3 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              disabled={isLoading}
              onClick={() => handleDigitPress(num)}
              className="h-14 w-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-xl font-bold text-white border border-slate-700/50 transition flex items-center justify-center mx-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {state.useBengaliDigits ? toBengaliNumber(num, true) : num}
            </button>
          ))}

          {/* Biometrics button (left) */}
          <button
            type="button"
            disabled={isLoading || !hasBiometrics}
            onClick={handleBiometricAuth}
            className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto border transition ${
              hasBiometrics
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95 cursor-pointer'
                : 'text-slate-600 border-transparent cursor-not-allowed'
            }`}
            title="বায়োমেট্রিক ফিঙ্গারপ্রিন্ট আনলক"
          >
            <Fingerprint className="w-7 h-7" />
          </button>

          {/* 0 Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleDigitPress('0')}
            className="h-14 w-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-xl font-bold text-white border border-slate-700/50 transition flex items-center justify-center mx-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {state.useBengaliDigits ? toBengaliNumber(0, true) : '0'}
          </button>

          {/* Delete Button (right) */}
          <button
            type="button"
            disabled={isLoading || pin.length === 0}
            onClick={handleDelete}
            className="h-14 w-14 rounded-2xl bg-slate-800/50 hover:bg-slate-700/60 active:scale-95 text-slate-300 border border-slate-700/40 transition flex items-center justify-center mx-auto cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="মুছুন"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Biometric Quick Trigger Text */}
        {hasBiometrics && (
          <button
            type="button"
            onClick={handleBiometricAuth}
            className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
          >
            <Fingerprint className="w-4 h-4" />
            <span>ফিঙ্গারপ্রিন্ট বা ফেস দিয়ে আনলক করুন</span>
          </button>
        )}
      </div>
    </div>
  );
};
