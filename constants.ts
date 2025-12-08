import { CardInfo } from './types';

export const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Compras',
  'Estudos',
  'Ifood',
  'Lazer',
  'Mercado',
  'Saúde',
  'Serviços',
  'Uber',
  'Outros'
];

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const DEFAULT_CARDS: CardInfo[] = [
  { id: '1', name: 'WILL', bestDay: 22, dueDay: 10, color: '#FFD700' }, // Amarelo Ouro
  { id: '2', name: 'NU', bestDay: 8, dueDay: 10, color: '#820AD1' },   // Roxo Nubank
  { id: '3', name: 'INTER', bestDay: 16, dueDay: 10, color: '#FF7A00' }, // Laranja Inter
  { id: '4', name: 'EMPRESTIMO', bestDay: 8, dueDay: 10, color: '#4B5563' }, // Cinza Chumbo
  { id: '5', name: 'CURSO', bestDay: 12, dueDay: 10, color: '#0EA5E9' }, // Azul Claro
  { id: '6', name: 'RENNER', bestDay: 1, dueDay: 10, color: '#DC2626' }, // Vermelho
  { id: '7', name: 'FACULDADE', bestDay: 5, dueDay: 10, color: '#16A34A' } // Verde
];

export const COLORS = {
  red: '#EF4444',
  orange: '#F59E0B',
  green: '#10B981',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  gray: '#6B7280',
};

// Helper to format currency
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Helper to get current month string YYYY-MM
export const getCurrentMonthStr = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
};