import React from "react";

interface RevoraLogoProps {
  className?: string;
  variant?: "dark-bg" | "light-bg" | "icon-only";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export const RevoraLogo: React.FC<RevoraLogoProps> = ({
  className = "",
  variant = "dark-bg",
  size = "md",
  showTagline = true,
}) => {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const isLight = variant === "light-bg";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official REVORA SVG Icon Mark */}
      <div className={`relative shrink-0 ${iconSizes[size]} flex items-center justify-center`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 46"
          fill="none"
          className="w-full h-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
        >
          <path
            fill="#7C3AED"
            d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
          />
          <mask id="revora-mask" width="48" height="46" x="0" y="0" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }}>
            <path
              fill="#000"
              d="M25.842 44.938c-.664.844-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.183c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.498 0-3.579-1.842-3.579H1.133c-.92 0-1.456-1.04-.92-1.787L9.91.473c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.578 1.842 3.578h11.377c.943 0 1.473 1.088.89 1.832L25.843 44.94z"
            />
          </mask>
          <g mask="url(#revora-mask)">
            <g filter="url(#revora-blur-1)">
              <ellipse
                cx="5.508"
                cy="14.704"
                fill="#F97368"
                rx="5.508"
                ry="14.704"
                transform="matrix(.00324 1 1 -.00324 -4.47 31.516)"
              />
            </g>
            <g filter="url(#revora-blur-2)">
              <ellipse
                cx="10.399"
                cy="29.851"
                fill="#8B5CF6"
                rx="10.399"
                ry="29.851"
                transform="matrix(.00324 1 1 -.00324 -39.328 7.883)"
              />
            </g>
            <g filter="url(#revora-blur-3)">
              <ellipse
                cx="5.508"
                cy="30.487"
                fill="#7C3AED"
                rx="5.508"
                ry="30.487"
                transform="rotate(89.814 -25.913 -14.639)scale(1 -1)"
              />
            </g>
            <g filter="url(#revora-blur-4)">
              <ellipse
                cx="14.072"
                cy="22.078"
                fill="#FF6B6B"
                rx="14.072"
                ry="22.078"
                transform="rotate(93.35 24.506 48.493)scale(-1 1)"
              />
            </g>
            <g filter="url(#revora-blur-5)">
              <ellipse
                cx="41.412"
                cy="6.333"
                fill="#FDBA8C"
                rx="5.971"
                ry="9.665"
                transform="rotate(37.892 41.412 6.333)"
              />
            </g>
            <g filter="url(#revora-blur-6)">
              <ellipse
                cx="38.418"
                cy="32.4"
                fill="#F97368"
                rx="5.971"
                ry="15.297"
                transform="rotate(37.892 38.418 32.4)"
              />
            </g>
          </g>
          <defs>
            <filter id="revora-blur-1" width="60.045" height="41.654" x="-19.77" y="16.149" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="7.659" />
            </filter>
            <filter id="revora-blur-2" width="90.34" height="51.437" x="-54.613" y="-7.533" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="7.659" />
            </filter>
            <filter id="revora-blur-3" width="79.355" height="29.4" x="-49.64" y="2.03" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="4.596" />
            </filter>
            <filter id="revora-blur-4" width="74.749" height="58.852" x="15.756" y="-17.901" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="7.659" />
            </filter>
            <filter id="revora-blur-5" width="33.541" height="35.313" x="24.641" y="-11.323" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="4.596" />
            </filter>
            <filter id="revora-blur-6" width="39.409" height="43.623" x="18.713" y="10.588" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="4.596" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* Brand Typography */}
      {variant !== "icon-only" && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight font-display ${textSizes[size]} ${
                isLight ? "text-[#0D0A1F]" : "text-[#FFFDF9]"
              }`}
            >
              REVORA
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97368] shadow-sm shadow-[#F97368]/50" />
          </div>
          {showTagline && (
            <span
              className={`text-[10px] font-semibold tracking-widest uppercase mt-0.5 ${
                isLight ? "text-[#7C3AED]" : "text-[#FDBA8C]/90"
              }`}
            >
              AI Sports Tech
            </span>
          )}
        </div>
      )}
    </div>
  );
};
