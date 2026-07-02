import type {
  BeanId,
  GrindSize,
  TampingStrength,
  ExtractionVolume,
  Finish,
} from "./types";
import { getBeanName, getBeanCremaBase } from "../data/beans";

// ─── ラベル (日本語) ───────────────────────────────────────

export const TAMPING_STRENGTH_LABEL: Record<TampingStrength, string> = {
  gentle: "やさしめ",
  firm:   "しっかり",
};

export const EXTRACTION_VOLUME_LABEL: Record<ExtractionVolume, string> = {
  ristretto: "リストレット",
  espresso:  "エスプレッソ",
  lungo:     "ルンゴ",
};

/** 抽出量ごとに名前の修飾語 */
const VOLUME_MODIFIER: Record<ExtractionVolume, string> = {
  ristretto: "きりっと",
  espresso:  "丁寧な",
  lungo:     "ゆったり",
};

// ─── 判定関数 ──────────────────────────────────────────────

/**
 * 挽きの細かさとタンピング回数 → やさしめ / しっかり
 * 細かい挽き + 多いタンピング → firm、それ以外 → gentle
 */
export function getTampingStrength(
  grindSize: GrindSize,
  tampingCount: number,
): TampingStrength {
  const grindScore = grindSize === "coarse" ? 0 : grindSize === "medium" ? 1 : 2;
  const tampScore  = tampingCount >= 3 ? 2 : tampingCount >= 1 ? 1 : 0;
  return grindScore + tampScore >= 3 ? "firm" : "gentle";
}

/**
 * 抽出量 (0〜1) → リストレット / エスプレッソ / ルンゴ
 * 0〜0.34: ristretto / 0.35〜0.64: espresso / 0.65〜: lungo
 */
export function getExtractionVolume(amount: number): ExtractionVolume {
  if (amount < 0.35) return "ristretto";
  if (amount < 0.65) return "espresso";
  return "lungo";
}

// ─── 命名 ──────────────────────────────────────────────────

/**
 * 完成したカップに自然な日本語名を付ける。
 * 例: 「エチオピアのゆったりルンゴ」
 */
export function nameCup(
  bean: BeanId,
  extractionVolume: ExtractionVolume,
  finish: Finish,
): string {
  const beanName = getBeanName(bean);
  const modifier = VOLUME_MODIFIER[extractionVolume];
  const volLabel = EXTRACTION_VOLUME_LABEL[extractionVolume];

  switch (finish) {
    case "straight":
      return `${beanName}の${modifier}${volLabel}`;
    case "americano":
      return `${beanName}のやさしいアメリカーノ`;
    case "cappuccino":
      return `${beanName}のふんわりカプチーノ`;
  }
}

// ─── クレマ色 ──────────────────────────────────────────────

/**
 * 豆と抽出量からクレマの CSS カラー文字列を返す。
 * リストレットは少し濃いめ、ルンゴは少し薄めに調整。
 */
export function getCremaColor(
  bean: BeanId,
  extractionVolume: ExtractionVolume,
): string {
  const base = getBeanCremaBase(bean);
  const shift = extractionVolume === "ristretto" ? -18 : extractionVolume === "lungo" ? 18 : 0;
  return shiftHexColor(base, shift);
}

function shiftHexColor(hex: string, amount: number): string {
  const r = clamp(parseInt(hex.slice(1, 3), 16) + amount);
  const g = clamp(parseInt(hex.slice(3, 5), 16) + amount);
  const b = clamp(parseInt(hex.slice(5, 7), 16) + amount);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}
