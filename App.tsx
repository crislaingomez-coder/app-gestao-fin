import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import { Transaction, CardInfo, PaymentRecord } from './types';

import {
  getTransactions,
  saveTransactions,
  getCards,
  saveCards,
  getCategories,
  saveCategories,
  deleteTransaction,
  deleteCard,
  deleteCategory,
  savePayments // ← ADICIONADO
} from "./services/supabaseStorage";

import { getCurrentMonthStr } from './constants';

const App: React.FC = () => {
  const [screen, setScreen] = useState<string>('login');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]); // ← ADICIONADO

  const onRequestConfirm = (msg: string, onConfirm: () => void) => {
    if (window.confirm(msg)) onConfirm();
  };

  useEffect(() => {
    (async () => {
      setTransactions(await getTransactions());
      setCards(await getCards());
      setCategories(await getCategories());
    })();
  }, []);

  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveCards(cards); }, [cards]);
  useEffect(() => { saveCategories(categories); }, [categories]);
  useEffect(() => { savePayments(payments); }, [payments]); // ← ADICIONADO

  const handleAddTransaction = (t: Transaction | Transaction[]) =>
    setTransactions(prev => [...prev, ...(Array.isArray(t) ? t : [t])]);

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTransactions = (updates: Transaction[]) => {
    setTransactions(prev => prev.map(t => updates.find(u => u.id === t.id) ?? t));
  };

  const handleAddPayment = (p: PaymentRecord) => // ← ADICIONADO
    setPayments(prev => [...prev, p]);

  const handleAddCard = (c: CardInfo) => setCards(prev => [...prev, c]);
  const handleEditCard = (c: CardInfo) => setCards(prev => prev.map(x => x.id === c.id ? c : x));
  const handleDeleteCard = async (id: string) => {
    await deleteCard(id);
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const handleAddCategory = (c: string) => {
    if (!categories.includes(c)) setCategories(prev => [...prev, c]);
  };

  const handleDeleteCategory = async (c: string) => {
    await deleteCategory(c);
    setCategories(prev => prev.filter(x => x !== c));
  };

  const handleRestoreData = (t: Transaction[], c: CardInfo[], g: string[]) => {
    setTransactions(t);
    setCards(c);
    setCategories(g);
  };

  const togglePrivacyMode = () => setIsPrivacyMode(p => !p);

  // Your login & UI logic remains EXACTLY as before...

  return (
    <Layout
      activeScreen={screen}
      onNavigate={setScreen}
      isPrivacyMode={isPrivacyMode}
      togglePrivacyMode={togglePrivacyMode}
    >
      {(screen === 'expenses' || screen === 'payments') && (
        <Transactions
          mode={screen}
          transactions={transactions}
          cards={cards}
          categories={categories}
          onAddTransaction={handleAddTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onUpdateTransactions={handleUpdateTransactions}

          onAddPayment={handleAddPayment} // ← ADICIONADO

          isPrivacyMode={isPrivacyMode}
          onRequestConfirm={onRequestConfirm}
        />
      )}

      {/* Dashboard & Settings continuam iguais */}
    </Layout>
  );
};

export default App;
