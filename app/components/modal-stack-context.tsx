"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type ModalStackContextValue = {
  depth: number;
  notifyNestedOpen: (delta: number) => void;
};

const defaultModalStackContextValue: ModalStackContextValue = {
  depth: 0,
  notifyNestedOpen: () => {},
};

const ModalStackContext = createContext<ModalStackContextValue>(
  defaultModalStackContextValue,
);

export function useModalStack() {
  return useContext(ModalStackContext);
}

type ModalStackProviderProps = {
  value: ModalStackContextValue;
  children: ReactNode;
};

export function ModalStackProvider({ value, children }: ModalStackProviderProps) {
  return (
    <ModalStackContext.Provider value={value}>{children}</ModalStackContext.Provider>
  );
}
