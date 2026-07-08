"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type MotionHighlightProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function MotionHighlight({ children, className, delay = 0 }: MotionHighlightProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        reduce
          ? undefined
          : {
              y: -2,
              transition: { type: "spring", stiffness: 400, damping: 28 }
            }
      }
      className={cn(
        "group relative overflow-hidden rounded-xl transition-shadow",
        !reduce && "hover:shadow-[0_0_0_1px_hsl(var(--glow)/0.25),0_8px_32px_-12px_hsl(var(--glow)/0.35)]",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-izii-lime/0 via-izii-lime/0 to-izii-green/0 opacity-0 transition-opacity duration-300 group-hover:from-izii-lime/[0.06] group-hover:to-izii-dark/[0.08] group-hover:opacity-100"
      />
      <span className="relative">{children}</span>
    </motion.div>
  );
}
