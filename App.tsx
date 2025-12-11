import React, { useState, useEffect } from 'react';

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import OpenDebts from './components/OpenDebts';

import {
  Transaction,
  CardInfo,
  PaymentRecord,
  OpenDebt
} from './types';

import {
  getTransactions, saveTransactions,
  getCards, saveCards,
  getCategories, saveCategories,
  getOpenDebts, saveOpenDebts,
  deleteTransaction, deleteCard, deleteCategory,
  savePayments, deleteOpenDebt
} from "./services/supabaseStorage";

import { getCurrentMonthStr } from './constants';


// =====================================================================
// LOGO (igual ao seu original)
// =====================================================================
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

  // =====================================================================
  // STATES
  // =====================================================================
  const [screen, setScreen] = useState<string>('login');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const [openDebts, setOpenDebts] = useState<OpenDebt[]>([]);



  // =====================================================================
  // CONFIRMAÇÃO (igual ao seu: window.confirm)
  // =====================================================================
  const onRequestConfirm = (msg: string, onConfirm: () => void) => {
    if (window.confirm(msg)) onConfirm();
  };



  // =====================================================================
  // LOAD INITIAL DATA
  // =====================================================================
  useEffect(() => {
    (async () => {
      try {
        const tx = await getTransactions();
        const cs = await getCards();
        const cats = await getCategories();
        const debts = await getOpenDebts();

        setTransactions(tx ?? []);
        setCards(cs ?? []);
        setCategories(cats ?? []);
        setOpenDebts(debts ?? []);

      } catch (err) {
        console.error("Erro ao inicializar dados:", err);
      }
    })();
  }, []);



  // =====================================================================
  // SAVERS (SEM LOOP INFINITO)
  // =====================================================================
  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveCards(cards); }, [cards]);
  useEffect(() => { saveCategories(categories); }, [categories]);
  useEffect(() => { savePayments(payments); }, [payments]);



  // =====================================================================
  // HANDLERS — MESMO CÓDIGO DO SEU APP ORIGINAL
  // =====================================================================

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



  // =====================================================================
  // OPEN DEBTS — NOVA FUNCIONALIDADE CORRETA
  // =====================================================================

  const handleAddOpenDebt = async (d: OpenDebt) => {
    setOpenDebts(prev => [d, ...prev]);
    await saveOpenDebts([d]);      // SALVA UM POR VEZ → CORRETO
  };

  const handleDeleteOpenDebt = async (id: string) => {
    await deleteOpenDebt(id);   // REMOVE DO BANCO
    setOpenDebts(prev => prev.filter(d => d.id !== id));
  };



  // RESTORE
  const handleRestoreData = (t: Transaction[], c: CardInfo[], g: string[]) => {
    setTransactions(t);
    setCards(c);
    setCategories(g);
  };

  const togglePrivacyMode = () => setIsPrivacyMode(p => !p);



  // =====================================================================
  // LOGIN SCREEN — SEU LAYOUT ORIGINAL MANTIDO
  // =====================================================================
  if (screen === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 relative overflow-hidden">

        <div className="absolute top-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vh] h-[40vh] bg-orange-200/20 rounded-full blur-3xl animate-pulse"></div>

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <div className="mb-8 p-6 bg-white rounded-[2.5rem] shadow-xl shadow-blue-500/10">
            <Logo className="w-24 h-24" />
          </div>

          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Minha Gestão</h1>
          <p className="text-gray-400 mb-10 text-center text-sm font-medium">Controle financeiro pessoal inteligente</p>

          <button
            onClick={() => setScreen('dashboard')}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98]"
          >
            Entrar
          </button>

          <p className="mt-8 text-xs text-gray-400 font-medium">
            Versão 1.0.0 (PWA) - Desenvolvido por Crislaine Gomes
          </p>
        </div>
      </div>
    );
  }



  // =====================================================================
  // MAIN NAVIGATION — AGORA INCLUI A TELA NOVA
  // =====================================================================
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

      {screen === 'opendebts' && (
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
