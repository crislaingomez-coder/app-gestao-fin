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
  
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${date.getFullYear()}-${newMonth}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${date.getFullYear()}-${newMonth}`);
  };

  const generalData = useMemo(() => {
    let totalDebt = 0;
    let totalPending = 0;
    let totalPaid = 0;

    const categoryMap = new Map<string, number>();
    const cardMap = new Map<string, number>();

    transactions.forEach(t => {
      const amount = t.amount;
      const paid = t.payments ? t.payments.reduce((s, p) => s + p.amount, 0) : (t.paidAmount || 0);
      
      totalDebt += amount;
      totalPaid += paid;

      const remaining = Math.max(0, amount - paid);
      if (t.status !== TransactionStatus.PAID) totalPending += remaining;

      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + amount);

      if (t.cardId) {
        const name = cards.find(c => c.id === t.cardId)?.name || 'Desconhecido';
        cardMap.set(name, (cardMap.get(name) || 0) + amount);
      }
    });

    const categoryData = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const cardData = Array.from(cardMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const projectionData = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const target = `${y}-${m}`;
      const label = `${MONTH_NAMES[d.getMonth()].slice(0, 3)}/${String(y).slice(2)}`;

      const total = transactions
        .filter(t =>
          t.type === TransactionType.CREDIT_CARD
            ? t.invoiceMonth === target
            : t.date.startsWith(target)
        )
        .reduce((s, t) => s + t.amount, 0);

      projectionData.push({ name: label, value: total, fullDate: target });
    }

    return { totalDebt, totalPending, totalPaid, categoryData, cardData, projectionData };
  }, [transactions, cards]);

  const monthlyData = useMemo(() => {
    const monthTx = transactions.filter(t =>
      t.type === TransactionType.CREDIT_CARD
        ? t.invoiceMonth === selectedMonth
        : t.date.startsWith(selectedMonth)
    );

    let totalDebt = 0;
    let totalPending = 0;
    let totalPaid = 0;

    monthTx.forEach(t => {
      const amount = t.amount;
      const paid = t.payments ? t.payments.reduce((s, p) => s + p.amount, 0) : (t.paidAmount || 0);

      totalDebt += amount;
      totalPaid += paid;

      const remaining = Math.max(0, amount - paid);
      if (t.status !== TransactionStatus.PAID) totalPending += remaining;
    });

    const categoryMap = new Map<string, number>();
    monthTx.forEach(t => {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
    });

    const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name: name.length > 8 ? name.slice(0, 8) + "..." : name,
      fullName: name,
      value
    }));

    const cardMap = new Map<string, number>();
    monthTx.forEach(t => {
      if (t.cardId) {
        const name = cards.find(c => c.id === t.cardId)?.name || "Desconhecido";
        cardMap.set(name, (cardMap.get(name) || 0) + t.amount);
      }
    });

    const cardData = Array.from(cardMap.entries()).map(([name, value]) => ({ name, value }));

    const projectionData = [];
    const [y0, m0] = selectedMonth.split("-").map(Number);

    for (let i = 0; i < 6; i++) {
      const d = new Date(y0, m0 - 1 + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const target = `${y}-${m}`;
      const label = `${MONTH_NAMES[d.getMonth()].slice(0, 3)}/${String(y).slice(2)}`;

      const total = transactions
        .filter(t => {
          const match =
            t.type === TransactionType.CREDIT_CARD
              ? t.invoiceMonth === target
              : t.date.startsWith(target);
          if (!match) return false;

          if (t.type === TransactionType.CREDIT_CARD) return true;
          if (t.type === TransactionType.FIXED && t.installments) return true;

          return false;
        })
        .reduce((s, t) => s + t.amount, 0);

      projectionData.push({ name: label, value: total, fullDate: target });
    }

    return { totalDebt, totalPending, totalPaid, categoryData, cardData, projectionData };
  }, [transactions, selectedMonth, cards]);

  const activeData = viewMode === "general" ? generalData : monthlyData;

  return (
    <div className="space-y-6 pb-6">
      
      {/* MODE TOGGLE */}
      <div className="flex justify-center mb-1">
        <div className="bg-gray-100 p-1 rounded-2xl flex text-xs font-bold shadow-inner">
          <button
            onClick={() => setViewMode("monthly")}
            className={`px-6 py-2.5 rounded-xl transition-all duration-200 ${
              viewMode === "monthly" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
            }`}
          >
            Mensal
          </button>

          <button
            onClick={() => setViewMode("general")}
            className={`px-6 py-2.5 rounded-xl transition-all duration-200 ${
              viewMode === "general" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
            }`}
          >
            Geral
          </button>
        </div>
      </div>

      {/* MONTH PICKER */}
      {viewMode === "monthly" && (
        <div className="flex flex-col items-center gap-4 animate-scale-in">
          <div className="flex items-center justify-between w-full max-w-xs bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            <button onClick={handlePrevMonth} className="p-2 text-gray-400 hover:text-blue-600">
              <ChevronLeft size={24} />
            </button>

            <MonthPicker value={selectedMonth} onChange={onMonthChange} variant="header" />

            <button onClick={handleNextMonth} className="p-2 text-gray-400 hover:text-blue-600">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* GENERAL VIEW HEADER */}
      {viewMode === "general" && (
        <div className="flex flex-col items-center gap-4 animate-scale-in">
          <div className="flex items-center gap-2 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 text-blue-700 shadow-sm">
            <Globe className="w-5 h-5" />
            <span className="font-bold text-lg">Visão Global de Tudo</span>
          </div>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard
          title={viewMode === "general" ? "Total Acumulado" : "Total (Mês)"}
          amount={activeData.totalDebt}
          bg="bg-red-600"
          textColor="text-white"
          subtitle={viewMode === "general" ? "Histórico + Futuro" : "Dívida total do mês"}
          isPrivacyMode={isPrivacyMode}
        />

        <SummaryCard
          title="Pendente"
          amount={activeData.totalPending}
          bg="bg-orange-500"
          textColor="text-white"
          subtitle={viewMode === "general" ? "Total a pagar futuro" : "Restante do mês"}
          isPrivacyMode={isPrivacyMode}
        />

        <SummaryCard
          title="Pago"
          amount={activeData.totalPaid}
          bg="bg-green-600"
          textColor="text-white"
          subtitle={viewMode === "general" ? "Total já pago" : "Pago neste mês"}
          isPrivacyMode={isPrivacyMode}
        />
      </div>

      {/* --- PROJECTION CHART --- */}
      {/* ✔ Linha corrigida aqui */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full min-w-0">

        <h3 className="text-gray-800 font-bold mb-1 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600" />
          {viewMode === "general"
            ? "Projeção de Dívida (12 Meses)"
            : "Projeção (Dívida Cartão + Fixas Parc.)"}
        </h3>

        <p className="text-xs text-gray-400 mb-4 ml-7">
          {viewMode === "general"
            ? "Estimativa de gastos para o próximo ano."
            : "Soma das parcelas futuras agendadas."}
        </p>

        <div style={{ width: "100%", height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={activeData.projectionData} margin={{ top: 0, right: 40 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} width={50} />
              <Tooltip formatter={(v) => [isPrivacyMode ? "****" : formatCurrency(v), "Valor Previsto"]} />

              <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
                {activeData.projectionData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? COLORS.blue : "#93C5FD"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, amount, bg, textColor, subtitle, isPrivacyMode }: any) => (
  <div className={`${bg} rounded-3xl p-5 shadow-lg shadow-gray-200/50 flex flex-col`}>
    <span className={`${textColor} text-opacity-80 text-[10px] font-bold uppercase`}>{title}</span>

    <div className="w-full relative">
      {/* ✔ ÚNICA ALTERAÇÃO DE FONTE PERMITIDA */}
      <span
        className={`${textColor} text-[16px] sm:text-2xl font-black tracking-tight whitespace-nowrap block truncate ${
          isPrivacyMode ? "privacy-hidden" : ""
        }`}
      >
        {isPrivacyMode ? "****" : formatCurrency(amount)}
      </span>
    </div>

    {subtitle && <span className={`${textColor} text-opacity-75 text-[10px] truncate`}>{subtitle}</span>}
  </div>
);

export default Dashboard;
