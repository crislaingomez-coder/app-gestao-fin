export enum TransactionType {
  CREDIT_CARD = 'CREDIT_CARD',
  FIXED = 'FIXED'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID'
}

export interface CardInfo {
  id: string;
  name: string;
  bestDay: number;
  dueDay: number;
  color: string;
}

export interface InstallmentInfo {
  current: number;
  total: number;
  groupId: string; // To link related installments
}

export interface PaymentRecord {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number; // The original/expected amount
  paidAmount?: number; // The sum of all payments (cache)
  payments?: PaymentRecord[]; // Detailed history of payments
  date: string; // ISO Date string YYYY-MM-DD
  type: TransactionType;
  category: string;
  status: TransactionStatus;
  cardId?: string; // If CREDIT_CARD
  invoiceMonth?: string; // YYYY-MM format. Calculated for cards.
  installments?: InstallmentInfo;
}

export interface DashboardSummary {
  totalDebt: number;
  totalPending: number;
  totalPaid: number;
}