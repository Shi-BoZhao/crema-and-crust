import { Button } from "./Button";

interface StepNavProps {
  step: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  canGoBack?: boolean;
  canGoNext?: boolean;
}

export function StepNav({
  step,
  totalSteps,
  onBack,
  onNext,
  backLabel = "もどる",
  nextLabel = "つぎへ",
  canGoBack = true,
  canGoNext = true,
}: StepNavProps) {
  return (
    <>
      <div className="step-dots" aria-hidden>
        {Array.from({ length: totalSteps }, (_, i) => (
          <span
            key={i}
            className={`step-dot ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
          />
        ))}
      </div>
      <div className="step-nav">
        {onBack && (
          <Button variant="secondary" onClick={onBack} disabled={!canGoBack}>
            {backLabel}
          </Button>
        )}
        {onNext && (
          <Button variant="primary" onClick={onNext} disabled={!canGoNext}>
            {nextLabel}
          </Button>
        )}
      </div>
    </>
  );
}
