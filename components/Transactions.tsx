import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, CardInfo, PaymentRecord } from '../types';
import { formatCurrency, getCurrentMonthStr } from '../constants';
import { Plus, Trash2, CreditCard, Check, X, Tag, Pencil, Search, FileText, CheckCircle, ChevronDown, Wallet, DollarSign } from 'lucide-react';
import MonthPicker from './MonthPicker';
import DatePicker from './DatePicker';

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
  const [filterCard, setFilterCard] = useState('all');
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
  // --- EXPENSES LIST LOGIC ---
  const filteredExpenses = useMemo(() => {
    return transactions
      .filter((t) => {
        let matchesMonth = false;

        if (t.type === TransactionType.CREDIT_CARD) {
          matchesMonth = t.invoiceMonth === filterMonth;
        } else {
          matchesMonth = t.date.startsWith(filterMonth);
        }

        let matchesCard = filterCard === "all" || t.cardId === filterCard;

        let matchesSearch = t.description
          .toUpperCase()
          .includes(searchText.toUpperCase());

        return matchesMonth && matchesCard && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  }, [transactions, filterMonth, filterCard, searchText]);


  // --- PAYMENTS LIST LOGIC ---
  const filteredPayments = useMemo(() => {
    const allPayments: any[] = [];

    transactions.forEach((t) => {
      const tCard = t.cardId ? cards.find((c) => c.id === t.cardId) : null;

      if (filterCard !== "all" && t.cardId !== filterCard) return;

      const common = {
        transactionId: t.id,
        description: t.description,
        category: t.category,
        cardName: tCard ? tCard.name : "PIX",
        cardId: t.cardId,
        color: tCard?.color || "#ccc",
      };

      if (t.payments && t.payments.length > 0) {
        t.payments.forEach((p) => {
          if (p.date.startsWith(filterMonth)) {
            allPayments.push({
              ...common,
              id: p.id,
              date: p.date,
              amount: p.amount,
            });
          }
        });
      } else if (
        t.status === TransactionStatus.PAID &&
        t.paidAmount &&
        t.date.startsWith(filterMonth)
      ) {
        allPayments.push({
          ...common,
          id: t.id + "_legacy",
          date: t.date,
          amount: t.paidAmount,
        });
      }
    });

    return allPayments.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, cards, filterMonth, filterCard]);


  // --- BULK PAYMENT CALCULATIONS (DLED) ---
  const bulkDebts = useMemo(() => {
    const map = new Map();

    const relevant = transactions.filter((t) => {
      if (t.type === TransactionType.CREDIT_CARD)
        return t.invoiceMonth === bulkMonth;
      return t.date.startsWith(bulkMonth);
    });

    relevant.forEach((t) => {
      const paid =
        t.payments?.reduce((s, p) => s + p.amount, 0) ||
        t.paidAmount ||
        0;

      const remaining = t.amount - paid;
      if (remaining <= 0.01) return;

      const identifier = t.cardId || "pix";
      const card = t.cardId ? cards.find((c) => c.id === t.cardId) : null;

      const entry = map.get(identifier) || {
        identifier,
        name: card ? card.name : "PIX / Contas",
        color: card?.color || "#16a34a",
        total: 0,
        paid: 0,
        remaining: 0,
        transactions: [],
      };

      entry.total += t.amount;
      entry.paid += paid;
      entry.remaining += remaining;
      entry.transactions.push(t);

      map.set(identifier, entry);
    });

    return Array.from(map.values());
  }, [transactions, bulkMonth, cards]);


  // --- FUNCTIONS ---

  const openForm = () => {
    setEditingId(null);
    setDescription("");
    setAmount("");
    setInstallments("1");
    setDate(new Date().toISOString().split("T")[0]);
    setType(TransactionType.CREDIT_CARD);
    setCategory(categories[0] || "");
    setSelectedCardId(cards[0]?.id || "");
    setIsFormOpen(true);
  };

  const openEditForm = (t: Transaction) => {
    setEditingId(t.id);
    setDescription(t.description.replace(/\s\(\d+\/\d+\)$/, ""));
    setAmount(String(t.amount));
    setInstallments(t.installments?.total ? String(t.installments.total) : "1");
    setDate(t.date);
    setType(t.type);
    setCategory(t.category);
    setSelectedCardId(t.cardId || "");
    setIsFormOpen(true);
  };

  const calculateInvoiceMonth = (purchase: string, cardId: string) => {
    const c = cards.find((c) => c.id === cardId);
    if (!c) return purchase.slice(0, 7);

    const [y, m, d] = purchase.split("-").map(Number);
    let add = 0;

    if (d < c.bestDay) {
      add = c.dueDay >= c.bestDay ? 0 : 1;
    } else {
      add = c.dueDay >= c.bestDay ? 1 : 2;
    }

    const target = new Date(y, m - 1 + add, 1);
    return `${target.getFullYear()}-${String(
      target.getMonth() + 1
    ).padStart(2, "0")}`;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const valAmount = parseFloat(amount.replace(",", "."));
    const valInstallments = parseInt(installments);

    if (!description || !amount || !category) return;

    const newList: Transaction[] = [];
    const groupId = generateId();

    if (editingId) {
      const old = transactions.find((t) => t.id === editingId);
      if (!old) return;

      const updated: Transaction = {
        ...old,
        description:
          description.toUpperCase() +
          (old.installments
            ? ` (${old.installments.current}/${old.installments.total})`
            : ""),
        amount: valAmount,
        date,
        type,
        category,
        cardId:
          type === TransactionType.CREDIT_CARD ? selectedCardId : undefined,
        invoiceMonth:
          type === TransactionType.CREDIT_CARD
            ? calculateInvoiceMonth(date, selectedCardId)
            : undefined,
      };

      onUpdateTransactions([updated]);
    } else {
      if (type === TransactionType.CREDIT_CARD && valInstallments > 1) {
        let base = new Date(date + "T12:00:00");

        for (let i = 1; i <= valInstallments; i++) {
          const d = new Date(base.getFullYear(), base.getMonth() + i - 1, base.getDate());
          const dStr = d.toISOString().split("T")[0];
          const invoice = calculateInvoiceMonth(dStr, selectedCardId);

          newList.push({
            id: generateId(),
            description: `${description.toUpperCase()} (${i}/${valInstallments})`,
            amount: valAmount / valInstallments,
            date: dStr,
            type,
            category,
            status: TransactionStatus.PENDING,
            cardId: selectedCardId,
            invoiceMonth: invoice,
            installments: { current: i, total: valInstallments, groupId },
          });
        }
      } else {
        newList.push({
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
              ? [{ id: generateId(), date, amount: valAmount }]
              : [],
          cardId: type === TransactionType.CREDIT_CARD ? selectedCardId : undefined,
          invoiceMonth:
            type === TransactionType.CREDIT_CARD
              ? calculateInvoiceMonth(date, selectedCardId)
              : undefined,
        });
      }

      onAddTransaction(newList);
    }

    setIsFormOpen(false);
  };

  const handleBulkPayment = () => {
    const updates: Transaction[] = [];

    bulkDebts.forEach((debt) => {
      let pay = parseFloat((bulkInputs[debt.identifier] || "").replace(",", "."));
      if (!pay || pay <= 0) return;

      for (const t of debt.transactions) {
        if (pay <= 0) break;

        const already =
          t.payments?.reduce((s, p) => s + p.amount, 0) ||
          t.paidAmount ||
          0;

        const remaining = t.amount - already;
        if (remaining <= 0) continue;

        const toPay = Math.min(pay, remaining);

        const newPayment: PaymentRecord = {
          id: generateId(),
          date: paymentDate,
          amount: toPay,
        };

        const newTotal = already + toPay;
        const newStatus =
          Math.abs(t.amount - newTotal) < 0.01
            ? TransactionStatus.PAID
            : TransactionStatus.PENDING;

        updates.push({
          ...t,
          payments: [...(t.payments || []), newPayment],
          paidAmount: newTotal,
          status: newStatus,
        });

        pay -= toPay;
      }
    });

    onUpdateTransactions(updates);
    setIsBulkOpen(false);
    setBulkInputs({});
  };

  const fillAllBulk = () => {
    const filled: any = {};
    bulkDebts.forEach((d) => {
      filled[d.identifier] = d.remaining.toFixed(2);
    });
    setBulkInputs(filled);
  };

  const handleDeletePayment = (transactionId: string, paymentId: string) => {
    onRequestConfirm(
      "Excluir este pagamento? O valor voltará a ficar pendente.",
      () => {
        const t = transactions.find((x) => x.id === transactionId);
        if (!t) return;

        const updatedPayments = (t.payments || []).filter(
          (p) => p.id !== paymentId
        );

        const totalPaid = updatedPayments.reduce(
          (s, p) => s + p.amount,
          0
        );

        const newStatus =
          Math.abs(t.amount - totalPaid) < 0.01
            ? TransactionStatus.PAID
            : TransactionStatus.PENDING;

        onUpdateTransactions([
          {
            ...t,
            payments: updatedPayments,
            paidAmount: totalPaid,
            status: newStatus,
          },
        ]);
      }
    );
  };
  return (
    <div className="space-y-4 pb-24">

      {/* ================= HEADER ================= */}
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
                { value: "all", label: "Todos" },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none shadow-sm"
          />
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="space-y-3">

        {/* ================= EXPENSES ================= */}
        {mode === "expenses" ? (
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
                <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">

                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        t.type === TransactionType.CREDIT_CARD
                          ? "bg-orange-50 text-orange-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {t.type === TransactionType.CREDIT_CARD ? (
                        <CreditCard size={20} />
                      ) : (
                        <FileText size={20} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{t.description}</p>

                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">

                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                          {t.category}
                        </span>

                        <span className="flex items-center gap-1">
                          {card ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: card.color }}></span>
                              {card.name}
                            </>
                          ) : (
                            "PIX"
                          )}
                        </span>

                        <span>
                          • {t.date.split("-").reverse().slice(0, 2).join("/")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">

                    <span
                      className={`font-bold text-lg ${isPrivacyMode ? "privacy-hidden" : ""} ${t.status === TransactionStatus.PAID ? "text-green-600" : "text-gray-900"}`}
                    >
                      {isPrivacyMode ? "****" : formatCurrency(t.amount)}
                    </span>

                    {isPartial && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">
                        Rest: {isPrivacyMode ? "****" : formatCurrency(remaining)}
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
                            "Tem certeza que deseja excluir este gasto?",
                            () => {
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
            })
          )

        ) : (
          /* ================= PAYMENTS ================= */
          filteredPayments.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Nenhum pagamento no período.
            </div>
          ) : (
            filteredPayments.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">

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
                          "PIX"
                        )}
                        {p.cardName}
                      </span>

                      <span>• {p.date.split("-").reverse().join("/")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">

                  <span
                    className={`font-bold text-green-600 ${isPrivacyMode ? "privacy-hidden" : ""}`}
                  >
                    {isPrivacyMode ? "****" : formatCurrency(p.amount)}
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
          )
        )}

      </div>

      {/* ================= BOTÃO ADD ================= */}
      {mode === "expenses" && (
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

      {/* ================= BOTÃO PAGAMENTO ================= */}
      {mode === "payments" && (
        <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center z-20 pointer-events-none">
          <button
            onClick={() => { setBulkInputs({}); setIsBulkOpen(true); }}
            className="w-full max-w-md bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 pointer-events-auto"
          >
            <DollarSign size={20} />
            Registrar Pagamento
          </button>
        </div>
      )}

      {/* ================= MODAL NOVA TRANSAÇÃO ================= */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-[2px]">

          <div className="bg-white w-full max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? "Editar" : "Novo Gasto"}
              </h3>

              <button
                onClick={() => setIsFormOpen(false)}
                className="bg-gray-50 p-2 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* ================= FORM ================= */}
            <form onSubmit={handleSave} className="space-y-4">

              {/* Tipo */}
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => setType(TransactionType.CREDIT_CARD)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    type === TransactionType.CREDIT_CARD
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <CreditCard size={16} /> Cartão
                </button>

                <button
                  type="button"
                  onClick={() => { setType(TransactionType.FIXED); setSelectedCardId(""); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    type === TransactionType.FIXED
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <FileText size={16} /> Fixo/Pix
                </button>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">
                  Descrição
                </label>

                <input
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3.5 border border-gray-200 rounded-2xl focus:border-blue-500 outline-none bg-white text-gray-900 font-medium uppercase"
                  placeholder={type === TransactionType.FIXED ? "EX: LUZ, ÁGUA, NET..." : "EX: MERCADO"}
                />
              </div>

              {/* Valor */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">
                    Valor (R$)
                  </label>
                  <input
                    required
                    value={amount}
                    type="number"
                    step="0.01"
                    onChange={e => setAmount(e.target.value)}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl focus:border-blue-500 outline-none bg-white text-gray-900 font-medium"
                    placeholder="0,00"
                  />
                </div>

                {type === TransactionType.CREDIT_CARD && !editingId && (
                  <div className="w-24">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">Parc.</label>
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
              </div>

              {/* Data */}
              <DatePicker label="Data da Compra" value={date} onChange={setDate} />

              <div className={`grid ${type === TransactionType.CREDIT_CARD ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <CustomSelect
                  label="Categoria"
                  value={category}
                  onChange={setCategory}
                  options={categories.map(cat => ({ value: cat, label: cat }))}
                  icon={<Tag size={16} />}
                />

                {type === TransactionType.CREDIT_CARD && (
                  <CustomSelect
                    label="Cartão"
                    value={selectedCardId}
                    onChange={setSelectedCardId}
                    options={cards.map(c => ({ value: c.id, label: c.name, color: c.color }))}
                    icon={<CreditCard size={16} />}
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                {editingId ? "Salvar Alterações" : "Adicionar"}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL PAGAMENTO EM LOTE ================= */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-[2px]">

          <div className="bg-white w-full max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Wallet className="text-green-600" /> Registrar Pagamento
              </h3>
              <button onClick={() => setIsBulkOpen(false)} className="bg-gray-50 p-2 rounded-full text-gray-400 hover:bg-gray-100"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">Referência</label>
                  <MonthPicker value={bulkMonth} onChange={setBulkMonth} />
                </div>
                <div>
                  <DatePicker value={paymentDate} onChange={setPaymentDate} label="Data Pagamento" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Faturas / Contas Pendentes</label>
                  <button
                    onClick={fillAllBulk}
                    className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm hover:bg-blue-100 transition-colors"
                  >
                    PREENCHER TUDO
                  </button>
                </div>

                <div className="bg-gray-50 rounded-2xl p-2 space-y-2 max-h-[300px] overflow-y-auto">
                  {bulkDebts.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-xs">Tudo pago para este mês! 🎉</div>
                  ) : (
                    bulkDebts.map(debt => (
                      <div key={debt.identifier} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: debt.color }}></div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{debt.name}</p>
                            <p className="text-[10px] text-gray-500 font-medium">Restante: <span className="text-red-500">{isPrivacyMode ? '****' : formatCurrency(debt.remaining)}</span></p>
                          </div>
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={bulkInputs[debt.identifier] || ''}
                            onChange={e => setBulkInputs(prev => ({ ...prev, [debt.identifier]: e.target.value }))}
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
