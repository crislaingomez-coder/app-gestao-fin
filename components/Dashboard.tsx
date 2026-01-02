
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList
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

  const calculateStackedData = (dataList: Transaction[]) => {
    const catMap = new Map<string, { paid: number, pending: number, total: number }>();
    const cardMap = new Map<string, { paid: number, pending: number, total: number }>();

    dataList.forEach(t => {
        const total = t.amount;
        const paid = t.payments ? t.payments.reduce((sum, p) => sum + p.amount, 0) : (t.paidAmount || 0);
        const pending = Math.max(0, total - paid);

        const cData = catMap.get(t.category) || { paid: 0, pending: 0, total: 0 };
        cData.paid += paid;
        cData.pending += pending;
        cData.total += total;
        catMap.set(t.category, cData);

        if (t.cardId) {
            const cardName = cards.find(c => c.id === t.cardId)?.name || 'Desconhecido';
            const crData = cardMap.get(cardName) || { paid: 0, pending: 0, total: 0 };
            crData.paid += paid;
            crData.pending += pending;
            crData.total += total;
            cardMap.set(cardName, crData);
        } else if (t.type === TransactionType.FIXED) {
            const crData = cardMap.get('PIX/Outros') || { paid: 0, pending: 0, total: 0 };
            crData.paid += paid;
            crData.pending += pending;
            crData.total += total;
            cardMap.set('PIX/Outros', crData);
        }
    });

    const categoryData = Array.from(catMap.entries()).map(([name, vals]) => ({
        name: name.length > 8 ? name.substring(0,8) + '...' : name,
        fullName: name,
        ...vals
    })).sort((a,b) => b.total - a.total);

    const cardData = Array.from(cardMap.entries()).map(([name, vals]) => ({
        name,
        ...vals
    })).sort((a,b) => b.total - a.total);

    return { categoryData, cardData };
  };

  const calculateProjection = (baseTransactions: Transaction[], startYear: number, startMonth: number, count: number) => {
    const projection = [];
    for (let i = 0; i < count; i++) {
        const d = new Date(startYear, startMonth - 1 + i, 1);
        const yStr = d.getFullYear();
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        const targetMonthStr = `${yStr}-${mStr}`;
        const monthNameShort = MONTH_NAMES[d.getMonth()].substring(0,3);

        let monthTotal = 0;
        let monthPaid = 0;

        baseTransactions.forEach(t => {
            const matches = t.type === TransactionType.CREDIT_CARD ? t.invoiceMonth === targetMonthStr : t.date.startsWith(targetMonthStr);
            if (matches) {
                monthTotal += t.amount;
                const paid = t.payments ? t.payments.reduce((sum, p) => sum + p.amount, 0) : (t.paidAmount || 0);
                monthPaid += paid;
            }
        });

        projection.push({
            name: `${monthNameShort}/${String(yStr).slice(2)}`,
            total: monthTotal,
            paid: monthPaid,
            pending: Math.max(0, monthTotal - monthPaid)
        });
    }
    return projection;
  };

  const generalData = useMemo(() => {
    let totalDebt = 0;
    let totalPending = 0;
    let totalPaid = 0;
    transactions.forEach(t => {
        const amount = t.amount;
        const paid = t.payments ? t.payments.reduce((sum, p) => sum + p.amount, 0) : (t.paidAmount || 0);
        totalDebt += amount;
        totalPaid += paid;
        if (t.status !== TransactionStatus.PAID) totalPending += Math.max(0, amount - paid);
    });
    const stacked = calculateStackedData(transactions);
    const now = new Date();
    const projectionData = calculateProjection(transactions, now.getFullYear(), now.getMonth() + 1, 12);
    return { totalDebt, totalPending, totalPaid, ...stacked, projectionData };
  }, [transactions, cards]);

  const monthlyData = useMemo(() => {
    const monthTransactions = transactions.filter(t => 
      t.type === TransactionType.CREDIT_CARD ? t.invoiceMonth === selectedMonth : t.date.startsWith(selectedMonth)
    );
    let totalDebt = 0;
    let totalPending = 0;
    let totalPaid = 0;
    monthTransactions.forEach(t => {
      const amount = t.amount;
      const paid = t.payments ? t.payments.reduce((sum, p) => sum + p.amount, 0) : (t.paidAmount || 0);
      totalDebt += amount;
      totalPaid += paid;
      if (t.status !== TransactionStatus.PAID) totalPending += Math.max(0, amount - paid);
    });
    const stacked = calculateStackedData(monthTransactions);
    const [sYear, sMonth] = selectedMonth.split('-').map(Number);
    const projectionData = calculateProjection(transactions, sYear, sMonth, 6);
    return { totalDebt, totalPending, totalPaid, ...stacked, projectionData };
  }, [transactions, selectedMonth, cards]);

  const activeData = viewMode === 'general' ? generalData : monthlyData;

  const renderCustomLabel = (val: number) => {
    if (isPrivacyMode) return '****';
    if (val === undefined || val === null || val === 0) return '';
    return formatCurrency(val);
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex justify-center mb-1">
         <div className="bg-gray-100 p-1 rounded-2xl flex text-xs font-bold shadow-inner">
            <button onClick={() => setViewMode('monthly')} className={`px-6 py-2.5 rounded-xl transition-all duration-200 ${viewMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Mensal</button>
            <button onClick={() => setViewMode('general')} className={`px-6 py-2.5 rounded-xl transition-all duration-200 ${viewMode === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Geral</button>
         </div>
      </div>

      {viewMode === 'monthly' && (
        <div className="flex flex-col items-center gap-4 animate-scale-in">
             <div className="flex items-center justify-between w-full max-w-xs bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-colors active:scale-95"><ChevronLeft size={24} /></button>
                <MonthPicker value={selectedMonth} onChange={onMonthChange} variant="header" />
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-colors active:scale-95"><ChevronRight size={24} /></button>
            </div>
        </div>
      )}

      {viewMode === 'general' && (
         <div className="flex flex-col items-center gap-4 animate-scale-in">
            <div className="flex items-center gap-2 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 text-blue-700 shadow-sm">
               <Globe className="w-5 h-5" />
               <span className="font-bold text-lg">Visão Global</span>
           </div>
         </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <SummaryCard title={viewMode === 'general' ? "Total" : "Total Mês"} amount={activeData.totalDebt} bg="bg-red-600" textColor="text-white" subtitle={viewMode === 'general' ? "Geral" : "Dívida"} isPrivacyMode={isPrivacyMode} />
        <SummaryCard title="Pendente" amount={activeData.totalPending} bg="bg-orange-500" textColor="text-white" subtitle="Restante" isPrivacyMode={isPrivacyMode} />
        <SummaryCard title="Pago" amount={activeData.totalPaid} bg="bg-green-600" textColor="text-white" subtitle="Realizado" isPrivacyMode={isPrivacyMode} />
      </div>

      {/* FLUXO MENSAL (HORIZONTAL) */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full min-h-[380px]">
        <h3 className="text-gray-800 font-bold mb-6 flex items-center gap-2 text-sm uppercase">
            <BarChart3 size={18} className="text-blue-600"/>
            Fluxo Mensal
        </h3>
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart layout="vertical" data={activeData.projectionData} margin={{ top: 10, right: 60, left: 0, bottom: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} width={50} tick={{fill: '#6b7280', fontWeight: 600}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} formatter={(value: number, name: string) => [isPrivacyMode ? '****' : formatCurrency(value), name === 'paid' ? 'Já Pago' : 'Pendente']} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                
                <Bar dataKey="paid" stackId="p" fill={COLORS.blue} barSize={24}>
                   <LabelList dataKey="paid" position="insideLeft" offset={8} formatter={renderCustomLabel} fill="#ffffff" fontSize={10} fontWeight="bold" />
                </Bar>
                
                <Bar dataKey="pending" stackId="p" fill="#BFDBFE" barSize={24} radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="total" position="right" formatter={renderCustomLabel} fill="#6b7280" fontSize={10} fontWeight="bold" offset={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
          {/* CATEGORIAS (VERTICAL) */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full min-h-[440px]">
            <h3 className="text-gray-800 font-bold mb-6 text-xs uppercase tracking-widest">Categorias</h3>
            <div className="w-full h-[360px]">
              {activeData.categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={activeData.categoryData} margin={{ top: 60, right: 0, left: -25, bottom: 25 }}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => isPrivacyMode ? '****' : `R$${val}`} tick={{fill: '#9ca3af'}} />
                    <Tooltip formatter={(value: number, name: string) => [isPrivacyMode ? '****' : formatCurrency(value), name === 'paid' ? 'Pago' : 'Pendente']} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    
                    {/* PARTE PAGA NA BASE */}
                    <Bar dataKey="paid" stackId="a" fill={COLORS.blue} barSize={40}>
                        {/* VALOR PAGO NO PÉ DA BARRA (INSIDE BOTTOM) */}
                        <LabelList dataKey="paid" position="insideBottom" angle={-90} offset={20} formatter={renderCustomLabel} fill="#ffffff" fontSize={10} fontWeight="bold" textAnchor="middle" />
                    </Bar>
                    
                    {/* PARTE PENDENTE NO TOPO */}
                    <Bar dataKey="pending" stackId="a" fill="#BFDBFE" radius={[4, 4, 0, 0]} barSize={40}>
                        {/* VALOR TOTAL NO TOPO (TOP) - ÂNGULO VERTICAL PARA NÃO BATER */}
                        <LabelList dataKey="total" position="top" angle={-90} offset={35} formatter={renderCustomLabel} fill="#374151" fontSize={11} fontWeight="black" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados</div>}
            </div>
          </div>

          {/* CARTÕES (VERTICAL) */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full min-h-[440px]">
            <h3 className="text-gray-800 font-bold mb-6 text-xs uppercase tracking-widest">Cartões / Contas</h3>
            <div className="w-full h-[360px]">
               {activeData.cardData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={activeData.cardData} margin={{ top: 60, right: 0, left: -25, bottom: 25 }}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => isPrivacyMode ? '****' : `R$${val}`} tick={{fill: '#9ca3af'}} />
                    <Tooltip formatter={(value: number, name: string) => [isPrivacyMode ? '****' : formatCurrency(value), name === 'paid' ? 'Pago' : 'Pendente']} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    
                    <Bar dataKey="paid" stackId="a" fill={COLORS.green} barSize={40}>
                        <LabelList dataKey="paid" position="insideBottom" angle={-90} offset={20} formatter={renderCustomLabel} fill="#ffffff" fontSize={10} fontWeight="bold" textAnchor="middle" />
                    </Bar>
                    
                    <Bar dataKey="pending" stackId="a" fill={COLORS.red} radius={[4, 4, 0, 0]} barSize={40}>
                        <LabelList dataKey="total" position="top" angle={-90} offset={35} formatter={renderCustomLabel} fill="#374151" fontSize={11} fontWeight="black" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
               ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados</div>}
            </div>
          </div>
      </div>

    </div>
  );
};

const SummaryCard = ({ title, amount, bg, textColor, subtitle, isPrivacyMode }: any) => (
  <div className={`${bg} rounded-3xl p-3 shadow-lg shadow-gray-200/50 flex flex-col justify-center items-start min-h-[90px] w-full overflow-hidden relative`}>
    <span className={`${textColor} text-opacity-90 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate w-full`}>{title}</span>
    <div className="w-full relative z-10">
         <span className={`${textColor} text-lg sm:text-2xl font-bold tracking-tighter leading-tight break-words whitespace-normal ${isPrivacyMode ? 'privacy-hidden' : ''}`}>
            {isPrivacyMode ? '****' : formatCurrency(amount)}
        </span>
    </div>
    {subtitle && <span className={`${textColor} text-opacity-80 text-[9px] font-medium leading-tight mt-0.5 truncate w-full`}>{subtitle}</span>}
  </div>
);

export default Dashboard;
