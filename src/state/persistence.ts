import type { GameState } from "./state";
import { initialState } from "./state";

const SAVE_KEY = "crema-and-crust-save";

// ─── 保存 ──────────────────────────────────────────────────

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // ストレージ容量超過などは黙って無視する
  }
}

// ─── 読込 ──────────────────────────────────────────────────

/**
 * localStorage からゲーム状態を読み込む。
 * データが存在しない・壊れている場合は null を返す。
 */
export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidGameState(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 保存データを削除して初期状態にリセットする。
 */
export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

// ─── バリデーション ────────────────────────────────────────

function isValidGameState(data: unknown): data is GameState {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;

  if (!Array.isArray(d["recipeNotes"])) return false;
  if (typeof d["cardCount"] !== "number") return false;
  if (typeof d["customer"] !== "object" || d["customer"] === null) return false;

  return true;
}

export { initialState };
