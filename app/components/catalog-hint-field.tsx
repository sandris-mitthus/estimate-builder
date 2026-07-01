"use client";

import { useEffect, useState } from "react";
import { EstimateLineItemNameField } from "@/app/components/estimate-line-item-name-field";
import { useTranslations } from "@/app/components/translations-provider";
import { catalogPositionToLineItemRef } from "@/app/lib/estimates/composite-line-item";
import type { LineItemCatalogRef } from "@/app/lib/estimates/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

type CatalogHintFieldProps = {
  value: LineItemCatalogRef | null;
  onChange: (ref: LineItemCatalogRef | null) => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate?: number | null;
  placeholder?: string;
  /** Jau pievienotās kataloga pozīcijas — hintos nerāda. */
  excludedCatalogKeys?: ReadonlySet<string>;
};

const fieldClassName =
  "w-full min-h-[2.75rem] resize-none rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm leading-snug whitespace-normal break-words transition [field-sizing:content] focus:border-zinc-300 focus:outline-none";

/** Materiāls / mehānisms ar hintiem — cena nāk no izvēlētās kataloga pozīcijas. */
export function CatalogHintField({
  value,
  onChange,
  catalogPositions,
  defaultHourlyRate = null,
  placeholder,
  excludedCatalogKeys,
}: CatalogHintFieldProps) {
  const { t } = useTranslations();
  const [query, setQuery] = useState(value?.name ?? "");

  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value?.name, value?.positionPriceId]);

  return (
    <EstimateLineItemNameField
      value={query}
      catalogPositions={catalogPositions}
      defaultHourlyRate={defaultHourlyRate}
      excludedCatalogKeys={excludedCatalogKeys}
      className={fieldClassName}
      placeholder={placeholder ?? t("positions.catalog_search_placeholder", "Meklēt katalogā")}
      onNameChange={(name) => {
        setQuery(name);
        if (!name.trim()) {
          onChange(null);
        }
      }}
      onCatalogSelect={(position) => {
        setQuery(position.name);
        onChange(catalogPositionToLineItemRef(position));
      }}
    />
  );
}
