import type { ServedItem } from "../game/customers";
import type { RecipeEntry } from "../state/state";
import type { SauceLevel, Finish } from "../game/types";

/** レシピ名から提供アイテムの属性を推測する(UI 層のヒューリスティック) */
export function inferServedItem(entry: RecipeEntry): ServedItem {
  const { name, type } = entry;

  if (type === "pizza") {
    const sauceLevel: SauceLevel = name.includes("白")
      ? "white"
      : name.includes("薄め")
        ? "light"
        : name.includes("たっぷり")
          ? "generous"
          : "light";
    const toppingCount = (name.match(/と|・/g) ?? []).length;
    return { type: "pizza", sauceLevel, toppingCount: Math.max(1, toppingCount) };
  }

  let finish: Finish = "straight";
  if (name.includes("アメリカーノ")) finish = "americano";
  else if (name.includes("カプチーノ")) finish = "cappuccino";

  return { type: "espresso", finish };
}
