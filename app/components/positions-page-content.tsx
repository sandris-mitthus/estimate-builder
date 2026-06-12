"use client";



import { useMemo, useState } from "react";

import { AddPositionButton } from "@/app/components/add-position-button";

import { PositionPriceCell } from "@/app/components/position-price-cell";

import { PositionRowActions } from "@/app/components/position-row-actions";

import { SectionPage } from "@/app/components/section-page";

import {

  formInputClassName,

  formInputFullWidthClass,

} from "@/app/lib/form/input-styles";

import { PositionCostTypeDisplay } from "@/app/components/position-cost-type-display";
import { PositionCostTypeFilter as PositionCostTypeFilterControl } from "@/app/components/position-cost-type-filter";
import { PositionVariableQuantityIcon } from "@/app/components/position-variable-quantity-icon";
import { collectKnownUnits } from "@/app/lib/positions/collect-known-units";

import {
  getVisiblePositions,
  filterCatalogPositions,
  type PositionCostTypeFilter,
} from "@/app/lib/positions/filter-positions";

import type { PositionPriceSummary } from "@/app/lib/positions/types";

import type { CurrencyCode } from "@/app/lib/settings/currencies";



type PositionsPageContentProps = {

  initialPositions: PositionPriceSummary[];

  currency: CurrencyCode;

};



export function PositionsPageContent({

  initialPositions,

  currency,

}: PositionsPageContentProps) {

  const [searchQuery, setSearchQuery] = useState("");
  const [costTypeFilter, setCostTypeFilter] =
    useState<PositionCostTypeFilter>("all");

  const catalogPositions = useMemo(
    () => filterCatalogPositions(initialPositions),
    [initialPositions],
  );

  const knownUnits = collectKnownUnits(catalogPositions);

  const visiblePositions = useMemo(

    () =>
      getVisiblePositions(catalogPositions, searchQuery, costTypeFilter),

    [catalogPositions, searchQuery, costTypeFilter],

  );

  const isSearching = searchQuery.trim().length > 0;
  const isFiltering = isSearching || costTypeFilter !== "all";



  return (

    <SectionPage

      title="Pozicijas"

      subtitle={

        isFiltering

          ? `${visiblePositions.length} no ${catalogPositions.length} pozīcijām`

          : `${catalogPositions.length} pozīcijas katalogā`

      }

      actions={<AddPositionButton knownUnits={knownUnits} />}

    >

      <div className="space-y-3">

        <label htmlFor="positions-search" className="relative block">

          <span className="sr-only">Meklēt pozīcijas</span>

          <i

            className="fas fa-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400"

            aria-hidden="true"

          />

          <input

            id="positions-search"

            type="search"

            value={searchQuery}

            onChange={(event) => setSearchQuery(event.target.value)}

            placeholder="Meklēt pozīcijas…"

            className={`${formInputFullWidthClass} ${formInputClassName()} pl-9`}

          />

        </label>

        <PositionCostTypeFilterControl
          id="positions-cost-type-filter"
          value={costTypeFilter}
          onChange={setCostTypeFilter}
        />

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

          <table className="w-full border-collapse text-sm">

            <thead>

              <tr className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">

                <th className="border-b border-zinc-200 px-4 py-2.5 text-left">

                  Nosaukums

                </th>

                <th className="w-32 border-b border-zinc-200 px-4 py-2.5 text-left">

                  Veids

                </th>

                <th className="w-52 border-b border-zinc-200 px-4 py-2.5 text-left">

                  Cena

                </th>

                <th className="w-44 border-b border-zinc-200 px-4 py-2.5 text-right">

                  Darbības

                </th>

              </tr>

            </thead>

            <tbody>

              {visiblePositions.length === 0 ? (

                <tr>

                  <td

                    colSpan={4}

                    className="px-4 py-10 text-center text-sm text-zinc-500"

                  >

                    {isFiltering

                      ? "Nav atrastu pozīciju."

                      : "Nav pozīciju katalogā."}

                  </td>

                </tr>

              ) : (

                visiblePositions.map((position) => (

                  <tr

                    key={position.id}

                    className="border-b border-zinc-200 transition-colors odd:bg-white even:bg-zinc-100 hover:bg-emerald-900/12 last:border-b-0"

                  >

                    <td className="cursor-default px-4 py-3 text-zinc-900">
                      <span className="inline-flex items-center gap-1.5">
                        {position.name}
                        <PositionVariableQuantityIcon
                          enabled={position.variableQuantity}
                        />
                      </span>
                    </td>

                    <td className="cursor-default px-4 py-3 text-zinc-600">
                      <PositionCostTypeDisplay costType={position.costType} />
                    </td>

                    <td className="px-4 py-3">

                      <PositionPriceCell
                        position={position}
                        currency={currency}
                      />

                    </td>

                    <td className="px-4 py-3">

                      <PositionRowActions

                        position={position}

                        knownUnits={collectKnownUnits(catalogPositions, {

                          excludePositionId: position.id,

                        })}

                        currency={currency}

                      />

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </SectionPage>

  );

}

