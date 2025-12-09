import React, { useState } from 'react';
import { CardInfo, Transaction } from '../types';
import { Trash2, Plus, CreditCard, Tag, X, Pencil, Save } from 'lucide-react';

// 🔥 IMPORTA O SUPABASE DELETE
import { deleteCard, deleteCategory } from "../services/supabaseStorage";

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

      {/* ======================= CARDS ======================= */}
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
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-2xl font-bold hover:bg-blue-700 flex items-center gap-1"
            >
                <Plus size={16}/> Adicionar
            </button>
        </div>

        <div className="grid gap-3">
            {cards.map(card => (
                <div key={card.id} className="flex items-center justify-between p-4 border rounded-2xl bg-gray-50">
                    <div>
                        <div className="flex items-center gap-2">
                             <span className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color || '#ccc' }}></span>
                             <p className="font-bold">{card.name}</p>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1.5">
                            <span>Melhor dia: <strong>{card.bestDay}</strong></span>
                            <span>Vence dia: <strong>{card.dueDay}</strong></span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => openEditCardModal(card)}
                            className="p-2 text-gray-400 hover:text-blue-600"
                        >
                            <Pencil size={18} />
                        </button>

                        {cards.length > 1 && (
                            <button 
                                onClick={async (e) => { 
                                    e.preventDefault();
                                    await deleteCard(card.id);       // 🔥 SUPABASE DELETE
                                    onDeleteCard(card.id);            // atualiza local
                                }}
                                className="p-2 text-gray-400 hover:text-red-600"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* ======================= CATEGORIES ======================= */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

        <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 mb-6">
            <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                <Tag size={20}/>
            </div>
            Categorias
        </h3>

        <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-6">
            <input 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value.toUpperCase())}
                placeholder="NOVA CATEGORIA..."
                className="flex-1 border rounded-xl px-4 py-3 text-sm uppercase"
            />
            <button 
                type="submit"
                disabled={!newCategory.trim()}
                className="bg-orange-500 text-white px-5 rounded-2xl font-bold"
            >
                Add
            </button>
        </form>

        <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
                <div key={cat} className="flex items-center gap-2 bg-gray-50 pl-4 pr-2 py-2 rounded-xl border text-sm">
                    <span>{cat}</span>
                    <button 
                        onClick={async (e) => { 
                            e.preventDefault();
                            await deleteCategory(cat);      // 🔥 SUPABASE DELETE
                            onDeleteCategory(cat);          // atualiza local
                        }}
                        className="text-gray-400 hover:text-red-500"
                    >
                        <X size={14}/>
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* =============== MODAL DE CARTÃO =============== */}
      {isCardModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl">
                  
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">
                        {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
                    </h3>
                    <button onClick={() => setIsCardModalOpen(false)} className="p-2 text-gray-400">
                        <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleCardSubmit} className="space-y-4">

                      <div>
                          <label className="block text-xs font-bold mb-1.5">Nome do Cartão</label>
                          <input required value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} className="w-full p-3.5 border rounded-2xl" />
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold mb-1.5">Melhor Dia</label>
                            <input required type="number" min="1" max="31" value={bestDay} onChange={e => setBestDay(e.target.value)} className="w-full p-3.5 border rounded-2xl text-center" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold mb-1.5">Vencimento</label>
                            <input required type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full p-3.5 border rounded-2xl text-center" />
                        </div>
                      </div>

                      <button type="submit" className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold">
                         <Save size={20} />
                         {editingCard ? 'Salvar Alterações' : 'Criar Cartão'}
                      </button>

                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default Settings;
