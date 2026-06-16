"use client";

import { createContext, useContext } from "react";

const EstimatePlannedProfitContext = createContext(0);

export function EstimatePlannedProfitProvider({
  percent,
  children,
}: {
  percent: number;
  children: React.ReactNode;
}) {
  return (
    <EstimatePlannedProfitContext.Provider value={percent}>
      {children}
    </EstimatePlannedProfitContext.Provider>
  );
}

export function useEstimatePlannedProfitPercent(): number {
  return useContext(EstimatePlannedProfitContext);
}
