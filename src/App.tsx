/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TransactionsView } from './components/TransactionsView';
import { BudgetAlertsView } from './components/BudgetAlertsView';
import { ChartsView } from './components/ChartsView';
import { AnnualReportView } from './components/AnnualReportView';
import { ThreeDView } from './components/ThreeDView';
import { BackupSecurityView } from './components/BackupSecurityView';
import { TransactionModal } from './components/TransactionModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { LockScreen } from './components/LockScreen';
import { OfflineBanner } from './components/OfflineBanner';
import { Transaction } from './types';
import { Plus } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isLocked } = useApp();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // If locked, render LockScreen
  if (isLocked) {
    return <LockScreen />;
  }

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-['Hind_Siliguri','Inter',sans-serif]">
      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddModalOpen(true);
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenAddModal={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
            onEditTransaction={handleEditTransaction}
            setActiveTab={setActiveTab}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            onOpenAddModal={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
            onEditTransaction={handleEditTransaction}
          />
        )}

        {activeTab === 'budget' && <BudgetAlertsView />}

        {activeTab === 'charts' && <ChartsView />}

        {activeTab === 'annual' && <AnnualReportView />}

        {activeTab === '3d-scene' && <ThreeDView />}

        {activeTab === 'backup-security' && <BackupSecurityView />}
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="sm:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsAddModalOpen(true);
          }}
          className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/40 flex items-center justify-center transition active:scale-95 cursor-pointer"
          title="নতুন হিসাব যোগ করুন"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        editTransaction={editingTransaction}
        onOpenCategoryManager={() => {
          handleCloseModal();
          setIsCategoryModalOpen(true);
        }}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      {/* Persistent Offline Notification */}
      <OfflineBanner />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
