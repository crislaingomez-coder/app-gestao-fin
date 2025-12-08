import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Transaction, TransactionStatus, CardInfo, TransactionType } from '../types';
import { formatCurrency, COLORS, MONTH_NAMES } from '../constants';
import { ChevronLeft, ChevronRight, BarChart3, Globe } from 'lucide-react';
import MonthPicker from './MonthPicker';

interface DashboardProps {
  transactions: Transaction[];
  cards: CardInfo[];
  selectedMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
  isPrivacyMode: boolean;
}

type ViewMode = 'monthly' | 'general';

const Dashboard: React.FC<DashboardProps> = ({ transactions, cards, selectedMonth, onMonthChange, isPrivacyMode }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  
  // Navigation helpers for month
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 - 1, 1);
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${date.getFullYear()}-${newMonth}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + 1, 1);
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${date.getFullYear()}-${newMonth}`);
  };

  // --- GENERAL VIEW CALCULATIONS ---
  const generalData = useMemo(() => {
    let totalDebt = 0;
    let totalPending = 0;
    let totalPaid = 0;

    const categoryDataMap = new Map<string, number>();
    const cardDataMap = new Map<string, number>();

    transactions.forEach(t => {
        const amount = t.amount;
        const actualPaid = t.payments 
            ? t.payments.reduce((sum, p) => sum + p.amount, 0) 
            : (t.paidAmount || 0);
        
        totalDebt += amount;
        totalPaid += actualPaid;

        const remaining = Math.max(0, amount - actualPaid);
        if (t.status !== TransactionStatus.PAID) {
            totalPending += remaining;
        }

        categoryDataMap.set(t.category, (categoryDataMap.get(t.category) || 0) + amount);

        if (t.cardId) {
            const cardName = cards.find(c => c.id === t.cardId)?.name || 'Desconhecido';
            cardDataMap.set(cardName, (cardDataMap.get(cardName) || 0) + amount);
        }
    });

    const categoryData = Array.from(categoryDataMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);

    const cardData = Array.from(cardDataMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);

    // General Projection (Next 12 Months)
    const projectionData = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based

    for (let i = 0; i < 12; i++) {
        const d = new Date(currentYear, currentMonth + i, 1);
        const yStr = d.getFullYear();
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        const targetMonthStr = `${yStr}-${mStr}`;
        const monthNameShort = MONTH_NAMES[d.getMonth()].substring(0,3);

        const totalScheduled = transactions
            .filter(t => {
                let matchesMonth = false;
                if (t.type === TransactionType.CREDIT_CARD) {
                    matchesMonth = t.invoiceMonth === targetMonthStr;
                } else {
                    matchesMonth = t.date.startsWith(targetMonthStr);
                }
                return matchesMonth;
            })
            .reduce((sum, t) => {
                 return sum + t.amount;
            }, 0);

        projectionData.push({
            name: `${monthNameShort}/${String(yStr).slice(2)}`,
            value: totalScheduled,
            fullDate: targetMonthStr
        });
    }

    return { totalDebt, totalPending, totalPaid, categoryData, cardData, projectionData };
  }, [transactions, cards]);


  // --- MONTHLY VIEW CALCULATIONS ---
  const monthlyData = useMemo(() => {
    // Filter transactions relevant to this view (Invoice month for cards, Date for fixed)
    const monthTransactions = transactions.filter(t => {
      if (t.type === TransactionType.CREDIT_CARD) {
        return t.invoiceMonth === selectedMonth;
      } else {
        return t.date.startsWith(selectedMonth);
      }
    });

    let totalDebt = 0;
    let totalPending = 0;
    let totalPaid = 0;

    monthTransactions.forEach(t => {
      const amount = t.amount;
      const actualPaid = t.payments 
            ? t.payments.reduce((sum, p) => sum + p.amount, 0) 
            : (t.paidAmount || 0);

      totalDebt += amount;
      
      totalPaid += actualPaid;
      
      const remaining = Math.max(0, amount - actualPaid);
      if (t.status !== TransactionStatus.PAID) {
         totalPending += remaining;
      }
    });

    const categoryDataMap = new Map<string, number>();
    monthTransactions.forEach(t => {
        categoryDataMap.set(t.category, (categoryDataMap.get(t.category) || 0) + t.amount);
    });
    
    const categoryData = Array.from(categoryDataMap.entries()).map(([name, value]) => ({
      name: name.length > 8 ? name.substring(0,8) + '...' : name,
      fullName: name,
      value
    })).sort((a,b) => b.value - a.value);

    const cardDataMap = new Map<string, number>();
    monthTransactions.forEach(t => {
        if (t.cardId) {
            const cardName = cards.find(c => c.id === t.cardId)?.name || 'Desconhecido';
            const val = t.amount; 
            cardDataMap.set(cardName, (cardDataMap.get(cardName) || 0) + val);
        }
    });
    const cardData = Array.from(cardDataMap.entries()).map(([name, value]) => ({
        name, value
    })).sort((a,b) => b.value - a.value);

    // Projection Logic (Next 6 months relative to selected month)
    const projectionData = [];
    const [startYear, startMonth] = selectedMonth.split('-').map(Number);
    
    for (let i = 0; i < 6; i++) {
        const d = new Date(startYear, startMonth - 1 + i, 1);
        const yStr = d.getFullYear();
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        const targetMonthStr = `${yStr}-${mStr}`;
        const monthNameShort = MONTH_NAMES[d.getMonth()].substring(0,3);

        const totalScheduled = transactions
            .filter(t => {
                let matchesMonth = false;
                if (t.type === TransactionType.CREDIT_CARD) {
                    matchesMonth = t.invoiceMonth === targetMonthStr;
                } else {
                    matchesMonth = t.date.startsWith(targetMonthStr);
                }
                
                if (!matchesMonth) return false;

                if (t.type === TransactionType.CREDIT_CARD) return true;
                if (t.type === TransactionType.FIXED && t.installments) return true;
                
                return false; 
            })
            .reduce((sum, t) => sum + t.amount, 0);

        projectionData.push({
            name: `${monthNameShort}/${String(yStr).slice(2)}`,
            value: totalScheduled,
            fullDate: targetMonthStr
        });
    }

    return { totalDebt, totalPending, totalPaid, categoryData, cardData, projectionData };
  }, [transactions, selectedMonth, cards]);


  const activeData = viewMode === 'general' ? generalData : monthlyData;

  return (
    <div className="space-y-6 pb-6">
      
      {/* VIEW TOGGLE */}
      <div className="flex justify-center mb-1">
         <div className="bg-gray-100 p-1 rounded-2xl flex text-xs font-bold shadow-inner">
            <button
                onClick={() => setViewMode('monthly')}
                className={`px-6 py-2.5 rounded-xl transition-all duration-200 ${viewMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Mensal
            </button>
            <button
                onClick={() => setViewMode('general')}
                className={`px-6 py-2.5 rounded-xl transition-all duration-200 ${viewMode === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Geral
            </button>
         </div>
      </div>

      {/* --- TOP BAR: MONTH SELECTOR WITH ARROWS (Only in Monthly Mode) --- */}
      {viewMode === 'monthly' && (
        <div className="flex flex-col items-center gap-4 animate-scale-in">
             <div className="flex items-center justify-between w-full max-w-xs bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                <button 
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-colors active:scale-95"
                >
                    <ChevronLeft size={24} />
                </button>
                
                <MonthPicker 
                    value={selectedMonth} 
                    onChange={onMonthChange} 
                    variant="header"
                />

                <button 
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-colors active:scale-95"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
      )}

      {viewMode === 'general' && (
         <div className="flex flex-col items-center gap-4 animate-scale-in">
            <div className="flex items-center gap-2 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 text-blue-700 shadow-sm">
               <Globe className="w-5 h-5" />
               <span className="font-bold text-lg">Visão Global de Tudo</span>
           </div>
         </div>
      )}

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard 
          title={viewMode === 'general' ? "Total Acumulado" : "Total (Mês)"}
          amount={activeData.totalDebt} 
          bg="bg-red-600" 
          textColor="text-white"
          subtitle={viewMode === 'general' ? "Histórico + Futuro" : "Dívida total do mês"}
          isPrivacyMode={isPrivacyMode}
        />
        <SummaryCard 
          title="Pendente" 
          amount={activeData.totalPending} 
          bg="bg-orange-500" 
          textColor="text-white" 
          subtitle={viewMode === 'general' ? "Total a pagar futuro" : "Restante do mês"}
          isPrivacyMode={isPrivacyMode}
        />
        <SummaryCard 
          title="Pago" 
          amount={activeData.totalPaid} 
          bg="bg-green-600" 
          textColor="text-white" 
          subtitle={viewMode === 'general' ? "Total já pago" : "Pago neste mês"}
          isPrivacyMode={isPrivacyMode}
        />
      </div>

      {/* --- PROJECTION CHART --- */}
       <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full">
        <h3 className="text-gray-800 font-bold mb-1 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600"/>
            {viewMode === 'general' ? 'Projeção de Dívida (12 Meses)' : 'Projeção (Dívida Cartão + Fixas Parc.)'}
        </h3>
        <p className="text-xs text-gray-400 mb-4 ml-7">
            {viewMode === 'general' ? 'Estimativa de gastos para o próximo ano.' : 'Soma das parcelas futuras agendadas.'}
        </p>
        
        {/* FIX: Explicit dimensions & wrapper for Recharts */}
        <div className="w-full h-[300px] min-h-[200px] min-w-[200px] relative">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart layout="vertical" data={activeData.projectionData} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} width={50} tick={{fill: '#6b7280', fontWeight: 600}} />
                <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    formatter={(value: number) => [isPrivacyMode ? '****' : formatCurrency(value), 'Valor Previsto']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
                    {activeData.projectionData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.blue : '#93C5FD'} className={isPrivacyMode ? 'privacy-hidden' : ''} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* --- CHARTS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Category Chart */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full">
            <h3 className="text-gray-800 font-bold mb-4 text-sm uppercase tracking-wide">Por Categoria</h3>
            <div className="w-full h-[300px] min-h-[200px] min-w-[200px] relative">
              {activeData.categoryData.length > 0 ? (
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={activeData.categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => isPrivacyMode ? '****' : `R$${val}`} tick={{fill: '#9ca3af'}} />
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        formatter={(value: number) => [isPrivacyMode ? '****' : formatCurrency(value), 'Valor']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {activeData.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.blue} className={isPrivacyMode ? 'privacy-hidden' : ''} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados</div>
              )}
            </div>
          </div>

          {/* Card Chart */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full">
            <h3 className="text-gray-800 font-bold mb-4 text-sm uppercase tracking-wide">Por Cartão / Conta</h3>
            <div className="w-full h-[300px] min-h-[200px] min-w-[200px] relative">
               {activeData.cardData.length > 0 ? (
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={activeData.cardData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => isPrivacyMode ? '****' : `R$${val}`} tick={{fill: '#9ca3af'}} />
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        formatter={(value: number) => [isPrivacyMode ? '****' : formatCurrency(value), 'Valor']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {activeData.cardData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.red} className={isPrivacyMode ? 'privacy-hidden' : ''} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
               ) : (
                 <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem gastos por cartão</div>
               )}
            </div>
          </div>
      </div>

    </div>
  );
};

const SummaryCard = ({ title, amount, bg, textColor, subtitle, isPrivacyMode }: any) => (
  <div className={`${bg} rounded-3xl p-6 shadow-lg shadow-gray-200/50 flex flex-col justify-center items-start transition-transform hover:scale-[1.02] min-h-[140px]`}>
    <span className={`${textColor} text-opacity-90 text-xs font-bold uppercase tracking-wider mb-1`}>{title}</span>
    <span className={`${textColor} text-3xl font-extrabold tracking-tight ${isPrivacyMode ? 'privacy-hidden' : ''}`}>
        {isPrivacyMode ? '****' : formatCurrency(amount)}
    </span>
    {subtitle && <span className={`${textColor} text-opacity-75 text-[10px] mt-2 font-medium`}>{subtitle}</span>}
  </div>
);

export default Dashboard;