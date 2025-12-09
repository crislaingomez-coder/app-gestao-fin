import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import { Transaction, CardInfo } from './types';

import {
  getTransactions,
  saveTransactions,
  getCards,
  saveCards,
  getCategories,
  saveCategories,
  deleteTransaction,
  deleteCard,
  deleteCategory
} from "./services/supabaseStorage";

import { getCurrentMonthStr } from './constants';

// =======================================================
// LOGO SVG
// =======================================================
const Logo = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
    <rect width="512" height="512" rx="128" fill="#2563eb" />
    <path d="M128 350L256 480L384 350" fill="none" stroke="#1e40af" strokeWidth="20" opacity="0.1"/>
    <rect x="112" y="144" width="288" height="224" rx="32" fill="#ffffff"/>
    <path d="M112 184h288" stroke="#e5e7eb" strokeWidth="16"/>
    <path d="M320 232h80v48h-80a24 24 0 0 1-24-24v0a24 24 0 0 1 24-24z" fill="#f59e0b"/>
    <circle cx="360" cy="256" r="12" fill="#ffffff"/>
  </svg>
);


// =======================================================
// APP
// =======================================================
const App: React.FC = () => {
  const [screen, setScreen] = useState<string>('login');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const onRequestConfirm = (msg: string, onConfirm: () => void) => {
    if (window.confirm(msg)) onConfirm();
  };

  // LOAD INITIAL DATA
  useEffect(() => {
    (async () => {
      setTransactions(await getTransactions());
      setCards(await getCards());
      setCategories(await getCategories());
    })();
  }, []);

  // SAVE CHANGES
  useEffect(() => {
    if (transactions.length > 0) saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    if (cards.length > 0) saveCards(cards);
  }, [cards]);

  useEffect(() => {
    if (categories.length > 0) saveCategories(categories);
  }, [categories]);


  // HANDLERS
  const handleAddTransaction = (newTransactions: Transaction[]) => {
    setTransactions(prev => {
      const updated = [...prev, ...newTransactions];
      saveTransactions(updated);
      return updated;
    });
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTransactions = (updates: Transaction[]) => {
    setTransactions(prev => prev.map(t => updates.find(u => u.id === t.id) ?? t));
  };

  const handleAddCard = (c: CardInfo) => {
    setCards(prev => {
      const updated = [...prev, c];
      saveCards(updated);
      return updated;
    });
  };

  const handleEditCard = (updated: CardInfo) => {
    setCards(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteCard = async (id: string) => {
    await deleteCard(id);
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const handleAddCategory = (cat: string) => {
    if (!categories.includes(cat)) {
      const updated = [...categories, cat];
      setCategories(updated);
      saveCategories(updated);
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    await deleteCategory(cat);
    setCategories(prev => prev.filter(c => c !== cat));
  };

  const handleRestoreData = (t: Transaction[], c: CardInfo[], g: string[]) => {
    setTransactions(t);
    setCards(c);
    setCategories(g);

    saveTransactions(t);
    saveCards(c);
    saveCategories(g);
  };

  const togglePrivacyMode = () => setIsPrivacyMode(prev => !prev);


  // LOGIN SCREEN
  if (screen === 'login') {
    return (
      ... (EXATAMENTE SEU LOGIN SCREEN AQUI, SEM MUDAR NADA)
    );
  }

  // MAIN LAYOUT
  return (
    <Layout
      activeScreen={screen}
      onNavigate={setScreen}
      isPrivacyMode={isPrivacyMode}
      togglePrivacyMode={togglePrivacyMode}
    >
      {screen === 'dashboard' && (
        <Dashboard
          transactions={transactions}
          cards={cards}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          isPrivacyMode={isPrivacyMode}
        />
      )}

      {(screen === 'expenses' || screen === 'payments') && (
        <Transactions
          mode={screen}
          transactions={transactions}
          cards={cards}
          categories={categories}
          onAddTransaction={handleAddTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onUpdateTransactions={handleUpdateTransactions}
          isPrivacyMode={isPrivacyMode}
          onRequestConfirm={onRequestConfirm}
        />
      )}

      {screen === 'settings' && (
        <Settings
          cards={cards}
          categories={categories}
          transactions={transactions}
          onAddCard={handleAddCard}
          onEditCard={handleEditCard}
          onDeleteCard={handleDeleteCard}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onRestoreData={handleRestoreData}
        />
      )}
    </Layout>
  );
};

export default App;
