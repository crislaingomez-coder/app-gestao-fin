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
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao carregar cards:", error);
    return DEFAULT_CARDS;
  }

  return data || DEFAULT_CARDS;
}

export async function saveCards(cards: CardInfo[]) {
  if (!cards || cards.length === 0) return;

  const rows = cards.map(c => ({
    ...c,
    user_id: FIXED_USER_ID,
    created_at: c.created_at || new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("cards")
    .upsert(rows, { onConflict: "id" });

  if (error) console.error("Erro ao salvar cards:", error);
}

// ==========================================================
// CATEGORIES
// ==========================================================
export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Erro ao carregar categorias:", error);
    return DEFAULT_CATEGORIES;
  }

  return data?.map((c) => c.name) || DEFAULT_CATEGORIES;
}

export async function saveCategories(categories: string[]) {
  if (!categories || categories.length === 0) return;

  const rows = categories.map((name) => ({
    name,
    user_id: FIXED_USER_ID,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("categories")
    .upsert(rows, { onConflict: "name" });

  if (error) console.error("Erro ao salvar categorias:", error);
}

// ==========================================================
// TRANSACTIONS
// ==========================================================
export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao carregar transações:", error);
    return [];
  }

  return data || [];
}

export async function saveTransactions(transactions: Transaction[]) {
  if (!transactions || transactions.length === 0) return;

  const rows = transactions.map((t) => ({
    ...t,
    user_id: FIXED_USER_ID,
    created_at: t.created_at || new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("transactions")
    .upsert(rows, { onConflict: "id" });

  if (error) console.error("Erro ao salvar transações:", error);
}
