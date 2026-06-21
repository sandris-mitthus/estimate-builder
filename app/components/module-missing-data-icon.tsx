"use client";

import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";

export function ModuleMissingDataIcon() {
  const { t } = useTranslations();
  const label = t("modules.data_missing", "Nav ievadīti moduļu dati");

  return (
    <Tooltip
      label={label}
      labelClassName="max-w-none whitespace-nowrap"
    >
      <span
        className="inline-flex shrink-0 items-center text-red-600"
        aria-label={label}
      >
        <i className="fas fa-house-damage text-sm" aria-hidden="true" />
      </span>
    </Tooltip>
  );
}
