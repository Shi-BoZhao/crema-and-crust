import type { BeanId } from "../game/types";

export interface BeanDef {
  id: BeanId;
  name: string;
  description: string;
  /** クレマの基調色 (CSS hex) */
  cremaBase: string;
  initiallyUnlocked: boolean;
}

export const BEANS: readonly BeanDef[] = [
  {
    id: "house-blend",
    name: "ハウスブレンド",
    description: "毎日飲んでも飽きない、やさしくまろやかな一杯…",
    cremaBase: "#c8a882",
    initiallyUnlocked: true,
  },
  {
    id: "brazil",
    name: "ブラジル",
    description: "香ばしいナッツの香りと、どっしりした甘み〜",
    cremaBase: "#b8864e",
    initiallyUnlocked: false,
  },
  {
    id: "ethiopia",
    name: "エチオピア",
    description: "華やかな花の香りと、さわやかな酸味が広がる…",
    cremaBase: "#d4a860",
    initiallyUnlocked: false,
  },
  {
    id: "dark-roast",
    name: "深煎り",
    description: "ビターでコクのある、力強い味わい…",
    cremaBase: "#7a4a2a",
    initiallyUnlocked: false,
  },
] as const;

export function getBeanName(id: BeanId): string {
  return BEANS.find((b) => b.id === id)?.name ?? id;
}

export function getBeanCremaBase(id: BeanId): string {
  return BEANS.find((b) => b.id === id)?.cremaBase ?? "#c8a882";
}
