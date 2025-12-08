// services/supabaseStorage.ts
import { supabase } from "./supabaseClient";
import { Transaction, CardInfo } from "../types";
import { DEFAULT_CARDS, DEFAULT_CATEGORIES } from "../constants";

// -------------------------------
// CARDS
// -------------------------------
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
  await supabase.from("cards").upsert(cards);
}

// -------------------------------
// CATEGORIES
// -------------------------------
export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Erro ao carregar categorias:", error);
    return DEFAULT_CATEGORIES;
  }

  return data?.map((c) => c.name) || DEFAULT_CATEGORIES;
}

export async function saveCategories(categories: string[]) {
  const rows = categories.map((name) => ({ name }));
  await supabase.from("categories").upsert(rows);
}

// -------------------------------
// TRANSACTIONS
// -------------------------------
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
  await supabase.from("transactions").upsert(transactions);
}
