import type { ReactNode } from "react";

interface SpeechBubbleProps {
  children: ReactNode;
  className?: string;
}

export function SpeechBubble({ children, className = "" }: SpeechBubbleProps) {
  return (
    <div className={`speech-bubble ${className}`.trim()} role="note">
      {children}
    </div>
  );
}
