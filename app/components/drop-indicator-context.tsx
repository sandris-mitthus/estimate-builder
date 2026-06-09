"use client";

import {
  createContext,
  useContext,
  useMemo,
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

  const value = useMemo(
    () => ({
      activeId,
      overId,
      setActiveId,
      setOverId,
      clear: () => {
        setActiveId(null);
        setOverId(null);
      },
    }),
    [activeId, overId],
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
