import type {
  CustomerId,
  CustomerMood,
  SauceLevel,
  Finish,
} from "./types";
import { CUSTOMERS } from "../data/customers";

// ─── 気分の抽選 ────────────────────────────────────────────

const MOODS: readonly CustomerMood[] = ["warm", "refreshing", "hungry", "casual"];

/** ランダムに気分を返す */
export function drawMood(): CustomerMood {
  return MOODS[Math.floor(Math.random() * MOODS.length)];
}

// ─── マッチ判定 ────────────────────────────────────────────

export interface ServedItem {
  type: "pizza" | "espresso";
  sauceLevel?: SauceLevel;
  toppingCount?: number;
  finish?: Finish;
}

/**
 * 提供した品と気分がマッチするか判定する。
 * マッチしなくても肯定的な反応が返るので、ここは「特別な会話になるか」の判定。
 */
export function matchesMood(item: ServedItem, mood: CustomerMood): boolean {
  switch (mood) {
    case "warm":
      // あたたかいエスプレッソ系 (アメリカーノより、ストレートやカプチーノ)
      return (
        item.type === "espresso" &&
        (item.finish === "straight" || item.finish === "cappuccino")
      );

    case "refreshing":
      // さっぱり = アメリカーノ、または白ピザ
      return (
        (item.type === "espresso" && item.finish === "americano") ||
        (item.type === "pizza" && item.sauceLevel === "white")
      );

    case "hungry":
      // おなかがすいた = トッピングがある程度のったピザ
      return item.type === "pizza" && (item.toppingCount ?? 0) >= 2;

    case "casual":
      // なんとなく = 何でもうれしい
      return true;
  }
}

// ─── 会話文の選択 ──────────────────────────────────────────

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 来店時のつぶやきを返す */
export function selectArrival(
  customerId: CustomerId,
  mood: CustomerMood,
): string {
  const customer = CUSTOMERS.find((c) => c.id === customerId);
  if (!customer) return "…";
  return pickRandom(customer.arrivals[mood]);
}

/**
 * 提供後の反応を返す。
 * マッチしなくても必ず肯定的な文が返る。
 */
export function selectResponse(
  customerId: CustomerId,
  _mood: CustomerMood,
  matches: boolean,
): string {
  const customer = CUSTOMERS.find((c) => c.id === customerId);
  if (!customer) return "…ありがとう";
  const pool = matches ? customer.matchResponses : customer.normalResponses;
  return pickRandom(pool);
}

/** 全常連の ID 一覧 */
export const ALL_CUSTOMER_IDS: readonly CustomerId[] = CUSTOMERS.map(
  (c) => c.id,
);

/** ランダムに常連を一人選ぶ */
export function drawCustomer(): CustomerId {
  return pickRandom(ALL_CUSTOMER_IDS);
}
