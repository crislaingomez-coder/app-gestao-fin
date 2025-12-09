import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, CardInfo, PaymentRecord } from '../types';
import { formatCurrency, getCurrentMonthStr } from '../constants';
import { Plus, Trash2, CreditCard, Check, X, Tag, Pencil, Search, FileText, CheckCircle, ChevronDown, DollarSign } from 'lucide-react';
import MonthPicker from './MonthPicker';
import DatePicker from './DatePicker';

// DELETE Supabase
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

/* ===========================
     Custom Select
=========================== */

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
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">{label}</label>}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between ${minimal ? 'p-2.5 text-sm rounded-xl' : 'p-3.5 rounded-2xl'} 
        bg-white border ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-200 hover:border-gray-300'} 
        shadow-sm transition-all`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-gray-400">{icon}</span>}
          {selectedOption ? (
            <span className="font-semibold text-gray-900 flex items-center gap-2 truncate">
              {selectedOption.color && <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: selectedOption.color }}></span>}
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-gray-400 truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={minimal ? 16 : 18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-gray-100 rounded-2xl shadow-xl mt-2 max-h-64 overflow-y-auto animate-scale-in">
          <div className="p-1.5 space-y-1">
            {options.map(o => (
              <button
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm 
                ${value === o.value ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <div className="flex items-center gap-3">
                  {o.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: o.color }}></span>}
                  <span>{o.label}</span>
                </div>
                {value === o.value && <Check size={16} className="text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ===========================
      COMPONENTE PRINCIPAL
=========================== */

const Transactions: React.FC<TransactionsProps> = ({
  mode, transactions, cards, categories, onAddTransaction, onDeleteTransaction, onUpdateTransactions, isPrivacyMode, onRequestConfirm
}) => {

  /* ===========================
        Estados
  =========================== */

  const [filterMonth, setFilterMonth] = useState(getCurrentMonthStr());
  const [filterCard, setFilterCard] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [installments, setInstallments] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.CREDIT_CARD);
  const [category, setCategory] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkMonth, setBulkMonth] = useState(getCurrentMonthStr());
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [bulkInputs, setBulkInputs] = useState<{ [key: string]: string }>({});

  /* ===========================
        Filtros de despesas
  =========================== */

  const filteredExpenses = useMemo(() => {
    return transactions
      .filter(t => {
        const monthMatch =
          t.type === TransactionType.CREDIT_CARD
            ? t.invoiceMonth === filterMonth
            : t.date.startsWith(filterMonth);

        const cardMatch = filterCard === "all" || t.cardId === filterCard;
        const searchMatch = !searchText || t.description.toUpperCase().includes(searchText.toUpperCase());

        return monthMatch && cardMatch && searchMatch;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, filterMonth, filterCard, searchText]);

  /* ===========================
        Pagamentos filtrados
  =========================== */

  const filteredPayments = useMemo(() => {
    const result: any[] = [];

    transactions.forEach(t => {
      const card = t.cardId ? cards.find(c => c.id === t.cardId) : null;

      if (filterCard !== "all" && t.cardId !== filterCard) return;

      const common = {
        transactionId: t.id,
        description: t.description,
        category: t.category,
        cardId: t.cardId,
        cardName: card ? card.name : "PIX",
        color: card?.color || "#ccc"
      };

      if (t.payments?.length) {
        t.payments.forEach(p => {
          if (p.date.startsWith(filterMonth)) {
            result.push({ ...common, id: p.id, date: p.date, amount: p.amount });
          }
        });
      } else if (t.status === TransactionStatus.PAID && t.paidAmount) {
        if (t.date.startsWith(filterMonth)) {
          result.push({ ...common, id: t.id + "_legacy", date: t.date, amount: t.paidAmount });
        }
      }
    });

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterMonth, filterCard, cards]);
  /* ===========================
      Agrupamento para pagamento em lote
  =========================== */

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
      if (t.type === TransactionType.CREDIT_CARD) return t.invoiceMonth === bulkMonth;
      return t.date.startsWith(bulkMonth);
    });

    relevant.forEach(t => {
      const paid = t.payments
        ? t.payments.reduce((s, p) => s + p.amount, 0)
        : t.paidAmount || 0;

      const remaining = t.amount - paid;
      if (remaining <= 0.01) return;

      const identifier = t.cardId || "pix";
      let name = "PIX / Contas";
      let color = "#16a34a";

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
        existing.paid += paid;
        existing.remaining += remaining;
        existing.transactions.push(t);
      } else {
        map.set(identifier, {
          identifier,
          name,
          total: t.amount,
          paid,
          remaining,
          color,
          transactions: [t]
        });
      }
    });

    return Array.from(map.values());
  }, [transactions, bulkMonth, cards]);

  /* ===========================
      Abrir Formulário
  =========================== */

  const openForm = () => {
    setEditingId(null);
    setDescription("");
    setAmount("");
    setInstallments("1");
    setDate(new Date().toISOString().split("T")[0]);
    setType(TransactionType.CREDIT_CARD);
    setCategory(categories[0] || "Outros");
    setSelectedCardId(cards[0]?.id || "");
    setIsFormOpen(true);
  };

  /* ===========================
      Editar
  =========================== */

  const openEditForm = (t: Transaction) => {
    setEditingId(t.id);
    setDescription(t.description.replace(/\s\(\d+\/\d+\)$/, ""));
    setAmount(t.amount.toString());
    setInstallments(t.installments ? t.installments.total.toString() : "1");
    setDate(t.date);
    setType(t.type);
    setCategory(t.category);
    setSelectedCardId(t.cardId || "");
    setIsFormOpen(true);
  };

  /* ===========================
      Cálculo da fatura do cartão
  =========================== */

  const calculateInvoiceMonth = (purchaseDateStr: string, cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return purchaseDateStr.substring(0, 7);

    const [y, m, d] = purchaseDateStr.split("-").map(Number);

    let monthsToAdd = 0;

    if (d < card.bestDay) {
      monthsToAdd = card.dueDay >= card.bestDay ? 0 : 1;
    } else {
      monthsToAdd = card.dueDay >= card.bestDay ? 1 : 2;
    }

    const target = new Date(y, m - 1 + monthsToAdd, 1);
    const ty = target.getFullYear();
    const tm = String(target.getMonth() + 1).padStart(2, "0");

    return `${ty}-${tm}`;
  };

  /* ===========================
      Salvar (Novo ou Editar)
  =========================== */

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !category) return;

    const valAmount = parseFloat(amount.replace(",", "."));
    const totalInstallments = parseInt(installments);

    const newTransactions: Transaction[] = [];
    const groupId = generateId();

    // EDITAR
    if (editingId) {
      const t = transactions.find(x => x.id === editingId);
      if (t) {
        const updated: Transaction = {
          ...t,
          description:
            description.toUpperCase() +
            (t.installments
              ? ` (${t.installments.current}/${t.installments.total})`
              : ""),
          amount: valAmount,
          date,
          type,
          category,
          cardId:
            type === TransactionType.CREDIT_CARD ? selectedCardId || undefined : undefined,
          invoiceMonth:
            type === TransactionType.CREDIT_CARD
              ? calculateInvoiceMonth(date, selectedCardId)
              : undefined
        };

        onUpdateTransactions([updated]);
      }
    }

    // NOVO LANÇAMENTO
    else {
      if (type === TransactionType.CREDIT_CARD && totalInstallments > 1) {
        const base = new Date(date + "T12:00:00");

        for (let i = 1; i <= totalInstallments; i++) {
          const instDate = new Date(
            base.getFullYear(),
            base.getMonth() + i - 1,
            base.getDate()
          );

          const instStr = instDate.toISOString().split("T")[0];
          const instInvoiceMonth = calculateInvoiceMonth(instStr, selectedCardId);

          newTransactions.push({
            id: generateId(),
            description: `${description.toUpperCase()} (${i}/${totalInstallments})`,
            amount: valAmount / totalInstallments,
            date: instStr,
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
        // COMPRA ÚNICA
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
              ? [{ id: generateId(), date, amount: valAmount }]
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

  /* ===========================
      Pagamento em lote
  =========================== */

  const handleBulkPayment = () => {
    const updates: Transaction[] = [];

    bulkDebts.forEach(debt => {
      const input = bulkInputs[debt.identifier];
      if (!input) return;

      let paymentAmount = parseFloat(input.replace(",", "."));
      if (!(paymentAmount > 0)) return;

      for (const t of debt.transactions) {
        if (paymentAmount <= 0) break;

        const alreadyPaid = t.payments
          ? t.payments.reduce((s, p) => s + p.amount, 0)
          : t.paidAmount || 0;

        const remaining = t.amount - alreadyPaid;
        if (remaining <= 0) continue;

        const toPay = Math.min(paymentAmount, remaining);

        const payment: PaymentRecord = {
          id: generateId(),
          date: paymentDate,
          amount: toPay
        };

        const newPaid = alreadyPaid + toPay;
        const newStatus =
          Math.abs(t.amount - newPaid) < 0.01
            ? TransactionStatus.PAID
            : TransactionStatus.PENDING;

        updates.push({
          ...t,
          status: newStatus,
          paidAmount: newPaid,
          payments: [...(t.payments || []), payment]
        });

        paymentAmount -= toPay;
      }
    });

    onUpdateTransactions(updates);
    setIsBulkOpen(false);
    setBulkInputs({});
  };

  const fillAllBulk = () => {
    const obj: Record<string, string> = {};
    bulkDebts.forEach(d => {
      obj[d.identifier] = d.remaining.toFixed(2);
    });
    setBulkInputs(obj);
  };

  /* ===========================
      DELETE PAYMENT LOCAL
  =========================== */

  const handleDeletePaymentLocal = (transactionId: string, paymentId: string) => {
    const t = transactions.find(x => x.id === transactionId);
    if (!t) return;

    const newPayments = (t.payments || []).filter(p => p.id !== paymentId);
    const newPaid = newPayments.reduce((s, p) => s + p.amount, 0);

    const newStatus =
      Math.abs(t.amount - newPaid) < 0.01
        ? TransactionStatus.PAID
        : TransactionStatus.PENDING;

    const updated = {
      ...t,
      payments: newPayments,
      paidAmount: newPaid,
      status: newStatus
    };

    onUpdateTransactions([updated]);
  };
  /* ===============================
      RENDER
  =============================== */

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
                      className={`font-bold text-lg ${
                        isPrivacyMode ? "privacy-hidden" : ""
                      } ${
                        t.status === TransactionStatus.PAID
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
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

                      {/* DELETE TRANSACTION - SUPABASE + LOCAL */}
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();

                          onRequestConfirm?.(
                            "Tem certeza que deseja excluir este gasto?",
                            async () => {
                              await deleteTransaction(t.id); // Supabase
                              onDeleteTransaction(t.id); // Local
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

                  {/* DELETE PAYMENT - SUPABASE + LOCAL */}
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();

                      onRequestConfirm?.(
                        "Excluir este pagamento?",
                        async () => {
                          await deletePayment(p.id); // Supabase
                          handleDeletePaymentLocal(p.transactionId, p.id); // Local
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
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">
                  Valor
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

              {/* Categoria */}
              <CustomSelect
                label="Categoria"
                value={category}
                onChange={setCategory}
                options={categories.map(cat => ({ value: cat, label: cat }))}
                icon={<Tag size={16} />}
              />

              {/* Cartão */}
              {type === TransactionType.CREDIT_CARD && (
                <CustomSelect
                  label="Cartão"
                  value={selectedCardId}
                  onChange={setSelectedCardId}
                  options={cards.map(c => ({
                    value: c.id,
                    label: c.name,
                    color: c.color
                  }))}
                  icon={<CreditCard size={16} />}
                />
              )}

              {/* Parcelas */}
              {type === TransactionType.CREDIT_CARD && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">
                    Parcelas
                  </label>

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
              <h3 className="text-xl font-bold text-gray-900">Registrar Pagamentos</h3>
              <button
                onClick={() => setIsBulkOpen(false)}
                className="bg-gray-50 p-2 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mês */}
            <MonthPicker value={bulkMonth} onChange={setBulkMonth} />

            {/* Data */}
            <DatePicker label="Data do Pagamento" value={paymentDate} onChange={setPaymentDate} />

            <div className="mt-4 space-y-3">
              {bulkDebts.map(d => (
                <div key={d.identifier} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                      <p className="font-bold text-gray-800">{d.name}</p>
                    </div>

                    <p className="text-sm font-bold text-gray-500">
                      Restante: {formatCurrency(d.remaining)}
                    </p>
                  </div>

                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={bulkInputs[d.identifier] ?? ""}
                    onChange={e =>
                      setBulkInputs(prev => ({
                        ...prev,
                        [d.identifier]: e.target.value
                      }))
                    }
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                  />

                </div>
              ))}
            </div>

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
