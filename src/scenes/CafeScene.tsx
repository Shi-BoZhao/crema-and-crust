import { useEffect } from "react";
import type { SceneId } from "../App";
import { useGame } from "../state/GameContext";
import {
  drawCustomer,
  drawMood,
  selectArrival,
} from "../game/customers";
import { CUSTOMERS } from "../data/customers";
import { TIME_OF_DAY_LABEL } from "../game/time";
import type { TimeOfDay } from "../game/types";
import { SpeechBubble } from "../components/SpeechBubble";

interface CafeSceneProps {
  onNavigate: (scene: SceneId) => void;
  timeOfDay: TimeOfDay;
}

export function CafeScene({ onNavigate, timeOfDay }: CafeSceneProps) {
  const { state, dispatch } = useGame();
  const { customer } = state;

  useEffect(() => {
    const tryArrival = () => {
      if (state.customer.id !== null) return;
      if (Math.random() > 0.35) return;

      const id = drawCustomer();
      const mood = drawMood();
      const message = selectArrival(id, mood);
      dispatch({ type: "CUSTOMER_ARRIVED", payload: { id, mood, message } });
    };

    const id = window.setInterval(tryArrival, 25_000);
    return () => window.clearInterval(id);
  }, [dispatch, state.customer.id]);

  const customerDef = customer.id
    ? CUSTOMERS.find((c) => c.id === customer.id)
    : null;

  return (
    <div className="scene cafe-scene">
      <header className="cafe-header">
        <h1 className="cafe-title">Crema &amp; Crust</h1>
        <p className="cafe-time">{TIME_OF_DAY_LABEL[timeOfDay]}の店内〜</p>
      </header>

      <div className="cafe-interior panel">
        <button
          type="button"
          className="cafe-hotspot cafe-oven"
          onClick={() => onNavigate("pizza")}
          aria-label="ピザ窯"
        >
          <svg viewBox="0 0 80 70" width="80" height="70" aria-hidden>
            <rect x="8" y="20" width="64" height="45" rx="8" fill="#8b5a3c" />
            <ellipse cx="40" cy="42" rx="22" ry="16" fill="#2a1810" />
            <ellipse cx="40" cy="40" rx="18" ry="12" fill="#ff6b20" opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.4;0.7;0.4"
                dur="3s"
                repeatCount="indefinite"
              />
            </ellipse>
          </svg>
          <span>ピザ窯</span>
        </button>

        <button
          type="button"
          className="cafe-hotspot cafe-espresso"
          onClick={() => onNavigate("espresso")}
          aria-label="エスプレッソマシン"
        >
          <svg viewBox="0 0 60 80" width="60" height="80" aria-hidden>
            <rect x="10" y="8" width="40" height="55" rx="6" fill="#6b7a7a" />
            <rect x="18" y="18" width="24" height="12" rx="3" fill="#4a5555" />
            <rect x="22" y="55" width="16" height="18" rx="2" fill="#8b7355" />
            <circle cx="30" cy="30" r="4" fill="#c96f4a" />
          </svg>
          <span>マシン</span>
        </button>

        <button
          type="button"
          className="cafe-hotspot cafe-notebook"
          onClick={() => onNavigate("notebook")}
          aria-label="レシピノート"
        >
          <svg viewBox="0 0 50 60" width="50" height="60" aria-hidden>
            <rect x="6" y="4" width="38" height="52" rx="4" fill="#e8d5bc" stroke="#c4a882" />
            <line x1="14" y1="18" x2="36" y2="18" stroke="#c4a882" strokeWidth="2" />
            <line x1="14" y1="28" x2="32" y2="28" stroke="#c4a882" strokeWidth="2" />
            <line x1="14" y1="38" x2="34" y2="38" stroke="#c4a882" strokeWidth="2" />
          </svg>
          <span>ノート</span>
        </button>

        <div className="cafe-counter">
          {customer.id ? (
            <button
              type="button"
              className="cafe-customer"
              onClick={() => onNavigate("serve")}
              aria-label={`${customerDef?.name ?? "お客さん"}に話しかける`}
            >
              <svg viewBox="0 0 60 80" width="60" height="80" aria-hidden>
                <circle cx="30" cy="22" r="14" fill="#e8c4a0" />
                <ellipse cx="30" cy="58" rx="18" ry="22" fill="#5a7d68" />
              </svg>
              {customer.arrivalMessage && (
                <SpeechBubble className="cafe-bubble">
                  {customer.arrivalMessage}
                </SpeechBubble>
              )}
            </button>
          ) : (
            <div className="cafe-counter-empty">
              <p className="hint">カウンターはひっそりしている〜</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .cafe-header {
          text-align: center;
          margin-bottom: 0.5rem;
        }
        .cafe-title {
          margin: 0;
          font-size: 1.5rem;
          color: var(--forest);
          font-weight: 600;
        }
        [data-time="night"] .cafe-title {
          color: var(--text);
        }
        .cafe-time {
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
          color: var(--text-soft);
        }
        .cafe-interior {
          position: relative;
          min-height: 380px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 1.5rem;
          padding: 2rem 1.5rem;
        }
        .cafe-hotspot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 1rem;
          color: var(--forest);
          transition: background 0.35s ease, transform 0.3s ease;
        }
        [data-time="night"] .cafe-hotspot {
          color: var(--text);
        }
        .cafe-hotspot:hover {
          background: var(--accent-glow);
          transform: translateY(-2px);
        }
        .cafe-hotspot span {
          font-size: 0.85rem;
        }
        .cafe-counter {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          min-height: 140px;
          border-top: 3px solid var(--cream-dark);
          padding-top: 1.5rem;
        }
        .cafe-customer {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.35s ease;
        }
        .cafe-customer:hover {
          transform: scale(1.03);
        }
        .cafe-bubble {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 0.5rem;
          white-space: normal;
          width: max-content;
          max-width: min(260px, 78vw);
        }
        .cafe-counter-empty {
          text-align: center;
        }
      `}</style>
    </div>
  );
}
