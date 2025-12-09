// services/supabaseStorage.ts
import { supabase } from "./supabaseClient";
import { Transaction, CardInfo } from "../types";
import { DEFAULT_CARDS, DEFAULT_CATEGORIES } from "../constants";

const FIXED_USER_ID = "00000000-0000-0000-0000-000000000000";

// ==========================================================
// FUNÇÃO: Inserir DEFAULT_CARDS automaticamente no Supabase
// ==========================================================
async function seedDefaultCardsIfEmpty() {
  const { data, error } = await supabase
    .from("cards")
    .select("*");

  if (error) {
    console.error("Erro ao verificar cards:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("Banco vazio → populando DEFAULT_CARDS…");

    const rows = DEFAULT_CARDS.map(c => ({
      id: c.id,
      name: c.name,
      bestday: c.bestDay,
      dueday: c.dueDay,
      color: c.color,
      user_id: FIXED_USER_ID,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("cards")
      .upsert(rows, { onConflict: "id" });

    if (insertError) console.error("Erro ao inserir DEFAULT_CARDS:", insertError);
  }
}

// ==========================================================
// GET CARDS (carrega + popula banco se estiver vazio)
// ==========================================================
export async function getCards(): Promise<CardInfo[]> {
  // Garante que DEFAULT_CARDS serão inseridos se a tabela estiver vazia
  await seedDefaultCardsIfEmpty();

  // Agora carrega os cartões normalmente
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("created_at");

  if (error) {
    console.error("Erro ao carregar os cards:", error);
    return DEFAULT_CARDS;
  }

  // Converte campos do banco → CardInfo
  return data.map(c => ({
    id: c.id,
    name: c.name,
    bestDay: c.bestday,
    dueDay: c.dueday,
    color: c.color,
  }));
}

// ==========================================================
// SAVE / UPDATE CARDS
// ==========================================================
export async function saveCards(cards: CardInfo[]) {
  if (!cards || cards.length === 0) return;

  const rows = cards.map(c => ({
    id: c.id,
    name: c.name,
    bestday: c.bestDay,
    dueday: c.dueDay,
    color: c.color,
    user_id: FIXED_USER_ID,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("cards")
    .upsert(rows, { onConflict: "id" });

  if (error) console.error("Erro ao salvar cards:", error);
}

// ==========================================================
// DELETE CARD
// ==========================================================
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

  if (!data || data.length === 0) return DEFAULT_CATEGORIES;

  return data.map(c => c.name);
}

export async function saveCategories(categories: string[]) {
  if (!categories || categories.length === 0) return;

  const rows = categories.map(name => ({
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
export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at");

  if (error) {
    console.error("Erro ao carregar transações:", error);
    return [];
  }

  return data || [];
}

export async function saveTransactions(transactions: Transaction[]) {
  if (!transactions || transactions.length === 0) return;

  const rows = transactions.map(t => ({
    ...t,
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
