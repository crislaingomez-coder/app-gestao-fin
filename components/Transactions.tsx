import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, CardInfo, PaymentRecord } from '../types';
import { formatCurrency, getCurrentMonthStr } from '../constants';
import { Plus, Trash2, CreditCard, Check, X, Tag, Pencil, Search, FileText, CheckCircle, ChevronDown, Wallet, DollarSign } from 'lucide-react';
import MonthPicker from './MonthPicker';
import DatePicker from './DatePicker';

// IMPORTAÇÃO AJUSTADA: adicionamos savePayments
import { deleteTransaction, deletePayment, savePayments } from "../services/supabaseStorage";

const generateId = (): string => crypto.randomUUID();

interface TransactionsProps {
  mode: 'expenses' | 'payments';
  transactions: Transaction[];
  cards: CardInfo[];
  categories: string[];
  onAddTransaction: (t: Transaction[]) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransactions: (updates: Transaction[]) => void;
  isPrivacyMode: boolean;
  onRequestConfirm: (message: string, onConfirm: () => void) => void;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  options: { value: string; label: string; color?: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  minimal?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, options, onChange, placeholder = 'Selecione...', icon, minimal = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative group" ref={containerRef}>
      {label && <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between ${minimal ? 'p-2.5 text-sm rounded-xl' : 'p-3.5 rounded-2xl'} bg-white border transition-all duration-200 outline-none text-left shadow-sm
        ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className={`flex items-center gap-2 truncate ${selectedOption ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
            {selectedOption?.color && (
              <span className="w-2 h-2 rounded-full ring-1 ring-gray-100 shadow-sm shrink-0" style={{ backgroundColor: selectedOption.color }}></span>
            )}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={minimal ? 16 : 18} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto animate-scale-in origin-top">
          <div className="p-1.5 space-y-0.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm transition-all duration-150 ${
                  value === option.value 
                    ? 'bg-blue-50 text-blue-700 font-bold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                    {option.color && (
                        <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: option.color }}></span>
                    )}
                    <span>{option.label}</span>
                </div>
                {value === option.value && <Check size={16} className="text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Transactions: React.FC<TransactionsProps> = ({ 
  mode, transactions, cards, categories, onAddTransaction, onDeleteTransaction, onUpdateTransactions, isPrivacyMode, onRequestConfirm
}) => {

  const [filterMonth, setFilterMonth] = useState(getCurrentMonthStr());
  const [searchText, setSearchText] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.CREDIT_CARD);
  const [category, setCategory] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkMonth, setBulkMonth] = useState(getCurrentMonthStr());
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkInputs, setBulkInputs] = useState<{[key: string]: string}>({});

  // ------- EXPENSES -------
  const filteredExpenses = useMemo(() => {
  return transactions
    .filter(t => {
      if (t.type === TransactionType.CREDIT_CARD) {
        return t.invoiceMonth === filterMonth;
      }
      return t.date.startsWith(filterMonth);
    })
    .filter(t =>
      !searchText ||
      t.description.toUpperCase().includes(searchText.toUpperCase())
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}, [transactions, filterMonth, searchText]);
    const groupedExpenses = useMemo(() => {
  const groups: {
    cardId: string;
    cardName: string;
    dueDay: string;
    items: Transaction[];
  }[] = [];

  const map = new Map<string, Transaction[]>();

  filteredExpenses.forEach(t => {
    const key = t.cardId || 'pix';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  });

  map.forEach((items, cardId) => {
    const card = cards.find(c => c.id === cardId);

    const dueDay = card
      ? String(card.dueDay).padStart(2, '0')
      : items[0].date.split('-')[2];

    groups.push({
      cardId,
      cardName: card ? card.name : 'PIX / FIXO',
      dueDay,
      items: items.sort((a, b) => a.date.localeCompare(b.date))
    });
  });

  return groups.sort((a, b) => a.dueDay.localeCompare(b.dueDay));
}, [filteredExpenses, cards]);


  // ------- PAYMENTS -------
const filteredPayments = useMemo(() => {
  const allPayments: any[] = [];

  transactions.forEach(t => {
    const tCard = t.cardId ? cards.find(c => c.id === t.cardId) : null;

    const common = {
      transactionId: t.id,
      description: t.description,
      category: t.category,
      cardName: tCard ? tCard.name : 'PIX',
      cardId: t.cardId,
      color: tCard?.color || '#ccc'
    };

    if (t.payments && t.payments.length > 0) {
      t.payments.forEach(p => {
        if (p.date.startsWith(filterMonth)) {
          allPayments.push({
            ...common,
            id: p.id,
            date: p.date,
            amount: p.amount
          });
        }
      });
    } else if (t.status === TransactionStatus.PAID && t.paidAmount) {
      if (t.date.startsWith(filterMonth)) {
        allPayments.push({
          ...common,
          id: t.id + '_legacy',
          date: t.date,
          amount: t.paidAmount
        });
      }
    }
  });

  return allPayments.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}, [transactions, filterMonth, cards]);


  // ------- BULK PAYMENT CALC -------
  const bulkDebts = useMemo(() => {
      const debtsMap = new Map<string, {
          identifier: string;
          name: string;
          total: number;
          paid: number;
          remaining: number;
          color: string;
          transactions: Transaction[];
      }>();

      const relevantTransactions = transactions.filter(t => {
          if (t.type === TransactionType.CREDIT_CARD) {
              return t.invoiceMonth === bulkMonth;
          } else {
              return t.date.startsWith(bulkMonth);
          }
      });

      relevantTransactions.forEach(t => {
          const actualPaid = t.payments 
            ? t.payments.reduce((sum, p) => sum + p.amount, 0) 
            : (t.paidAmount || 0);
          
          const remaining = t.amount - actualPaid;
          if (remaining <= 0.01) return;

          const identifier = t.cardId || 'pix';
          let name = 'PIX / Contas';
          let color = '#16a34a';

          if (t.cardId) {
              const c = cards.find(card => card.id === t.cardId);
              if (c) {
                  name = c.name;
                  color = c.color;
              }
          }

          const existing = debtsMap.get(identifier);
          if (existing) {
              existing.total += t.amount;
              existing.paid += actualPaid;
              existing.remaining += remaining;
              existing.transactions.push(t);
          } else {
              debtsMap.set(identifier, {
                  identifier,
                  name,
                  total: t.amount,
                  paid: actualPaid,
                  remaining,
                  color,
                  transactions: [t]
              });
          }
      });

      return Array.from(debtsMap.values());
  }, [transactions, bulkMonth, cards]);

  // ------- SAVE / UPDATE -------
  const openForm = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setInstallments('1');
    setDate(new Date().toISOString().split('T')[0]);
    setType(TransactionType.CREDIT_CARD);
    setCategory(categories[0] || 'Outros');
    setSelectedCardId(cards[0]?.id || '');
    setIsFormOpen(true);
  };

  const openEditForm = (t: Transaction) => {
      setEditingId(t.id);
      setDescription(t.description.replace(/\s\(\d+\/\d+\)$/, '')); 
      setAmount(t.amount.toString());
      setInstallments(t.installments ? t.installments.total.toString() : '1');
      setDate(t.date);
      setType(t.type);
      setCategory(t.category);
      setSelectedCardId(t.cardId || '');
      setIsFormOpen(true);
  };

  const calculateInvoiceMonth = (purchaseDateStr: string, cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return purchaseDateStr.substring(0, 7);

    const [y, m, d] = purchaseDateStr.split('-').map(Number);

    let monthsToAdd = 0;

    if (d < card.bestDay) {
        if (card.dueDay >= card.bestDay) {
            monthsToAdd = 0;
        } else {
            monthsToAdd = 1;
        }
    } else {
        if (card.dueDay >= card.bestDay) {
            monthsToAdd = 1;
        } else {
            monthsToAdd = 2;
        }
    }

    const targetDate = new Date(y, m - 1 + monthsToAdd, 1);
    const ty = targetDate.getFullYear();
    const tm = String(targetDate.getMonth() + 1).padStart(2, '0');
    return `${ty}-${tm}`;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;

    const valAmount = parseFloat(amount.replace(',', '.'));
    const valInstallments = parseInt(installments);
    const newTransactions: Transaction[] = [];
    const groupId = generateId();

    if (editingId) {
        const t = transactions.find(tr => tr.id === editingId);
        if (t) {
            const updates: Transaction = {
                ...t,
                description: description.toUpperCase() + (t.installments ? ` (${t.installments.current}/${t.installments.total})` : ''),
                amount: valAmount,
                date,
                type,
                category,
                cardId: type === TransactionType.CREDIT_CARD ? (selectedCardId || undefined) : undefined,
                invoiceMonth: type === TransactionType.CREDIT_CARD ? calculateInvoiceMonth(date, selectedCardId) : undefined
            };
            onUpdateTransactions([updates]);
        }
    } else {

        if (type === TransactionType.CREDIT_CARD && valInstallments > 1) {
            let baseDate = new Date(date + 'T12:00:00');
            for (let i = 1; i <= valInstallments; i++) {
                const iDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i - 1, baseDate.getDate());
                const iDateStr = iDate.toISOString().split('T')[0];
                const iInvoiceMonth = calculateInvoiceMonth(iDateStr, selectedCardId);

                newTransactions.push({
                    id: generateId(),
                    description: `${description.toUpperCase()} (${i}/${valInstallments})`,
                    amount: valAmount / valInstallments,
                    date: iDateStr,
                    type,
                    category,
                    status: TransactionStatus.PENDING,
                    cardId: selectedCardId,
                    invoiceMonth: iInvoiceMonth,
                    installments: { current: i, total: valInstallments, groupId }
                });
            }
        } else {
            newTransactions.push({
                id: generateId(),
                description: description.toUpperCase(),
                amount: valAmount,
                date,
                type,
                category,
                status: type === TransactionType.FIXED ? TransactionStatus.PAID : TransactionStatus.PENDING,
                paidAmount: type === TransactionType.FIXED ? valAmount : 0,
                payments: type === TransactionType.FIXED ? [{ id: generateId(), date, amount: valAmount }] : [],
                cardId: type === TransactionType.CREDIT_CARD ? selectedCardId : undefined,
                invoiceMonth: type === TransactionType.CREDIT_CARD ? calculateInvoiceMonth(date, selectedCardId) : undefined
            });
        }
        onAddTransaction(newTransactions);
    }
    setIsFormOpen(false);
  };

  // ------- REAL PAYMENT SAVE -------
  const handleBulkPayment = async () => {
    const updates: Transaction[] = [];

    for (const debt of bulkDebts) {
      const inputStr = bulkInputs[debt.identifier];
      if (!inputStr) continue;

      let paymentAmount = parseFloat(inputStr.replace(',', '.'));
      if (isNaN(paymentAmount) || paymentAmount <= 0) continue;

      for (const t of debt.transactions) {
        if (paymentAmount <= 0) break;

        const alreadyPaid = t.payments ? t.payments.reduce((s,p)=>s+p.amount,0) : (t.paidAmount || 0);
        const tRemaining = t.amount - alreadyPaid;
        if (tRemaining <= 0) continue;

        const toPay = Math.min(paymentAmount, tRemaining);

        const newPayment: PaymentRecord = {
          id: generateId(),
          transactionId: t.id,
          date: paymentDate,
          amount: toPay
        };

        // ----- AQUI É O SALVAMENTO REAL NO SUPABASE -----
        await savePayments([newPayment]);

        const newTotalPaid = alreadyPaid + toPay;
        const newStatus = Math.abs(t.amount - newTotalPaid) < 0.01 ? TransactionStatus.PAID : TransactionStatus.PENDING;

        updates.push({
          ...t,
          status: newStatus,
          paidAmount: newTotalPaid,
          payments: [...(t.payments || []), newPayment]
        });

        paymentAmount -= toPay;
      }
    }

    onUpdateTransactions(updates);
    setIsBulkOpen(false);
    setBulkInputs({});
  };

  const fillAllBulk = () => {
      const inputs: any = {};
      bulkDebts.forEach(d => {
          inputs[d.identifier] = d.remaining.toFixed(2);
      });
      setBulkInputs(inputs);
  };

  const handleDeletePayment = async (transactionId: string, paymentId: string) => {
    onRequestConfirm("Excluir este registro de pagamento?", async () => {
      
      const t = transactions.find(tr => tr.id === transactionId);
      if (!t) return;

      const updatedPayments = (t.payments || []).filter(p => p.id !== paymentId);

      // -------- REMOVE DO SUPABASE --------
      await deletePayment(paymentId);

      const newPaidAmount = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
      const newStatus =
        Math.abs(t.amount - newPaidAmount) < 0.01
          ? TransactionStatus.PAID
          : TransactionStatus.PENDING;

      const updatedTransaction = {
        ...t,
        payments: updatedPayments,
        paidAmount: newPaidAmount,
        status: newStatus
      };

      onUpdateTransactions([updatedTransaction]);
    });
  };

  return (
    <div className="space-y-4 pb-24">

      {/* HEADER + FILTERS */}
      <div className="flex flex-col gap-3 sticky top-0 bg-background z-10 py-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <MonthPicker value={filterMonth} onChange={setFilterMonth} />
          </div>
      
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none shadow-sm"
          />
        </div>
      </div>

      {/* LISTAGEM */}
      <div className="space-y-3">
       {mode === 'expenses' ? (
  <>
    {groupedExpenses.length === 0 ? (
      <div className="text-center py-10 text-gray-400 text-sm">
        Nenhum lançamento encontrado.
      </div>
    ) : (
      groupedExpenses.map(group => (
        <div key={group.cardId} className="space-y-4">

          {/* CABEÇALHO DO GRUPO */}
          <div className="flex items-center gap-4 px-2">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
              {group.dueDay}
            </div>
            <div className="h-px flex-1 bg-gray-200"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {group.cardName} • VENCIMENTO
            </span>
          </div>

          {/* ITENS */}
          {group.items.map(t => {
            const card = cards.find(c => c.id === t.cardId);
            const paid = t.payments
              ? t.payments.reduce((s, p) => s + p.amount, 0)
              : t.paidAmount || 0;
            const remaining = t.amount - paid;
            const isPartial = paid > 0 && remaining > 0.01;

            return (
              <div
                key={t.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      t.type === TransactionType.CREDIT_CARD
                        ? 'bg-orange-50 text-orange-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {t.type === TransactionType.CREDIT_CARD ? (
                      <CreditCard size={20} />
                    ) : (
                      <FileText size={20} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {t.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                        {t.category}
                      </span>

                      <span className="flex items-center gap-1">
                        {card ? (
                          <>
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: card.color }}
                            ></span>
                            {card.name}
                          </>
                        ) : (
                          'PIX'
                        )}
                      </span>

                      <span>
                        • {t.date.split('-').reverse().slice(0, 2).join('/')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`font-bold text-lg ${
                      isPrivacyMode ? 'privacy-hidden' : ''
                    } ${
                      t.status === TransactionStatus.PAID
                        ? 'text-green-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {isPrivacyMode ? '****' : formatCurrency(t.amount)}
                  </span>

                  {isPartial && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">
                      Rest:{' '}
                      {isPrivacyMode
                        ? '****'
                        : formatCurrency(remaining)}
                    </span>
                  )}

                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(t)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRequestConfirm(
                          'Tem certeza que deseja excluir este gasto?',
                          async () => {
                            try {
                              await deleteTransaction(t.id);
                            } catch {}
                            onDeleteTransaction(t.id);
                          }
                        );
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))
    )}
  </>


        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Nenhum pagamento no período.
          </div>
        ) : (
          filteredPayments.map(p => (
            <div
              key={p.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-50 text-green-600">
                  <Check size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{p.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      {p.cardId ? (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        ></span>
                      ) : (
                        'PIX'
                      )}
                      {p.cardName}
                    </span>
                    <span>• {p.date.split('-').reverse().join('/')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`font-bold text-green-600 ${
                    isPrivacyMode ? 'privacy-hidden' : ''
                  }`}
                >
                  {isPrivacyMode ? '****' : formatCurrency(p.amount)}
                </span>

                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeletePayment(p.transactionId, p.id);
                  }}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD BUTTON */}
      {mode === 'expenses' && (
        <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center z-20 pointer-events-none">
          <button
            onClick={openForm}
            className="w-full max-w-md bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 pointer-events-auto"
          >
            <Plus size={20} />
            Novo Gasto
          </button>
        </div>
      )}

      {mode === 'payments' && (
        <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center z-20 pointer-events-none">
          <button
            onClick={() => {
              setBulkInputs({});
              setIsBulkOpen(true);
            }}
            className="w-full max-w-md bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 pointer-events-auto"
          >
            <DollarSign size={20} />
            Registrar Pagamento
          </button>
        </div>
      )}

      {/* MODAL NOVO/EDIT */}
      {isFormOpen && (
       <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-0 sm:p-4 backdrop-blur-[2px]">
          <div className="bg-white w-full h-full sm:h-auto max-w-md sm:rounded-[2rem] rounded-none p-6 shadow-2xl animate-slide-up sm:animate-scale-in max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar' : 'Novo Gasto'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="bg-gray-50 p-2 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setType(TransactionType.CREDIT_CARD);
                  }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    type === TransactionType.CREDIT_CARD
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  <CreditCard size={16} /> Cartão
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType(TransactionType.FIXED);
                    setSelectedCardId('');
                  }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    type === TransactionType.FIXED
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  <FileText size={16} /> Fixo/Pix
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">
                  Descrição
                </label>
                <input
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3.5 border border-gray-200 rounded-2xl focus:border-blue-500 outline-none bg-white text-gray-900 font-medium uppercase"
                  placeholder={
                    type === TransactionType.FIXED
                      ? 'EX: LUZ, ÁGUA, NET...'
                      : 'EX: MERCADO'
                  }
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">
                    Valor (R$)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl focus:border-blue-500 outline-none bg-white text-gray-900 font-bold"
                    placeholder="0,00"
                  />
                </div>

                {type === TransactionType.CREDIT_CARD && !editingId && (
                  <div className="w-24">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">
                      Parc.
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={installments}
                      onChange={e => setInstallments(e.target.value)}
                      className="w-full p-3.5 border border-gray-200 rounded-2xl focus:border-blue-500 outline-none bg-white text-gray-900 font-bold text-center"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <DatePicker
                    value={date}
                    onChange={setDate}
                    label="Data da Compra"
                  />
                </div>
              </div>

              <div
                className={`grid ${
                  type === TransactionType.CREDIT_CARD
                    ? 'grid-cols-2'
                    : 'grid-cols-1'
                } gap-4`}
              >
                <CustomSelect
                  label="Categoria"
                  value={category}
                  onChange={setCategory}
                  options={categories.map(c => ({
                    value: c,
                    label: c
                  }))}
                  placeholder="Categoria"
                  icon={<Tag size={18} />}
                />

                {type === TransactionType.CREDIT_CARD && (
                  <CustomSelect
                    label="Cartão (Obrigatório)"
                    value={selectedCardId}
                    onChange={setSelectedCardId}
                    options={cards.map(c => ({
                      value: c.id,
                      label: c.name,
                      color: c.color
                    }))}
                    placeholder="Selecione"
                    icon={<CreditCard size={18} />}
                  />
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  {editingId ? 'Salvar Alterações' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAGAMENTO */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center sm:p-4 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Wallet className="text-green-600" /> Registrar Pagamento
              </h3>
              <button
                onClick={() => setIsBulkOpen(false)}
                className="bg-gray-50 p-2 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">
                    Referência
                  </label>
                  <MonthPicker
                    value={bulkMonth}
                    onChange={setBulkMonth}
                  />
                </div>
                <div>
                  <DatePicker
                    value={paymentDate}
                    onChange={setPaymentDate}
                    label="Data Pagamento"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">
                    Faturas / Contas Pendentes
                  </label>
                  <button
                    onClick={fillAllBulk}
                    className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm hover:bg-blue-100 transition-colors"
                  >
                    PREENCHER TUDO
                  </button>
                </div>

                <div className="bg-gray-50 rounded-2xl p-2 space-y-2 max-h-[300px] overflow-y-auto">
                  {bulkDebts.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-xs">
                      Tudo pago para este mês! 🎉
                    </div>
                  ) : (
                    bulkDebts.map(debt => (
                      <div
                        key={debt.identifier}
                        className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1 h-8 rounded-full"
                            style={{ backgroundColor: debt.color }}
                          ></div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">
                              {debt.name}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium">
                              Restante:{' '}
                              <span className="text-red-500">
                                {isPrivacyMode
                                  ? '****'
                                  : formatCurrency(debt.remaining)}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={bulkInputs[debt.identifier] || ''}
                            onChange={e =>
                              setBulkInputs({
                                ...bulkInputs,
                                [debt.identifier]: e.target.value
                              })
                            }
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-2 text-right text-sm font-bold text-gray-900 focus:bg-white focus:border-green-500 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={handleBulkPayment}
                disabled={bulkDebts.length === 0}
                className="w-full p-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-600/30 hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={20} />
                Confirmar Pagamentos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
