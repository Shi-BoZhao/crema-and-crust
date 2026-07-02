import type { CustomerId, CustomerMood } from "../game/types";
import type { GameState, RecipeEntry } from "./state";
import { initialState } from "./state";

// ─── アクション型 ──────────────────────────────────────────

export type Action =
  | { type: "RECORD_PIZZA";      payload: { name: string } }
  | { type: "RECORD_ESPRESSO";   payload: { name: string } }
  | { type: "SERVE_CUSTOMER" }
  | {
      type: "CUSTOMER_ARRIVED";
      payload: { id: CustomerId; mood: CustomerMood; message: string };
    }
  | { type: "CUSTOMER_LEFT" }
  | { type: "LOAD_SAVE"; payload: GameState };

// ─── ユーティリティ ────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function addRecipeEntry(
  notes: readonly RecipeEntry[],
  name: string,
  type: "pizza" | "espresso",
): readonly RecipeEntry[] {
  return [
    ...notes,
    { id: generateId(), name, type, timestamp: Date.now() },
  ];
}

// ─── Reducer ───────────────────────────────────────────────

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "RECORD_PIZZA":
      return {
        ...state,
        recipeNotes: addRecipeEntry(state.recipeNotes, action.payload.name, "pizza"),
      };

    case "RECORD_ESPRESSO":
      return {
        ...state,
        recipeNotes: addRecipeEntry(state.recipeNotes, action.payload.name, "espresso"),
      };

    case "SERVE_CUSTOMER":
      return {
        ...state,
        cardCount: state.cardCount + 1,
        customer: { id: null, mood: null, arrivalMessage: null },
      };

    case "CUSTOMER_ARRIVED":
      return {
        ...state,
        customer: {
          id: action.payload.id,
          mood: action.payload.mood,
          arrivalMessage: action.payload.message,
        },
      };

    case "CUSTOMER_LEFT":
      return {
        ...state,
        customer: { id: null, mood: null, arrivalMessage: null },
      };

    case "LOAD_SAVE":
      return action.payload;

    default:
      return state;
  }
}

export { initialState };
