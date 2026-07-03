"use client";

import { Tooltip } from "@/app/components/tooltip";

export function EstimateTableSubheaderLabel({ label }: { label: string }) {
  return (
    <Tooltip label={label} className="block w-full min-w-0">
      <span className="block min-w-0 truncate" aria-label={label}>
        {label}
      </span>
    </Tooltip>
  );
}
