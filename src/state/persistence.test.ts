import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveState, loadState, clearSave } from "./persistence";
import { initialState } from "./state";
import type { GameState } from "./state";

// ─── localStorage モック ──────────────────────────────────

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem:    (key: string) => store[key] ?? null,
    setItem:    (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear:      () => { store = {}; },
  };
}

// ─── テスト ───────────────────────────────────────────────

describe("persistence", () => {
  beforeEach(() => {
    const mock = createLocalStorageMock();
    vi.stubGlobal("localStorage", mock);
  });

  it("saveState → loadState で同じ状態が返る", () => {
    const state: GameState = {
      ...initialState,
      cardCount: 5,
      recipeNotes: [
        { id: "x1", name: "バジルのピザ", type: "pizza", timestamp: 12345 },
      ],
    };
    saveState(state);
    const loaded = loadState();
    expect(loaded).not.toBeNull();
    expect(loaded?.cardCount).toBe(5);
    expect(loaded?.recipeNotes).toHaveLength(1);
  });

  it("保存データがない場合は null を返す", () => {
    expect(loadState()).toBeNull();
  });

  it("壊れた JSON は null にフォールバックする", () => {
    localStorage.setItem("crema-and-crust-save", "{ this is not json }");
    expect(loadState()).toBeNull();
  });

  it("cardCount が欠けているデータは null にフォールバックする", () => {
    localStorage.setItem(
      "crema-and-crust-save",
      JSON.stringify({ recipeNotes: [], customer: {} }),
    );
    expect(loadState()).toBeNull();
  });

  it("recipeNotes が配列でないデータは null にフォールバックする", () => {
    localStorage.setItem(
      "crema-and-crust-save",
      JSON.stringify({ recipeNotes: "broken", cardCount: 0, customer: {} }),
    );
    expect(loadState()).toBeNull();
  });

  it("null 値が保存されていた場合は null にフォールバックする", () => {
    localStorage.setItem("crema-and-crust-save", "null");
    expect(loadState()).toBeNull();
  });

  it("clearSave でデータが削除される", () => {
    saveState({ ...initialState, cardCount: 3 });
    clearSave();
    expect(loadState()).toBeNull();
  });
});
