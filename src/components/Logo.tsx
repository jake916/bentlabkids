import React from "react";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", iconOnly = false, size = "md" }: LogoProps) {
  const iconSizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-28 h-28",
  };

  const LogoIcon = () => (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${iconSizeClasses[size]} shrink-0 drop-shadow-md`}
    >
      {/* Outer Glow / Circular Button Base */}
      <circle cx="50" cy="50" r="46" fill="#B31046" />
      <circle cx="50" cy="50" r="42" fill="#C91854" />
      
      {/* TV Screen Outer Frame (Greenish-teal) */}
      <rect
        x="24"
        y="28"
        width="52"
        height="44"
        rx="10"
        stroke="#10B981"
        strokeWidth="4"
        fill="#A3164D"
      />
      
      {/* Play Button (White Triangle) */}
      <path
        d="M44 40.5L62 50L44 59.5V40.5Z"
        fill="white"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Antennae (Greenish-teal) */}
      <path
        d="M38 28 L30 18"
        stroke="#10B981"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M62 28 L70 18"
        stroke="#10B981"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="30" cy="18" r="2.5" fill="#10B981" />
      <circle cx="70" cy="18" r="2.5" fill="#10B981" />
    </svg>
  );

  if (iconOnly) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <LogoIcon />
      </div>
    );
  }

  // Text sizes corresponding to sizes
  const textSizes = {
    sm: { title: "text-lg", sub: "text-xs" },
    md: { title: "text-2xl", sub: "text-sm" },
    lg: { title: "text-4xl", sub: "text-lg" },
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <LogoIcon />
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span className="font-extrabold tracking-tight text-[#B31046]" style={{ fontSize: size === "sm" ? "1.25rem" : size === "lg" ? "2.5rem" : "1.75rem" }}>
            Bentlab
          </span>
          <span className="font-black tracking-tight text-[#1E3A8A] ml-1 relative flex items-center" style={{ fontSize: size === "sm" ? "1.25rem" : size === "lg" ? "2.5rem" : "1.75rem" }}>
            kids
            <span className="text-[#10B981]">tv</span>
            {/* Playful dots above the tv text */}
            <span className="absolute -top-1.5 right-0.5 flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-yellow-400 animate-ping"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
              <span className="w-1 h-1 rounded-full bg-[#10B981]"></span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
