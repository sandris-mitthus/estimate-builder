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
    let cancelIdle: (() => void) | null = null;

    async function loadAssignedMaterials() {
      try {
        const response = await fetch("/api/assigned-materials", {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
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

    // The banner is secondary content — wait for idle so it does not compete
    // with the page's own data on first paint.
    const idle = window.requestIdleCallback;
    if (typeof idle === "function") {
      const handle = idle(() => void loadAssignedMaterials(), { timeout: 2000 });
      cancelIdle = () => window.cancelIdleCallback?.(handle);
    } else {
      const timer = window.setTimeout(() => void loadAssignedMaterials(), 300);
      cancelIdle = () => window.clearTimeout(timer);
    }

    return () => {
      cancelIdle?.();
      controller.abort();
    };
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
