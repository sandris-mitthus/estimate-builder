"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ProjectMaterialsTable } from "@/app/components/project-materials-table";
import { useAssignedMaterialsBannerExpanded } from "@/app/lib/hooks/use-assigned-materials-banner-expanded";
import type { UserAssignedMaterialsProjectGroup } from "@/app/lib/projects/list-user-assigned-materials";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import type { UserSummary } from "@/app/lib/users/types";

type AssignedMaterialsBannerProps = {
  groups: UserAssignedMaterialsProjectGroup[];
  catalogPositions: PositionPriceSummary[];
  currency?: string | null;
  currentUser: UserSummary;
};

export function AssignedMaterialsBanner({
  groups,
  catalogPositions,
  currency = null,
  currentUser,
}: AssignedMaterialsBannerProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const { isExpanded, preferenceLoaded, toggleExpanded } =
    useAssignedMaterialsBannerExpanded(currentUser.id);
  const [animateToggle, setAnimateToggle] = useState(false);
  const isContentOpen = preferenceLoaded && isExpanded;

  const handleToggleExpanded = useCallback(() => {
    setAnimateToggle(true);
    toggleExpanded();
  }, [toggleExpanded]);

  useEffect(() => {
    if (activeIndex >= groups.length) {
      setActiveIndex(Math.max(0, groups.length - 1));
    }
  }, [activeIndex, groups.length]);

  if (groups.length === 0) {
    return null;
  }

  const group = groups[activeIndex];
  if (!group) {
    return null;
  }

  const projectLabel = group.moduleName
    ? `${group.moduleName} · ${group.projectName}`
    : group.projectName;

  return (
    <section
      aria-labelledby="assigned-materials-banner-heading"
      className="border-b border-amber-200 bg-amber-50/70"
    >
      <div className="mx-auto max-w-[1480px] px-4 py-4 md:px-6">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <h2
            id="assigned-materials-banner-heading"
            className="text-sm font-semibold leading-none text-amber-950"
          >
            Jums piešķirti materiāli pasūtīšanai
          </h2>

          <button
            type="button"
            onClick={handleToggleExpanded}
            aria-expanded={isContentOpen}
            aria-controls="assigned-materials-banner-content"
            aria-label={isContentOpen ? "Sakļaut bloku" : "Izvērst bloku"}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-amber-200 bg-white text-amber-800 transition hover:bg-amber-100"
          >
            <i
              className={`fas fa-chevron-down text-xs ${
                animateToggle
                  ? "transition-transform duration-300 ease-in-out"
                  : "transition-none"
              } ${isContentOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          id="assigned-materials-banner-content"
          aria-hidden={!isContentOpen}
          className={
            animateToggle
              ? "grid transition-[grid-template-rows] duration-300 ease-in-out"
              : "grid"
          }
          style={{ gridTemplateRows: isContentOpen ? "1fr" : "0fr" }}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`pt-4 ${
                animateToggle
                  ? "transition-opacity duration-300 ease-in-out"
                  : ""
              } ${isContentOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <p className="min-w-0 text-sm text-amber-900/90">
                Projekts{" "}
                <Link
                  href={`/${group.projectId}`}
                  className="font-medium text-amber-950 underline decoration-amber-300 underline-offset-2 transition hover:decoration-amber-500"
                >
                  {projectLabel}
                </Link>
                {group.projectAddress ? (
                  <span className="text-amber-800/80">
                    {" "}
                    — {group.projectAddress}
                  </span>
                ) : null}
              </p>

              {groups.length > 1 ? (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((index) => Math.max(0, index - 1))
                    }
                    disabled={activeIndex === 0}
                    aria-label="Iepriekšējais projekts"
                    className="inline-flex size-8 items-center justify-center rounded-md border border-amber-200 bg-white text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <i
                      className="fas fa-chevron-left text-xs"
                      aria-hidden="true"
                    />
                  </button>
                  <span className="min-w-[4.5rem] text-center text-xs font-medium tabular-nums text-amber-900">
                    {activeIndex + 1} / {groups.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((index) =>
                        Math.min(groups.length - 1, index + 1),
                      )
                    }
                    disabled={activeIndex >= groups.length - 1}
                    aria-label="Nākamais projekts"
                    className="inline-flex size-8 items-center justify-center rounded-md border border-amber-200 bg-white text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <i
                      className="fas fa-chevron-right text-xs"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              ) : null}
            </div>

            <ProjectMaterialsTable
              key={group.projectId}
              projectId={group.projectId}
              categories={group.categories}
              catalogPositions={catalogPositions}
              moduleSizeOptions={group.moduleSizeOptions}
              orderedMaterialPositionIds={group.orderedMaterialPositionIds}
              visibleMaterialIds={group.assignedMaterialIds}
              materialAssigneeUserIds={group.materialAssigneeUserIds}
              users={[currentUser]}
              currency={currency}
              useFrozenPrices
              hideHeader
              headingId={`assigned-materials-table-${group.projectId}`}
              onMaterialOrdered={() => router.refresh()}
            />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
