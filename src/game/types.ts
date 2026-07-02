// ─── トッピング ────────────────────────────────────────────
export type ToppingId =
  | "mozzarella"
  | "basil"
  | "mushroom"
  | "olive"
  | "prosciutto"
  | "anchovy"
  | "gorgonzola"
  | "honey";

// ─── コーヒー豆 ────────────────────────────────────────────
export type BeanId = "house-blend" | "brazil" | "ethiopia" | "dark-roast";

// ─── ピザ ──────────────────────────────────────────────────
/** 生地の厚さ: 肯定的な名前 */
export type DoughThickness = "thick" | "regular" | "thin";

/** ソース量 */
export type SauceLevel = "white" | "light" | "generous";

/** 焼き加減: すべて肯定的な名前 */
export type BakeLevel = "pillowy" | "golden" | "neapolitan";

// ─── エスプレッソ ──────────────────────────────────────────
/** 挽きの細かさ */
export type GrindSize = "coarse" | "medium" | "fine";

/** タンピングの印象 */
export type TampingStrength = "gentle" | "firm";

/** 抽出量 */
export type ExtractionVolume = "ristretto" | "espresso" | "lungo";

/** 仕上げ */
export type Finish = "straight" | "americano" | "cappuccino";

// ─── お客さん ──────────────────────────────────────────────
export type CustomerId = "grandma" | "writer" | "student";

/** 気分のゆるい分類 */
export type CustomerMood = "warm" | "refreshing" | "hungry" | "casual";

// ─── 時間帯 ────────────────────────────────────────────────
export type TimeOfDay = "morning" | "day" | "evening" | "night";

// ─── 解放 ──────────────────────────────────────────────────
export type UnlockableId =
  | "brazil"
  | "prosciutto"
  | "cappuccino"
  | "ethiopia"
  | "gorgonzola"
  | "honey"
  | "dark-roast"
  | "anchovy";
