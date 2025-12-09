// services/supabaseStorage.ts
import { supabase } from "./supabaseClient";
import { Transaction, CardInfo } from "../types";
import { DEFAULT_CARDS, DEFAULT_CATEGORIES } from "../constants";

const FIXED_USER_ID = "00000000-0000-0000-0000-000000000000";

// ==========================================================
// CARDS
// ==========================================================
export async function getCards(): Promise<CardInfo[]> {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("created_at");

  if (error) return DEFAULT_CARDS;
  return data || [];
}

export async function saveCards(cards: CardInfo[]) {
  if (!cards || cards.length === 0) return;

  const rows = cards.map((c) => ({
    id: c.id,
    name: c.name,
    bestday: c.bestDay,
    dueday: c.dueDay,
    color: c.color,
    user_id: FIXED_USER_ID,
    created_at: c.created_at || new Date().toISOString(),
  }));

  await supabase.from("cards").upsert(rows, { onConflict: "id" });
}

export async function deleteCard(id: string) {
  await supabase.from("cards").delete().eq("id", id);
}

// ==========================================================
// CATEGORIES
// ==========================================================
export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) return DEFAULT_CATEGORIES;
  return data?.map((c) => c.name) ?? DEFAULT_CATEGORIES;
}

export async function saveCategories(categories: string[]) {
  if (!categories || categories.length === 0) return;

  const rows = categories.map((name) => ({
    id: crypto.randomUUID(),
    name,
    user_id: FIXED_USER_ID,
    created_at: new Date().toISOString(),
  }));

  await supabase.from("categories").upsert(rows, { onConflict: "name" });
}

export async function deleteCategory(name: string) {
  await supabase.from("categories").delete().eq("name", name);
}

// ==========================================================
// TRANSACTIONS
// ==========================================================
export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at");

  if (error) return [];
  return data || [];
}

export async function saveTransactions(transactions: Transaction[]) {
  if (!transactions || transactions.length === 0) return;

  const rows = transactions.map((t) => ({
    id: t.id,
    description: t.description,
    amount: t.amount,
    date: t.date,
    type: t.type,
    category: t.category,
    status: t.status,

    // nomes corretos no banco
    card_id: t.cardId ?? null,
    invoice_month: t.invoiceMonth ?? null,

    installment_current: t.installments?.current ?? null,
    installment_total: t.installments?.total ?? null,
    installment_group_id: t.installments?.groupId ?? null,

    paid_amount: t.paidAmount ?? 0,

    user_id: FIXED_USER_ID,
    created_at: t.created_at || new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("transactions")
    .upsert(rows, { onConflict: "id" });

  if (error) console.error("Erro ao salvar transações:", error);
}

// ==========================================================
// PAYMENTS
// ==========================================================
export async function getPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at");

  if (error) return [];
  return data || [];
}

export async function savePayments(payments: any[]) {
  if (!payments || payments.length === 0) return;

  const rows = payments.map((p) => ({
    id: p.id,
    transaction_id: p.transactionId,
    amount: p.amount,
    date: p.date,
    user_id: FIXED_USER_ID,
    created_at: p.created_at || new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("payments")
    .upsert(rows, { onConflict: "id" });

  if (error) console.error("Erro ao salvar pagamentos:", error);
}

export async function deletePayment(id: string) {
  await supabase.from("payments").delete().eq("id", id);
}
