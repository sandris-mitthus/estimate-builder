import type { ReactNode } from "react";
import { EstimateCollapsedSummaryDisplay } from "@/app/components/estimate-collapsed-summary-display";
import type { CollapsedSectionSummaryParts } from "@/app/lib/estimate-positions/collapsed-sections-cookie";

export function EstimateSectionActionsCell({
  actions,
  collapsedSummaryParts,
  showSummary = false,
  actionsVisible = true,
  className = "",
  onMouseEnter,
  onMouseLeave,
}: {
  actions: ReactNode;
  collapsedSummaryParts?: CollapsedSectionSummaryParts;
  showSummary?: boolean;
  actionsVisible?: boolean;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <div
      className={`ml-auto flex min-h-[1.75rem] shrink-0 items-center justify-end gap-0.5 ${className}`.trim()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {showSummary && collapsedSummaryParts ? (
        <EstimateCollapsedSummaryDisplay
          parts={collapsedSummaryParts}
          className="shrink min-w-0"
        />
      ) : null}
      <div
        className={`flex shrink-0 items-center gap-0.5 transition-opacity ${
          actionsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {actions}
      </div>
    </div>
  );
}
