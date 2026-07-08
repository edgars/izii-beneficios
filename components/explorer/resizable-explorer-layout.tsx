"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPLORER_LAYOUT, useExplorerLayout } from "@/lib/hooks/use-explorer-layout";
import { cn } from "@/lib/utils";

type ResizableExplorerLayoutProps = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

export function ResizableExplorerLayout({ left, center, right }: ResizableExplorerLayoutProps) {
  const reduce = useReducedMotion();
  const {
    leftWidth,
    rightWidth,
    leftCollapsed,
    rightCollapsed,
    hydrated,
    resizeLeft,
    resizeRight,
    toggleLeft,
    toggleRight
  } = useExplorerLayout();

  return (
    <>
      {/* Mobile / tablet: stacked */}
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex min-h-[calc(100dvh-56px)] flex-col xl:hidden"
      >
        <section className="min-h-0 flex-1 overflow-y-auto border-b border-slate-200">{center}</section>
        <aside className="min-h-[min(50dvh,520px)] shrink-0 overflow-hidden bg-background">{right}</aside>
      </motion.div>

      {/* Desktop: resizable 3-column */}
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="hidden min-h-[calc(100dvh-56px)] overflow-hidden xl:flex"
        style={{ opacity: hydrated ? 1 : 0.98 }}
      >
        {/* Left panel */}
        <AnimatePresence initial={false} mode="popLayout">
          {leftCollapsed ? (
            <CollapsedRail
              key="left-rail"
              side="left"
              label="Endpoints"
              onExpand={toggleLeft}
            />
          ) : (
            <motion.aside
              key="left-panel"
              initial={reduce ? false : { width: 0, opacity: 0 }}
              animate={{ width: leftWidth, opacity: 1 }}
              exit={reduce ? undefined : { width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className="relative flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-card"
            >
              {left}
            </motion.aside>
          )}
        </AnimatePresence>

        <PanelDivider
          side="left"
          collapsed={leftCollapsed}
          onToggle={toggleLeft}
          onResize={resizeLeft}
        />

        <section className="relative min-h-0 min-w-[280px] flex-1 overflow-y-auto">
          {center}
        </section>

        <PanelDivider
          side="right"
          collapsed={rightCollapsed}
          onToggle={toggleRight}
          onResize={resizeRight}
        />

        <AnimatePresence initial={false} mode="popLayout">
          {rightCollapsed ? (
            <CollapsedRail
              key="right-rail"
              side="right"
              label="Console"
              onExpand={toggleRight}
            />
          ) : (
            <motion.aside
              key="right-panel"
              initial={reduce ? false : { width: 0, opacity: 0 }}
              animate={{ width: rightWidth, opacity: 1 }}
              exit={reduce ? undefined : { width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className="relative flex min-h-0 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-background"
            >
              {right}
            </motion.aside>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

function CollapsedRail({
  side,
  label,
  onExpand
}: {
  side: "left" | "right";
  label: string;
  onExpand: () => void;
}) {
  const Icon = side === "left" ? ChevronRight : ChevronLeft;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: EXPLORER_LAYOUT.left.collapsed, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      className={cn(
        "flex min-h-0 shrink-0 flex-col items-center gap-3 bg-card py-3",
        side === "left" ? "border-r border-slate-200" : "border-l border-slate-200"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-izii-lime"
        onClick={onExpand}
        aria-label={`Expandir ${label}`}
      >
        <Icon className="h-4 w-4" />
      </Button>
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 [writing-mode:vertical-rl]"
        style={{ textOrientation: "mixed" }}
      >
        {label}
      </span>
    </motion.aside>
  );
}

function PanelDivider({
  side,
  collapsed,
  onToggle,
  onResize
}: {
  side: "left" | "right";
  collapsed: boolean;
  onToggle: () => void;
  onResize: (delta: number) => void;
}) {
  const dragging = React.useRef(false);
  const lastX = React.useRef(0);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (collapsed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    lastX.current = e.clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const delta = e.clientX - lastX.current;
    lastX.current = e.clientX;
    onResize(delta);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  const CollapseIcon = side === "left" ? ChevronLeft : ChevronRight;

  return (
    <motion.div
      className="group relative z-10 flex w-3 shrink-0 items-stretch justify-center"
      whileHover={{ scale: 1 }}
    >
      <motion.div
        role="separator"
        aria-orientation="vertical"
        aria-label={side === "left" ? "Redimensionar painel de endpoints" : "Redimensionar console"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 touch-none transition-colors",
          collapsed ? "cursor-default bg-slate-100" : "cursor-col-resize bg-slate-200 hover:bg-izii-lime/50"
        )}
      />

      <motion.div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-3 w-3 text-slate-400" aria-hidden />
      </motion.div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          "pointer-events-auto absolute top-3 z-20 h-7 w-7 rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm backdrop-blur transition hover:border-izii-lime/35 hover:bg-slate-100 hover:text-izii-lime",
          side === "left" ? "-right-3" : "-left-3"
        )}
        aria-label={collapsed ? "Expandir painel" : "Fechar painel"}
      >
        <CollapseIcon className={cn("h-3.5 w-3.5", collapsed && "rotate-180")} />
      </Button>
    </motion.div>
  );
}
