import type { TimeOfDay } from "./types";

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morning: "朝",
  day:     "昼",
  evening: "夕方",
  night:   "夜",
};

/**
 * Date オブジェクトから時間帯を判定する。
 *   5 時以上 10 時未満 → morning
 *  10 時以上 16 時未満 → day
 *  16 時以上 19 時未満 → evening
 *  それ以外 (19〜5 時) → night
 */
export function getTimeOfDay(date: Date): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 10) return "morning";
  if (h >= 10 && h < 16) return "day";
  if (h >= 16 && h < 19) return "evening";
  return "night";
}
