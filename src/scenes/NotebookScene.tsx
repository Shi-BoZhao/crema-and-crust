import { SceneLayout } from "../components/SceneLayout";
import { PizzaSvg } from "../components/PizzaSvg";
import { CupSvg } from "../components/CupSvg";
import { useGame } from "../state/GameContext";

interface NotebookSceneProps {
  onBack: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function NotebookScene({ onBack }: NotebookSceneProps) {
  const { state } = useGame();
  const { recipeNotes, cardCount } = state;
  const items = [...recipeNotes].reverse();

  return (
    <SceneLayout
      title="レシピノート"
      onBack={onBack}
      headerExtra={
        cardCount > 0 ? (
          <span className="card-count">ありがとうカード {cardCount} 枚</span>
        ) : null
      }
    >
      {items.length === 0 ? (
        <p className="hint">まだ何も書いていないノートです〜</p>
      ) : (
        <ul className="recipe-list">
          {items.map((entry) => (
            <li key={entry.id} className="recipe-item">
              {entry.type === "pizza" ? (
                <PizzaSvg size={52} spreadRadius={0.55} sauceAmount={0.4} />
              ) : (
                <CupSvg size={52} fillLevel={0.65} />
              )}
              <div>
                <div className="recipe-item-name">{entry.name}</div>
                <div className="recipe-item-time">{formatDate(entry.timestamp)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SceneLayout>
  );
}
