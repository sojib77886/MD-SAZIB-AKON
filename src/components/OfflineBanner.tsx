import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, ShieldCheck } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="অফলাইন স্ট্যাটাস নোটিফিকেশন"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/90 text-slate-950 px-4 py-2 text-xs font-semibold shadow-xl backdrop-blur-md border border-amber-400"
    >
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span>অফলাইন মোড সক্রিয় — আপনার সকল তথ্য স্থানীয়ভাবে ও নিরাপদে ডিভাইসেই সংরক্ষিত হচ্ছে</span>
      <div className="flex items-center gap-1 bg-amber-600/30 px-2 py-0.5 rounded text-[10px]">
        <ShieldCheck className="w-3 h-3" />
        <span>১০০% কার্যকর</span>
      </div>
    </aside>
  );
};
