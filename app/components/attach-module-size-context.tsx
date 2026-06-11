"use client";

import { createContext, useContext, type ReactNode } from "react";

type AttachModuleSizeContextValue = {
  openAttachModal: (lineItemId: string, positionName: string) => void;
};

const AttachModuleSizeContext =
  createContext<AttachModuleSizeContextValue | null>(null);

export function AttachModuleSizeProvider({
  children,
  openAttachModal,
}: {
  children: ReactNode;
  openAttachModal: (lineItemId: string, positionName: string) => void;
}) {
  return (
    <AttachModuleSizeContext.Provider value={{ openAttachModal }}>
      {children}
    </AttachModuleSizeContext.Provider>
  );
}

export function useAttachModuleSize(): AttachModuleSizeContextValue {
  const context = useContext(AttachModuleSizeContext);
  if (!context) {
    throw new Error(
      "useAttachModuleSize must be used within AttachModuleSizeProvider",
    );
  }
  return context;
}
