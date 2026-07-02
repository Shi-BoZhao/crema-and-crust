import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import { reducer, type Action } from "./reducer";
import { type GameState, initialState } from "./state";
import { saveState, loadState } from "./persistence";

// ─── Context 型 ────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}

// ─── Context ───────────────────────────────────────────────

const GameContext = createContext<GameContextValue | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────

/**
 * ゲーム全体の状態を提供する Provider。
 * useReducer を包み、state 変化時に localStorage へ自動保存する。
 *
 * 使い方:
 *   <GameProvider>
 *     <App />
 *   </GameProvider>
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    return loadState() ?? initialState;
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────

/**
 * ゲーム状態と dispatch を返すカスタムフック。
 * GameProvider の内側でのみ使用できる。
 *
 * @example
 *   const { state, dispatch } = useGame();
 *   dispatch({ type: "RECORD_PIZZA", payload: { name: "バジルのピザ" } });
 */
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (ctx === undefined) {
    throw new Error("useGame は GameProvider の内側で使ってください");
  }
  return ctx;
}
