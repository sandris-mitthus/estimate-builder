"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { EstimateLineItem } from "@/app/lib/estimates/types";

type PositionModalContextValue = {
  openPositionModal: (
    item: EstimateLineItem,
    onSave: (next: EstimateLineItem) => void,
  ) => void;
};

const PositionModalContext = createContext<PositionModalContextValue | null>(
  null,
);

export function PositionModalProvider({
  children,
  openPositionModal,
}: {
  children: ReactNode;
  openPositionModal: PositionModalContextValue["openPositionModal"];
}) {
  return (
    <PositionModalContext.Provider value={{ openPositionModal }}>
      {children}
    </PositionModalContext.Provider>
  );
}

export function usePositionModal(): PositionModalContextValue {
  const context = useContext(PositionModalContext);
  if (!context) {
    throw new Error(
      "usePositionModal must be used within PositionModalProvider",
    );
  }
  return context;
}
