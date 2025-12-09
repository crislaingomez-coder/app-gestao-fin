import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, CardInfo, PaymentRecord } from '../types';
import { formatCurrency, getCurrentMonthStr } from '../constants';
import { Plus, Trash2, CreditCard, Check, X, Tag, Pencil, Search, FileText, CheckCircle, ChevronDown, Wallet, DollarSign } from 'lucide-react';
import MonthPicker from './MonthPicker';
import DatePicker from './DatePicker';

// 🔥 IMPORTS NECESSÁRIOS DO SUPABASE
import { deleteTransaction, deletePayment } from "../services/supabaseStorage";

const generateId = (): string => Math.random().toString(36).substr(2, 9);

interface TransactionsProps {
  mode: 'expenses' | 'payments';
  transactions: Transaction[];
  cards: CardInfo[];
  categories: string[];
  onAddTransaction: (t: Transaction[]) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransactions: (updates: Transaction[]) => void;
  isPrivacyMode: boolean;
  onRequestConfirm?: (message: string, onConfirm: () => void) => void;
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
  const [filterCard, setFilterCard] = useState('all');
  const [searchText, setSearchText] = useState('');

  // FORM STATE
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.CREDIT_CARD);
  const [category, setCategory] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');

  // BULK PAYMENT MODAL
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkMonth, setBulkMonth] = useState(getCurrentMonthStr());
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkInputs, setBulkInputs] = useState<{[key: string]: string}>({});

  // =============================
  // FILTER EXPENSES
  // =============================
  const filteredExpenses = useMemo(() => {
    return transactions
      .filter(t => {
        let matchesMonth = false;

        if (t.type === TransactionType.CREDIT_CARD) {
          matchesMonth = t.invoiceMonth === filterMonth;
        } else {
          matchesMonth = t.date.startsWith(filterMonth);
        }

        let matchesCard = filterCard === 'all' || t.cardId === filterCard;

        let matchesSearch =
          !searchText ||
          t.description.toUpperCase().includes(searchText.toUpperCase());

        return matchesMonth && matchesCard && matchesSearch;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, filterMonth, filterCard, searchText]);

  // =============================
  // FILTER PAYMENTS
  // =============================
  const filteredPayments = useMemo(() => {
    const allPayments: any[] = [];

    transactions.forEach(t => {
      const tCard = t.cardId ? cards.find(c => c.id === t.cardId) : null;

      if (filterCard !== 'all' && t.cardId !== filterCard) return;

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
  }, [transactions, filterMonth, filterCard, cards]);

  // =============================
  // GROUP DEBTS FOR BULK PAYMENT
  // =============================
  const bulkDebts = useMemo(() => {
    const map = new Map<
      string,
      {
        identifier: string;
        name: string;
        total: number;
        paid: number;
        remaining: number;
        color: string;
        transactions: Transaction[];
      }
    >();

    const relevant = transactions.filter(t => {
      if (t.type === TransactionType.CREDIT_CARD) {
        return t.invoiceMonth === bulkMonth;
      }
      return t.date.startsWith(bulkMonth);
    });

    relevant.forEach(t => {
      const alreadyPaid = t.payments
        ? t.payments.reduce((s, p) => s + p.amount, 0)
        : t.paidAmount || 0;

      const remaining = t.amount - alreadyPaid;
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

      const existing = map.get(identifier);

      if (existing) {
        existing.total += t.amount;
        existing.paid += alreadyPaid;
        existing.remaining += remaining;
        existing.transactions.push(t);
      } else {
        map.set(identifier, {
          identifier,
          name,
          total: t.amount,
          paid: alreadyPaid,
          remaining,
          color,
          transactions: [t]
        });
      }
    });

    return Array.from(map.values());
  }, [transactions, bulkMonth, cards]);
  // =============================
  // OPEN NEW TRANSACTION FORM
  // =============================
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

  // =============================
  // OPEN EDIT FORM
  // =============================
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

  // =============================
  // CREDIT CARD INVOICE MONTH
  // =============================
  const calculateInvoiceMonth = (purchaseDateStr: string, cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return purchaseDateStr.substring(0, 7);

    const [y, m, d] = purchaseDateStr.split('-').map(Number);

    let monthsToAdd = 0;

    if (d < card.bestDay) {
      if (card.dueDay >= card.bestDay) monthsToAdd = 0;
      else monthsToAdd = 1;
    } else {
      if (card.dueDay >= card.bestDay) monthsToAdd = 1;
      else monthsToAdd = 2;
    }

    const target = new Date(y, m - 1 + monthsToAdd, 1);
    const ty = target.getFullYear();
    const tm = String(target.getMonth() + 1).padStart(2, '0');

    return `${ty}-${tm}`;
  };

  // =============================
  // SAVE TRANSACTION
  // =============================
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;

    const valAmount = parseFloat(amount.replace(',', '.'));
    const totalInstallments = parseInt(installments);
    const newTransactions: Transaction[] = [];
    const groupId = generateId();

    // EDIT
    if (editingId) {
      const t = transactions.find(tr => tr.id === editingId);
      if (t) {
        const updated: Transaction = {
          ...t,
          description:
            description.toUpperCase() +
            (t.installments
              ? ` (${t.installments.current}/${t.installments.total})`
              : ''),
          amount: valAmount,
          date,
          type,
          category,
          cardId:
            type === TransactionType.CREDIT_CARD
              ? selectedCardId || undefined
              : undefined,
          invoiceMonth:
            type === TransactionType.CREDIT_CARD
              ? calculateInvoiceMonth(date, selectedCardId)
              : undefined
        };

        onUpdateTransactions([updated]);
      }
    } else {
      // NEW
      if (type === TransactionType.CREDIT_CARD && totalInstallments > 1) {
        // INSTALLMENTS
        const base = new Date(date + 'T12:00:00');

        for (let i = 1; i <= totalInstallments; i++) {
          const instDate = new Date(
            base.getFullYear(),
            base.getMonth() + i - 1,
            base.getDate()
          );

          const instDateStr = instDate.toISOString().split('T')[0];
          const instInvoiceMonth = calculateInvoiceMonth(
            instDateStr,
            selectedCardId
          );

          newTransactions.push({
            id: generateId(),
            description: `${description.toUpperCase()} (${i}/${totalInstallments})`,
            amount: valAmount / totalInstallments,
            date: instDateStr,
            type,
            category,
            status: TransactionStatus.PENDING,
            cardId: selectedCardId,
            invoiceMonth: instInvoiceMonth,
            installments: {
              current: i,
              total: totalInstallments,
              groupId
            }
          });
        }
      } else {
        // SINGLE PAYMENT
        newTransactions.push({
          id: generateId(),
          description: description.toUpperCase(),
          amount: valAmount,
          date,
          type,
          category,
          status:
            type === TransactionType.FIXED
              ? TransactionStatus.PAID
              : TransactionStatus.PENDING,
          paidAmount: type === TransactionType.FIXED ? valAmount : 0,
          payments:
            type === TransactionType.FIXED
              ? [
                  {
                    id: generateId(),
                    date,
                    amount: valAmount
                  }
                ]
              : [],
          cardId: type === TransactionType.CREDIT_CARD ? selectedCardId : undefined,
          invoiceMonth:
            type === TransactionType.CREDIT_CARD
              ? calculateInvoiceMonth(date, selectedCardId)
              : undefined
        });
      }

      onAddTransaction(newTransactions);
    }

    setIsFormOpen(false);
  };

  // =============================
  // BULK PAYMENT
  // =============================
  const handleBulkPayment = () => {
    const updates: Transaction[] = [];

    bulkDebts.forEach(debt => {
      const inputStr = bulkInputs[debt.identifier];
      if (!inputStr) return;

      let paymentAmount = parseFloat(inputStr.replace(',', '.'));
      if (isNaN(paymentAmount) || paymentAmount <= 0) return;

      for (const t of debt.transactions) {
        if (paymentAmount <= 0) break;

        const alreadyPaid = t.payments
          ? t.payments.reduce((s, p) => s + p.amount, 0)
          : t.paidAmount || 0;

        const remaining = t.amount - alreadyPaid;
        if (remaining <= 0) continue;

        const toPay = Math.min(paymentAmount, remaining);

        const newPayment: PaymentRecord = {
          id: generateId(),
          date: paymentDate,
          amount: toPay
        };

        const totalPaid = alreadyPaid + toPay;
        const newStatus =
          Math.abs(t.amount - totalPaid) < 0.01
            ? TransactionStatus.PAID
            : TransactionStatus.PENDING;

        updates.push({
          ...t,
          status: newStatus,
          paidAmount: totalPaid,
          payments: [...(t.payments || []), newPayment]
        });

        paymentAmount -= toPay;
      }
    });

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

  // =============================
  // DELETE PAYMENT (LOCAL ONLY)
  // =============================
  const handleDeletePaymentLocal = (transactionId: string, paymentId: string) => {
    const t = transactions.find(x => x.id === transactionId);
    if (!t) return;

    const newPayments = (t.payments || []).filter(p => p.id !== paymentId);
    const newPaidAmount = newPayments.reduce((s, p) => s + p.amount, 0);
    const newStatus =
      Math.abs(t.amount - newPaidAmount) < 0.01
        ? TransactionStatus.PAID
        : TransactionStatus.PENDING;

    const updated = {
      ...t,
      payments: newPayments,
      paidAmount: newPaidAmount,
      status: newStatus
    };

    onUpdateTransactions([updated]);
  };
  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-4 pb-24">

      {/* HEADER */}
      <div className="flex flex-col gap-3 sticky top-0 bg-background z-10 py-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <MonthPicker value={filterMonth} onChange={setFilterMonth} />
          </div>

          <div className="flex-1">
            <CustomSelect
              value={filterCard}
              onChange={setFilterCard}
              options={[
                { value: 'all', label: 'Todos' },
                ...cards.map(c => ({
                  value: c.id,
                  label: c.name,
                  color: c.color
                }))
              ]}
              minimal
              icon={<CreditCard size={16} />}
              placeholder="Cartão"
            />
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

      {/* CONTENT */}
      <div className="space-y-3">
        {mode === 'expenses' ? (
          filteredExpenses.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Nenhum lançamento encontrado.
            </div>
          ) : (
            filteredExpenses.map(t => {
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
                        Rest: {isPrivacyMode ? '****' : formatCurrency(remaining)}
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

                      {/* DELETE EXPENSE: SUPABASE + LOCAL */}
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();

                          onRequestConfirm?.(
                            'Tem certeza que deseja excluir este gasto?',
                            async () => {
                              await deleteTransaction(t.id); // SUPABASE
                              onDeleteTransaction(t.id); // LOCAL
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
            })
          )
        ) : (
          /* PAYMENTS MODE */
          filteredPayments.length === 0 ? (
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

                  {/* DELETE PAYMENT — SUPABASE + LOCAL */}
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();

                      onRequestConfirm?.(
                        'Excluir este pagamento?',
                        async () => {
                          await deletePayment(p.id); // SUPABASE
                          handleDeletePaymentLocal(p.transactionId, p.id); // LOCAL
                        }
                      );
                    }}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">Valor</label>
                          <input 
                              required 
                              value={amount} 
                              onChange={e => setAmount(e.target.value)} 
                              type="number"
                              step="0.01"
                              className="w-full p-3.5 border border-gray-200 rounded-2xl focus:border-blue-500 outline-none bg-white text-gray-900 font-medium"
                              placeholder="0,00"
                          />
                      </div>

                      {/* Categoria */}
                      <CustomSelect
                          label="Categoria"
                          value={category}
                          onChange={setCategory}
                          options={categories.map(cat => ({ value: cat, label: cat }))}
                          icon={<Tag size={16} />}
                      />

                      {/* Cartão (somente para compras no cartão) */}
                      {type === TransactionType.CREDIT_CARD && (
                        <CustomSelect
                            label="Cartão"
                            value={selectedCardId}
                            onChange={setSelectedCardId}
                            options={cards.map(c => ({ value: c.id, label: c.name, color: c.color }))}
                            icon={<CreditCard size={16}/>}
                        />
                      )}

                      {/* Parcelas */}
                      {type === TransactionType.CREDIT_CARD && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">Parcelas</label>
                            <input 
                                type="number"
                                min="1"
                                max="48"
                                value={installments}
                                onChange={e => setInstallments(e.target.value)}
                                className="w-full p-3.5 border border-gray-200 rounded-2xl focus:border-blue-500 outline-none bg-white text-gray-900 text-center font-bold"
                            />
                        </div>
                      )}

                      {/* Data */}
                      <DatePicker label="Data da Compra" value={date} onChange={setDate} />

                      <button
                          type="submit"
                          className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                          <CheckCircle size={20}/>
                          {editingId ? 'Salvar Alterações' : 'Adicionar'}
                      </button>

                  </form>
              </div>
          </div>
      )}
      {/* BULK PAYMENT MODAL */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Registrar Pagamentos</h3>
              <button onClick={() => setIsBulkOpen(false)} className="bg-gray-50 p-2 rounded-full text-gray-400 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {/* Mês */}
            <MonthPicker value={bulkMonth} onChange={setBulkMonth} />

            {/* Data do Pagamento */}
            <DatePicker label="Data do Pagamento" value={paymentDate} onChange={setPaymentDate} />

            {/* Itens */}
            <div className="mt-4 space-y-3">
              {bulkDebts.map((d) => (
                <div key={d.identifier} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                      <p className="font-bold text-gray-800">{d.name}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-500">Restante: {formatCurrency(d.remaining)}</p>
                  </div>

                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={bulkInputs[d.identifier] ?? ''}
                    onChange={(e) =>
                      setBulkInputs((prev) => ({ ...prev, [d.identifier]: e.target.value }))
                    }
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={fillAllBulk}
                className="w-full p-4 bg-gray-200 text-gray-800 rounded-2xl font-bold hover:bg-gray-300 active:scale-[0.98]"
              >
                Preencher com valores restantes
              </button>

              <button
                onClick={handleBulkPayment}
                className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98]"
              >
                Registrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Transactions;
