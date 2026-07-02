import { useCallback, useState } from "react";
import { SceneLayout } from "../components/SceneLayout";
import { StepNav } from "../components/StepNav";
import { Button } from "../components/Button";
import { PizzaSvg, type PlacedTopping } from "../components/PizzaSvg";
import { useGame } from "../state/GameContext";
import { useActiveProgress } from "../hooks/useActiveProgress";
import {
  getDoughThickness,
  getSauceLevel,
  getBakeLevel,
  namePizza,
  DOUGH_THICKNESS_LABEL,
  SAUCE_LEVEL_LABEL,
  BAKE_LEVEL_LABEL,
} from "../game/pizza";
import type { ToppingId } from "../game/types";
import { TOPPINGS } from "../data/toppings";
import { isToppingAvailable } from "../utils/unlocks";

interface PizzaSceneProps {
  onBack: () => void;
}

const STEPS = ["のばす", "ソース", "トッピング", "窯"];
const TOTAL_STEPS = 4;

export function PizzaScene({ onBack }: PizzaSceneProps) {
  const { state, dispatch } = useGame();
  const [step, setStep] = useState(0);
  const [spreadCount, setSpreadCount] = useState(0);
  const [sauceAmount, setSauceAmount] = useState(0);
  const [forceWhite, setForceWhite] = useState(false);
  const [toppings, setToppings] = useState<PlacedTopping[]>([]);
  const [selectedTopping, setSelectedTopping] = useState<ToppingId | null>(
    "mozzarella",
  );
  const [bakeProgress, setBakeProgress] = useState(0);
  const [isBaking, setIsBaking] = useState(false);
  const [completed, setCompleted] = useState<string | null>(null);
  const [isDraggingSauce, setIsDraggingSauce] = useState(false);

  const doughThickness = getDoughThickness(spreadCount);
  const sauceLevel = forceWhite ? "white" : getSauceLevel(sauceAmount);
  const bakeLevel = getBakeLevel(bakeProgress);
  const spreadRadius = Math.min(1, spreadCount / 10);

  const availableToppings = TOPPINGS.filter((t) =>
    isToppingAvailable(t.id, state.cardCount),
  );

  const handleBakeTick = useCallback((delta: number) => {
    setBakeProgress((p) => Math.min(1, p + delta));
  }, []);

  useActiveProgress(isBaking && step === 3 && !completed, handleBakeTick, 0.06);

  const handlePizzaClick = (x: number, y: number) => {
    if (step === 0) {
      setSpreadCount((c) => c + 1);
      return;
    }
    if (step === 2 && selectedTopping) {
      const cx = 0.5;
      const cy = 0.5;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > 0.42) return;

      const hitIndex = toppings.findIndex(
        (t) => Math.hypot(t.x - x, t.y - y) < 0.08,
      );
      if (hitIndex >= 0) {
        setToppings((prev) => prev.filter((_, i) => i !== hitIndex));
      } else {
        setToppings((prev) => [...prev, { id: selectedTopping, x, y }]);
      }
    }
  };

  const addSauce = () => {
    if (forceWhite) return;
    setSauceAmount((a) => Math.min(1, a + 0.08));
  };

  const handleSaucePointerDown = () => {
    if (forceWhite) return;
    setIsDraggingSauce(true);
    addSauce();
  };

  const handleSaucePointerUp = () => setIsDraggingSauce(false);

  const finishPizza = () => {
    const uniqueToppings = [...new Set(toppings.map((t) => t.id))];
    const pizzaName = namePizza(uniqueToppings, bakeLevel, sauceLevel);
    dispatch({ type: "RECORD_PIZZA", payload: { name: pizzaName } });
    setCompleted(pizzaName);
    setIsBaking(false);
  };

  if (completed) {
    return (
      <SceneLayout title="できあがり〜" onBack={onBack}>
        <div className="completion-screen">
          <PizzaSvg
            size={200}
            spreadRadius={spreadRadius}
            sauceAmount={sauceAmount}
            sauceLevel={sauceLevel}
            toppings={toppings}
            bakeProgress={bakeProgress}
          />
          <p className="completion-name">{completed}</p>
          <p className="hint">ノートに書きとめました〜</p>
          <Button variant="primary" onClick={onBack}>
            店内にもどる
          </Button>
        </div>
      </SceneLayout>
    );
  }

  return (
    <SceneLayout title={`ピザ作り — ${STEPS[step]}`} onBack={onBack}>
      <p className="hint">
        {step === 0 && "生地をタップして、のばしていきましょう〜"}
        {step === 1 && "ソースを塗るか、白ピザにするか選べます〜"}
        {step === 2 && "パレットから選んで、のせたり外したりできます〜"}
        {step === 3 && "焼くボタンをおしているあいだ、ゆっくり焼けていきます〜"}
      </p>

      <div className="panel interactive-area">
        <PizzaSvg
          spreadRadius={spreadRadius}
          sauceAmount={forceWhite ? 0 : sauceAmount}
          sauceLevel={sauceLevel}
          toppings={toppings}
          bakeProgress={bakeProgress}
          onClick={step === 0 || step === 2 ? handlePizzaClick : undefined}
        />
      </div>

      {step === 0 && (
        <p className="hint">
          いまの生地… {DOUGH_THICKNESS_LABEL[doughThickness]}
        </p>
      )}

      {step === 1 && (
        <div className="pizza-sauce-controls">
          <div className="palette">
            <button
              type="button"
              className={`palette-item ${forceWhite ? "selected" : ""}`}
              onClick={() => {
                setForceWhite(true);
                setSauceAmount(0);
              }}
            >
              白ピザ
            </button>
            <button
              type="button"
              className={`palette-item ${!forceWhite ? "selected" : ""}`}
              onClick={() => setForceWhite(false)}
            >
              トマトソース
            </button>
          </div>
          {!forceWhite && (
            <div
              className="sauce-brush panel"
              onPointerDown={handleSaucePointerDown}
              onPointerUp={handleSaucePointerUp}
              onPointerLeave={handleSaucePointerUp}
              onPointerMove={() => {
                if (isDraggingSauce) addSauce();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") addSauce();
              }}
            >
              <span>ここをドラッグ、またはタップで塗る〜</span>
            </div>
          )}
          <p className="hint">{SAUCE_LEVEL_LABEL[sauceLevel]}</p>
        </div>
      )}

      {step === 2 && (
        <div className="palette">
          {availableToppings.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`palette-item ${selectedTopping === t.id ? "selected" : ""}`}
              onClick={() => setSelectedTopping(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="pizza-oven-controls">
          <p className="hint">{BAKE_LEVEL_LABEL[bakeLevel]}</p>
          <div className="step-nav">
            {!isBaking ? (
              <Button variant="primary" onClick={() => setIsBaking(true)}>
                焼く
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setIsBaking(false)}>
                とめる
              </Button>
            )}
            <Button variant="primary" onClick={finishPizza}>
              とりだす
            </Button>
          </div>
        </div>
      )}

      <StepNav
        step={step}
        totalSteps={TOTAL_STEPS}
        onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
        onNext={step < TOTAL_STEPS - 1 ? () => setStep((s) => s + 1) : undefined}
        canGoBack={step > 0}
        canGoNext={step < TOTAL_STEPS - 1}
      />

      <style>{`
        .pizza-sauce-controls {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: center;
        }
        .sauce-brush {
          width: 100%;
          max-width: 280px;
          padding: 1.5rem;
          text-align: center;
          cursor: pointer;
          user-select: none;
          background: linear-gradient(135deg, #e85a3a 0%, #c44a2a 100%);
          color: #fff;
          border-radius: 1rem;
          transition: transform 0.3s ease;
        }
        .sauce-brush:hover {
          transform: scale(1.02);
        }
        .pizza-oven-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
      `}</style>
    </SceneLayout>
  );
}
