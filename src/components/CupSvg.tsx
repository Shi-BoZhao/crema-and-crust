import type { Finish } from "../game/types";

interface CupSvgProps {
  size?: number;
  fillLevel?: number;
  cremaColor?: string;
  finish?: Finish;
  artSeed?: number;
  className?: string;
}

export function CupSvg({
  size = 120,
  fillLevel = 0,
  cremaColor = "#c8a882",
  finish = "straight",
  artSeed = 0,
  className = "",
}: CupSvgProps) {
  const liquidHeight = 18 + fillLevel * 42;
  const liquidY = 78 - liquidHeight;
  const isCappuccino = finish === "cappuccino";
  const isAmericano = finish === "americano";

  const foamColor = isCappuccino ? "#f5ebe0" : cremaColor;
  const liquidColor = isAmericano
    ? `color-mix(in srgb, ${cremaColor} 55%, #8b7355)`
    : cremaColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="カップ"
    >
      <path
        d="M 28 82 L 32 30 Q 50 22 68 30 L 72 82 Z"
        fill="#f0e8dc"
        stroke="#c4b8a8"
        strokeWidth="1.5"
      />
      <path
        d="M 72 45 Q 88 48 88 58 Q 88 68 72 65"
        fill="none"
        stroke="#c4b8a8"
        strokeWidth="3"
      />
      {fillLevel > 0 && (
        <>
          <clipPath id="cup-clip">
            <path d="M 30 80 L 33 32 Q 50 25 67 32 L 70 80 Z" />
          </clipPath>
          <g clipPath="url(#cup-clip)">
            <rect
              x="28"
              y={liquidY}
              width="44"
              height={liquidHeight + 4}
              fill={liquidColor}
              style={{ transition: "all 0.5s ease" }}
            />
            {fillLevel > 0.1 && (
              <ellipse
                cx="50"
                cy={liquidY + 2}
                rx="18"
                ry="5"
                fill={foamColor}
                opacity="0.9"
              />
            )}
            {isCappuccino && fillLevel > 0.5 && (
              <g opacity="0.7">
                <path
                  d={`M 42 38 Q ${46 + (artSeed % 5)} 32 50 38 Q ${54 - (artSeed % 4)} 44 58 38`}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <ellipse cx="48" cy="36" rx="3" ry="2" fill="#fff" />
              </g>
            )}
          </g>
        </>
      )}
    </svg>
  );
}
