
import React, { useState } from 'react';
import { OpenDebt } from '../types';
import { formatCurrency } from '../constants';
import { Plus, Trash2, Check, X, User, FileText, Banknote } from 'lucide-react';

interface OpenDebtsProps {
  debts: OpenDebt[];
  onAddDebt: (debt: OpenDebt) => void;
  onDeleteDebt: (id: string) => void;
  isPrivacyMode: boolean;
  onRequestConfirm: (message: string, onConfirm: () => void) => void;
}

const OpenDebts: React.FC<OpenDebtsProps> = ({ debts, onAddDebt, onDeleteDebt, isPrivacyMode, onRequestConfirm }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const totalOwed = debts.reduce((acc, curr) => acc + curr.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !amount) return;

    const newDebt: OpenDebt = {
      id: Math.random().toString(36).substr(2, 9),
      personName: personName.toUpperCase(),
      amount: parseFloat(amount.replace(',', '.')),
      description: description,
      createdAt: new Date().toISOString()
    };

    onAddDebt(newDebt);
    
    // Reset and Close
    setPersonName('');
    setAmount('');
    setDescription('');
    setIsModalOpen(false);
  };

  const handlePay = (id: string, name: string) => {
      onRequestConfirm(`Marcar a dívida com "${name}" como paga/resolvida? Ela será removida da lista.`, () => {
          onDeleteDebt(id);
      });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 shadow-lg shadow-indigo-500/30 text-white relative overflow-hidden">
          <div className="relative z-10">
              <h2 className="text-indigo-100 font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Banknote size={16} /> Dívidas em Aberto
              </h2>
              <p className={`text-3xl font-bold ${isPrivacyMode ? 'privacy-hidden' : ''}`}>
                  {isPrivacyMode ? '****' : formatCurrency(totalOwed)}
              </p>
              <p className="text-xs text-indigo-200 mt-2 opacity-80">
                  Valores que não possuem data fixa para pagamento.
              </p>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
      </div>

      {/* List */}
      <div className="space-y-3">
          {debts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                  <User size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhuma anotação de dívida.</p>
                  <p className="text-xs mt-1">Adicione empréstimos informais aqui.</p>
              </div>
          ) : (
              debts.map(debt => (
                  <div key={debt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                              <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 shrink-0">
                                  <User size={20} />
                              </div>
                              <div>
                                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{debt.personName}</h3>
                                  {debt.description ? (
                                      <p className="text-xs text-gray-500 mt-1 bg-gray-50 px-2 py-1 rounded-lg inline-block border border-gray-100">
                                          {debt.description}
                                      </p>
                                  ) : (
                                      <p className="text-xs text-gray-400 mt-0.5">Sem observação</p>
                                  )}
                              </div>
                          </div>
                          <span className={`font-bold text-lg text-red-500 ${isPrivacyMode ? 'privacy-hidden' : ''}`}>
                              {isPrivacyMode ? '****' : formatCurrency(debt.amount)}
                          </span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-50 mt-1">
                          <button 
                              onClick={() => handlePay(debt.id, debt.personName)}
                              className="flex-1 bg-green-50 text-green-700 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
                          >
                              <Check size={16} /> Marcar como Pago
                          </button>
                      </div>
                  </div>
              ))
          )}
      </div>

      {/* FAB - Add Button */}
      <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center z-20 pointer-events-none">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full max-w-md bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 pointer-events-auto"
          >
            <Plus size={20} />
            Adicionar Dívida
          </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-[2px]">
              <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] max-w-md sm:rounded-[2rem] p-6 pb-safe shadow-2xl animate-slide-up sm:animate-scale-in overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Nova Dívida Informal</h3>
                    <button onClick={() => setIsModalOpen(false)} className="bg-gray-50 p-2 rounded-full text-gray-400 hover:bg-gray-100"><X size={20} /></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">Quem? (Credor)</label>
                          <div className="relative">
                              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                              <input 
                                required 
                                value={personName} 
                                onChange={e => setPersonName(e.target.value)} 
                                className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:border-indigo-500 outline-none bg-white text-gray-900 font-bold uppercase" 
                                placeholder="EX: VÔ, IRMÃ..." 
                              />
                          </div>
                      </div>
                      
                      <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">Valor (R$)</label>
                           <input 
                            required 
                            type="number" 
                            step="0.01" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            className="w-full p-3.5 border border-gray-200 rounded-2xl focus:border-indigo-500 outline-none bg-white text-gray-900 font-bold text-lg" 
                            placeholder="0,00" 
                           />
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">Observação (Opcional)</label>
                          <div className="relative">
                              <FileText className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                              <textarea 
                                rows={3}
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:border-indigo-500 outline-none bg-white text-gray-900 text-sm resize-none" 
                                placeholder="Ex: Pagar quando receber o décimo terceiro..." 
                              />
                          </div>
                      </div>

                      <div className="pt-4">
                          <button type="submit" className="w-full p-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                             <Check size={20} />
                             Salvar Anotação
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default OpenDebts;
