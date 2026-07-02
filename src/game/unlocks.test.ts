import { describe, it, expect } from "vitest";
import { getUnlockedIds, getNewlyUnlocked } from "./unlocks";

// ─── getUnlockedIds ───────────────────────────────────────

describe("getUnlockedIds", () => {
  it("カード 0 枚 → 何も解放されない", () => {
    expect(getUnlockedIds(0)).toHaveLength(0);
  });

  it("カード 1 枚 → まだ解放なし", () => {
    expect(getUnlockedIds(1)).toHaveLength(0);
  });

  it("カード 2 枚 → brazil が解放される", () => {
    const ids = getUnlockedIds(2);
    expect(ids).toContain("brazil");
    expect(ids).toHaveLength(1);
  });

  it("カード 4 枚 → brazil + prosciutto", () => {
    const ids = getUnlockedIds(4);
    expect(ids).toContain("brazil");
    expect(ids).toContain("prosciutto");
    expect(ids).toHaveLength(2);
  });

  it("カード 6 枚 → cappuccino も追加", () => {
    const ids = getUnlockedIds(6);
    expect(ids).toContain("cappuccino");
    expect(ids).toHaveLength(3);
  });

  it("カード 9 枚 → ethiopia も追加", () => {
    const ids = getUnlockedIds(9);
    expect(ids).toContain("ethiopia");
    expect(ids).toHaveLength(4);
  });

  it("カード 12 枚 → gorgonzola + honey も追加 (計 6)", () => {
    const ids = getUnlockedIds(12);
    expect(ids).toContain("gorgonzola");
    expect(ids).toContain("honey");
    expect(ids).toHaveLength(6);
  });

  it("カード 15 枚 → dark-roast + anchovy も追加 (計 8)", () => {
    const ids = getUnlockedIds(15);
    expect(ids).toContain("dark-roast");
    expect(ids).toContain("anchovy");
    expect(ids).toHaveLength(8);
  });

  it("カード 100 枚 → 全部解放 (15 枚と同じ結果)", () => {
    expect(getUnlockedIds(100)).toHaveLength(8);
  });
});

// ─── getNewlyUnlocked ─────────────────────────────────────

describe("getNewlyUnlocked", () => {
  it("0 → 2 で brazil だけ新規解放", () => {
    const diff = getNewlyUnlocked(0, 2);
    expect(diff).toEqual(["brazil"]);
  });

  it("2 → 4 で prosciutto だけ新規解放", () => {
    const diff = getNewlyUnlocked(2, 4);
    expect(diff).toEqual(["prosciutto"]);
  });

  it("12 → 15 で dark-roast + anchovy が新規解放", () => {
    const diff = getNewlyUnlocked(12, 15);
    expect(diff).toContain("dark-roast");
    expect(diff).toContain("anchovy");
    expect(diff).toHaveLength(2);
  });

  it("増加がない場合 → 空配列", () => {
    expect(getNewlyUnlocked(5, 5)).toHaveLength(0);
  });

  it("閾値をまたぎ飛ばした場合も差分を返す", () => {
    const diff = getNewlyUnlocked(0, 15);
    expect(diff).toHaveLength(8);
  });

  it("全解放済みからさらにカードが増えても空配列", () => {
    expect(getNewlyUnlocked(15, 20)).toHaveLength(0);
  });
});
