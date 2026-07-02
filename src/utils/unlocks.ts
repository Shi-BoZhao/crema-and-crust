import type { BeanId, ToppingId, UnlockableId } from "../game/types";
import { getUnlockedIds } from "../game/unlocks";
import { TOPPINGS } from "../data/toppings";
import { BEANS } from "../data/beans";
import { getBeanName } from "../data/beans";
import { getToppingName } from "../data/toppings";

export function isUnlockableUnlocked(
  id: UnlockableId,
  cardCount: number,
): boolean {
  return getUnlockedIds(cardCount).includes(id);
}

export function isToppingAvailable(
  id: ToppingId,
  cardCount: number,
): boolean {
  const def = TOPPINGS.find((t) => t.id === id);
  if (!def) return false;
  if (def.initiallyUnlocked) return true;
  return isUnlockableUnlocked(id as UnlockableId, cardCount);
}

export function isBeanAvailable(id: BeanId, cardCount: number): boolean {
  const def = BEANS.find((b) => b.id === id);
  if (!def) return false;
  if (def.initiallyUnlocked) return true;
  return isUnlockableUnlocked(id as UnlockableId, cardCount);
}

export function isCappuccinoAvailable(cardCount: number): boolean {
  return isUnlockableUnlocked("cappuccino", cardCount);
}

const UNLOCK_MESSAGES: Partial<Record<UnlockableId, string>> = {
  brazil: "新しい豆が届きました… ブラジル〜",
  ethiopia: "新しい豆が届きました… エチオピア〜",
  "dark-roast": "新しい豆が届きました… 深煎り〜",
  prosciutto: "新しいトッピングが届きました… 生ハム〜",
  gorgonzola: "新しいトッピングが届きました… ゴルゴンゾーラ〜",
  honey: "新しいトッピングが届きました… はちみつ〜",
  anchovy: "新しいトッピングが届きました… アンチョビ〜",
  cappuccino: "ミルクが届きました… カプチーノが淹れられるようになった〜",
};

export function getUnlockMessage(id: UnlockableId): string {
  return (
    UNLOCK_MESSAGES[id] ??
    `新しいものが届きました… ${getToppingName(id as ToppingId) || getBeanName(id as BeanId)}〜`
  );
}
