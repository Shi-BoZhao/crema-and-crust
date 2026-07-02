import { useState } from "react";
import { useTimeOfDay } from "./hooks/useTimeOfDay";
import { CafeScene } from "./scenes/CafeScene";
import { PizzaScene } from "./scenes/PizzaScene";
import { EspressoScene } from "./scenes/EspressoScene";
import { ServeScene } from "./scenes/ServeScene";
import { NotebookScene } from "./scenes/NotebookScene";

export type SceneId = "cafe" | "pizza" | "espresso" | "serve" | "notebook";

export function App() {
  const [scene, setScene] = useState<SceneId>("cafe");
  const timeOfDay = useTimeOfDay();

  return (
    <div className="app-shell" data-time={timeOfDay}>
      {scene === "cafe" && <CafeScene onNavigate={setScene} />}
      {scene === "pizza" && (
        <PizzaScene onBack={() => setScene("cafe")} />
      )}
      {scene === "espresso" && (
        <EspressoScene onBack={() => setScene("cafe")} />
      )}
      {scene === "serve" && (
        <ServeScene onBack={() => setScene("cafe")} />
      )}
      {scene === "notebook" && (
        <NotebookScene onBack={() => setScene("cafe")} />
      )}
    </div>
  );
}
