import { useCallback, useState } from "react";
import { SceneLayout } from "../components/SceneLayout";
import { StepNav } from "../components/StepNav";
import { Button } from "../components/Button";
import { CupSvg } from "../components/CupSvg";
import { useGame } from "../state/GameContext";
import { useActiveProgress } from "../hooks/useActiveProgress";
import {
  getTampingStrength,
  getExtractionVolume,
  getCremaColor,
  nameCup,
  TAMPING_STRENGTH_LABEL,
  EXTRACTION_VOLUME_LABEL,
} from "../game/espresso";
import type { BeanId, GrindSize, Finish } from "../game/types";
import { BEANS } from "../data/beans";
import { isBeanAvailable, isCappuccinoAvailable } from "../utils/unlocks";

interface EspressoSceneProps {
  onBack: () => void;
}

const STEPS = ["挽く", "タンピング", "抽出", "仕上げ"];
const TOTAL_STEPS = 4;
const GRIND_LABELS: Record<GrindSize, string> = {
  coarse: "粗め",
  medium: "ふつう",
  fine: "細かめ",
};

export function EspressoScene({ onBack }: EspressoSceneProps) {
  const { state, dispatch } = useGame();
  const [step, setStep] = useState(0);
  const [bean, setBean] = useState<BeanId>("house-blend");
  const [grindAmount, setGrindAmount] = useState(0);
  const [grindSize, setGrindSize] = useState<GrindSize>("medium");
  const [tampingCount, setTampingCount] = useState(0);
  const [extractionAmount, setExtractionAmount] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [finish, setFinish] = useState<Finish>("straight");
  const [completed, setCompleted] = useState<string | null>(null);
  const [artSeed] = useState(() => Math.floor(Math.random() * 100));

  const availableBeans = BEANS.filter((b) =>
    isBeanAvailable(b.id, state.cardCount),
  );
  const cappuccinoOk = isCappuccinoAvailable(state.cardCount);

  const tampingStrength = getTampingStrength(grindSize, tampingCount);
  const extractionVolume = getExtractionVolume(extractionAmount);
  const cremaColor = getCremaColor(bean, extractionVolume);

  const handleExtractTick = useCallback((delta: number) => {
    setExtractionAmount((a) => Math.min(1, a + delta));
  }, []);

  useActiveProgress(
    isExtracting && step === 2 && !completed,
    handleExtractTick,
    0.07,
  );

  const grind = () => {
    setGrindAmount((g) => Math.min(1, g + 0.12));
  };

  const tamp = () => {
    setTampingCount((c) => c + 1);
  };

  const completeCup = () => {
    const cupName = nameCup(bean, extractionVolume, finish);
    dispatch({ type: "RECORD_ESPRESSO", payload: { name: cupName } });
    setCompleted(cupName);
    setIsExtracting(false);
  };

  if (completed) {
    return (
      <SceneLayout title="できあがり〜" onBack={onBack}>
        <div className="completion-screen">
          <CupSvg
            size={160}
            fillLevel={extractionAmount}
            cremaColor={cremaColor}
            finish={finish}
            artSeed={artSeed}
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
    <SceneLayout title={`エスプレッソ — ${STEPS[step]}`} onBack={onBack}>
      <p className="hint">
        {step === 0 && "豆を選んで、ミルをくるくる回しましょう〜"}
        {step === 1 && "タンパーを押して、ゆっくり押し固めます〜"}
        {step === 2 && "抽出ボタンをおしているあいだ、液面が上がります〜"}
        {step === 3 && "そのまま出すか、仕上げを選べます〜"}
      </p>

      <div className="panel espresso-visual">
        <CupSvg
          size={140}
          fillLevel={step >= 2 ? extractionAmount : 0}
          cremaColor={cremaColor}
          finish={step >= 3 ? finish : "straight"}
          artSeed={artSeed}
        />

        {step === 0 && grindAmount > 0 && (
          <div className="grind-pile" style={{ opacity: grindAmount }}>
            <span>挽き豆…</span>
          </div>
        )}
      </div>

      {step === 0 && (
        <>
          <div className="palette">
            {availableBeans.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`palette-item ${bean === b.id ? "selected" : ""}`}
                onClick={() => setBean(b.id)}
              >
                {b.name}
              </button>
            ))}
          </div>
          <p className="hint bean-desc">
            {BEANS.find((b) => b.id === bean)?.description}
          </p>
          <div className="palette">
            {(Object.keys(GRIND_LABELS) as GrindSize[]).map((g) => (
              <button
                key={g}
                type="button"
                className={`palette-item ${grindSize === g ? "selected" : ""}`}
                onClick={() => setGrindSize(g)}
              >
                {GRIND_LABELS[g]}
              </button>
            ))}
          </div>
          <button type="button" className="mill-btn panel" onClick={grind}>
            <svg viewBox="0 0 80 80" width="64" height="64" aria-hidden>
              <circle cx="40" cy="40" r="30" fill="#8b8b8b" />
              <circle cx="40" cy="40" r="12" fill="#6b6b6b" />
              <rect x="36" y="8" width="8" height="16" rx="2" fill="#aaa" />
            </svg>
            <span>ミルを回す</span>
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <p className="hint">
            {TAMPING_STRENGTH_LABEL[tampingStrength]}
            {tampingCount > 0 ? `（${tampingCount}回）` : ""}
          </p>
          <button type="button" className="tamper-btn panel" onClick={tamp}>
            <svg viewBox="0 0 60 100" width="48" height="80" aria-hidden>
              <rect x="22" y="8" width="16" height="50" rx="4" fill="#8b7355" />
              <rect x="14" y="58" width="32" height="12" rx="3" fill="#6b5a45" />
            </svg>
            <span>タンパーを押す</span>
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <p className="hint">{EXTRACTION_VOLUME_LABEL[extractionVolume]}</p>
          <div className="step-nav">
            {!isExtracting ? (
              <Button variant="primary" onClick={() => setIsExtracting(true)}>
                抽出
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setIsExtracting(false)}>
                とめる
              </Button>
            )}
          </div>
        </>
      )}

      {step === 3 && (
        <div className="palette">
          <button
            type="button"
            className={`palette-item ${finish === "straight" ? "selected" : ""}`}
            onClick={() => setFinish("straight")}
          >
            そのまま
          </button>
          <button
            type="button"
            className={`palette-item ${finish === "americano" ? "selected" : ""}`}
            onClick={() => setFinish("americano")}
          >
            アメリカーノ
          </button>
          {cappuccinoOk && (
            <button
              type="button"
              className={`palette-item ${finish === "cappuccino" ? "selected" : ""}`}
              onClick={() => setFinish("cappuccino")}
            >
              カプチーノ
            </button>
          )}
          <Button variant="primary" onClick={completeCup}>
            できあがり
          </Button>
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
        .espresso-visual {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          min-height: 180px;
          justify-content: center;
        }
        .grind-pile {
          font-size: 0.85rem;
          color: var(--text-soft);
        }
        .bean-desc {
          padding: 0 0.5rem;
        }
        .mill-btn,
        .tamper-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto;
          padding: 1.25rem;
          cursor: pointer;
          transition: transform 0.35s ease;
          width: fit-content;
        }
        .mill-btn:hover,
        .tamper-btn:hover {
          transform: scale(1.04);
        }
        .mill-btn:active,
        .tamper-btn:active {
          transform: scale(0.97);
        }
      `}</style>
    </SceneLayout>
  );
}
