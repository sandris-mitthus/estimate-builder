"use client";

import { Tooltip } from "@/app/components/tooltip";

export function ModuleMissingDataIcon() {
  return (
    <Tooltip
      label="Nav ievadīti moduļu dati"
      labelClassName="max-w-none whitespace-nowrap"
    >
      <span
        className="inline-flex shrink-0 items-center text-red-600"
        aria-label="Nav ievadīti moduļu dati"
      >
        <i className="fas fa-house-damage text-sm" aria-hidden="true" />
      </span>
    </Tooltip>
  );
}
