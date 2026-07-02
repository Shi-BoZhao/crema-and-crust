import type { ReactNode } from "react";
import { Button } from "./Button";

interface SceneLayoutProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  headerExtra?: ReactNode;
}

export function SceneLayout({
  title,
  onBack,
  children,
  headerExtra,
}: SceneLayoutProps) {
  return (
    <div className="scene">
      <header className="scene-header">
        <Button variant="back" onClick={onBack} aria-label="店内にもどる">
          ← 店内
        </Button>
        <h1 className="scene-title">{title}</h1>
        {headerExtra}
      </header>
      {children}
    </div>
  );
}
