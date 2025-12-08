import { CardInfo, Transaction } from '../types';
import { DEFAULT_CARDS, DEFAULT_CATEGORIES } from '../constants';

const KEYS = {
  TRANSACTIONS: 'app_transactions',
  CARDS: 'app_cards',
  CATEGORIES: 'app_categories'
};

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
};

export const saveTransactions = (transactions: Transaction[]) => {
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
};

export const getCards = (): CardInfo[] => {
  const data = localStorage.getItem(KEYS.CARDS);
  return data ? JSON.parse(data) : DEFAULT_CARDS;
};

export const saveCards = (cards: CardInfo[]) => {
  localStorage.setItem(KEYS.CARDS, JSON.stringify(cards));
};

export const getCategories = (): string[] => {
  const data = localStorage.getItem(KEYS.CATEGORIES);
  return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
};

export const saveCategories = (categories: string[]) => {
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
};