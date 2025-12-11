import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import OpenDebts from './components/OpenDebts';   // ← ADICIONADO

import { Transaction, CardInfo, OpenDebt, PaymentRecord } from './types';

import { 
    getTransactions, saveTransactions, 
    getCards, saveCards,
    getCategories, saveCategories,
    getOpenDebts, saveOpenDebts,   // ← ADICIONADO
    deleteTransaction, deleteCard, deleteCategory,
    savePayments                    // ← EXISTENTE NO SEU CÓDIGO
} from "./services/supabaseStorage";

import { getCurrentMonthStr } from './constants';

// LOGO — igual ao seu original
const Logo = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
    <rect width="512" height="512" rx="128" fill="#2563eb" />
    <path d="M128 350L256 480L384 350" fill="none" stroke="#1e40af" strokeWidth="20" opacity="0.1" />
    <rect x="112" y="144" width="288" height="224" rx="32" fill="#ffffff" />
    <path d="M112 184h288" stroke="#e5e7eb" strokeWidth="16" />
    <path d="M320 232h80v48h-80a24 24 0 0 1-24-24v0a24 24 0 0 1 24-24z" fill="#f59e0b" />
    <circle cx="360" cy="256" r="12" fill="#ffffff" />
  </svg>
);

const App: React.FC = () => {

  const [screen, setScreen] = useState<string>('login');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]); 

  const [openDebts, setOpenDebts] = useState<OpenDebt[]>([]);   // ← ADICIONADO

  const onRequestConfirm = (msg: string, onConfirm: () => void) => {
    if (window.confirm(msg)) onConfirm();
  };

  // LOAD DATA
  useEffect(() => {
    (async () => {
      try {
        const tx = await getTransactions();
        const cs = await getCards();
        const cats = await getCategories();
        const debts = await getOpenDebts();   // ← ADICIONADO

        setTransactions(tx ?? []);
        setCards(cs ?? []);
        setCategories(cats ?? []);
        setOpenDebts(debts ?? []);           // ← ADICIONADO

      } catch (err) {
        console.error("Erro ao inicializar dados:", err);
      }
    })();
  }, []);

  // SAVE
  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveCards(cards); }, [cards]);
  useEffect(() => { saveCategories(categories); }, [categories]);
  useEffect(() => { savePayments(payments); }, [payments]);
  useEffect(() => { saveOpenDebts(openDebts); }, [openDebts]);   // ← ADICIONADO

  // HANDLERS
  const handleAddTransaction = (t: Transaction | Transaction[]) =>
    setTransactions(prev => [...prev, ...(Array.isArray(t) ? t : [t])]);

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTransactions = (updates: Transaction[]) =>
    setTransactions(prev =>
      prev.map(t => updates.find(u => u.id === t.id) ?? t)
    );

  const handleAddPayment = (p: PaymentRecord) =>
    setPayments(prev => [...prev, p]);

  // CARDS
  const handleAddCard = (c: CardInfo) => setCards(prev => [...prev, c]);

  const handleEditCard = (c: CardInfo) =>
    setCards(prev => prev.map(x => (x.id === c.id ? c : x)));

  const handleDeleteCard = async (id: string) => {
    await deleteCard(id);
    setCards(prev => prev.filter(c => c.id !== id));
  };

  // CATEGORIES
  const handleAddCategory = (c: string) => {
    if (!categories.includes(c)) setCategories(prev => [...prev, c]);
  };

  const handleDeleteCategory = async (c: string) => {
    await deleteCategory(c);
    setCategories(prev => prev.filter(x => x !== c));
  };

  // OPEN DEBTS HANDLERS  ← ADICIONADO
  const handleAddOpenDebt = (d: OpenDebt) =>
    setOpenDebts(prev => [d, ...prev]);

  const handleDeleteOpenDebt = (id: string) =>
    setOpenDebts(prev => prev.filter(d => d.id !== id));

  // RESTORE
  const handleRestoreData = (t: Transaction[], c: CardInfo[], g: string[]) => {
    setTransactions(t);
    setCards(c);
    setCategories(g);
  };

  const togglePrivacyMode = () => setIsPrivacyMode(p => !p);

  // LOGIN SCREEN — idêntico ao original
  if (screen === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 relative overflow-hidden">
        {/* seu código original */}
      </div>
    );
  }

  // MAIN NAVIGATION
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
          onAddPayment={handleAddPayment}
          isPrivacyMode={isPrivacyMode}
          onRequestConfirm={onRequestConfirm}
        />
      )}

      {screen === 'opendebts' && (                         // ← ADICIONADO
        <OpenDebts 
          debts={openDebts}
          onAddDebt={handleAddOpenDebt}
          onDeleteDebt={handleDeleteOpenDebt}
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
