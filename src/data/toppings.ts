import type { ToppingId } from "../game/types";

export interface ToppingDef {
  id: ToppingId;
  name: string;
  color: string;
  initiallyUnlocked: boolean;
}

export const TOPPINGS: readonly ToppingDef[] = [
  // ─── 初期解放 ──────────────────────────────────────────
  { id: "mozzarella", name: "モッツァレラ",   color: "#f5f0e8", initiallyUnlocked: true  },
  { id: "basil",      name: "バジル",         color: "#4a7c59", initiallyUnlocked: true  },
  { id: "mushroom",   name: "マッシュルーム", color: "#9e7f6b", initiallyUnlocked: true  },
  { id: "olive",      name: "オリーブ",       color: "#6b7a3a", initiallyUnlocked: true  },
  // ─── 解放素材 ──────────────────────────────────────────
  { id: "prosciutto", name: "生ハム",         color: "#d4846a", initiallyUnlocked: false },
  { id: "anchovy",    name: "アンチョビ",     color: "#7a5c3a", initiallyUnlocked: false },
  { id: "gorgonzola", name: "ゴルゴンゾーラ", color: "#c8c090", initiallyUnlocked: false },
  { id: "honey",      name: "はちみつ",       color: "#d4a832", initiallyUnlocked: false },
] as const;

export function getToppingName(id: ToppingId): string {
  return TOPPINGS.find((t) => t.id === id)?.name ?? id;
}
