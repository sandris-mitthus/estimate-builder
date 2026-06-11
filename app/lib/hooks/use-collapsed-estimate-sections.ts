"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readCollapsedSectionIds,
  writeCollapsedSectionIds,
} from "@/app/lib/estimate-positions/collapsed-sections-cookie";

export function useCollapsedEstimateSections(documentId: string) {
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<
    ReadonlySet<string>
  >(() => new Set());

  useEffect(() => {
    setCollapsedSectionIds(readCollapsedSectionIds(documentId));
  }, [documentId]);

  const toggleSectionCollapsed = useCallback(
    (sectionId: string) => {
      setCollapsedSectionIds((current) => {
        const next = new Set(current);
        if (next.has(sectionId)) {
          next.delete(sectionId);
        } else {
          next.add(sectionId);
        }
        writeCollapsedSectionIds(documentId, next);
        return next;
      });
    },
    [documentId],
  );

  const expandSection = useCallback(
    (sectionId: string) => {
      setCollapsedSectionIds((current) => {
        if (!current.has(sectionId)) {
          return current;
        }

        const next = new Set(current);
        next.delete(sectionId);
        writeCollapsedSectionIds(documentId, next);
        return next;
      });
    },
    [documentId],
  );

  const isSectionCollapsed = useCallback(
    (sectionId: string) => collapsedSectionIds.has(sectionId),
    [collapsedSectionIds],
  );

  return {
    collapsedSectionIds,
    toggleSectionCollapsed,
    expandSection,
    isSectionCollapsed,
  };
}
