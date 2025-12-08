import { CardInfo, Transaction } from "../types";
import { DEFAULT_CARDS, DEFAULT_CATEGORIES } from "../constants";
import { supabase } from "./supabaseClient";

/* ======================================================
   TRANSAÇÕES
   ====================================================== */

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar transações:", error);
    return [];
  }

  // Conversão snake_case → camelCase
  return data.map((t: any) => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    date: t.date,
    type: t.type,
    category: t.category,
    status: t.status,
    cardId: t.card_id,
    invoiceMonth: t.invoice_month,
    installments: {
      current: t.installment_current,
      total: t.installment_total,
      groupId: t.installment_group_id
    }
  }));
};

export const saveTransactions = async (transactions: Transaction[]) => {
  // Estratégia simples: apagar tudo e inserir novamente
  // (mantém lógica do app sem alterar nada)
  await supabase.from("transactions").delete().neq("id", "0");

  const payload = transactions.map((t) => ({
    id: t.id,
    description: t.description,
    amount: t.amount,
    date: t.date,
    type: t.type,
    category: t.category,
    status: t.status,
    card_id: t.cardId,
    invoice_month: t.invoiceMonth,
    installment_current: t.installments?.current ?? null,
    installment_total: t.installments?.total ?? null,
    installment_group_id: t.installments?.groupId ?? null
  }));

  const { error } = await supabase.from("transactions").insert(payload);

  if (error) console.error("Erro ao salvar transações:", error);
};

/* ======================================================
   CARTÕES
   ====================================================== */

export const getCards = async (): Promise<CardInfo[]> => {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("created_at");

  if (error) {
    console.error("Erro ao buscar cartões:", error);
    return DEFAULT_CARDS; // fallback igual ao original
  }

  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    bestDay: c.best_day,
    dueDay: c.due_day,
    color: c.color
  }));
};

export const saveCards = async (cards: CardInfo[]) => {
  await supabase.from("cards").delete().neq("id", "0");

  const payload = cards.map((c) => ({
    id: c.id,
    name: c.name,
    best_day: c.bestDay,
    due_day: c.dueDay,
    color: c.color
  }));

  const { error } = await supabase.from("cards").insert(payload);

  if (error) console.error("Erro ao salvar cartões:", error);
};

/* ======================================================
   CATEGORIAS
   ====================================================== */

export const getCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Erro ao buscar categorias:", error);
    return DEFAULT_CATEGORIES; // fallback igual ao original
  }

  return data.map((c: any) => c.name);
};

export const saveCategories = async (categories: string[]) => {
  await supabase.from("categories").delete().neq("id", "0");

  const payload = categories.map((name) => ({ name }));

  const { error } = await supabase.from("categories").insert(payload);

  if (error) console.error("Erro ao salvar categorias:", error);
};
