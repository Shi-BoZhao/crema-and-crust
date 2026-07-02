import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameProvider } from "./state/GameContext";
import { App } from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
);
