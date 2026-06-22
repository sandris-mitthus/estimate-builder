"use client";

import { useEffect, useState } from "react";
import { AssignedMaterialsBanner } from "@/app/components/assigned-materials-banner";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import type { UserAssignedMaterialsProjectGroup } from "@/app/lib/projects/list-user-assigned-materials";
import type { UserSummary } from "@/app/lib/users/types";

type AssignedMaterialsPayload = {
  groups: UserAssignedMaterialsProjectGroup[];
  catalogPositions: PositionPriceSummary[];
  currency: string | null;
  currentUser: UserSummary;
};

export function AssignedMaterialsBannerLoader() {
  const [payload, setPayload] = useState<AssignedMaterialsPayload | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAssignedMaterials() {
      try {
        const response = await fetch("/api/assigned-materials", {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const nextPayload = (await response.json()) as AssignedMaterialsPayload;
        if (nextPayload.groups.length > 0) {
          setPayload(nextPayload);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Assigned materials banner failed to load:", error);
        }
      }
    }

    void loadAssignedMaterials();

    return () => controller.abort();
  }, []);

  if (!payload) {
    return null;
  }

  return (
    <AssignedMaterialsBanner
      groups={payload.groups}
      catalogPositions={payload.catalogPositions}
      currency={payload.currency}
      currentUser={payload.currentUser}
    />
  );
}
