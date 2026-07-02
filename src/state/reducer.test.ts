import { describe, it, expect } from "vitest";
import { reducer, type Action } from "./reducer";
import { initialState, type GameState } from "./state";

// ─── RECORD_PIZZA ─────────────────────────────────────────

describe("RECORD_PIZZA", () => {
  it("レシピノートにピザが追加される", () => {
    const action: Action = { type: "RECORD_PIZZA", payload: { name: "バジルのピザ" } };
    const next = reducer(initialState, action);
    expect(next.recipeNotes).toHaveLength(1);
    expect(next.recipeNotes[0].name).toBe("バジルのピザ");
    expect(next.recipeNotes[0].type).toBe("pizza");
  });

  it("複数回追加できる", () => {
    let state = initialState;
    state = reducer(state, { type: "RECORD_PIZZA", payload: { name: "ピザ A" } });
    state = reducer(state, { type: "RECORD_PIZZA", payload: { name: "ピザ B" } });
    expect(state.recipeNotes).toHaveLength(2);
  });

  it("カード数は変化しない", () => {
    const next = reducer(initialState, { type: "RECORD_PIZZA", payload: { name: "x" } });
    expect(next.cardCount).toBe(0);
  });
});

// ─── RECORD_ESPRESSO ──────────────────────────────────────

describe("RECORD_ESPRESSO", () => {
  it("レシピノートにエスプレッソが追加される", () => {
    const action: Action = {
      type: "RECORD_ESPRESSO",
      payload: { name: "エチオピアのルンゴ" },
    };
    const next = reducer(initialState, action);
    expect(next.recipeNotes).toHaveLength(1);
    expect(next.recipeNotes[0].type).toBe("espresso");
    expect(next.recipeNotes[0].name).toBe("エチオピアのルンゴ");
  });
});

// ─── SERVE_CUSTOMER ───────────────────────────────────────

describe("SERVE_CUSTOMER", () => {
  it("カードが 1 枚増える", () => {
    const next = reducer(initialState, { type: "SERVE_CUSTOMER" });
    expect(next.cardCount).toBe(1);
  });

  it("複数回提供するとカードが累積する", () => {
    let state = initialState;
    state = reducer(state, { type: "SERVE_CUSTOMER" });
    state = reducer(state, { type: "SERVE_CUSTOMER" });
    state = reducer(state, { type: "SERVE_CUSTOMER" });
    expect(state.cardCount).toBe(3);
  });

  it("お客さん状態がクリアされる", () => {
    const withCustomer: GameState = {
      ...initialState,
      customer: {
        id: "grandma",
        mood: "warm",
        arrivalMessage: "あたたかいものがほしいわ",
      },
    };
    const next = reducer(withCustomer, { type: "SERVE_CUSTOMER" });
    expect(next.customer.id).toBeNull();
    expect(next.customer.mood).toBeNull();
    expect(next.customer.arrivalMessage).toBeNull();
  });
});

// ─── CUSTOMER_ARRIVED ─────────────────────────────────────

describe("CUSTOMER_ARRIVED", () => {
  it("お客さん状態がセットされる", () => {
    const action: Action = {
      type: "CUSTOMER_ARRIVED",
      payload: {
        id: "writer",
        mood: "refreshing",
        message: "さっぱりしたものを…",
      },
    };
    const next = reducer(initialState, action);
    expect(next.customer.id).toBe("writer");
    expect(next.customer.mood).toBe("refreshing");
    expect(next.customer.arrivalMessage).toBe("さっぱりしたものを…");
  });
});

// ─── CUSTOMER_LEFT ────────────────────────────────────────

describe("CUSTOMER_LEFT", () => {
  it("お客さん状態がクリアされる", () => {
    const withCustomer: GameState = {
      ...initialState,
      customer: {
        id: "student",
        mood: "hungry",
        arrivalMessage: "お腹すいた〜",
      },
    };
    const next = reducer(withCustomer, { type: "CUSTOMER_LEFT" });
    expect(next.customer.id).toBeNull();
    expect(next.customer.mood).toBeNull();
  });
});

// ─── LOAD_SAVE ────────────────────────────────────────────

describe("LOAD_SAVE", () => {
  it("渡された状態に完全に置き換わる", () => {
    const saved: GameState = {
      recipeNotes: [
        { id: "abc", name: "ブラジルのエスプレッソ", type: "espresso", timestamp: 1000 },
      ],
      cardCount: 7,
      customer: { id: null, mood: null, arrivalMessage: null },
    };
    const next = reducer(initialState, { type: "LOAD_SAVE", payload: saved });
    expect(next.cardCount).toBe(7);
    expect(next.recipeNotes).toHaveLength(1);
  });
});
