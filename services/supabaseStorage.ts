import { supabase } from "./supabaseClient";
import { Transaction, CardInfo, PaymentRecord, OpenDebt } from "../types";
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

  return data?.map((c: any) => ({
    id: c.id,
    name: c.name,
    bestDay: c.bestday,
    dueDay: c.dueday,
    color: c.color,
    created_at: c.created_at
  })) ?? [];
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

  const { error } = await supabase
    .from("cards")
    .upsert(rows, { onConflict: "id" });

  if (error) console.error("Erro ao salvar cards:", error);
}

export async function deleteCard(id: string) {
  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", id);

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
// TRANSACTIONS + PAYMENTS JOIN
// ==========================================================
export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(`*, payments:payments(*)`)
    .order("created_at");

  if (error || !data) {
    console.error("Erro ao carregar transações:", error);
    return [];
  }

  return data.map((t: any) => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    date: t.date?.substring(0, 10),
    type: t.type,
    category: t.category,
    status: t.status,

    cardId: t.card_id || undefined,
    invoiceMonth: t.invoice_month || undefined,

    paidAmount: Number(t.paid_amount ?? 0),

    installments:
      t.installment_total && t.installment_current
        ? {
            current: t.installment_current,
            total: t.installment_total,
            groupId: t.installment_group_id,
          }
        : undefined,

    payments:
      t.payments?.map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        date: p.date.substring(0, 10),
      })) ?? [],

    created_at: t.created_at,
    user_id: t.user_id,
  }));
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

    card_id: t.cardId || null,
    invoice_month: t.invoiceMonth || null,

    installment_current: t.installments?.current || null,
    installment_total: t.installments?.total || null,
    installment_group_id: t.installments?.groupId || null,

    paid_amount: t.paidAmount ?? 0,

    user_id: FIXED_USER_ID,
    created_at: t.created_at || new Date().toISOString(),
  }));

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
export async function savePayments(payments: PaymentRecord[]) {
  if (!payments || payments.length === 0) return;

  const rows = payments.map((p) => ({
    id: p.id,
    transaction_id: (p as any).transactionId,
    amount: p.amount,
    date: p.date,
    user_id: FIXED_USER_ID,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("payments")
    .upsert(rows, { onConflict: "id" });

  if (error) console.error("Erro ao salvar pagamentos:", error);
}

export async function deletePayment(id: string) {
  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", id);

  if (error) console.error("Erro ao deletar pagamento:", error);
}



// ==========================================================
// OPEN DEBTS (CORRIGIDO)
// ==========================================================
export async function getOpenDebts(): Promise<OpenDebt[]> {
  const { data, error } = await supabase
    .from("open_debts")
    .select("*")
    .eq("user_id", FIXED_USER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar open_debts:", error);
    return [];
  }

  return (data ?? []).map((r: any) => ({
    id: r.id,
    personName: r.person_name,
    amount: Number(r.amount),
    description: r.description ?? undefined,
    createdAt: r.created_at,
  }));
}

export async function saveOpenDebts(debts: OpenDebt[]) {
  if (!debts || debts.length === 0) return;

  const rows = debts.map((d) => ({
    id: d.id,
    person_name: d.personName,
    amount: d.amount,
    description: d.description ?? null,
    created_at: d.createdAt ?? new Date().toISOString(),
    user_id: FIXED_USER_ID,
  }));

  const { error } = await supabase
    .from("open_debts")
    .upsert(rows, { onConflict: "id" });

  if (error) console.error("Erro ao salvar open_debts:", error);
}

export async function deleteOpenDebt(id: string) {
  const { error } = await supabase
    .from("open_debts")
    .delete()
    .eq("id", id)
    .eq("user_id", FIXED_USER_ID);

  if (error) console.error("Erro ao deletar open_debt:", error);
}
