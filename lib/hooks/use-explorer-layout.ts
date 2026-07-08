"use client";

import * as React from "react";

const STORAGE_KEY = "api-portal:explorer-layout";

export const EXPLORER_LAYOUT = {
  left: { default: 280, min: 200, max: 420, collapsed: 40 },
  right: { default: 440, min: 300, max: 720, collapsed: 40 }
} as const;

export type ExplorerLayoutState = {
  leftWidth: number;
  rightWidth: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
};

const DEFAULT_STATE: ExplorerLayoutState = {
  leftWidth: EXPLORER_LAYOUT.left.default,
  rightWidth: EXPLORER_LAYOUT.right.default,
  leftCollapsed: false,
  rightCollapsed: false
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function loadState(): ExplorerLayoutState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<ExplorerLayoutState>;
    return {
      leftWidth: clamp(
        parsed.leftWidth ?? DEFAULT_STATE.leftWidth,
        EXPLORER_LAYOUT.left.min,
        EXPLORER_LAYOUT.left.max
      ),
      rightWidth: clamp(
        parsed.rightWidth ?? DEFAULT_STATE.rightWidth,
        EXPLORER_LAYOUT.right.min,
        EXPLORER_LAYOUT.right.max
      ),
      leftCollapsed: Boolean(parsed.leftCollapsed),
      rightCollapsed: Boolean(parsed.rightCollapsed)
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useExplorerLayout() {
  const [state, setState] = React.useState<ExplorerLayoutState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const resizeLeft = React.useCallback((delta: number) => {
    setState((prev) => {
      if (prev.leftCollapsed) return prev;
      return {
        ...prev,
        leftWidth: clamp(prev.leftWidth + delta, EXPLORER_LAYOUT.left.min, EXPLORER_LAYOUT.left.max)
      };
    });
  }, []);

  const resizeRight = React.useCallback((delta: number) => {
    setState((prev) => {
      if (prev.rightCollapsed) return prev;
      return {
        ...prev,
        rightWidth: clamp(prev.rightWidth - delta, EXPLORER_LAYOUT.right.min, EXPLORER_LAYOUT.right.max)
      };
    });
  }, []);

  const toggleLeft = React.useCallback(() => {
    setState((prev) => ({ ...prev, leftCollapsed: !prev.leftCollapsed }));
  }, []);

  const toggleRight = React.useCallback(() => {
    setState((prev) => ({ ...prev, rightCollapsed: !prev.rightCollapsed }));
  }, []);

  return {
    ...state,
    hydrated,
    resizeLeft,
    resizeRight,
    toggleLeft,
    toggleRight
  };
}
