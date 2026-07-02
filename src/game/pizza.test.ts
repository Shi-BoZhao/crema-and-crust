import { describe, it, expect } from "vitest";
import {
  getDoughThickness,
  getSauceLevel,
  getBakeLevel,
  namePizza,
  BAKE_LEVEL_LABEL,
} from "./pizza";

// ─── getDoughThickness ─────────────────────────────────────

describe("getDoughThickness", () => {
  it("0 回 → thick", () => {
    expect(getDoughThickness(0)).toBe("thick");
  });
  it("2 回 → thick (境界値)", () => {
    expect(getDoughThickness(2)).toBe("thick");
  });
  it("3 回 → regular (境界値)", () => {
    expect(getDoughThickness(3)).toBe("regular");
  });
  it("6 回 → regular (境界値)", () => {
    expect(getDoughThickness(6)).toBe("regular");
  });
  it("7 回 → thin (境界値)", () => {
    expect(getDoughThickness(7)).toBe("thin");
  });
  it("100 回 → thin", () => {
    expect(getDoughThickness(100)).toBe("thin");
  });
});

// ─── getSauceLevel ────────────────────────────────────────

describe("getSauceLevel", () => {
  it("0 → white (白ピザ)", () => {
    expect(getSauceLevel(0)).toBe("white");
  });
  it("負数 → white", () => {
    expect(getSauceLevel(-0.1)).toBe("white");
  });
  it("0.01 → light", () => {
    expect(getSauceLevel(0.01)).toBe("light");
  });
  it("0.39 → light (境界値)", () => {
    expect(getSauceLevel(0.39)).toBe("light");
  });
  it("0.4 → generous (境界値)", () => {
    expect(getSauceLevel(0.4)).toBe("generous");
  });
  it("1.0 → generous", () => {
    expect(getSauceLevel(1.0)).toBe("generous");
  });
});

// ─── getBakeLevel ─────────────────────────────────────────

describe("getBakeLevel", () => {
  it("0.0 → pillowy (もっちり白焼き)", () => {
    expect(getBakeLevel(0.0)).toBe("pillowy");
  });
  it("0.39 → pillowy (境界値)", () => {
    expect(getBakeLevel(0.39)).toBe("pillowy");
  });
  it("0.4 → golden (境界値)", () => {
    expect(getBakeLevel(0.4)).toBe("golden");
  });
  it("0.74 → golden (境界値)", () => {
    expect(getBakeLevel(0.74)).toBe("golden");
  });
  it("0.75 → neapolitan (境界値)", () => {
    expect(getBakeLevel(0.75)).toBe("neapolitan");
  });
  it("1.0 → neapolitan", () => {
    expect(getBakeLevel(1.0)).toBe("neapolitan");
  });
  it("すべての結果ラベルが肯定的な日本語", () => {
    expect(BAKE_LEVEL_LABEL["pillowy"]).toBe("もっちり白焼き");
    expect(BAKE_LEVEL_LABEL["golden"]).toBe("こんがり");
    expect(BAKE_LEVEL_LABEL["neapolitan"]).toBe("ナポリの下町風");
  });
});

// ─── namePizza ────────────────────────────────────────────

describe("namePizza", () => {
  it("トッピングなし・白ピザ", () => {
    const name = namePizza([], "pillowy", "white");
    expect(name).toBe("もっちり白焼きの白ピザ");
  });

  it("トッピングなし・トマトあり", () => {
    const name = namePizza([], "golden", "generous");
    expect(name).toBe("こんがりのシンプルピザ");
  });

  it("トッピング 1 つ", () => {
    const name = namePizza(["basil"], "golden", "generous");
    expect(name).toContain("バジル");
    expect(name).toContain("こんがり");
    expect(name).toContain("ピザ");
  });

  it("トッピング 2 つ (仕様例に近い形)", () => {
    const name = namePizza(["basil", "mozzarella"], "golden", "generous");
    // 「バジルとこんがりモッツァレラのピザ」のような形
    expect(name).toContain("バジル");
    expect(name).toContain("こんがり");
    expect(name).toContain("モッツァレラ");
    expect(name).toContain("ピザ");
  });

  it("トッピング 3 つ以上でも名前が返る", () => {
    const name = namePizza(
      ["basil", "mozzarella", "mushroom"],
      "neapolitan",
      "generous",
    );
    expect(name).toContain("ピザ");
    expect(name.length).toBeGreaterThan(0);
  });

  it("ありがとうカード的な命名: 仕様例と構造が一致", () => {
    const name = namePizza(["basil", "mozzarella"], "golden", "generous");
    expect(name).toBe("バジルとこんがりモッツァレラのピザ");
  });
});
