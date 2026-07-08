import { IziiLogo } from "@/components/izii-logo";
import { cn } from "@/lib/utils";

type PortalLogoProps = {
  className?: string;
  priority?: boolean;
  variant?: "color" | "white" | "mono";
};

export function PortalLogo({ className, variant = "color" }: PortalLogoProps) {
  return <IziiLogo variant={variant} className={cn("h-7 w-auto shrink-0", className)} />;
}
