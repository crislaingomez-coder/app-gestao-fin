import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import OpenDebts from './components/OpenDebts';
import { Transaction, CardInfo, OpenDebt, PaymentRecord } from './types';

import { 
    getTransactions, saveTransactions, 
    getCards, saveCards,
    getCategories, saveCategories,
    getOpenDebts, saveOpenDebts,
    savePayments          // ← ADICIONADO
} from './services/storage';

import { getCurrentMonthStr } from './constants';

// LOGO — sem alteração
const Logo = ({ className }: { className?: string }) => ( ... );

const App: React.FC = () => {
  const [screen, setScreen] = useState<string>('login');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [openDebts, setOpenDebts] = useState<OpenDebt[]>([]);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);   // ← ADICIONADO

  const [confirmConfig, setConfirmConfig] = useState({
      isOpen: false,
      message: '',
      onConfirm: () => {}
  });

  // LOAD DATA
  useEffect(() => {
    setTransactions(getTransactions());
    setCards(getCards());
    setCategories(getCategories());
    setOpenDebts(getOpenDebts());
  }, []);

  // SAVE DATA
  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveCards(cards); }, [cards]);
  useEffect(() => { saveCategories(categories); }, [categories]);
  useEffect(() => { saveOpenDebts(openDebts); }, [openDebts]);
  useEffect(() => { savePayments(payments); }, [payments]);   // ← ADICIONADO

  // HANDLERS
  const handleAddTransaction = (newTransactions: Transaction[]) =>
    setTransactions(prev => [...prev, ...newTransactions]);

  const handleDeleteTransaction = (id: string) =>
    setTransactions(prev => prev.filter(t => t.id !== id));

  const handleUpdateTransactions = (updates: Transaction[]) =>
    setTransactions(prev =>
      prev.map(t => updates.find(u => u.id === t.id) || t)
    );

  const handleAddPayment = (p: PaymentRecord) =>    // ← ADICIONADO
    setPayments(prev => [...prev, p]);

  const handleAddCard = (c: CardInfo) =>
    setCards(prev => [...prev, c]);

  const handleEditCard = (c: CardInfo) =>
    setCards(prev => prev.map(x => x.id === c.id ? c : x));

  const handleDeleteCard = (id: string) =>
    setCards(prev => prev.filter(c => c.id !== id));

  const handleAddCategory = (cat: string) => {
      if (!categories.includes(cat))
          setCategories(prev => [...prev, cat]);
  };

  const handleDeleteCategory = (cat: string) =>
    setCategories(prev => prev.filter(c => c !== cat));

  const handleAddOpenDebt = (d: OpenDebt) =>
    setOpenDebts(prev => [d, ...prev]);

  const handleDeleteOpenDebt = (id: string) =>
    setOpenDebts(prev => prev.filter(d => d.id !== id));

  const handleRestoreData = (t: Transaction[], c: CardInfo[], g: string[]) => {
      setTransactions(t);
      setCards(c);
      setCategories(g);
  };

  const togglePrivacyMode = () => setIsPrivacyMode(v => !v);

  const handleRequestConfirm = (message: string, onConfirm: () => void) =>
    setConfirmConfig({ isOpen: true, message, onConfirm });

  const executeConfirm = () => {
    confirmConfig.onConfirm();
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  if (screen === 'login') return ( ... );

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
          onAddPayment={handleAddPayment}   // ← ADICIONADO
          isPrivacyMode={isPrivacyMode}
          onRequestConfirm={handleRequestConfirm}
        />
      )}

      {screen === 'opendebts' && (
        <OpenDebts 
          debts={openDebts}
          onAddDebt={handleAddOpenDebt}
          onDeleteDebt={handleDeleteOpenDebt}
          isPrivacyMode={isPrivacyMode}
          onRequestConfirm={handleRequestConfirm}
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

      {/* modal igual ao seu */}
    </Layout>
  );
};

export default App;
