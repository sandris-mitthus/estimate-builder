"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readAssignedMaterialsBannerCollapsed,
  writeAssignedMaterialsBannerCollapsed,
} from "@/app/lib/projects/assigned-materials-banner-cookie";

export function useAssignedMaterialsBannerExpanded(userId: string) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);

  useEffect(() => {
    setIsExpanded(!readAssignedMaterialsBannerCollapsed(userId));
    setPreferenceLoaded(true);
  }, [userId]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((current) => {
      const next = !current;
      writeAssignedMaterialsBannerCollapsed(userId, !next);
      return next;
    });
  }, [userId]);

  return {
    isExpanded,
    preferenceLoaded,
    toggleExpanded,
  };
}
