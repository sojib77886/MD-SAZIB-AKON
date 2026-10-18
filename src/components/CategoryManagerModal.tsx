import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category, TransactionType } from '../types';
import { renderCategoryIcon } from './TransactionModal';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_ICONS = [
  'Home',
  'Zap',
  'Utensils',
  'Wallet',
  'Cigarette',
  'Droplet',
  'Car',
  'ShoppingBag',
  'HeartPulse',
  'Wifi',
  'Briefcase',
  'Laptop',
  'Store',
  'Gift',
];

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const { state, addCategory, updateCategory, deleteCategory } = useApp();

  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // New category inputs
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('ক্যাটাগরির নাম লিখুন');
      return;
    }

    const budgetNum = budget ? parseFloat(budget) : undefined;

    if (editingCatId) {
      const existing = state.categories.find((c) => c.id === editingCatId);
      if (existing) {
        updateCategory({
          ...existing,
          name: name.trim(),
          type: activeTab,
          icon: selectedIcon,
          color: selectedColor,
          budget: budgetNum,
        });
      }
      setEditingCatId(null);
    } else {
      addCategory({
        name: name.trim(),
        type: activeTab,
        icon: selectedIcon,
        color: selectedColor,
        budget: budgetNum,
      });
    }

    // Reset fields
    setName('');
    setBudget('');
    setError('');
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setName(cat.name);
    setActiveTab(cat.type);
    setSelectedIcon(cat.icon);
    setSelectedColor(cat.color);
    setBudget(cat.budget ? String(cat.budget) : '');
  };

  const currentCategories = state.categories.filter((c) => c.type === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto font-['Hind_Siliguri','Inter',sans-serif]">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-800 dark:text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            ক্যাটাগরি ম্যানেজমেন্ট
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Expense vs Income */}
        <div className="grid grid-cols-2 gap-2 my-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'expense'
                ? 'bg-rose-500 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            খরচের ক্যাটাগরি
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'income'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            আয়ের ক্যাটাগরি
          </button>
        </div>

        {/* Existing categories list */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            বর্তমান ক্যাটাগরিসমূহ ({currentCategories.length})
          </h3>
          <div className="max-h-40 overflow-y-auto space-y-1.5 p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
            {currentCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="p-1.5 rounded-md text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </span>
                    {cat.budget && (
                      <span className="ml-2 text-[11px] text-slate-400">
                        (বাজেট: ৳{cat.budget})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(cat)}
                    className="p-1 text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                    title="সম্পাদনা করুন"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!cat.isDefault && (
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add / Edit Form */}
        <form onSubmit={handleSave} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {editingCatId ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি তৈরি'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                নাম (বাংলায়)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="যেমন: গৃহশিক্ষক / জিম খরচ"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                মাসিক বাজেট সীমা (ঐচ্ছিক)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="৳ সীমা"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-3 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              আইকন নির্বাচন
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={`p-2 rounded-lg border transition cursor-pointer ${
                    selectedIcon === iconName
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {renderCategoryIcon(iconName, 'w-4 h-4')}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              রং নির্বাচন
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-6 h-6 rounded-full transition flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingCatId && (
              <button
                type="button"
                onClick={() => {
                  setEditingCatId(null);
                  setName('');
                  setBudget('');
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                বাতিল
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingCatId ? 'আপডেট করুন' : 'যোগ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
