"use client";

import { createContext, useContext } from "react";

const SystemAdminContext = createContext(false);

export function SystemAdminProvider({
  isSystemAdmin,
  children,
}: {
  isSystemAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <SystemAdminContext.Provider value={isSystemAdmin}>
      {children}
    </SystemAdminContext.Provider>
  );
}

export function useIsSystemAdmin(): boolean {
  return useContext(SystemAdminContext);
}
