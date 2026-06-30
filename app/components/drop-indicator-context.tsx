"use client";

import {
  useCallback,
  createContext,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { canDropDragId } from "@/app/lib/estimates/reorder-estimate";

type DropIndicatorContextValue = {
  activeId: string | null;
  overId: string | null;
  setActiveId: (id: string | null) => void;
  setOverId: (id: string | null) => void;
  clear: () => void;
};

const DropIndicatorContext = createContext<DropIndicatorContextValue | null>(
  null,
);

export function DropIndicatorProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const overIdRef = useRef<string | null>(null);
  const pendingOverIdRef = useRef<string | null>(null);
  const frameRef = useRef<number | null>(null);

  const setThrottledOverId = useCallback((id: string | null) => {
    if (pendingOverIdRef.current === id || overIdRef.current === id) {
      return;
    }

    pendingOverIdRef.current = id;

    if (frameRef.current != null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const nextId = pendingOverIdRef.current;
      pendingOverIdRef.current = null;

      if (overIdRef.current === nextId) {
        return;
      }

      overIdRef.current = nextId;
      setOverId(nextId);
    });
  }, []);

  const clear = useCallback(() => {
    if (frameRef.current != null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    pendingOverIdRef.current = null;
    overIdRef.current = null;
    setActiveId(null);
    setOverId(null);
  }, []);

  useEffect(
    () => () => {
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      activeId,
      overId,
      setActiveId,
      setOverId: setThrottledOverId,
      clear,
    }),
    [activeId, clear, overId, setThrottledOverId],
  );

  return (
    <DropIndicatorContext.Provider value={value}>
      {children}
    </DropIndicatorContext.Provider>
  );
}

function useDropIndicatorContext() {
  const context = useContext(DropIndicatorContext);
  if (!context) {
    throw new Error("DropIndicatorProvider is required");
  }
  return context;
}

export function useShowDropLine(sortId: string): boolean {
  const { activeId, overId } = useDropIndicatorContext();

  if (!activeId || !overId || activeId === overId) return false;

  return overId === sortId && canDropDragId(activeId, overId);
}

export function useDropIndicatorActions() {
  const { setActiveId, setOverId, clear } = useDropIndicatorContext();
  return { setActiveId, setOverId, clear };
}
