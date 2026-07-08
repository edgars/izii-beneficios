"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

type MagneticButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
};

export function MagneticButton({ href, children, variant = "primary", className }: MagneticButtonProps) {
  const ref = React.useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  function handleMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    x.set(offsetX * 0.15);
    y.set(offsetY * 0.15);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div style={{ x: springX, y: springY }} className="inline-block">
      <Link
        ref={ref}
        href={href}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className={cn(
          "group relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors",
          variant === "primary" &&
            "bg-izii-green text-white shadow-lg shadow-izii-green/20 hover:bg-izii-charcoal",
          variant === "ghost" &&
            "border border-slate-200 bg-white text-izii-charcoal hover:border-izii-green/40 hover:text-izii-green",
          className
        )}
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-izii-dark/0 via-white/10 to-izii-lime/0 opacity-0 transition-opacity group-hover:opacity-100" />
        <span className="relative inline-flex items-center gap-2">{children}</span>
      </Link>
    </motion.div>
  );
}
