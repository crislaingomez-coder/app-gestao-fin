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
  saveCategories
} from "./services/supabaseStorage";

import { getCurrentMonthStr } from './constants';

const Logo = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
    <rect width="512" height="512" rx="128" fill="#2563eb"/>
    <path d="M128 350L256 480L384 350" fill="none" stroke="#1e40af" strokeWidth="20" opacity="0.1"/>
    <rect x="112" y="144" width="288" height="224" rx="32" fill="#ffffff"/>
    <path d="M112 184h288" stroke="#e5e7eb" strokeWidth="16"/>
    <path d="M320 232h80v48h-80a24 24 0 0 1-24-24v0a24 24 0 0 1 24-24z" fill="#f59e0b"/>
    <circle cx="360" cy="256" r="12" fill="#ffffff"/>
  </svg>
);

const App: React.FC = () => {
  const [screen, setScreen] = useState<string>('login');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // ==========================================
  // LOAD INITIAL DATA FROM SUPABASE
  // ==========================================
  useEffect(() => {
    (async () => {
      const trx = await getTransactions();
      const crd = await getCards();
      const cat = await getCategories();

      setTransactions(trx);
      setCards(crd);
      setCategories(cat);
    })();
  }, []);

  // ==========================================
  // SAVE WHEN CHANGES OCCUR
  // ==========================================
  useEffect(() => {
    if (transactions.length > 0) {
      saveTransactions(transactions);
    }
  }, [transactions]);

  useEffect(() => {
    if (cards.length > 0) {
      saveCards(cards);
    }
  }, [cards]);

  useEffect(() => {
    if (categories.length > 0) {
      saveCategories(categories);
    }
  }, [categories]);

  // ==========================================
  // HANDLERS (SEM ALTERAR LÓGICA)
  // ==========================================
  const handleAddTransaction = (newTransactions: Transaction[]) => {
    setTransactions(prev => {
      const updated = [...prev, ...newTransactions];
      saveTransactions(updated);
      return updated;
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTransactions = (updates: Transaction[]) => {
    setTransactions(prev => {
      return prev.map(t => {
        const update = updates.find(u => u.id === t.id);
        return update ? update : t;
      });
    });
  };

  const handleAddCard = (c: CardInfo) => {
    setCards(prev => {
      const updated = [...prev, c];
      saveCards(updated);
      return updated;
    });
  };

  const handleEditCard = (updatedCard: CardInfo) => {
    setCards(prev => prev.map(c => (c.id === updatedCard.id ? updatedCard : c)));
  };

  const handleDeleteCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const handleAddCategory = (cat: string) => {
    if (!categories.includes(cat)) {
      const updated = [...categories, cat];
      setCategories(updated);
      saveCategories(updated);
    }
  };

  const handleDeleteCategory = (cat: string) => {
    setCategories(prev => prev.filter(c => c !== cat));
  };

  const handleRestoreData = (newTransactions: Transaction[], newCards: CardInfo[], newCategories: string[]) => {
    setTransactions(newTransactions);
    setCards(newCards);
    setCategories(newCategories);

    saveTransactions(newTransactions);
    saveCards(newCards);
    saveCategories(newCategories);
  };

  const togglePrivacyMode = () => {
    setIsPrivacyMode(prev => !prev);
  };

  // ==========================================
  // LOGIN SCREEN
  // ==========================================
  if (screen === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 relative overflow-hidden">

        <div className="absolute top-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vh] h-[40vh] bg-orange-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
          <div className="mb-8 p-6 bg-white rounded-[2.5rem] shadow-xl shadow-blue-500/10 animate-scale-in">
            <Logo className="w-24 h-24 drop-shadow-lg" />
          </div>

          <h1 className="text-3xl font-extrabold text-gray-800 mb-2 tracking-tight text-center">Minha Gestão</h1>
          <p className="text-gray-400 mb-10 text-center text-sm font-medium">Controle financeiro pessoal inteligente</p>

          <button
            onClick={() => setScreen('dashboard')}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
          >
            <span>Entrar</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>

          <p className="mt-8 text-xs text-gray-400 font-medium">Versão 1.0.0 (PWA)</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN APP SCREENS
  // ==========================================
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
