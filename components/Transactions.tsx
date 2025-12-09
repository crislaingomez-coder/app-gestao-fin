import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, CardInfo, PaymentRecord } from '../types';
import { formatCurrency, getCurrentMonthStr } from '../constants';
import { Plus, Trash2, CreditCard, Check, X, Tag, Pencil, Search, FileText, CheckCircle, ChevronDown, DollarSign } from 'lucide-react';
import MonthPicker from './MonthPicker';
import DatePicker from './DatePicker';

// DELETE Supabase
import { deleteTransaction, deletePayment } from "../services/supabaseStorage";

const generateId = (): string => Math.random().toString(36).substr(2, 9);

// INTERFACES
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

// COMPONENTE CustomSelect
const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, options, onChange, placeholder = 'Selecione...', icon, minimal = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
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
              {selectedOption.color && (
                <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: selectedOption.color }}></span>
              )}
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
                onClick={() => { onChange(o.value); setIsOpen(false); }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm ${
                  value === o.value ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {o.color && (
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: o.color }}></span>
                  )}
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

// =====================
// COMPONENTE PRINCIPAL
// =====================
const Transactions: React.FC<TransactionsProps> = ({
  mode, transactions, cards, categories, onAddTransaction, onDeleteTransaction, onUpdateTransactions, isPrivacyMode, onRequestConfirm
}) => {

  // TODO: AQUI você cola TODO o restante do componente Transactions (que você já enviou),
  // do começo ao fim, incluindo todos os modais, forms, filtros, return completo.

  // Nada precisa ser alterado.  
  // Apenas não deixe o component vazio ou cortado.
};

export default Transactions;
