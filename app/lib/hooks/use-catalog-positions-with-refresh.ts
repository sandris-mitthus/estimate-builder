"use client";

import { useCallback, useEffect, useState } from "react";
import { catalogPositionsDiffer } from "@/app/lib/positions/catalog-positions-differ";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

type UseCatalogPositionsWithRefreshOptions = {
  /** Atjauno katalogu, kad lietotājs atgriežas uz šo cilni. */
  refreshOnVisible?: boolean;
};

async function fetchCatalogPositionsForHints(): Promise<
  PositionPriceSummary[] | null
> {
  const response = await fetch("/api/catalog-positions/hints", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    positions?: PositionPriceSummary[];
  };

  return Array.isArray(payload.positions) ? payload.positions : null;
}

/** Servera props atjauninājums — neaizstāj klienta fetch, ja tas jau satur jaunākus ID. */
function shouldApplyServerCatalogPositions(
  current: ReadonlyArray<PositionPriceSummary>,
  next: ReadonlyArray<PositionPriceSummary>,
): boolean {
  if (!catalogPositionsDiffer(current, next)) {
    return false;
  }

  const currentIds = new Set(current.map((position) => position.id));
  if (next.some((position) => !currentIds.has(position.id))) {
    return true;
  }

  return next.length > current.length;
}

export function useCatalogPositionsWithRefresh(
  initialCatalogPositions: PositionPriceSummary[],
  options: UseCatalogPositionsWithRefreshOptions = {},
) {
  const { refreshOnVisible = true } = options;
  const [catalogPositions, setCatalogPositions] = useState(
    initialCatalogPositions,
  );

  useEffect(() => {
    setCatalogPositions((current) =>
      shouldApplyServerCatalogPositions(current, initialCatalogPositions)
        ? initialCatalogPositions
        : current,
    );
  }, [initialCatalogPositions]);

  const refreshCatalogPositions = useCallback(() => {
    void (async () => {
      const positions = await fetchCatalogPositionsForHints();
      if (!positions) {
        return;
      }

      setCatalogPositions((current) =>
        catalogPositionsDiffer(current, positions) ? positions : current,
      );
    })();
  }, []);

  useEffect(() => {
    if (!refreshOnVisible) {
      return;
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshCatalogPositions();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshCatalogPositions, refreshOnVisible]);

  return { catalogPositions, refreshCatalogPositions };
}
