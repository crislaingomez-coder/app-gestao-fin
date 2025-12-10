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

  if (error) {
    console.error("Erro ao carregar cards:", error);
    return DEFAULT_CARDS;
  }

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

  const { error } = await supabase.from("cards").upsert(rows, {
    onConflict: "id",
  });

  if (error) console.error("Erro ao salvar cards:", error);
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from("cards").delete().eq("id", id);

  if (error) console.error("Erro ao deletar cartão:", error);
}

// ==========================================================
// CATEGORIES
// ==========================================================
export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Erro ao carregar categorias:", error);
    return DEFAULT_CATEGORIES;
  }

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

  const { error } = await supabase
    .from("categories")
    .upsert(rows, { onConflict: "name" });

  if (error) console.error("Erro ao salvar categorias:", error);
}

export async function deleteCategory(name: string) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("name", name);

  if (error) console.error("Erro ao deletar categoria:", error);
}

// ==========================================================
// TRANSACTIONS
// ==========================================================

// 🔥🔥🔥 AQUI ESTÁ A CORREÇÃO QUE FAZ AS TRANSAÇÕES APARECEREM NO APP 🔥🔥🔥
export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at");

  if (error) {
    console.error("Erro ao carregar transações:", error);
    return [];
  }

  // CONVERTE snake_case → camelCase (ESSA PARTE É O QUE RESOLVE)
  const converted = (data || []).map((t: any) => ({
    ...t,
    cardId: t.card_id,
    invoiceMonth: t.invoice_month,
    installments: t.installment_total
      ? {
          current: t.installment_current,
          total: t.installment_total,
          groupId: t.installment_group_id,
        }
      : undefined,
    paidAmount: t.paid_amount,
  }));

  return converted;
}

// SALVAR (sem alterar tua lógica)
export async function saveTransactions(transactions: Transaction[]) {
  if (!transactions || transactions.length === 0) return;

  const rows = transactions.map((t) => {
    const { payments, installments, cardId, invoiceMonth, ...rest } = t;

    return {
      ...rest,
      card_id: cardId || null,
      invoice_month: invoiceMonth || null,
      installment_current: installments?.current || null,
      installment_total: installments?.total || null,
      installment_group_id: installments?.groupId || null,
      paid_amount: t.paidAmount || 0,
      user_id: FIXED_USER_ID,
      created_at: t.created_at || new Date().toISOString(),
    };
  });

  console.log("ROWS ENVIADOS PARA O SUPABASE:", JSON.stringify(rows, null, 2));

  const { error } = await supabase
    .from("transactions")
    .upsert(rows, { onConflict: "id" });

  if (error) console.error("Erro ao salvar transações:", error);
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) console.error("Erro ao deletar transação:", error);
}

// ==========================================================
// PAYMENTS
// ==========================================================
export async function getPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at");

  if (error) {
    console.error("Erro ao carregar pagamentos:", error);
    return [];
  }

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
  const { error } = await supabase.from("payments").delete().eq("id", id);

  if (error) console.error("Erro ao deletar pagamento:", error);
}
