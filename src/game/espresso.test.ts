import { describe, it, expect } from "vitest";
import {
  getTampingStrength,
  getExtractionVolume,
  nameCup,
  getCremaColor,
  EXTRACTION_VOLUME_LABEL,
} from "./espresso";

// ─── getTampingStrength ───────────────────────────────────

describe("getTampingStrength", () => {
  it("粗め・0 回 → gentle", () => {
    expect(getTampingStrength("coarse", 0)).toBe("gentle");
  });
  it("粗め・1 回 → gentle", () => {
    expect(getTampingStrength("coarse", 1)).toBe("gentle");
  });
  it("細かめ・0 回 → gentle (スコア 2 未満)", () => {
    expect(getTampingStrength("fine", 0)).toBe("gentle");
  });
  it("細かめ・1 回 → firm (スコア 2+1=3)", () => {
    expect(getTampingStrength("fine", 1)).toBe("firm");
  });
  it("ふつう・3 回以上 → firm (スコア 1+2=3)", () => {
    expect(getTampingStrength("medium", 3)).toBe("firm");
  });
  it("ふつう・1 回 → gentle (スコア 1+1=2 < 3)", () => {
    expect(getTampingStrength("medium", 1)).toBe("gentle");
  });
  it("細かめ・3 回以上 → firm (スコア 2+2=4)", () => {
    expect(getTampingStrength("fine", 3)).toBe("firm");
  });
});

// ─── getExtractionVolume ──────────────────────────────────

describe("getExtractionVolume", () => {
  it("0.0 → ristretto", () => {
    expect(getExtractionVolume(0.0)).toBe("ristretto");
  });
  it("0.34 → ristretto (境界値)", () => {
    expect(getExtractionVolume(0.34)).toBe("ristretto");
  });
  it("0.35 → espresso (境界値)", () => {
    expect(getExtractionVolume(0.35)).toBe("espresso");
  });
  it("0.64 → espresso (境界値)", () => {
    expect(getExtractionVolume(0.64)).toBe("espresso");
  });
  it("0.65 → lungo (境界値)", () => {
    expect(getExtractionVolume(0.65)).toBe("lungo");
  });
  it("1.0 → lungo", () => {
    expect(getExtractionVolume(1.0)).toBe("lungo");
  });
  it("すべてのラベルが日本語で肯定的", () => {
    expect(EXTRACTION_VOLUME_LABEL["ristretto"]).toBe("リストレット");
    expect(EXTRACTION_VOLUME_LABEL["espresso"]).toBe("エスプレッソ");
    expect(EXTRACTION_VOLUME_LABEL["lungo"]).toBe("ルンゴ");
  });
});

// ─── nameCup ──────────────────────────────────────────────

describe("nameCup", () => {
  it("仕様例: エチオピアのゆったりルンゴ", () => {
    expect(nameCup("ethiopia", "lungo", "straight")).toBe(
      "エチオピアのゆったりルンゴ",
    );
  });

  it("straight: 豆名・修飾語・抽出量を含む", () => {
    const name = nameCup("house-blend", "espresso", "straight");
    expect(name).toContain("ハウスブレンド");
    expect(name).toContain("エスプレッソ");
  });

  it("americano: 豆名とアメリカーノを含む", () => {
    const name = nameCup("brazil", "espresso", "americano");
    expect(name).toContain("ブラジル");
    expect(name).toContain("アメリカーノ");
  });

  it("cappuccino: 豆名とカプチーノを含む", () => {
    const name = nameCup("ethiopia", "espresso", "cappuccino");
    expect(name).toContain("エチオピア");
    expect(name).toContain("カプチーノ");
  });

  it("dark-roast + ristretto", () => {
    const name = nameCup("dark-roast", "ristretto", "straight");
    expect(name).toContain("深煎り");
    expect(name).toContain("リストレット");
  });
});

// ─── getCremaColor ────────────────────────────────────────

describe("getCremaColor", () => {
  it("CSS カラー文字列 (#rrggbb) を返す", () => {
    const color = getCremaColor("house-blend", "espresso");
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("ristretto は espresso より暗い色", () => {
    const ristretto = getCremaColor("house-blend", "ristretto");
    const espresso  = getCremaColor("house-blend", "espresso");
    // R 成分で比較
    const r1 = parseInt(ristretto.slice(1, 3), 16);
    const r2 = parseInt(espresso.slice(1, 3), 16);
    expect(r1).toBeLessThan(r2);
  });

  it("lungo は espresso より明るい色", () => {
    const lungo    = getCremaColor("ethiopia", "lungo");
    const espresso = getCremaColor("ethiopia", "espresso");
    const r1 = parseInt(lungo.slice(1, 3), 16);
    const r2 = parseInt(espresso.slice(1, 3), 16);
    expect(r1).toBeGreaterThan(r2);
  });

  it("豆ごとにクレマ色が異なる", () => {
    const hb = getCremaColor("house-blend", "espresso");
    const dr = getCremaColor("dark-roast", "espresso");
    expect(hb).not.toBe(dr);
  });
});
