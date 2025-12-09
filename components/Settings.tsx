import React, { useState } from 'react';
import { CardInfo, Transaction } from '../types';
import { Trash2, Plus, CreditCard, Tag, X, Pencil, Save } from 'lucide-react';

interface SettingsProps {
  cards: CardInfo[];
  categories: string[];
  transactions: Transaction[];
  onAddCard: (card: CardInfo) => void;
  onEditCard: (card: CardInfo) => void;
  onDeleteCard: (id: string) => void;
  onAddCategory: (cat: string) => void;
  onDeleteCategory: (cat: string) => void;
  onRestoreData: (t: Transaction[], c: CardInfo[], cat: string[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    cards, categories, onAddCard, onEditCard, onDeleteCard, onAddCategory, onDeleteCategory 
}) => {
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardInfo | null>(null);
  
  const [cardName, setCardName] = useState('');
  const [bestDay, setBestDay] = useState('1');
  const [dueDay, setDueDay] = useState('10');

  const [newCategory, setNewCategory] = useState('');

  const openAddCardModal = () => {
      setEditingCard(null);
      setCardName('');
      setBestDay('1');
      setDueDay('10');
      setIsCardModalOpen(true);
  };

  const openEditCardModal = (card: CardInfo) => {
      setEditingCard(card);
      setCardName(card.name);
      setBestDay(String(card.bestDay));
      setDueDay(String(card.dueDay));
      setIsCardModalOpen(true);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCard) {
        onEditCard({
            ...editingCard,
            name: cardName,
            bestDay: parseInt(bestDay),
            dueDay: parseInt(dueDay)
        });
    } else {
        // 🔥 CORREÇÃO AQUI: UUID VÁLIDO PARA SUPABASE
        onAddCard({
            id: crypto.randomUUID(),
            name: cardName,
            bestDay: parseInt(bestDay),
            dueDay: parseInt(dueDay),
            color: '#000000'
        });
    }
    
    setIsCardModalOpen(false);
    setCardName('');
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newCategory.trim()) {
          onAddCategory(newCategory.trim());
          setNewCategory('');
      }
  };

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Configurações</h2>
      
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                  <CreditCard size={20}/>
                </div>
                Cartões
            </h3>
            <button 
                onClick={openAddCardModal}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-2xl font-bold hover:bg-blue-700 flex items-center gap-1 shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
                <Plus size={16}/> Adicionar
            </button>
        </div>

        <div className="grid gap-3">
            {cards.map(card => (
                <div key={card.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                    <div>
                        <div className="flex items-center gap-2">
                             <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: card.color || '#ccc' }}></span>
                             <p className="font-bold text-gray-900 text-lg">{card.name}</p>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1.5 font-medium">
                            <span className="bg-white px-2 py-1 rounded-md border border-gray-200">Melhor dia: <strong className="text-gray-700">{card.bestDay}</strong></span>
                            <span className="bg-white px-2 py-1 rounded-md border border-gray-200">Vence dia: <strong className="text-gray-700">{card.dueDay}</strong></span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => openEditCardModal(card)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all bg-white rounded-full border border-gray-100 shadow-sm"
                            title="Editar"
                        >
                            <Pencil size={18} />
                        </button>
                        {cards.length > 1 && (
                            <button 
                                type="button"
                                onClick={(e) => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    onDeleteCard(card.id); 
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all bg-white rounded-full border border-gray-100 shadow-sm"
                                title="Excluir"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 mb-6">
            <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                <Tag size={20}/>
            </div>
            Categorias
        </h3>

        <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-6">
            <input 
                type="text" 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value.toUpperCase())}
                placeholder="NOVA CATEGORIA..." 
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none bg-white text-gray-900 transition-all uppercase"
            />
            <button 
                type="submit" 
                disabled={!newCategory.trim()}
                className="bg-orange-500 text-white px-5 rounded-2xl font-bold hover:bg-orange-600 disabled:opacity-50 shadow-md shadow-orange-500/20 transition-all active:scale-95"
            >
                Add
            </button>
        </form>

        <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
                <div key={cat} className="group flex items-center gap-2 bg-gray-50 pl-4 pr-2 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-orange-200 hover:bg-orange-50 transition-colors">
                    <span>{cat}</span>
                    <button 
                        type="button"
                        onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            onDeleteCategory(cat); 
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-white"
                    >
                        <X size={14}/>
                    </button>
                </div>
            ))}
        </div>
      </div>

      {isCardModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
              <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-scale-in">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                        {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
                    </h3>
                    <button onClick={() => setIsCardModalOpen(false)} className="bg-gray-50 p-2 rounded-full text-gray-400 hover:bg-gray-100">
                        <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleCardSubmit} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">Nome do Cartão</label>
                          <input required value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} className="w-full p-3.5 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-white text-gray-900 font-bold uppercase" placeholder="Ex: NUBANK" />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">Melhor Dia</label>
                            <input required type="number" min="1" max="31" value={bestDay} onChange={e => setBestDay(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-white text-gray-900 text-center font-bold" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">Vencimento</label>
                            <input required type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-white text-gray-900 text-center font-bold" />
                        </div>
                      </div>
                      <div className="pt-4">
                          <button type="submit" className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                             <Save size={20} />
                             {editingCard ? 'Salvar Alterações' : 'Criar Cartão'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
