import type { ToppingId, BakeLevel, SauceLevel } from "../game/types";
import { TOPPINGS } from "../data/toppings";

export interface PlacedTopping {
  id: ToppingId;
  x: number;
  y: number;
}

interface PizzaSvgProps {
  size?: number;
  spreadRadius?: number;
  sauceAmount?: number;
  sauceLevel?: SauceLevel;
  toppings?: readonly PlacedTopping[];
  bakeProgress?: number;
  bakeLevel?: BakeLevel;
  onClick?: (x: number, y: number) => void;
  className?: string;
}

function getCrustColor(bakeProgress: number): string {
  const t = Math.min(1, bakeProgress);
  const r = Math.round(245 - t * 55);
  const g = Math.round(220 - t * 80);
  const b = Math.round(180 - t * 90);
  return `rgb(${r},${g},${b})`;
}

function getSauceColor(sauceLevel: SauceLevel, amount: number): string {
  if (sauceLevel === "white" || amount <= 0) return "transparent";
  const alpha = 0.35 + amount * 0.45;
  return `rgba(196, 74, 42, ${alpha})`;
}

export function PizzaSvg({
  size = 240,
  spreadRadius = 0.3,
  sauceAmount = 0,
  sauceLevel = "white",
  toppings = [],
  bakeProgress = 0,
  onClick,
  className = "",
}: PizzaSvgProps) {
  const radius = 40 + spreadRadius * 70;
  const cx = size / 2;
  const cy = size / 2;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onClick(x, y);
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      onClick={handleClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
      role="img"
      aria-label="ピザ"
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius + 6}
        fill={getCrustColor(bakeProgress)}
        stroke="#c4a060"
        strokeWidth="3"
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={getSauceColor(sauceLevel, sauceAmount)}
      />
      {toppings.map((t, i) => {
        const def = TOPPINGS.find((d) => d.id === t.id);
        const tx = t.x * size;
        const ty = t.y * size;
        return (
          <g key={`${t.id}-${i}`}>
            {t.id === "basil" ? (
              <ellipse
                cx={tx}
                cy={ty}
                rx="10"
                ry="6"
                fill={def?.color ?? "#4a7c59"}
                transform={`rotate(${i * 40} ${tx} ${ty})`}
              />
            ) : t.id === "olive" ? (
              <ellipse cx={tx} cy={ty} rx="7" ry="9" fill={def?.color ?? "#6b7a3a"} />
            ) : t.id === "mushroom" ? (
              <>
                <ellipse cx={tx} cy={ty - 2} rx="9" ry="7" fill={def?.color ?? "#9e7f6b"} />
                <rect x={tx - 3} y={ty + 2} width="6" height="5" rx="2" fill="#d4c4b0" />
              </>
            ) : t.id === "honey" ? (
              <circle cx={tx} cy={ty} r="8" fill={def?.color ?? "#d4a832"} opacity="0.8" />
            ) : (
              <circle cx={tx} cy={ty} r="9" fill={def?.color ?? "#ccc"} />
            )}
          </g>
        );
      })}
    </svg>
  );
}
