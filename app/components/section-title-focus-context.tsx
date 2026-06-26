"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createEstimatePositionSection } from "@/app/lib/estimate-positions/create-empty";
import { useTranslations } from "@/app/components/translations-provider";

type SectionTitleFocusContextValue = {
  focusRowId: string | null;
  requestFocus: (rowId: string) => void;
  clearFocus: () => void;
};

const SectionTitleFocusContext =
  createContext<SectionTitleFocusContextValue | null>(null);

export function SectionTitleFocusProvider({ children }: { children: ReactNode }) {
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const requestFocus = useCallback((rowId: string) => {
    setFocusRowId(rowId);
  }, []);
  const clearFocus = useCallback(() => {
    setFocusRowId(null);
  }, []);

  const value = useMemo(
    () => ({ focusRowId, requestFocus, clearFocus }),
    [focusRowId, requestFocus, clearFocus],
  );

  return (
    <SectionTitleFocusContext.Provider value={value}>
      {children}
    </SectionTitleFocusContext.Provider>
  );
}

export function useSectionTitleFocus() {
  return useContext(SectionTitleFocusContext);
}

export function AddEstimateSectionButton({
  onAdd,
}: {
  onAdd: (section: ReturnType<typeof createEstimatePositionSection>) => void;
}) {
  const { t } = useTranslations();
  const focusCtx = useSectionTitleFocus();

  return (
    <button
      type="button"
      onClick={() => {
        const section = createEstimatePositionSection();
        focusCtx?.requestFocus(section.id);
        onAdd(section);
      }}
      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
    >
      {t("estimate.actions.add_section", "+ Tāmes pozīcija")}
    </button>
  );
}
