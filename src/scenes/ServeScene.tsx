import { useState } from "react";
import { SceneLayout } from "../components/SceneLayout";
import { Button } from "../components/Button";
import { PizzaSvg } from "../components/PizzaSvg";
import { CupSvg } from "../components/CupSvg";
import { useGame } from "../state/GameContext";
import { matchesMood, selectResponse } from "../game/customers";
import { getNewlyUnlocked } from "../game/unlocks";
import { CUSTOMERS } from "../data/customers";
import type { RecipeEntry } from "../state/state";
import { inferServedItem } from "../utils/inferServedItem";
import { getUnlockMessage } from "../utils/unlocks";

interface ServeSceneProps {
  onBack: () => void;
}

export function ServeScene({ onBack }: ServeSceneProps) {
  const { state, dispatch } = useGame();
  const { customer, recipeNotes, cardCount } = state;
  const [selected, setSelected] = useState<RecipeEntry | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [unlockNotices, setUnlockNotices] = useState<string[]>([]);
  const [served, setServed] = useState(false);
  // 提供すると state 上の customer は消えるので、表示用に名前を残しておく
  const [servedName, setServedName] = useState<string | null>(null);

  const customerDef = customer.id
    ? CUSTOMERS.find((c) => c.id === customer.id)
    : null;

  const recentItems = [...recipeNotes].reverse().slice(0, 8);

  const handleServe = () => {
    if (!selected || !customer.id || !customer.mood || served) return;

    const item = inferServedItem(selected);
    const matched = matchesMood(item, customer.mood);
    const text = selectResponse(customer.id, customer.mood, matched);
    setResponse(text);
    setServedName(customerDef?.name ?? "お客さん");

    const prevCount = cardCount;
    dispatch({ type: "SERVE_CUSTOMER" });
    setServed(true);

    const newly = getNewlyUnlocked(prevCount, prevCount + 1);
    if (newly.length > 0) {
      setUnlockNotices(newly.map(getUnlockMessage));
    }
  };

  // 提供後は customer が消えるが、反応表示のため served 中は早期リターンしない
  if (!customer.id && !served) {
    return (
      <SceneLayout title="提供" onBack={onBack}>
        <p className="hint">いまはお客さんがいないみたい〜</p>
        <Button variant="primary" onClick={onBack}>
          店内にもどる
        </Button>
      </SceneLayout>
    );
  }

  return (
    <SceneLayout title="提供" onBack={onBack}>
      <div className="serve-customer panel">
        <svg viewBox="0 0 60 80" width="50" height="66" aria-hidden>
          <circle cx="30" cy="22" r="14" fill="#e8c4a0" />
          <ellipse cx="30" cy="58" rx="18" ry="22" fill="#5a7d68" />
        </svg>
        <p>{customerDef?.name ?? servedName ?? "お客さん"}</p>
        {!served && customer.arrivalMessage && (
          <p className="hint">「{customer.arrivalMessage}」</p>
        )}
      </div>

      {!served ? (
        <>
          <p className="hint">ノートから、出したいものをどうぞ〜</p>
          {recentItems.length === 0 ? (
            <p className="hint">まだノートに何もないみたい… 先に作ってみましょう〜</p>
          ) : (
            <ul className="recipe-list">
              {recentItems.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={`recipe-item serve-item ${selected?.id === entry.id ? "selected" : ""}`}
                    onClick={() => setSelected(entry)}
                  >
                    {entry.type === "pizza" ? (
                      <PizzaSvg size={48} spreadRadius={0.6} sauceAmount={0.5} />
                    ) : (
                      <CupSvg size={48} fillLevel={0.7} />
                    )}
                    <span className="recipe-item-name">{entry.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="step-nav">
            <Button
              variant="primary"
              onClick={handleServe}
              disabled={!selected}
            >
              出す
            </Button>
          </div>
        </>
      ) : (
        <div className="serve-result">
          {response && <p className="response-text">「{response}」</p>}
          <p className="hint">ありがとうカードが 1 枚たまりました〜</p>
          {unlockNotices.map((msg) => (
            <p key={msg} className="unlock-notice">
              {msg}
            </p>
          ))}
          <Button variant="primary" onClick={onBack}>
            店内にもどる
          </Button>
        </div>
      )}

      <style>{`
        .serve-customer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          text-align: center;
        }
        .serve-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .recipe-item {
          width: 100%;
          border: none;
          text-align: left;
        }
      `}</style>
    </SceneLayout>
  );
}
