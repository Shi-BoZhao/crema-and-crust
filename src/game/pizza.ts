import type { ToppingId, DoughThickness, SauceLevel, BakeLevel } from "./types";
import { getToppingName } from "../data/toppings";

// ─── ラベル (日本語) ───────────────────────────────────────

export const DOUGH_THICKNESS_LABEL: Record<DoughThickness, string> = {
  thick:   "厚め",
  regular: "ふつう",
  thin:    "薄め",
};

export const SAUCE_LEVEL_LABEL: Record<SauceLevel, string> = {
  white:    "白ピザ",
  light:    "トマト薄め",
  generous: "トマトたっぷり",
};

export const BAKE_LEVEL_LABEL: Record<BakeLevel, string> = {
  pillowy:    "もっちり白焼き",
  golden:     "こんがり",
  neapolitan: "ナポリの下町風",
};

// ─── 判定関数 ──────────────────────────────────────────────

/**
 * 生地を広げた回数 → 生地の厚さ
 * 0–2 回: thick / 3–6 回: regular / 7 回以上: thin
 */
export function getDoughThickness(spreadCount: number): DoughThickness {
  if (spreadCount <= 2) return "thick";
  if (spreadCount <= 6) return "regular";
  return "thin";
}

/**
 * ソース塗り量 (0〜1) → ソース表現
 * 0: white / 0 より大きく 0.4 未満: light / 0.4 以上: generous
 */
export function getSauceLevel(amount: number): SauceLevel {
  if (amount <= 0) return "white";
  if (amount < 0.4) return "light";
  return "generous";
}

/**
 * 焼き進行度 (0〜1) → 焼き表現 (すべて肯定的)
 * 0〜0.39: pillowy / 0.4〜0.74: golden / 0.75〜: neapolitan
 */
export function getBakeLevel(progress: number): BakeLevel {
  if (progress < 0.4) return "pillowy";
  if (progress < 0.75) return "golden";
  return "neapolitan";
}

// ─── 命名 ──────────────────────────────────────────────────

/**
 * 完成したピザに自然な日本語名を付ける。
 * 例: 「バジルとこんがりモッツァレラのピザ」
 */
export function namePizza(
  toppings: readonly ToppingId[],
  bakeLevel: BakeLevel,
  sauceLevel: SauceLevel,
): string {
  const bake = BAKE_LEVEL_LABEL[bakeLevel];

  if (toppings.length === 0) {
    if (sauceLevel === "white") return `${bake}の白ピザ`;
    return `${bake}のシンプルピザ`;
  }

  const names = toppings.map((id) => getToppingName(id));

  if (names.length === 1) {
    return `${names[0]}と${bake}のピザ`;
  }

  // 最初のトッピング + "と" + 焼き加減 + 残りトッピング + "のピザ"
  // 例: 「バジルとこんがりモッツァレラのピザ」
  const [first, ...rest] = names;
  return `${first}と${bake}${rest.join("・")}のピザ`;
}
