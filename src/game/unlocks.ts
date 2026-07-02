import type { UnlockableId } from "./types";

// ─── 解放テーブル (mechanics.md の仕様どおり) ──────────────

interface UnlockEntry {
  threshold: number;
  ids: readonly UnlockableId[];
}

const UNLOCK_TABLE: readonly UnlockEntry[] = [
  { threshold:  2, ids: ["brazil"]                  },
  { threshold:  4, ids: ["prosciutto"]               },
  { threshold:  6, ids: ["cappuccino"]               },
  { threshold:  9, ids: ["ethiopia"]                 },
  { threshold: 12, ids: ["gorgonzola", "honey"]      },
  { threshold: 15, ids: ["dark-roast", "anchovy"]    },
] as const;

// ─── 解放判定関数 ──────────────────────────────────────────

/** カード数から解放済み ID 一覧を返す */
export function getUnlockedIds(cardCount: number): UnlockableId[] {
  return UNLOCK_TABLE.filter((entry) => cardCount >= entry.threshold).flatMap(
    (entry) => [...entry.ids],
  );
}

/**
 * カード数が prevCount → cardCount に増えたとき
 * 新たに解放された ID 一覧を返す（差分）。
 */
export function getNewlyUnlocked(
  prevCount: number,
  cardCount: number,
): UnlockableId[] {
  const prev = new Set(getUnlockedIds(prevCount));
  return getUnlockedIds(cardCount).filter((id) => !prev.has(id));
}

/** 解放に必要な次の閾値を返す (全解放済みなら null) */
export function getNextUnlockThreshold(cardCount: number): number | null {
  const next = UNLOCK_TABLE.find((entry) => entry.threshold > cardCount);
  return next?.threshold ?? null;
}
