"use client";

import { useDroppable } from "@dnd-kit/core";
import { useMemo, type ReactNode } from "react";
import { ProjectMaterialRowActions } from "@/app/components/project-material-row-actions";
import { useTranslations } from "@/app/components/translations-provider";
import { aggregateProjectMaterials } from "@/app/lib/estimates/aggregate-project-materials";
import type { AggregatedProjectMaterial } from "@/app/lib/estimates/aggregate-project-materials";
import { formatMoneyDisplay } from "@/app/lib/estimates/format-money";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import { formatQuantityDisplay } from "@/app/lib/positions/variable-quantity";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import type { UserSummary } from "@/app/lib/users/types";

type ProjectMaterialsTableProps = {
  projectId: string;
  categories: EstimateCategory[];
  catalogPositions: PositionPriceSummary[];
  moduleSizeOptions: BuildingModuleSizeOption[];
  orderedMaterialPositionIds: string[];
  materialAssigneeUserIds?: Record<string, string>;
  users?: UserSummary[];
  delegationEnabled?: boolean;
  assigningMaterialId?: string | null;
  visibleMaterialIds?: string[];
  hideHeader?: boolean;
  headingId?: string;
  currency?: string | null;
  useFrozenPrices?: boolean;
  onMaterialOrdered: (orderedIds: string[]) => void;
};

type DroppableMaterialRowProps = {
  positionPriceId: string;
  delegationEnabled: boolean;
  hasPriceChange: boolean;
  isAssigning: boolean;
  children: ReactNode;
};

function DroppableMaterialRow({
  positionPriceId,
  delegationEnabled,
  hasPriceChange,
  isAssigning,
  children,
}: DroppableMaterialRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `delegation-material:${positionPriceId}`,
    data: { type: "delegation-material", positionPriceId },
    disabled: !delegationEnabled || isAssigning,
  });

  return (
    <tr
      ref={setNodeRef}
      className={`border-b border-zinc-100 last:border-b-0 ${
        hasPriceChange ? "bg-red-50/40" : ""
      } ${isAssigning ? "pointer-events-none opacity-45" : ""} ${
        isOver ? "bg-emerald-50/80 ring-1 ring-inset ring-emerald-300" : ""
      }`}
    >
      {children}
    </tr>
  );
}

export function ProjectMaterialsTable({
  projectId,
  categories,
  catalogPositions,
  moduleSizeOptions,
  orderedMaterialPositionIds,
  materialAssigneeUserIds = {},
  users = [],
  delegationEnabled = false,
  assigningMaterialId = null,
  visibleMaterialIds,
  hideHeader = false,
  headingId = "project-materials-heading",
  currency = null,
  useFrozenPrices = false,
  onMaterialOrdered,
}: ProjectMaterialsTableProps) {
  const { t } = useTranslations();
  const visibleMaterialIdSet = useMemo(
    () =>
      visibleMaterialIds ? new Set(visibleMaterialIds) : null,
    [visibleMaterialIds],
  );

  const materials = useMemo(
    () =>
      aggregateProjectMaterials(
        categories,
        catalogPositions,
        moduleSizeOptions,
        { useFrozenPrices },
      )
        .filter(
          (row) => !orderedMaterialPositionIds.includes(row.positionPriceId),
        )
        .filter(
          (row) =>
            !visibleMaterialIdSet ||
            visibleMaterialIdSet.has(row.positionPriceId),
        ),
    [
      categories,
      catalogPositions,
      moduleSizeOptions,
      useFrozenPrices,
      orderedMaterialPositionIds,
      visibleMaterialIdSet,
    ],
  );

  const catalogById = useMemo(
    () => new Map(catalogPositions.map((position) => [position.id, position])),
    [catalogPositions],
  );

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const budgetGrandTotal = useMemo(
    () => materials.reduce((sum, row) => sum + row.budgetTotal, 0),
    [materials],
  );

  if (materials.length === 0) {
    return null;
  }

  function resolveAssigneeName(row: AggregatedProjectMaterial): string | null {
    const userId = materialAssigneeUserIds[row.positionPriceId];
    if (!userId) {
      return null;
    }

    return usersById.get(userId)?.name ?? null;
  }

  return (
    <section
      aria-labelledby={hideHeader ? undefined : headingId}
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
    >
      {hideHeader ? null : (
        <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-3">
          <h2
            id={headingId}
            className="text-sm font-semibold text-zinc-900"
          >
            {t("materials.list.title", "Materiālu saraksts")}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {t(
              "materials.list.description",
              "Apstiprinātās tāmes materiāli ar apjomiem un budžeta cenu uz mērvienību — salīdzini ar pasūtījuma cenu.",
            )}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-white text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-2.5 font-medium">{t("common.name", "Nosaukums")}</th>
              <th className="px-3 py-2.5 font-medium">{t("common.unit_short", "Mērv.")}</th>
              <th className="px-3 py-2.5 text-right font-medium">{t("common.quantity_short", "Apjoms")}</th>
              <th className="px-3 py-2.5 text-right font-medium">
                {t("materials.budget_unit_price", "Budžeta cena")}
              </th>
              <th className="px-4 py-2.5 text-right font-medium">{t("materials.budget", "Budžets")}</th>
              <th className="px-3 py-2.5 text-right font-medium">{t("common.actions", "Darbības")}</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((row) => {
              const assigneeName = resolveAssigneeName(row);
              const isAssigning = assigningMaterialId === row.positionPriceId;

              return (
                <DroppableMaterialRow
                  key={row.positionPriceId}
                  positionPriceId={row.positionPriceId}
                  delegationEnabled={delegationEnabled}
                  hasPriceChange={row.hasPriceChange}
                  isAssigning={isAssigning}
                >
                  <td className="px-4 py-2.5 text-zinc-900">
                    <div className="flex items-start gap-2">
                      {isAssigning ? (
                        <i
                          className="fas fa-spinner mt-0.5 animate-spin text-xs text-zinc-400"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p>{row.name}</p>
                        {assigneeName ? (
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {assigneeName}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600">{row.unit}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-zinc-900">
                    {formatQuantityDisplay(row.quantity)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span
                      className={
                        row.hasPriceChange
                          ? "font-medium text-red-700"
                          : "text-zinc-700"
                      }
                    >
                      {formatMoneyDisplay(row.unitPrice, currency)}
                    </span>
                    {row.hasPriceChange ? (
                      <p className="mt-0.5 text-[11px] font-normal text-red-600">
                        {t("materials.catalog_price_prefix", "Katalogā:")}{" "}
                        {formatMoneyDisplay(row.catalogUnitPrice, currency)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-zinc-900">
                    {formatMoneyDisplay(row.budgetTotal, currency)}
                  </td>
                  <td className="px-3 py-2.5">
                    <ProjectMaterialRowActions
                      projectId={projectId}
                      material={row}
                      catalogPosition={catalogById.get(row.positionPriceId)}
                      currency={currency}
                      onOrdered={onMaterialOrdered}
                      disabled={isAssigning}
                    />
                  </td>
                </DroppableMaterialRow>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-200 bg-emerald-50/40">
              <td
                colSpan={4}
                className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                {t("materials.total", "Kopā materiāli")}
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums text-zinc-900">
                {formatMoneyDisplay(budgetGrandTotal, currency)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
