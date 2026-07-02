import type { CustomerId, CustomerMood } from "../game/types";

// ─── レシピノートの 1 エントリ ─────────────────────────────

export interface RecipeEntry {
  id: string;
  name: string;
  type: "pizza" | "espresso";
  timestamp: number;
}

// ─── 現在のお客さん状態 ────────────────────────────────────

export interface CustomerState {
  id: CustomerId | null;
  mood: CustomerMood | null;
  arrivalMessage: string | null;
}

// ─── ゲーム全体の状態 ──────────────────────────────────────

export interface GameState {
  /** 作ったピザ・カップの記録 */
  recipeNotes: readonly RecipeEntry[];
  /** 累計ありがとうカード数 */
  cardCount: number;
  /** 現在カウンターにいるお客さん */
  customer: CustomerState;
}

// ─── 初期状態 ──────────────────────────────────────────────

export const initialState: GameState = {
  recipeNotes: [],
  cardCount: 0,
  customer: {
    id: null,
    mood: null,
    arrivalMessage: null,
  },
};
