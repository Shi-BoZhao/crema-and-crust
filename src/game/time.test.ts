import { describe, it, expect } from "vitest";
import { getTimeOfDay } from "./time";

function makeDate(hour: number): Date {
  const d = new Date(2024, 0, 1); // 日付は固定
  d.setHours(hour, 0, 0, 0);
  return d;
}

describe("getTimeOfDay", () => {
  // ─── 朝 (morning): 5 時以上 10 時未満 ─────────────────
  it("5 時 → morning (境界値)", () => {
    expect(getTimeOfDay(makeDate(5))).toBe("morning");
  });
  it("7 時 → morning", () => {
    expect(getTimeOfDay(makeDate(7))).toBe("morning");
  });
  it("9 時 → morning (境界値)", () => {
    expect(getTimeOfDay(makeDate(9))).toBe("morning");
  });

  // ─── 昼 (day): 10 時以上 16 時未満 ───────────────────
  it("10 時 → day (境界値)", () => {
    expect(getTimeOfDay(makeDate(10))).toBe("day");
  });
  it("13 時 → day", () => {
    expect(getTimeOfDay(makeDate(13))).toBe("day");
  });
  it("15 時 → day (境界値)", () => {
    expect(getTimeOfDay(makeDate(15))).toBe("day");
  });

  // ─── 夕方 (evening): 16 時以上 19 時未満 ─────────────
  it("16 時 → evening (境界値)", () => {
    expect(getTimeOfDay(makeDate(16))).toBe("evening");
  });
  it("17 時 → evening", () => {
    expect(getTimeOfDay(makeDate(17))).toBe("evening");
  });
  it("18 時 → evening (境界値)", () => {
    expect(getTimeOfDay(makeDate(18))).toBe("evening");
  });

  // ─── 夜 (night): 19 時以上〜翌 5 時未満 ──────────────
  it("19 時 → night (境界値)", () => {
    expect(getTimeOfDay(makeDate(19))).toBe("night");
  });
  it("23 時 → night", () => {
    expect(getTimeOfDay(makeDate(23))).toBe("night");
  });
  it("0 時 → night (深夜)", () => {
    expect(getTimeOfDay(makeDate(0))).toBe("night");
  });
  it("4 時 → night (境界値)", () => {
    expect(getTimeOfDay(makeDate(4))).toBe("night");
  });
});
