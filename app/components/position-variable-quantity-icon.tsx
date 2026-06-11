"use client";

import { Tooltip } from "@/app/components/tooltip";

type PositionVariableQuantityIconProps = {
  enabled: boolean;
};

export function PositionVariableQuantityIcon({
  enabled,
}: PositionVariableQuantityIconProps) {
  if (!enabled) return null;

  return (
    <Tooltip label="Individuāls apjoms katram projektam">
      <span
        className="inline-flex shrink-0 items-center text-red-600"
        aria-label="Individuāls apjoms katram projektam"
      >
        <i className="fas fa-random text-sm" aria-hidden="true" />
      </span>
    </Tooltip>
  );
}
