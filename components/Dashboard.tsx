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
  selectedMonth: string;
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
      if (t.status !== TransactionStatus.PAID) totalPending += remaining;

      categoryDataMap.set(t.category, (categoryDataMap.get(t.category) || 0) + amount);

      if (t.cardId) {
        const cardName = cards.find(c => c.id === t.cardId)?.name || 'Desconhecido';
        cardDataMap.set(cardName, (cardDataMap.get(cardName) || 0) + amount);
      }
    });

    const categoryData = Array.from(categoryDataMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const cardData = Array.from(cardDataMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const projectionData = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (let i = 0; i < 12; i++) {
      const d = new Date(currentYear, currentMonth + i, 1);
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const targetMonthStr = `${yStr}-${mStr}`;
      const monthNameShort = MONTH_NAMES[d.getMonth()].substring(0, 3);

      const totalScheduled = transactions
        .filter(t =>
          t.type === TransactionType.CREDIT_CARD
            ? t.invoiceMonth === targetMonthStr
            : t.date.startsWith(targetMonthStr)
        )
        .reduce((sum, t) => sum + t.amount, 0);

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
    const monthTransactions = transactions.filter(t =>
      t.type === TransactionType.CREDIT_CARD
        ? t.invoiceMonth === selectedMonth
        : t.date.startsWith(selectedMonth)
    );

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
      if (t.status !== TransactionStatus.PAID) totalPending += remaining;
    });

    const categoryDataMap = new Map<string, number>();
    monthTransactions.forEach(t => {
      categoryDataMap.set(t.category, (categoryDataMap.get(t.category) || 0) + t.amount);
    });

    const categoryData = Array.from(categoryDataMap.entries()).map(([name, value]) => ({
      name: name.length > 8 ? name.substring(0, 8) + '...' : name,
      fullName: name,
      value
    })).sort((a, b) => b.value - a.value);

    const cardDataMap = new Map<string, number>();
    monthTransactions.forEach(t => {
      if (t.cardId) {
        const cardName = cards.find(c => c.id === t.cardId)?.name || 'Desconhecido';
        cardDataMap.set(cardName, (cardDataMap.get(cardName) || 0) + t.amount);
      }
    });

    const cardData = Array.from(cardDataMap.entries()).map(([name, value]) => ({
      name, value
    })).sort((a, b) => b.value - a.value);

    const projectionData = [];
    const [startYear, startMonth] = selectedMonth.split('-').map(Number);

    for (let i = 0; i < 6; i++) {
      const d = new Date(startYear, startMonth - 1 + i, 1);
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const targetMonthStr = `${yStr}-${mStr}`;
      const monthNameShort = MONTH_NAMES[d.getMonth()].substring(0, 3);

      const totalScheduled = transactions
        .filter(t => {
          const matchesMonth =
            t.type === TransactionType.CREDIT_CARD
              ? t.invoiceMonth === targetMonthStr
              : t.date.startsWith(targetMonthStr);

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

      {/* PROJECTION CHART (HORIZONTAL) */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full min-w-0">
        <h3 className="text-gray-800 font-bold mb-1 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600"/>
          {viewMode === 'general' ? 'Projeção (12 Meses)' : 'Projeção (6 Meses)'}
        </h3>

        <div style={{ width: '100%', height: 300, position: 'relative', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={activeData.projectionData}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} width={50} />
              <Tooltip formatter={(v: number) => [isPrivacyMode ? '****' : formatCurrency(v), 'Valor']} />

              <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
                <LabelList
                  dataKey="value"
                  position="insideRight"
                  formatter={(v: number) => isPrivacyMode ? '****' : formatCurrency(v)}
                  fill="#ffffff"
                  fontSize={11}
                />
                {activeData.projectionData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.blue : '#93C5FD'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CATEGORY (VERTICAL) */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={activeData.categoryData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(v: number) => [isPrivacyMode ? '****' : formatCurrency(v), 'Valor']} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="value"
                position="insideTop"
                formatter={(v: number) => isPrivacyMode ? '****' : formatCurrency(v)}
                fill="#ffffff"
                fontSize={10}
              />
              {activeData.categoryData.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS.blue} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* CARD (VERTICAL) */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={activeData.cardData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(v: number) => [isPrivacyMode ? '****' : formatCurrency(v), 'Valor']} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="value"
                position="insideTop"
                formatter={(v: number) => isPrivacyMode ? '****' : formatCurrency(v)}
                fill="#ffffff"
                fontSize={10}
              />
              {activeData.cardData.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default Dashboard;
