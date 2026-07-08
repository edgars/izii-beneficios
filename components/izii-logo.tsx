import { cn } from "@/lib/utils";

type IziiLogoProps = {
  className?: string;
  /** "color" = charcoal+green (default), "white" = all white, "mono" = all charcoal */
  variant?: "color" | "white" | "mono";
};

const CHARCOAL = "#3A3D4A";
const GREEN = "#8DC63F";

export function IziiLogo({ className, variant = "color" }: IziiLogoProps) {
  const dark = variant === "white" ? "#FFFFFF" : CHARCOAL;
  const accent = variant === "white" ? "#FFFFFF" : variant === "mono" ? CHARCOAL : GREEN;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 112 56"
      aria-label="IZII"
      role="img"
      className={cn("h-7 w-auto shrink-0", className)}
    >
      {/* "i" — dark */}
      <rect x="0" y="0" width="14" height="14" fill={dark} />
      <rect x="0" y="20" width="14" height="36" fill={dark} />
      {/* "z" — dark */}
      <path
        d="M 22,0 L 68,0 L 68,14 L 40,42 L 68,42 L 68,56 L 22,56 L 22,42 L 50,14 L 22,14 Z"
        fill={dark}
      />
      {/* "i" — accent */}
      <rect x="76" y="0" width="14" height="14" fill={accent} />
      <rect x="76" y="20" width="14" height="36" fill={accent} />
      {/* "i" — accent */}
      <rect x="98" y="0" width="14" height="14" fill={accent} />
      <rect x="98" y="20" width="14" height="36" fill={accent} />
    </svg>
  );
}
