"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  acknowledgeSagataveStructureIntroAction,
  saveProjectEstimateAction,
  updateProjectEstimateDatesAction,
} from "@/app/(protected)/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { EstimateSectionRowActions } from "@/app/components/estimate-section-row-actions";
import { EstimateSectionActionsCell } from "@/app/components/estimate-section-actions-cell";
import { EstimateTableStickyShell } from "@/app/components/estimate-table-sticky-shell";
import { EstimateTableSubheaderLabel } from "@/app/components/estimate-table-header-label";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useTranslations } from "@/app/components/translations-provider";
import {
  VolumeSumCells,
  SectionLeadingEmptyCells,
  resolveLaborWorkloadHours,
  resolveLineItemVolumeSum,
  volumeSumFooterCell,
  volumeSumFooterCellTotal,
} from "@/app/components/estimate-volume-sum-cells";
import {
  calculateCategoryVolumeTotals,
  calculateSubcategoryVolumeTotals,
  type SectionVolumeTotals,
} from "@/app/lib/estimates/calculate-section-volume-totals";
import {
  VOLUME_PRICE_COLUMN_COUNT,
  getVolumePriceSubheaderLabels,
} from "@/app/lib/estimates/volume-price-columns";
import { formatAmountDisplay } from "@/app/lib/estimates/calculate-line";
import { getEstimateNumericStyles } from "@/app/lib/estimates/estimate-table-numeric-styles";
import {
  isPlannedProfitUnset,
  normalizePlannedProfitPercent,
  parsePlannedProfitInput,
  applyPlannedProfitPercent,
} from "@/app/lib/estimates/planned-profit";
import { calculateEstimateTotals, collectEstimateLineItems } from "@/app/lib/estimates/calculate-totals";
import {
  createLineItem,
  createSubcategory,
} from "@/app/lib/estimates/create-empty";
import { formatMoneyDisplay } from "@/app/lib/estimates/format-money";
import {
  createSampleCategories,
  defaultEstimateDeadline,
  SAMPLE_META,
  SAMPLE_TITLE,
} from "@/app/lib/estimates/sample-data";
import { serializeEstimatePositionDocument } from "@/app/lib/estimate-positions/serialize-document";
import { collectEstimateDocumentUnits } from "@/app/lib/estimates/collect-estimate-document-units";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import {
  EstimatePlannedProfitProvider,
  useEstimatePlannedProfitPercent,
} from "@/app/components/estimate-planned-profit-context";
import { IndividualProjectModuleDataSpotlight } from "@/app/components/individual-project-module-data-spotlight";
import { ModuleVisualizationGallery } from "@/app/components/module-visualization-gallery";
import { ApprovedEstimateStatusLabel } from "@/app/components/approved-estimate-status-label";
import { ProjectCardActions } from "@/app/components/project-card-actions";
import { ProjectExcludedPositionsPanel } from "@/app/components/project-excluded-positions-panel";
import { PendingProjectMaterialsBanner } from "@/app/components/pending-project-materials-banner";
import { ProjectMaterialsDelegationPanel } from "@/app/components/project-materials-delegation-panel";
import { DeleteButton } from "@/app/components/delete-button";
import { RestoreButton } from "@/app/components/restore-button";
import { AttachedModuleSizeLabel } from "@/app/components/attached-module-size-label";
import {
  EstimateAttentionIcon,
  estimateAttentionRowClassName,
} from "@/app/components/line-item-attention-toggle";
import { EstimateAttentionBudgetControl } from "@/app/components/estimate-attention-budget-control";
import { EstimateMultiPositionRow } from "@/app/components/estimate-multi-position-row";
import { EstimateUnitPriceCells } from "@/app/components/estimate-unit-price-cells";
import {
  deriveCompositeUnitPrice,
  isCompositeLineItem,
  patchLineItemLaborTimeNorm,
} from "@/app/lib/estimates/composite-line-item";
import { resolveEstimateRowDisplayUnit } from "@/app/lib/estimates/sync-module-size-quantities";
import {
  UNIT_PRICE_COLUMN_COUNT,
  getUnitPriceSubheaderLabels,
} from "@/app/lib/estimates/unit-price-columns";
import { EstimateLineItemNameField } from "@/app/components/estimate-line-item-name-field";
import { EstimateLineItemNote } from "@/app/components/estimate-line-item-note";
import { EstimateQuantityInput } from "@/app/components/estimate-quantity-input";
import { IconActionButton } from "@/app/components/icon-action-button";
import { PositionModal } from "@/app/components/position-modal";
import { PositionModalProvider, usePositionModal } from "@/app/components/position-modal-context";
import {
  SectionTitleFocusProvider,
  useSectionTitleFocus,
  AddEstimateSectionButton,
} from "@/app/components/section-title-focus-context";
import { PositionVariableQuantityIcon } from "@/app/components/position-variable-quantity-icon";
import { Tooltip } from "@/app/components/tooltip";
import { MultiPositionModal } from "@/app/components/multi-position-modal";
import { useSyncCatalogPositionFromLineItem } from "@/app/lib/hooks/use-sync-catalog-position-from-line-item";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  applyCatalogPositionToLineItem,
  buildUnitPriceForCatalogPosition,
} from "@/app/lib/positions/apply-catalog-to-line-item";
import {
  estimateHasStaleCatalogPrices,
  isProjectEstimateSaved,
  refreshEstimateCatalogPrices,
  resolveFrozenEstimateDisplayUnitPrice,
  resolveLiveDisplayUnitPrice,
  resolveStaleCatalogPriceHints,
} from "@/app/lib/positions/stale-catalog-price";
import {
  applyLineItemCatalogEdit,
  findCatalogPositionForLineItem,
  hydrateLineItemWithCatalog,
} from "@/app/lib/positions/sync-from-estimate-line-items";
import type { ExcludedPosition } from "@/app/lib/excluded-positions/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import {
  hasModuleSizeAttachment,
  resolveLineItemDisplayQuantityFromModuleSize,
  syncCategoriesQuantitiesFromModuleSizes,
} from "@/app/lib/estimates/sync-module-size-quantities";
import {
  formatQuantityDisplay,
  isVariableQuantityLineItem,
} from "@/app/lib/positions/variable-quantity";
import { getEstimateUnitOptions } from "@/app/lib/estimates/unit-options";
import {
  DropIndicatorProvider,
  EstimateDragCategoriesProvider,
  useDropIndicatorActions,
  useShowDropLine,
} from "@/app/components/drop-indicator-context";
import { DragHandle } from "@/app/components/drag-handle";
import {
  categoryDragId,
  itemDragId,
  subcategoryDragId,
} from "@/app/lib/estimates/drag-ids";
import {
  appendCategoryChild,
  removeCategoryChildRef,
  resolveCategoryChildren,
} from "@/app/lib/estimates/category-child-order";
import {
  collectVisibleSectionDragIds,
  getCollapsedSectionSummaryParts,
  getCollapsedSubcategorySummaryParts,
  type CollapsedSectionSummaryParts,
} from "@/app/lib/estimate-positions/collapsed-sections-cookie";
import { useCollapsedEstimateSections } from "@/app/lib/hooks/use-collapsed-estimate-sections";
import {
  mergeSectionGroupHoverHandlers,
  useSectionGroupHover,
  type SectionGroupHoverHandlers,
} from "@/app/lib/hooks/use-section-group-hover";
import {
  reorderEstimate,
} from "@/app/lib/estimates/reorder-estimate";
import {
  countHiddenEstimateRows,
  hideMultiFromCategories,
  isEstimateCategoryHidden,
  isEstimateRowHidden,
  isEstimateSubcategoryHidden,
  removeOrHideRowItemById,
  restoreEstimateCategory,
  restoreEstimateSubcategory,
  restoreRowItemById,
  shouldRenderEstimateRow,
} from "@/app/lib/estimates/hidden-estimate-rows";
import {
  applyMultiChangeWithLinkSync,
  cleanupLinksAfterMultiDelete,
  findMultiById,
  getLinkedOptionSummaries,
  linkMultiOptions,
  removeMultiFromCategories,
  unlinkMultiOptions,
  type MultiOptionLinkActions,
} from "@/app/lib/estimates/multi-position-links";
import type { MultiOptionLinkGroup } from "@/app/lib/estimates/types";
import {
  createMultiPosition,
  getRowItemId,
  isEstimateMultiPosition,
  resolveLineItemDisplayName,
  updateRowItemById,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateMultiPosition,
  EstimateRowItem,
  EstimateSubcategory,
} from "@/app/lib/estimates/types";
import type {
  BuildingModuleSizeOption,
  BuildingModuleSummary,
  ModuleContentBlock,
} from "@/app/lib/modules/types";
import { isProjectEstimateLocked, shouldShowStaleCatalogPriceWarnings } from "@/app/lib/projects/project-status";
import {
  applySelectedSagataveChangesToProject,
  listSagatavePositionChanges,
} from "@/app/lib/estimate-positions/sagatave-position-changes";
import { listSagataveStructureIntroEntries } from "@/app/lib/estimate-positions/sagatave-structure-intro-entries";
import { SyncSagataveChangesModal } from "@/app/components/sync-sagatave-changes-modal";
import type { EstimateMeta, ProjectSummary } from "@/app/lib/projects/types";
import type { UserSummary } from "@/app/lib/users/types";
import { isIndividualProjectModuleDataComplete } from "@/app/lib/projects/project-module-utils";
import { countPendingProjectMaterials } from "@/app/lib/projects/pending-project-materials";
import { DEFAULT_ESTIMATE_VALIDITY_DAYS } from "@/app/lib/settings/estimate-validity-days";
function getEstimateTableColCount(showQuantityColumn: boolean): number {
  return showQuantityColumn ? 15 : 9;
}

function EstimateProjectTableColgroup({
  showQuantityColumn,
}: {
  showQuantityColumn: boolean;
}) {
  if (showQuantityColumn) {
    return (
      <colgroup>
        <col style={{ width: "36.5%" }} />
        <col style={{ width: "5.5%" }} />
        <col style={{ width: "4%" }} />
        {Array.from({ length: UNIT_PRICE_COLUMN_COUNT }).map((_, index) => (
          <col key={`unit-${index}`} style={{ width: "4%" }} />
        ))}
        {Array.from({ length: VOLUME_PRICE_COLUMN_COUNT }).map((_, index) => (
          <col key={`volume-${index}`} style={{ width: "4.6%" }} />
        ))}
        <col style={{ width: "7%" }} />
      </colgroup>
    );
  }

  return (
    <colgroup>
      <col style={{ width: "42%" }} />
      <col style={{ width: "5%" }} />
      {Array.from({ length: UNIT_PRICE_COLUMN_COUNT }).map((_, index) => (
        <col key={`unit-${index}`} style={{ width: "8%" }} />
      ))}
      <col style={{ width: "5%" }} />
    </colgroup>
  );
}

function bakeInCatalogPrices(
  categories: EstimateCategory[],
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
): EstimateCategory[] {
  const catalogById = new Map(
    catalogPositions.map((p) => [p.id, p]),
  );

  function bakeItem(item: EstimateRowItem): EstimateRowItem {
    if (isEstimateMultiPosition(item)) {
      return {
        ...item,
        options: item.options.map((opt) => ({
          ...opt,
          lineItem: bakeLineItem(opt.lineItem),
        })),
      };
    }
    return bakeLineItem(item);
  }

  function bakeLineItem(item: EstimateLineItem): EstimateLineItem {
    if (isCompositeLineItem(item)) {
      return {
        ...item,
        unitPrice: deriveCompositeUnitPrice(
          item,
          catalogPositions,
          defaultHourlyRate,
        ),
      };
    }

    if (!item.positionPriceId) return item;
    const position = catalogById.get(item.positionPriceId);
    if (!position) return item;
    return {
      ...item,
      unitPrice: buildUnitPriceForCatalogPosition(position, defaultHourlyRate),
      positionPriceId: undefined,
    };
  }

  return categories.map((cat) => ({
    ...cat,
    items: cat.items.map(bakeItem),
    subcategories: cat.subcategories.map((sub) => ({
      ...sub,
      items: sub.items.map(bakeItem),
    })),
  }));
}

function daysUntilDeadline(deadline: string): number | null {
  if (!deadline) return null;
  const d = new Date(`${deadline}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDeadlineDays(days: number, t: ReturnType<typeof useTranslations>["t"]): string {
  if (days === 0) return t("estimate.deadline.today", "Termiņš šodien");
  if (days < 0) {
    return t("estimate.deadline.expired_days", "Termiņš beidzies pirms {count} d.", {
      count: Math.abs(days),
    });
  }
  const abs = Math.abs(days);
  return t("estimate.deadline.remaining_days", "{count} dienas līdz termiņam", {
    count: abs,
  });
}

const cellInput =
  "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm transition focus:border-zinc-300 focus:bg-white focus:outline-none";
const nameInput =
  "w-full min-h-[2.75rem] resize-none rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm leading-snug whitespace-normal break-words transition [field-sizing:content] focus:border-zinc-300 focus:bg-white focus:outline-none";
const cellNum = `${cellInput} text-center tabular-nums`;
const nameCell = "border-b border-zinc-100 py-1 pr-2 align-top";
const readOnlyNum = "block px-2 py-1.5 text-center text-sm tabular-nums text-zinc-700";
/** Stable DndContext id — avoids SSR/client mismatch on aria-describedby. */
const ESTIMATE_DND_CONTEXT_ID = "estimate-table-dnd";

const footerCell =
  "border-t-2 border-zinc-300 px-2 py-2.5 text-center text-xs font-semibold tabular-nums text-zinc-900";

/** Shared left gutter + fixed drag column so handles align across all row types. */
const rowLead = "pl-[22px]";
const dragHandleColumn =
  "flex h-7 w-6 shrink-0 items-center justify-center self-start";
const subcategoryNameIndent = "ml-[10px]";
const subcategoryItemNameIndent = "ml-[20px]";
const dropLineClass = "shadow-[inset_0_4px_0_0_rgb(24_24_27)]";
const mergedSagataveRowClass = "bg-emerald-50/80 hover:bg-emerald-50";
const mergedSagataveCategoryRowClass =
  "border-b border-b-zinc-300 bg-emerald-100/90";
const mergedSagataveSubcategoryRowClass =
  "border-t border-t-zinc-300 border-b border-b-zinc-200 bg-emerald-50/90";
const estimateTableClassName =
  "w-full min-w-0 table-fixed border-separate border-spacing-0 text-sm";
const estimateTableToolbarRowClass =
  "border-b border-zinc-100 bg-zinc-50/95 p-0 font-normal text-left";
const estimateTableToolbarInnerClass =
  "flex flex-wrap items-center justify-between gap-3 px-4 py-2.5";
const estimateSubheaderThClass =
  "border-b border-r border-zinc-200 max-w-0 overflow-hidden px-1 py-1.5 text-center align-middle text-[10px] font-medium leading-snug text-zinc-500";
const estimatePrimaryHeaderThClass =
  "border-b border-r border-zinc-200 max-w-0 overflow-hidden bg-white py-1.5 text-center align-middle text-[10px] font-medium uppercase leading-snug tracking-normal text-zinc-500";
const estimateGroupHeaderThClass =
  "border-b border-r border-zinc-200 px-1 py-1.5 text-center align-middle text-[10px] font-medium uppercase leading-snug tracking-normal whitespace-normal";
const hiddenEstimateRowBodyClass =
  "[&_td:not(:last-child)]:opacity-55 [&_td:not(:last-child)]:pointer-events-none [&_td:not(:last-child)]:select-none";
const hiddenEstimateRowClass = "bg-zinc-100/90 hover:bg-zinc-100/90";

type OpenMultiPositionModal = (
  value: EstimateMultiPosition,
  onSave: (next: EstimateMultiPosition) => void,
) => void;

function LineItemRow({
  item,
  onChange,
  onDelete,
  onRestore,
  onSyncCatalogPosition,
  onScheduleCatalogSync,
  dragHandle,
  rowRef,
  rowStyle,
  indentName,
  showDropLine,
  catalogPositions,
  defaultHourlyRate,
  currency = null,
  showQuantityColumn,
  moduleSizeOptions = [],
  highlightStaleCatalogPrices = false,
  highlightMergedSagatave = false,
  estimateLocked = false,
  allowCompositeEdit = false,
  hiddenInEstimate = false,
  sectionGroupHover,
}: {
  item: EstimateLineItem;
  onChange: (item: EstimateLineItem) => void;
  onDelete: () => void;
  onRestore?: () => void;
  onSyncCatalogPosition: (item: EstimateLineItem) => void;
  onScheduleCatalogSync: (item: EstimateLineItem) => void;
  dragHandle?: ReactNode;
  rowRef?: (element: HTMLTableSectionElement | null) => void;
  rowStyle?: CSSProperties;
  indentName?: boolean;
  showDropLine?: boolean;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  currency?: string | null;
  showQuantityColumn: boolean;
  moduleSizeOptions?: BuildingModuleSizeOption[];
  highlightStaleCatalogPrices?: boolean;
  highlightMergedSagatave?: boolean;
  estimateLocked?: boolean;
  allowCompositeEdit?: boolean;
  hiddenInEstimate?: boolean;
  sectionGroupHover?: SectionGroupHoverHandlers;
}) {
  const { t } = useTranslations();
  const { openPositionModal } = usePositionModal();
  const plannedProfitPercent = useEstimatePlannedProfitPercent();
  const numericStyles = getEstimateNumericStyles(showQuantityColumn);
  const metricUnitCellClass = showQuantityColumn
    ? numericStyles.unitCell
    : "border-b border-zinc-100 px-1 py-0.5 align-middle text-center";
  const metricQuantityCellClass = showQuantityColumn
    ? numericStyles.quantityCell
    : "border-b border-zinc-100 px-1 py-0.5 align-middle text-center";
  const metricReadOnly = showQuantityColumn ? numericStyles.readOnly : readOnlyNum;
  const metricCellNum = showQuantityColumn ? numericStyles.input : cellNum;
  const catalogPosition = findCatalogPositionForLineItem(item, catalogPositions);
  const isCatalogLinked = catalogPosition != null;
  const isComposite = isCompositeLineItem(item);
  const displayName = catalogPosition?.name ?? item.name;
  const compositeResolvedName = isComposite
    ? resolveLineItemDisplayName(item)
    : null;
  const compositeIsUnnamed = compositeResolvedName === "—";
  const compositeRowLabel = compositeResolvedName
    ? compositeIsUnnamed
      ? t("positions.unnamed", "Nenosaukta pozīcija")
      : compositeResolvedName
    : null;
  const displayUnit = resolveEstimateRowDisplayUnit(
    item,
    moduleSizeOptions ?? [],
    catalogPosition?.unit,
  );
  const unitOptions = getEstimateUnitOptions(item.unit);
  const showQuantityInput = isVariableQuantityLineItem(item, catalogPositions);
  const quantityMissing = showQuantityInput && item.quantity <= 0;
  const attachedQuantity = resolveLineItemDisplayQuantityFromModuleSize(
    item,
    moduleSizeOptions,
  );
  const hasAttachedQuantity =
    !item.variableQuantity && hasModuleSizeAttachment(item) && attachedQuantity != null;
  const effectiveQuantity = attachedQuantity ?? item.quantity;
  const displayUnitPrice = applyPlannedProfitPercent(
    highlightStaleCatalogPrices
      ? resolveFrozenEstimateDisplayUnitPrice(
          item,
          catalogPositions,
          defaultHourlyRate,
        )
      : resolveLiveDisplayUnitPrice(item, catalogPositions, defaultHourlyRate),
    plannedProfitPercent,
  );
  const staleCatalogPriceHints = highlightStaleCatalogPrices
    ? resolveStaleCatalogPriceHints(
        item,
        catalogPositions,
        defaultHourlyRate,
        t,
      )
    : undefined;
  const volumeVariable = showQuantityInput || hasAttachedQuantity;
  const volumeSum = showQuantityColumn
    ? resolveLineItemVolumeSum(
        effectiveQuantity,
        displayUnitPrice,
        volumeVariable,
      )
    : null;
  const laborWorkloadHours = showQuantityColumn
    ? resolveLaborWorkloadHours(effectiveQuantity, item, volumeVariable)
    : null;
  const requiresAttention = item.requiresAttention === true;

  return (
    <tbody
      ref={rowRef}
      style={rowStyle}
      onMouseEnter={sectionGroupHover?.onSectionGroupEnter}
      onMouseLeave={sectionGroupHover?.onSectionGroupLeave}
      className={`group ${showDropLine ? dropLineClass : ""} ${
        hiddenInEstimate ? hiddenEstimateRowBodyClass : ""
      }`}
    >
    <tr
      className={`align-middle ${
        hiddenInEstimate
          ? hiddenEstimateRowClass
          : highlightMergedSagatave
          ? mergedSagataveRowClass
          : requiresAttention
            ? estimateAttentionRowClassName
          : quantityMissing && !estimateLocked
            ? "bg-red-50/60 hover:bg-red-50"
            : "hover:bg-sky-50/40"
      }`}
    >
      <td className={nameCell}>
        <div className={`flex items-start gap-1 ${rowLead}`}>
          <span className={dragHandleColumn}>{dragHandle}</span>
          <span className="inline-flex min-w-0 flex-1 items-start gap-1.5">
            {requiresAttention ? (
              <EstimateAttentionIcon className="relative top-[5px]" />
            ) : null}
            <span className="min-w-0 flex-1">
              {allowCompositeEdit && isComposite ? (
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => openPositionModal(item, onChange)}
                    className={`block w-full text-left text-sm transition hover:underline ${nameInput} ${indentName ? subcategoryItemNameIndent : ""} ${
                      compositeIsUnnamed
                        ? "italic text-zinc-400"
                        : "font-medium text-zinc-900 hover:text-sky-700"
                    }`}
                  >
                    {compositeRowLabel}
                  </button>
                  <EstimateLineItemNote note={item.note} />
                  {requiresAttention ? (
                    <EstimateAttentionBudgetControl
                      id={`attention-budget-${item.id}`}
                      value={item.attentionBudget}
                      currency={currency}
                      compact
                      readOnly={estimateLocked}
                      onChange={
                        estimateLocked
                          ? undefined
                          : (attentionBudget) =>
                              onChange({ ...item, attentionBudget })
                      }
                    />
                  ) : null}
                  <AttachedModuleSizeLabel
                    attachment={item.moduleSizeAttachment}
                    moduleSizeOptions={moduleSizeOptions ?? []}
                  />
                </div>
              ) : (
              <EstimateLineItemNameField
                value={displayName}
                readOnly={estimateLocked || isCatalogLinked}
                catalogPositions={catalogPositions}
                defaultHourlyRate={defaultHourlyRate}
                currency={currency}
                className={`${nameInput} ${indentName ? subcategoryItemNameIndent : ""}`}
                footer={
                  isComposite || item.note?.trim() || requiresAttention ? (
                    <>
                      <EstimateLineItemNote note={item.note} />
                      {requiresAttention ? (
                        <EstimateAttentionBudgetControl
                          id={`attention-budget-inline-${item.id}`}
                          value={item.attentionBudget}
                          currency={currency}
                          compact
                          readOnly={estimateLocked}
                          onChange={
                            estimateLocked
                              ? undefined
                              : (attentionBudget) =>
                                  onChange({ ...item, attentionBudget })
                          }
                        />
                      ) : null}
                      {isComposite ? (
                        <AttachedModuleSizeLabel
                          attachment={item.moduleSizeAttachment}
                          moduleSizeOptions={moduleSizeOptions ?? []}
                        />
                      ) : null}
                    </>
                  ) : undefined
                }
                onNameChange={(name) => {
                  const next = applyLineItemCatalogEdit(
                    item,
                    { name },
                    catalogPositions,
                  );
                  onChange(next);
                  onScheduleCatalogSync(next);
                }}
                onNameBlur={(name) => {
                  const linked = applyLineItemCatalogEdit(
                    item,
                    { name },
                    catalogPositions,
                  );
                  const linkChanged = linked.positionPriceId !== item.positionPriceId;
                  const withPrices = hydrateLineItemWithCatalog(
                    linked,
                    catalogPositions,
                    defaultHourlyRate,
                    {
                      forceCatalogPrices:
                        linkChanged || !item.name.trim(),
                    },
                  );
                  onChange(withPrices);
                  onSyncCatalogPosition(withPrices);
                }}
                onCatalogSelect={(position) =>
                  onChange(
                    applyCatalogPositionToLineItem(
                      item,
                      position,
                      defaultHourlyRate,
                    ),
                  )
                }
              />
              )}
            </span>
            {showQuantityColumn && !estimateLocked && item.variableQuantity ? (
              <Tooltip label={t("estimate.quantity.remove_individual", "Noņemt individuālo apjomu")}>
                <button
                  type="button"
                  aria-label={t("estimate.quantity.remove_individual", "Noņemt individuālo apjomu")}
                  onClick={() =>
                    onChange({ ...item, variableQuantity: undefined })
                  }
                  className="relative top-[5px] inline-flex shrink-0 items-center text-red-600 transition hover:text-red-400"
                >
                  <i className="fas fa-random text-sm" aria-hidden="true" />
                </button>
              </Tooltip>
            ) : (
              <PositionVariableQuantityIcon enabled={showQuantityInput} />
            )}
            {allowCompositeEdit && isComposite ? (
              <IconActionButton
                label={t("positions.edit.title", "Labot pozīciju")}
                icon="fas fa-pen"
                variant="edit"
                onClick={() => openPositionModal(item, onChange)}
                className="relative top-[5px] shrink-0 opacity-0 group-hover:opacity-100"
              />
            ) : null}
          </span>
        </div>
      </td>
      <td className={metricUnitCellClass}>
        {isCatalogLinked || isComposite ? (
          <span className={`${metricReadOnly} text-zinc-700`}>
            {displayUnit.trim() || "—"}
          </span>
        ) : (
          <select
            className={`${showQuantityColumn ? numericStyles.input : cellInput} cursor-pointer`}
            value={item.unit}
            onChange={(event) => {
              const next = { ...item, unit: event.target.value };
              onChange(next);
              onSyncCatalogPosition(next);
            }}
          >
            {unitOptions.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        )}
      </td>
      {showQuantityColumn ? (
        <td className={metricQuantityCellClass}>
          {hasAttachedQuantity ? (
            <span className={`${metricReadOnly} text-zinc-700`}>
              {formatQuantityDisplay(attachedQuantity)}
            </span>
          ) : showQuantityInput ? (
            estimateLocked ? (
              <span className={`${metricReadOnly} ${item.quantity <= 0 ? "text-red-500" : "text-zinc-700"}`}>
                {item.quantity <= 0 ? "—" : formatQuantityDisplay(item.quantity)}
              </span>
            ) : (
              <EstimateQuantityInput
                className={`${metricCellNum} ${quantityMissing ? "border-red-300 bg-red-50 text-red-700 placeholder-red-300" : ""}`}
                value={item.quantity}
                onChange={(quantity) => onChange({ ...item, quantity })}
                emptyValue={0}
              />
            )
          ) : (
            <span className={`${metricReadOnly} text-zinc-300`}>—</span>
          )}
        </td>
      ) : null}
      <EstimateUnitPriceCells
        item={item}
        defaultHourlyRate={defaultHourlyRate}
        values={displayUnitPrice}
        staleCatalogPriceHints={staleCatalogPriceHints}
        compact={showQuantityColumn}
        onTimeNormChange={
          isComposite && !estimateLocked
            ? (laborTimeNorm) =>
                onChange(
                  patchLineItemLaborTimeNorm(
                    item,
                    laborTimeNorm,
                    catalogPositions,
                    defaultHourlyRate,
                  ),
                )
            : undefined
        }
      />
      {showQuantityColumn ? (
        <VolumeSumCells
          values={volumeSum}
          laborWorkloadHours={laborWorkloadHours}
          staleCatalogPriceHints={staleCatalogPriceHints}
          compact
        />
      ) : null}
      <td className="border-b border-zinc-100 px-1 py-0.5 align-middle">
        <div className="flex justify-end">
        {estimateLocked ? null : hiddenInEstimate && onRestore ? (
          <RestoreButton
            label={t("estimate.hidden.restore", "Atjaunot pozīciju")}
            onClick={onRestore}
            className="opacity-100"
          />
        ) : (
          <DeleteButton
            label={t("positions.delete.action", "Dzēst pozīciju")}
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100"
          />
        )}
        </div>
      </td>
    </tr>
    </tbody>
  );
}

function SortableMultiPositionRow({
  sortId,
  subcategoryId,
  value,
  optionLinkActions,
  catalogPositions,
  defaultHourlyRate,
  currency = null,
  showQuantityColumn,
  allCategories: _allCategories,
  moduleSizeOptions = [],
  highlightStaleCatalogPrices = false,
  highlightMergedSagatave = false,
  estimateLocked = false,
  estimateUnits = [],
  onRestore,
  sectionGroupHover,
}: {
  sortId: string;
  categoryId: string;
  subcategoryId?: string;
  value: EstimateMultiPosition;
  optionLinkActions: MultiOptionLinkActions;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  currency?: string | null;
  showQuantityColumn: boolean;
  allCategories: EstimateCategory[];
  moduleSizeOptions?: BuildingModuleSizeOption[];
  highlightStaleCatalogPrices?: boolean;
  highlightMergedSagatave?: boolean;
  estimateLocked?: boolean;
  estimateUnits?: string[];
  onRestore?: () => void;
  sectionGroupHover?: SectionGroupHoverHandlers;
}) {
  const { t } = useTranslations();
  const hiddenInEstimate = isEstimateRowHidden(value);
  const showDropLine = useShowDropLine(sortId);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: sortId,
    disabled: estimateLocked || hiddenInEstimate,
    animateLayoutChanges: () => false,
  });
  return (
    <EstimateMultiPositionRow
      mode="offer"
      value={value}
      onChange={
        estimateLocked || hiddenInEstimate
          ? () => {}
          : (next) => optionLinkActions.onMultiChange(value.id, next, true)
      }
      onDelete={
        estimateLocked
          ? () => {}
          : () => optionLinkActions.onMultiDelete(value.id)
      }
      onRestore={estimateLocked ? undefined : onRestore}
      hiddenInEstimate={hiddenInEstimate}
      catalogPositions={catalogPositions}
      defaultHourlyRate={defaultHourlyRate}
      currency={currency}
      optionLinkActions={optionLinkActions}
      indentName={subcategoryId != null}
      showDropLine={showDropLine}
      showQuantityColumn={showQuantityColumn}
      moduleSizeOptions={moduleSizeOptions}
      estimateUnits={estimateUnits}
      readOnlyPrices={true}
      allowOfferMultiEdit={!estimateLocked}
      highlightStaleCatalogPrices={highlightStaleCatalogPrices}
      highlightMergedSagatave={highlightMergedSagatave}
      rowRef={setNodeRef}
      rowStyle={isDragging ? { opacity: 0.45 } : undefined}
      sectionGroupHover={sectionGroupHover}
      dragHandle={
        estimateLocked || hiddenInEstimate ? null : (
          <DragHandle
            label={t("estimate.drag.multi_position", "Pārvietot multi-pozīciju")}
            attributes={attributes}
            listeners={listeners}
          />
        )
      }
    />
  );
}

function SortableLineItemRow({
  sortId,
  subcategoryId,
  moduleSizeOptions = [],
  sectionGroupHover,
  ...props
}: {
  sortId: string;
  categoryId: string;
  subcategoryId?: string;
  item: EstimateLineItem;
  onChange: (item: EstimateLineItem) => void;
  onDelete: () => void;
  onRestore?: () => void;
  onSyncCatalogPosition: (item: EstimateLineItem) => void;
  onScheduleCatalogSync: (item: EstimateLineItem) => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  currency?: string | null;
  showQuantityColumn: boolean;
  moduleSizeOptions?: BuildingModuleSizeOption[];
  highlightStaleCatalogPrices?: boolean;
  highlightMergedSagatave?: boolean;
  estimateLocked?: boolean;
  sectionGroupHover?: SectionGroupHoverHandlers;
}) {
  const { t } = useTranslations();
  const hiddenInEstimate = isEstimateRowHidden(props.item);
  const showDropLine = useShowDropLine(sortId);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: sortId,
    disabled: props.estimateLocked || hiddenInEstimate,
    animateLayoutChanges: () => false,
  });

  return (
    <LineItemRow
      {...props}
      hiddenInEstimate={hiddenInEstimate}
      allowCompositeEdit={
        props.showQuantityColumn && !props.estimateLocked && !hiddenInEstimate
      }
      highlightStaleCatalogPrices={props.highlightStaleCatalogPrices}
      highlightMergedSagatave={props.highlightMergedSagatave}
      estimateLocked={props.estimateLocked}
      moduleSizeOptions={moduleSizeOptions}
      indentName={subcategoryId != null}
      showDropLine={showDropLine}
      rowRef={setNodeRef}
      rowStyle={isDragging ? { opacity: 0.45 } : undefined}
      sectionGroupHover={sectionGroupHover}
      dragHandle={
        props.estimateLocked || hiddenInEstimate ? null : (
          <DragHandle
            label={t("positions.drag.position", "Pārvietot pozīciju")}
            attributes={attributes}
            listeners={listeners}
          />
        )
      }
    />
  );
}

function SectionRow({
  sectionRowId,
  kind,
  placeholder,
  value,
  onChange,
  actions,
  dragHandle,
  rowRef,
  rowStyle,
  showDropLine,
  colSpan,
  estimateLocked = false,
  highlightMergedSagatave = false,
  collapsed = false,
  collapsedSummaryParts,
  onToggleCollapse,
  showQuantityColumn = false,
  volumeTotals,
  actionsVisible = true,
  sectionGroupHover,
}: {
  sectionRowId: string;
  kind: "category" | "subcategory";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  actions: ReactNode;
  dragHandle?: ReactNode;
  rowRef?: (element: HTMLTableSectionElement | null) => void;
  rowStyle?: CSSProperties;
  showDropLine?: boolean;
  colSpan: number;
  estimateLocked?: boolean;
  highlightMergedSagatave?: boolean;
  collapsed?: boolean;
  collapsedSummaryParts?: CollapsedSectionSummaryParts;
  onToggleCollapse?: () => void;
  showQuantityColumn?: boolean;
  volumeTotals?: SectionVolumeTotals;
  actionsVisible?: boolean;
  sectionGroupHover?: SectionGroupHoverHandlers;
}) {
  const { t } = useTranslations();
  const focusCtx = useSectionTitleFocus();
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldFocus = focusCtx?.focusRowId === sectionRowId;
  const isCategory = kind === "category";
  const topBorderClass = showDropLine ? "border-t-4 border-t-zinc-900" : "";
  const rowBgClassName = highlightMergedSagatave
    ? isCategory
      ? mergedSagataveCategoryRowClass
      : mergedSagataveSubcategoryRowClass
    : isCategory
      ? "border-b border-b-zinc-300 bg-zinc-200/90"
      : "border-t border-t-zinc-300 border-b border-b-zinc-200 bg-zinc-50";
  const sectionActionCellClass = `${rowBgClassName} max-w-0 overflow-hidden px-1 py-0.5 text-center align-middle`;

  useEffect(() => {
    if (!shouldFocus || estimateLocked) {
      return;
    }

    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.focus({ preventScroll: false });
    focusCtx?.clearFocus();
  }, [shouldFocus, estimateLocked, focusCtx]);

  const titleField = estimateLocked ? (
    <span
      className={`block min-w-0 truncate text-sm text-zinc-900 ${
        isCategory ? "font-semibold" : "font-normal"
      }`}
    >
      {value.trim() || placeholder}
    </span>
  ) : (
    <input
      ref={inputRef}
      type="text"
      className={`min-w-0 w-full border-0 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none ${
        isCategory ? "font-semibold" : "font-normal"
      }`}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );

  const sectionActions = (
    <EstimateSectionActionsCell
      actions={actions}
      collapsedSummaryParts={collapsedSummaryParts}
      showSummary={!showQuantityColumn && collapsed}
      actionsVisible={actionsVisible}
    />
  );

  return (
    <tbody
      ref={rowRef}
      style={rowStyle}
      onMouseEnter={sectionGroupHover?.onSectionGroupEnter}
      onMouseLeave={sectionGroupHover?.onSectionGroupLeave}
      className={`${isCategory ? "category-row" : "subcategory-row"} ${showDropLine ? dropLineClass : ""}`}
    >
    <tr>
      {showQuantityColumn ? (
        <>
          <td className={`p-0 ${rowBgClassName}`}>
            <div
              className={`flex min-h-[3.25rem] items-start gap-2 py-2 pr-3 ${rowLead} ${topBorderClass}`}
            >
              <span className={dragHandleColumn}>
                {estimateLocked ? null : dragHandle}
              </span>
              {onToggleCollapse ? (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  aria-expanded={!collapsed}
                  aria-label={
                    collapsed
                      ? isCategory
                        ? t("estimate.expand.category", "Izvērst kategoriju")
                        : t("estimate.expand.subcategory", "Izvērst subkategoriju")
                      : isCategory
                        ? t("estimate.collapse.category", "Sakļaut kategoriju")
                        : t("estimate.collapse.subcategory", "Sakļaut subkategoriju")
                  }
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white hover:text-zinc-800"
                >
                  <i
                    className={`fas fa-chevron-${collapsed ? "right" : "down"} text-xs`}
                    aria-hidden="true"
                  />
                </button>
              ) : null}
              <div
                className={`min-w-0 flex-1 ${isCategory ? "" : subcategoryNameIndent}`}
              >
                {titleField}
              </div>
            </div>
          </td>
          <SectionLeadingEmptyCells
            showQuantityColumn
            rowBgClassName={rowBgClassName}
          />
          <VolumeSumCells
            values={volumeTotals?.volumeSum ?? null}
            laborWorkloadHours={volumeTotals?.laborWorkloadHours ?? null}
            compact
            summary
            rowBgClassName={rowBgClassName}
            preLaborSummary={collapsed ? collapsedSummaryParts : undefined}
          />
          <td className={sectionActionCellClass}>
            <div className="flex min-h-[3.25rem] items-center justify-end py-2 pl-0 pr-0.5">
              {sectionActions}
            </div>
          </td>
        </>
      ) : (
      <td
        colSpan={colSpan}
        className={`p-0 ${rowBgClassName}`}
      >
        <div
          className={`flex min-h-[3.25rem] items-center gap-2 py-2 pr-3 ${rowLead} ${topBorderClass}`}
        >
          <span className={dragHandleColumn}>
            {estimateLocked ? null : dragHandle}
          </span>
          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded={!collapsed}
              aria-label={
                collapsed
                  ? isCategory
                    ? t("estimate.expand.category", "Izvērst kategoriju")
                    : t("estimate.expand.subcategory", "Izvērst subkategoriju")
                  : isCategory
                    ? t("estimate.collapse.category", "Sakļaut kategoriju")
                    : t("estimate.collapse.subcategory", "Sakļaut subkategoriju")
              }
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white hover:text-zinc-800"
            >
              <i
                className={`fas fa-chevron-${collapsed ? "right" : "down"} text-xs`}
                aria-hidden="true"
              />
            </button>
          ) : null}
          <div
            className={`min-w-0 flex-1 ${isCategory ? "" : subcategoryNameIndent}`}
          >
            {titleField}
          </div>
          <div className="shrink-0 self-center">{sectionActions}</div>
        </div>
      </td>
      )}
    </tr>
    </tbody>
  );
}

function SortableSectionRow({
  sortId,
  sectionRowId,
  dragLabel,
  estimateLocked = false,
  ...props
}: {
  sortId: string;
  sectionRowId: string;
  dragLabel: string;
  kind: "category" | "subcategory";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  actions: ReactNode;
  colSpan: number;
  estimateLocked?: boolean;
  highlightMergedSagatave?: boolean;
  collapsed?: boolean;
  collapsedSummaryParts?: CollapsedSectionSummaryParts;
  onToggleCollapse?: () => void;
  showQuantityColumn?: boolean;
  volumeTotals?: SectionVolumeTotals;
  actionsVisible?: boolean;
  sectionGroupHover?: SectionGroupHoverHandlers;
}) {
  const showDropLine = useShowDropLine(sortId);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: sortId,
    disabled: estimateLocked,
    animateLayoutChanges: () => false,
  });

  return (
    <SectionRow
      {...props}
      sectionRowId={sectionRowId}
      estimateLocked={estimateLocked}
      colSpan={props.colSpan}
      showDropLine={showDropLine}
      rowRef={setNodeRef}
      rowStyle={isDragging ? { opacity: 0.45 } : undefined}
      dragHandle={
        estimateLocked ? null : (
          <DragHandle
            label={dragLabel}
            attributes={attributes}
            listeners={listeners}
          />
        )
      }
    />
  );
}

function SubcategoryBlock({
  categoryId,
  subcategory,
  onChange,
  onDelete,
  onSyncCatalogPosition,
  onScheduleCatalogSync,
  catalogPositions,
  defaultHourlyRate,
  currency = null,
  showQuantityColumn,
  colSpan,
  allCategories,
  optionLinkActions,
  moduleSizeOptions = [],
  highlightStaleCatalogPrices = false,
  mergedSagataveHighlightIds,
  estimateLocked = false,
  openMultiPositionModal,
  estimateUnits = [],
  softDeleteRows = false,
  showHiddenEstimateRows = false,
  collapsed,
  collapsedSummaryParts,
  onToggleCollapse,
  onEnsureExpanded,
  parentSectionHover,
}: {
  categoryId: string;
  subcategory: EstimateSubcategory;
  onChange: (subcategory: EstimateSubcategory) => void;
  onDelete: () => void;
  onSyncCatalogPosition: (item: EstimateLineItem) => void;
  onScheduleCatalogSync: (item: EstimateLineItem) => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  currency?: string | null;
  showQuantityColumn: boolean;
  colSpan: number;
  allCategories: EstimateCategory[];
  optionLinkActions: MultiOptionLinkActions;
  moduleSizeOptions?: BuildingModuleSizeOption[];
  highlightStaleCatalogPrices?: boolean;
  mergedSagataveHighlightIds: ReadonlySet<string>;
  estimateLocked?: boolean;
  openMultiPositionModal: OpenMultiPositionModal;
  estimateUnits?: string[];
  softDeleteRows?: boolean;
  showHiddenEstimateRows?: boolean;
  collapsed: boolean;
  collapsedSummaryParts: CollapsedSectionSummaryParts;
  onToggleCollapse: () => void;
  onEnsureExpanded: () => void;
  parentSectionHover?: SectionGroupHoverHandlers;
}) {
  const { t } = useTranslations();
  const subcategoryHover = useSectionGroupHover();
  const sectionGroupHover = mergeSectionGroupHoverHandlers(
    subcategoryHover,
    parentSectionHover,
  );
  const plannedProfitPercent = useEstimatePlannedProfitPercent();
  const volumeTotals = useMemo(
    () =>
      showQuantityColumn
        ? calculateSubcategoryVolumeTotals(subcategory, {
            catalogPositions,
            defaultHourlyRate,
            plannedProfitPercent,
            moduleSizeOptions,
            highlightStaleCatalogPrices,
          })
        : undefined,
    [
      showQuantityColumn,
      subcategory,
      catalogPositions,
      defaultHourlyRate,
      plannedProfitPercent,
      moduleSizeOptions,
      highlightStaleCatalogPrices,
    ],
  );

  function withExpandedContent(
    updater: (current: EstimateSubcategory) => EstimateSubcategory,
  ) {
    onEnsureExpanded();
    onChange(updater(subcategory));
  }

  function handleAddMulti() {
    openMultiPositionModal(createMultiPosition(), (saved) =>
      withExpandedContent((current) => ({
        ...current,
        items: [...current.items, saved],
      })),
    );
  }

  if (!showHiddenEstimateRows && isEstimateSubcategoryHidden(subcategory)) {
    return null;
  }

  return (
    <>
      <SortableSectionRow
        sortId={subcategoryDragId(subcategory.id)}
        sectionRowId={subcategory.id}
        dragLabel={t("estimate.drag.subcategory", "Pārvietot subkategoriju")}
        colSpan={colSpan}
        kind="subcategory"
        placeholder={t("estimate.placeholder.subcategory", "Subkategorijas nosaukums")}
        value={subcategory.title}
        onChange={(title) => onChange({ ...subcategory, title })}
        estimateLocked={estimateLocked}
        highlightMergedSagatave={mergedSagataveHighlightIds.has(subcategory.id)}
        collapsed={collapsed}
        collapsedSummaryParts={collapsedSummaryParts}
        onToggleCollapse={onToggleCollapse}
        showQuantityColumn={showQuantityColumn}
        volumeTotals={volumeTotals}
        actionsVisible={subcategoryHover.hovered}
        sectionGroupHover={sectionGroupHover}
        actions={
          <EstimateSectionRowActions
            showSub={false}
            deleteLabel={t("estimate.delete.subcategory", "Dzēst subkategoriju")}
            estimateLocked={estimateLocked}
            onAddMulti={
              showQuantityColumn
                ? undefined
                : handleAddMulti
            }
            onAddItem={() =>
              withExpandedContent((current) => ({
                ...current,
                items: [...current.items, createLineItem()],
              }))
            }
            onDelete={onDelete}
          />
        }
      />
      {collapsed
        ? null
        : subcategory.items
        .filter((row) => shouldRenderEstimateRow(row, showHiddenEstimateRows))
        .map((row) =>
        isEstimateMultiPosition(row) ? (
          <SortableMultiPositionRow
            key={row.id}
            sortId={itemDragId(row.id)}
            categoryId={categoryId}
            subcategoryId={subcategory.id}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            currency={currency}
            showQuantityColumn={showQuantityColumn}
            allCategories={allCategories}
            optionLinkActions={optionLinkActions}
            moduleSizeOptions={moduleSizeOptions}
            highlightStaleCatalogPrices={highlightStaleCatalogPrices}
            highlightMergedSagatave={mergedSagataveHighlightIds.has(row.id)}
            estimateLocked={estimateLocked}
            estimateUnits={estimateUnits}
            sectionGroupHover={sectionGroupHover}
            value={row}
            onRestore={
              softDeleteRows && isEstimateRowHidden(row)
                ? () =>
                    onChange({
                      ...subcategory,
                      items: restoreRowItemById(subcategory.items, row.id),
                    })
                : undefined
            }
          />
        ) : (
          <SortableLineItemRow
            key={row.id}
            sortId={itemDragId(row.id)}
            categoryId={categoryId}
            subcategoryId={subcategory.id}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            currency={currency}
            showQuantityColumn={showQuantityColumn}
            moduleSizeOptions={moduleSizeOptions}
            highlightStaleCatalogPrices={highlightStaleCatalogPrices}
            highlightMergedSagatave={mergedSagataveHighlightIds.has(row.id)}
            estimateLocked={estimateLocked}
            onSyncCatalogPosition={onSyncCatalogPosition}
            onScheduleCatalogSync={onScheduleCatalogSync}
            sectionGroupHover={sectionGroupHover}
            item={row}
            onChange={(next) =>
              onChange({
                ...subcategory,
                items: updateRowItemById(subcategory.items, row.id, next),
              })
            }
            onDelete={() =>
              onChange({
                ...subcategory,
                items: removeOrHideRowItemById(
                  subcategory.items,
                  row.id,
                  softDeleteRows,
                ),
              })
            }
            onRestore={
              softDeleteRows && isEstimateRowHidden(row)
                ? () =>
                    onChange({
                      ...subcategory,
                      items: restoreRowItemById(subcategory.items, row.id),
                    })
                : undefined
            }
          />
        ),
      )}
    </>
  );
}

function CategoryBlock({
  category,
  onChange,
  onDelete,
  onSyncCatalogPosition,
  onScheduleCatalogSync,
  catalogPositions,
  defaultHourlyRate,
  currency = null,
  showQuantityColumn,
  colSpan,
  allCategories,
  optionLinkActions,
  moduleSizeOptions = [],
  highlightStaleCatalogPrices = false,
  mergedSagataveHighlightIds,
  estimateLocked = false,
  openMultiPositionModal,
  estimateUnits = [],
  softDeleteRows = false,
  showHiddenEstimateRows = false,
  collapsed,
  collapsedSummaryParts,
  onToggleCollapse,
  onEnsureExpanded,
  collapsedSectionIds,
  toggleSectionCollapsed,
  expandSection,
}: {
  category: EstimateCategory;
  onChange: (category: EstimateCategory) => void;
  onDelete: () => void;
  onSyncCatalogPosition: (item: EstimateLineItem) => void;
  onScheduleCatalogSync: (item: EstimateLineItem) => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  currency?: string | null;
  showQuantityColumn: boolean;
  colSpan: number;
  allCategories: EstimateCategory[];
  optionLinkActions: MultiOptionLinkActions;
  moduleSizeOptions?: BuildingModuleSizeOption[];
  highlightStaleCatalogPrices?: boolean;
  mergedSagataveHighlightIds: ReadonlySet<string>;
  estimateLocked?: boolean;
  openMultiPositionModal: OpenMultiPositionModal;
  estimateUnits?: string[];
  softDeleteRows?: boolean;
  showHiddenEstimateRows?: boolean;
  collapsed: boolean;
  collapsedSummaryParts: CollapsedSectionSummaryParts;
  onToggleCollapse: () => void;
  onEnsureExpanded: () => void;
  collapsedSectionIds: ReadonlySet<string>;
  toggleSectionCollapsed: (sectionId: string) => void;
  expandSection: (sectionId: string) => void;
}) {
  const { t } = useTranslations();
  const { requestFocus } = useSectionTitleFocus() ?? {};
  const categoryHover = useSectionGroupHover();
  const plannedProfitPercent = useEstimatePlannedProfitPercent();
  const volumeTotals = useMemo(
    () =>
      showQuantityColumn
        ? calculateCategoryVolumeTotals(category, {
            catalogPositions,
            defaultHourlyRate,
            plannedProfitPercent,
            moduleSizeOptions,
            highlightStaleCatalogPrices,
          })
        : undefined,
    [
      showQuantityColumn,
      category,
      catalogPositions,
      defaultHourlyRate,
      plannedProfitPercent,
      moduleSizeOptions,
      highlightStaleCatalogPrices,
    ],
  );

  function withExpandedContent(
    updater: (current: EstimateCategory) => EstimateCategory,
  ) {
    onEnsureExpanded();
    onChange(updater(category));
  }

  function handleAddMulti() {
    openMultiPositionModal(createMultiPosition(), (saved) =>
      withExpandedContent((current) =>
        appendCategoryChild(
          {
            ...current,
            items: [...current.items, saved],
          },
          { kind: "item", id: getRowItemId(saved) },
        ),
      ),
    );
  }

  if (!showHiddenEstimateRows && isEstimateCategoryHidden(category)) {
    return null;
  }

  return (
    <>
      <SortableSectionRow
        sortId={categoryDragId(category.id)}
        sectionRowId={category.id}
        dragLabel={t("estimate.drag.category", "Pārvietot kategoriju")}
        colSpan={colSpan}
        kind="category"
        placeholder={t("estimate.placeholder.category", "Kategorijas nosaukums")}
        value={category.title}
        onChange={(title) => onChange({ ...category, title })}
        estimateLocked={estimateLocked}
        highlightMergedSagatave={mergedSagataveHighlightIds.has(category.id)}
        collapsed={collapsed}
        collapsedSummaryParts={collapsedSummaryParts}
        onToggleCollapse={onToggleCollapse}
        showQuantityColumn={showQuantityColumn}
        volumeTotals={volumeTotals}
        actionsVisible={categoryHover.hovered}
        sectionGroupHover={categoryHover}
        actions={
          <EstimateSectionRowActions
            deleteLabel={t("estimate.delete.category", "Dzēst kategoriju")}
            estimateLocked={estimateLocked}
            onAddSub={() => {
              const subcategory = createSubcategory();
              requestFocus?.(subcategory.id);
              withExpandedContent((current) =>
                appendCategoryChild(
                  {
                    ...current,
                    subcategories: [...current.subcategories, subcategory],
                  },
                  { kind: "subcategory", id: subcategory.id },
                ),
              );
            }}
            onAddMulti={
              showQuantityColumn
                ? undefined
                : handleAddMulti
            }
            onAddItem={() => {
              const item = createLineItem();
              withExpandedContent((current) =>
                appendCategoryChild(
                  {
                    ...current,
                    items: [...current.items, item],
                  },
                  { kind: "item", id: getRowItemId(item) },
                ),
              );
            }}
            onDelete={onDelete}
          />
        }
      />

      {collapsed
        ? null
        : resolveCategoryChildren(category)
        .filter(
          (child) => {
            if (child.kind === "subcategory") {
              return (
                showHiddenEstimateRows ||
                !isEstimateSubcategoryHidden(child.subcategory)
              );
            }

            return shouldRenderEstimateRow(child.row, showHiddenEstimateRows);
          },
        )
        .map((child) => {
        if (child.kind === "subcategory") {
          const subcategory = child.subcategory;
          return (
            <SubcategoryBlock
              key={subcategory.id}
              categoryId={category.id}
              catalogPositions={catalogPositions}
              defaultHourlyRate={defaultHourlyRate}
              currency={currency}
              showQuantityColumn={showQuantityColumn}
              colSpan={colSpan}
              allCategories={allCategories}
              optionLinkActions={optionLinkActions}
              moduleSizeOptions={moduleSizeOptions}
              highlightStaleCatalogPrices={highlightStaleCatalogPrices}
              mergedSagataveHighlightIds={mergedSagataveHighlightIds}
              estimateLocked={estimateLocked}
              onSyncCatalogPosition={onSyncCatalogPosition}
              onScheduleCatalogSync={onScheduleCatalogSync}
              subcategory={subcategory}
              openMultiPositionModal={openMultiPositionModal}
              estimateUnits={estimateUnits}
              softDeleteRows={softDeleteRows}
              showHiddenEstimateRows={showHiddenEstimateRows}
              collapsed={collapsedSectionIds.has(subcategory.id)}
              collapsedSummaryParts={getCollapsedSubcategorySummaryParts(subcategory, t)}
              onToggleCollapse={() => toggleSectionCollapsed(subcategory.id)}
              onEnsureExpanded={() => expandSection(subcategory.id)}
              parentSectionHover={categoryHover}
              onChange={(next) =>
                onChange({
                  ...category,
                  subcategories: category.subcategories.map((entry) =>
                    entry.id === subcategory.id ? next : entry,
                  ),
                })
              }
              onDelete={() =>
                onChange(
                  removeCategoryChildRef(
                    {
                      ...category,
                      subcategories: category.subcategories.filter(
                        (entry) => entry.id !== subcategory.id,
                      ),
                    },
                    { kind: "subcategory", id: subcategory.id },
                  ),
                )
              }
            />
          );
        }

        const row = child.row;
        return isEstimateMultiPosition(row) ? (
          <SortableMultiPositionRow
            key={row.id}
            sortId={itemDragId(row.id)}
            categoryId={category.id}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            currency={currency}
            showQuantityColumn={showQuantityColumn}
            allCategories={allCategories}
            optionLinkActions={optionLinkActions}
            moduleSizeOptions={moduleSizeOptions}
            highlightStaleCatalogPrices={highlightStaleCatalogPrices}
            highlightMergedSagatave={mergedSagataveHighlightIds.has(row.id)}
            estimateLocked={estimateLocked}
            estimateUnits={estimateUnits}
            sectionGroupHover={categoryHover}
            value={row}
            onRestore={
              softDeleteRows && isEstimateRowHidden(row)
                ? () =>
                    onChange({
                      ...category,
                      items: restoreRowItemById(category.items, row.id),
                    })
                : undefined
            }
          />
        ) : (
          <SortableLineItemRow
            key={row.id}
            sortId={itemDragId(row.id)}
            categoryId={category.id}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            currency={currency}
            showQuantityColumn={showQuantityColumn}
            moduleSizeOptions={moduleSizeOptions}
            highlightStaleCatalogPrices={highlightStaleCatalogPrices}
            highlightMergedSagatave={mergedSagataveHighlightIds.has(row.id)}
            estimateLocked={estimateLocked}
            onSyncCatalogPosition={onSyncCatalogPosition}
            onScheduleCatalogSync={onScheduleCatalogSync}
            sectionGroupHover={categoryHover}
            item={row}
            onChange={(next) =>
              onChange({
                ...category,
                items: updateRowItemById(category.items, row.id, next),
              })
            }
            onDelete={() =>
              onChange({
                ...category,
                items: removeOrHideRowItemById(
                  category.items,
                  row.id,
                  softDeleteRows,
                ),
              })
            }
            onRestore={
              softDeleteRows && isEstimateRowHidden(row)
                ? () =>
                    onChange({
                      ...category,
                      items: restoreRowItemById(category.items, row.id),
                    })
                : undefined
            }
          />
        );
      })}
    </>
  );
}

function EstimateDndTable({
  categories,
  allDragIds,
  setCategories,
  multiOptionLinks,
  setMultiOptionLinks,
  totals,
  onSyncCatalogPosition,
  onScheduleCatalogSync,
  catalogPositions,
  defaultHourlyRate,
  currency = null,
  showQuantityColumn,
  moduleSizeOptions = [],
  highlightStaleCatalogPrices = false,
  mergedSagataveHighlightIds,
  estimateLocked = false,
  openMultiPositionModal,
  estimateUnits = [],
  softDeleteRows = false,
  showHiddenEstimateRows = false,
  toolbar = null,
  collapsedSectionIds,
  toggleSectionCollapsed,
  expandSection,
}: {
  categories: EstimateCategory[];
  allDragIds: string[];
  setCategories: Dispatch<SetStateAction<EstimateCategory[]>>;
  multiOptionLinks: MultiOptionLinkGroup[];
  setMultiOptionLinks: Dispatch<SetStateAction<MultiOptionLinkGroup[]>>;
  totals: {
    labor: number;
    materials: number;
    mechanisms: number;
    grand: number;
  };
  onSyncCatalogPosition: (item: EstimateLineItem) => void;
  onScheduleCatalogSync: (item: EstimateLineItem) => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  currency?: string | null;
  showQuantityColumn: boolean;
  moduleSizeOptions?: BuildingModuleSizeOption[];
  highlightStaleCatalogPrices?: boolean;
  mergedSagataveHighlightIds: ReadonlySet<string>;
  estimateLocked?: boolean;
  openMultiPositionModal: OpenMultiPositionModal;
  estimateUnits?: string[];
  softDeleteRows?: boolean;
  showHiddenEstimateRows?: boolean;
  toolbar?: ReactNode;
  collapsedSectionIds: ReadonlySet<string>;
  toggleSectionCollapsed: (sectionId: string) => void;
  expandSection: (sectionId: string) => void;
}) {
  const colSpan = getEstimateTableColCount(showQuantityColumn);

  return (
    <DropIndicatorProvider>
      <EstimateDragCategoriesProvider categories={categories}>
        <EstimateDndTableInner
        categories={categories}
        allDragIds={allDragIds}
        setCategories={setCategories}
        multiOptionLinks={multiOptionLinks}
        setMultiOptionLinks={setMultiOptionLinks}
        totals={totals}
        onSyncCatalogPosition={onSyncCatalogPosition}
        onScheduleCatalogSync={onScheduleCatalogSync}
        catalogPositions={catalogPositions}
        defaultHourlyRate={defaultHourlyRate}
        currency={currency}
        showQuantityColumn={showQuantityColumn}
        moduleSizeOptions={moduleSizeOptions}
        highlightStaleCatalogPrices={highlightStaleCatalogPrices}
        mergedSagataveHighlightIds={mergedSagataveHighlightIds}
        estimateLocked={estimateLocked}
        openMultiPositionModal={openMultiPositionModal}
        estimateUnits={estimateUnits}
        colSpan={colSpan}
        softDeleteRows={softDeleteRows}
        showHiddenEstimateRows={showHiddenEstimateRows}
        toolbar={toolbar}
        collapsedSectionIds={collapsedSectionIds}
        toggleSectionCollapsed={toggleSectionCollapsed}
        expandSection={expandSection}
      />
      </EstimateDragCategoriesProvider>
    </DropIndicatorProvider>
  );
}

function EstimateDndTableInner({
  categories,
  allDragIds,
  setCategories,
  multiOptionLinks,
  setMultiOptionLinks,
  totals,
  onSyncCatalogPosition,
  onScheduleCatalogSync,
  catalogPositions,
  defaultHourlyRate,
  currency = null,
  showQuantityColumn,
  moduleSizeOptions = [],
  highlightStaleCatalogPrices = false,
  mergedSagataveHighlightIds,
  estimateLocked = false,
  colSpan,
  openMultiPositionModal,
  estimateUnits = [],
  softDeleteRows = false,
  showHiddenEstimateRows = false,
  toolbar = null,
  collapsedSectionIds,
  toggleSectionCollapsed,
  expandSection,
}: {
  categories: EstimateCategory[];
  allDragIds: string[];
  setCategories: Dispatch<SetStateAction<EstimateCategory[]>>;
  multiOptionLinks: MultiOptionLinkGroup[];
  setMultiOptionLinks: Dispatch<SetStateAction<MultiOptionLinkGroup[]>>;
  totals: {
    labor: number;
    materials: number;
    mechanisms: number;
    grand: number;
  };
  onSyncCatalogPosition: (item: EstimateLineItem) => void;
  onScheduleCatalogSync: (item: EstimateLineItem) => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  currency?: string | null;
  showQuantityColumn: boolean;
  moduleSizeOptions?: BuildingModuleSizeOption[];
  highlightStaleCatalogPrices?: boolean;
  mergedSagataveHighlightIds: ReadonlySet<string>;
  estimateLocked?: boolean;
  colSpan: number;
  openMultiPositionModal: OpenMultiPositionModal;
  estimateUnits?: string[];
  softDeleteRows?: boolean;
  showHiddenEstimateRows?: boolean;
  toolbar?: ReactNode;
  collapsedSectionIds: ReadonlySet<string>;
  toggleSectionCollapsed: (sectionId: string) => void;
  expandSection: (sectionId: string) => void;
}) {
  const { t } = useTranslations();
  const numericHeaderStyles = getEstimateNumericStyles(showQuantityColumn);
  const primaryHeaderThClass = showQuantityColumn
    ? numericHeaderStyles.headerMetric
    : estimatePrimaryHeaderThClass;
  const subheaderThClass = showQuantityColumn
    ? numericHeaderStyles.headerSub
    : estimateSubheaderThClass;
  const groupHeaderThClass = showQuantityColumn
    ? numericHeaderStyles.headerGroup
    : estimateGroupHeaderThClass;
  const { setActiveId, setOverId, clear } = useDropIndicatorActions();
  const [linkDragSourceOptionId, setLinkDragSourceOptionId] = useState<
    string | null
  >(null);

  const optionLinkActions = useMemo<MultiOptionLinkActions>(
    () => ({
      linkDragSourceOptionId,
      onLinkDragStart: (optionId) => setLinkDragSourceOptionId(optionId),
      onLinkDragEnd: () => setLinkDragSourceOptionId(null),
      getLinkedOptions: (optionId) =>
        getLinkedOptionSummaries(categories, multiOptionLinks, optionId, t),
      onLinkDrop: (sourceOptionId, targetOptionId) => {
        setMultiOptionLinks((current) =>
          linkMultiOptions(
            categories,
            current,
            sourceOptionId,
            targetOptionId,
          ),
        );
      },
      onUnlink: (sourceOptionId, targetOptionId) => {
        setMultiOptionLinks((current) =>
          unlinkMultiOptions(current, sourceOptionId, targetOptionId),
        );
      },
      onMultiChange: (multiId, next, syncSelection) => {
        setCategories((current) =>
          applyMultiChangeWithLinkSync(
            current,
            multiOptionLinks,
            multiId,
            next,
            syncSelection,
          ),
        );
      },
      onMultiDelete: (multiId) => {
        setCategories((current) => {
          if (softDeleteRows) {
            return hideMultiFromCategories(current, multiId);
          }

          const multi = findMultiById(current, multiId);
          if (multi) {
            setMultiOptionLinks((links) =>
              cleanupLinksAfterMultiDelete(links, multi),
            );
          }

          return removeMultiFromCategories(current, multiId);
        });
      },
    }),
    [
      categories,
      linkDragSourceOptionId,
      multiOptionLinks,
      setCategories,
      setMultiOptionLinks,
      softDeleteRows,
      t,
    ],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over ? String(event.over.id) : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    clear();

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCategories((current) =>
      reorderEstimate(current, String(active.id), String(over.id)),
    );
  }

  return (
    <DndContext
      id={ESTIMATE_DND_CONTEXT_ID}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={clear}
    >
      <EstimateTableStickyShell
        header={
          <table className={estimateTableClassName}>
            <EstimateProjectTableColgroup showQuantityColumn={showQuantityColumn} />
            <thead>
              {toolbar ? (
                <tr>
                  <th colSpan={colSpan} className={estimateTableToolbarRowClass}>
                    <div className={estimateTableToolbarInnerClass}>{toolbar}</div>
                  </th>
                </tr>
              ) : null}
              <tr>
                <th rowSpan={2} className={`${primaryHeaderThClass} pl-[22px] pr-1 text-left`}>
                  {t("common.name", "Nosaukums")}
                </th>
                <th rowSpan={2} className={`${primaryHeaderThClass} px-1 text-center`}>
                  {t("common.unit_short", "Mērv.")}
                </th>
                {showQuantityColumn ? (
                  <th
                    rowSpan={2}
                    className={`${primaryHeaderThClass} px-1 text-center`}
                    title={t(
                      "estimate.quantity.individual_title",
                      "Individuāls apjoms katram projektam",
                    )}
                  >
                    {t("common.quantity_short", "Daudz.")}
                  </th>
                ) : null}
                <th
                  colSpan={UNIT_PRICE_COLUMN_COUNT}
                  className={`${groupHeaderThClass} bg-sky-50/80 text-sky-800/70`}
                >
                  {t("estimate.unit_price", "Vienības cena")}
                </th>
                {showQuantityColumn ? (
                  <th
                    colSpan={VOLUME_PRICE_COLUMN_COUNT}
                    className={`${groupHeaderThClass} bg-emerald-50/80 text-emerald-800/70`}
                  >
                    {t("estimate.volume_price", "Apjoma cena")}
                  </th>
                ) : null}
                <th rowSpan={2} className="border-b border-zinc-200 bg-white" />
              </tr>
              <tr>
                {getUnitPriceSubheaderLabels(currency, t).map((label) => (
                  <th
                    key={label}
                    className={`${subheaderThClass} bg-sky-50/40`}
                  >
                    <EstimateTableSubheaderLabel label={label} />
                  </th>
                ))}
                {showQuantityColumn
                  ? getVolumePriceSubheaderLabels(t).map((label) => (
                      <th
                        key={`volume-${label}`}
                        className={`${subheaderThClass} bg-emerald-50/40`}
                      >
                        <EstimateTableSubheaderLabel label={label} />
                      </th>
                    ))
                  : null}
              </tr>
            </thead>
          </table>
        }
      >
      <table className={estimateTableClassName}>
        <EstimateProjectTableColgroup showQuantityColumn={showQuantityColumn} />
        <SortableContext
          items={allDragIds}
          strategy={verticalListSortingStrategy}
        >
          {categories.map((category) => (
            <CategoryBlock
              key={category.id}
              catalogPositions={catalogPositions}
              defaultHourlyRate={defaultHourlyRate}
              currency={currency}
              showQuantityColumn={showQuantityColumn}
              moduleSizeOptions={moduleSizeOptions}
              highlightStaleCatalogPrices={highlightStaleCatalogPrices}
              mergedSagataveHighlightIds={mergedSagataveHighlightIds}
              estimateLocked={estimateLocked}
              openMultiPositionModal={openMultiPositionModal}
              estimateUnits={estimateUnits}
              colSpan={colSpan}
              allCategories={categories}
              optionLinkActions={optionLinkActions}
              softDeleteRows={softDeleteRows}
              showHiddenEstimateRows={showHiddenEstimateRows}
              onSyncCatalogPosition={onSyncCatalogPosition}
              onScheduleCatalogSync={onScheduleCatalogSync}
              collapsed={collapsedSectionIds.has(category.id)}
              collapsedSummaryParts={getCollapsedSectionSummaryParts(category, t)}
              onToggleCollapse={() => toggleSectionCollapsed(category.id)}
              onEnsureExpanded={() => expandSection(category.id)}
              collapsedSectionIds={collapsedSectionIds}
              toggleSectionCollapsed={toggleSectionCollapsed}
              expandSection={expandSection}
              category={category}
              onChange={(next) =>
                setCategories((current) =>
                  current.map((entry) =>
                    entry.id === category.id ? next : entry,
                  ),
                )
              }
              onDelete={() =>
                setCategories((current) =>
                  current.filter((entry) => entry.id !== category.id),
                )
              }
            />
          ))}
        </SortableContext>
        <tfoot>
          <tr className="bg-zinc-100/90">
            <td
              colSpan={showQuantityColumn ? 3 : 2}
              className="border-t-2 border-zinc-300 px-3 py-2.5 text-right text-sm font-semibold text-zinc-600"
            >
              {t("common.total", "Kopā")}
            </td>
            {showQuantityColumn ? (
              Array.from({ length: UNIT_PRICE_COLUMN_COUNT }).map((_, index) => (
                <td
                  key={`footer-unit-${index}`}
                  className="border-t-2 border-zinc-300 bg-sky-50/30"
                />
              ))
            ) : (
              <>
                <td className="border-t-2 border-zinc-300 bg-sky-50/30" />
                <td className="border-t-2 border-zinc-300 bg-sky-50/30" />
                <td className={`${footerCell} bg-sky-50/50`}>
                  {formatAmountDisplay(totals.labor)}
                </td>
                <td className={`${footerCell} bg-sky-50/50`}>
                  {formatAmountDisplay(totals.materials)}
                </td>
                <td className={`${footerCell} bg-sky-50/50`}>
                  {formatAmountDisplay(totals.mechanisms)}
                </td>
                <td className={`${footerCell} bg-sky-100/60 text-sm`}>
                  {formatAmountDisplay(totals.grand)}
                </td>
              </>
            )}
            {showQuantityColumn ? (
              <>
                <td className="border-t-2 border-zinc-300 bg-emerald-50/40" />
                <td className={volumeSumFooterCell}>
                  {formatAmountDisplay(totals.labor)}
                </td>
                <td className={volumeSumFooterCell}>
                  {formatAmountDisplay(totals.materials)}
                </td>
                <td className={volumeSumFooterCell}>
                  {formatAmountDisplay(totals.mechanisms)}
                </td>
                <td className={volumeSumFooterCellTotal}>
                  {formatAmountDisplay(totals.grand)}
                </td>
              </>
            ) : null}
            <td className="border-t-2 border-zinc-300" />
          </tr>
        </tfoot>
      </table>
      </EstimateTableStickyShell>
    </DndContext>
  );
}

function MetaField({
  label,
  value,
  type = "text",
  onChange,
  fullWidth = false,
  suffix,
  readOnly = false,
  disabled = false,
}: {
  label: string;
  value: string;
  type?: string;
  onChange?: (value: string) => void;
  fullWidth?: boolean;
  suffix?: string;
  readOnly?: boolean;
  disabled?: boolean;
}) {
  const isInactive = readOnly || disabled;
  const fieldClassName = `w-full border-0 bg-transparent pb-1.5 text-sm transition focus:outline-none ${
    disabled ? "cursor-not-allowed text-zinc-600" : "text-zinc-800"
  }`;

  const inputElement =
    fullWidth && type === "text" ? (
      <textarea
        rows={2}
        value={value}
        readOnly={readOnly}
        disabled={disabled}
        onChange={
          isInactive || !onChange
            ? undefined
            : (event) => onChange(event.target.value)
        }
        className={`${fieldClassName} resize-none break-words`}
      />
    ) : (
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        disabled={disabled}
        onChange={
          isInactive || !onChange
            ? undefined
            : (event) => onChange(event.target.value)
        }
        className={fieldClassName}
      />
    );

  return (
    <label className={`block w-full ${disabled ? "cursor-not-allowed" : ""}`}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      {suffix ? (
        <div
          className={`flex min-w-0 items-center overflow-hidden border-b border-zinc-200 transition ${
            disabled ? "" : "focus-within:border-zinc-400"
          }`}
        >
          <div className="min-w-0 flex-1">{inputElement}</div>
          <span
            className={`shrink-0 border-l border-zinc-200 pl-2 pr-0.5 text-sm ${
              disabled ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            {suffix}
          </span>
        </div>
      ) : (
        <div
          className={`border-b border-zinc-200 transition ${
            disabled ? "" : "focus-within:border-zinc-400"
          }`}
        >
          {inputElement}
        </div>
      )}
    </label>
  );
}

type EstimateTableProps = {
  variant?: "full" | "tableOnly";
  initialTitle?: string;
  initialMeta?: EstimateMeta;
  initialCategories?: EstimateCategory[];
  initialMultiOptionLinks?: MultiOptionLinkGroup[];
  /** ISO timestamp of last save (`estimates.updated_at` from DB). */
  estimateUpdatedAt?: string;
  moduleName?: string | null;
  moduleVisualizations?: ModuleContentBlock[];
  moduleSizeOptions?: BuildingModuleSizeOption[];
  project?: ProjectSummary;
  modules?: BuildingModuleSummary[];
  estimateValidityDays?: number;
  catalogPositions?: PositionPriceSummary[];
  defaultHourlyRate?: number | null;
  currency?: string | null;
  sagataveSections?: EstimateCategory[];
  sagataveMultiOptionLinks?: MultiOptionLinkGroup[];
  globalExcludedPositions?: ExcludedPosition[];
  users?: UserSummary[];
};

export function EstimateTable({
  variant = "full",
  initialTitle = SAMPLE_TITLE,
  initialMeta = SAMPLE_META,
  initialCategories = createSampleCategories(),
  initialMultiOptionLinks = [],
  estimateUpdatedAt,
  moduleName = null,
  moduleVisualizations = [],
  moduleSizeOptions = [],
  project,
  modules = [],
  estimateValidityDays = DEFAULT_ESTIMATE_VALIDITY_DAYS,
  catalogPositions = [],
  defaultHourlyRate = null,
  currency = null,
  sagataveSections = [],
  sagataveMultiOptionLinks = [],
  globalExcludedPositions = [],
  users = [],
}: EstimateTableProps = {}) {
  const { t } = useTranslations();
  const [title, setTitle] = useState(initialTitle);
  const [meta, setMeta] = useState(initialMeta);
  const [categories, setCategories] = useState<EstimateCategory[]>(
    initialCategories,
  );
  const [multiOptionLinks, setMultiOptionLinks] = useState<
    MultiOptionLinkGroup[]
  >(initialMultiOptionLinks);
  const [moduleDataSpotlightDismissed, setModuleDataSpotlightDismissed] =
    useState(false);
  const [mergedSagataveHighlightIds, setMergedSagataveHighlightIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [syncSagataveChangesModalOpen, setSyncSagataveChangesModalOpen] = useState(false);
  const [hideSagataveChangesBanner, setHideSagataveChangesBanner] = useState(false);
  const [showHiddenEstimateRows, setShowHiddenEstimateRows] = useState(false);
  const [excludedPositions, setExcludedPositions] = useState(globalExcludedPositions);
  const [, startSaveDatesTransition] = useTransition();
  const [isAcknowledgingSagataveIntro, startAcknowledgeSagataveIntroTransition] =
    useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isExcelDownloading, setIsExcelDownloading] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serializeEstimatePositionDocument(initialTitle, initialCategories, initialMultiOptionLinks),
  );
  const [savedPlannedProfitPercent, setSavedPlannedProfitPercent] = useState(() =>
    normalizePlannedProfitPercent(initialMeta.plannedProfitPercent ?? 0),
  );
  const [savedAt, setSavedAt] = useState<string | undefined>(
    initialMeta.savedAt,
  );
  const [positionModalState, setPositionModalState] = useState<{
    item: EstimateLineItem;
    onSave: (next: EstimateLineItem) => void;
  } | null>(null);
  const [multiPositionModalState, setMultiPositionModalState] = useState<{
    value: EstimateMultiPosition;
    onSave: (next: EstimateMultiPosition) => void;
  } | null>(null);
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const canSaveEstimate = useActionPermission("estimate.save");
  const canExportEstimate = useActionPermission("estimate.export");
  const canEditEstimateDates = useActionPermission("estimate.dates");
  const estimateStatusLocked = project
    ? isProjectEstimateLocked(project.status)
    : false;
  const editorLocked = estimateStatusLocked || !canSaveEstimate;
  const datesReadOnly = estimateStatusLocked || !canEditEstimateDates;
  const plannedProfitPercent = normalizePlannedProfitPercent(
    meta.plannedProfitPercent ?? 0,
  );
  const showPlannedProfitMissingNotice =
    project != null && isPlannedProfitUnset(meta.plannedProfitPercent);
  const openPositionModal = useCallback(
    (item: EstimateLineItem, onSave: (next: EstimateLineItem) => void) => {
      setPositionModalState({ item, onSave });
    },
    [],
  );
  const openMultiPositionModal = useCallback(
    (
      value: EstimateMultiPosition,
      onSave: (next: EstimateMultiPosition) => void,
    ) => {
      setMultiPositionModalState({ value, onSave });
    },
    [],
  );
  const estimateUnits = useMemo(
    () => collectEstimateDocumentUnits(categories, moduleSizeOptions),
    [categories, moduleSizeOptions],
  );
  const collapseDocumentId = project?.id ?? "__preview__";
  const {
    collapsedSectionIds,
    toggleSectionCollapsed,
    expandSection,
  } = useCollapsedEstimateSections(collapseDocumentId);

  useEffect(() => {
    setMeta(initialMeta);
    setSavedAt(initialMeta.savedAt);
    setSavedPlannedProfitPercent(
      normalizePlannedProfitPercent(initialMeta.plannedProfitPercent ?? 0),
    );
  }, [initialMeta]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    setExcludedPositions(globalExcludedPositions);
  }, [globalExcludedPositions]);

  useEffect(() => {
    setModuleDataSpotlightDismissed(false);
    setMergedSagataveHighlightIds(new Set());
  }, [project?.id]);

  function persistEstimateDates(dates: Pick<EstimateMeta, "date" | "deadline">) {
    if (!project) return;

    startSaveDatesTransition(async () => {
      await updateProjectEstimateDatesAction(project.id, dates);
    });
  }

  function handleEstimateDateChange(date: string) {
    const deadline = date
      ? defaultEstimateDeadline(date, estimateValidityDays)
      : meta.deadline;
    const nextMeta = { ...meta, date, deadline };
    setMeta(nextMeta);
    persistEstimateDates({ date: nextMeta.date, deadline: nextMeta.deadline });
  }

  function handleEstimateDeadlineChange(deadline: string) {
    const nextMeta = { ...meta, deadline };
    setMeta(nextMeta);
    persistEstimateDates({ date: nextMeta.date, deadline: nextMeta.deadline });
  }

  function handleRefreshCatalogPrices() {
    if (!highlightStaleCatalogPrices || editorLocked) return;

    const refreshed = refreshEstimateCatalogPrices(
      categories,
      catalogPositions,
      defaultHourlyRate,
    );
    setCategories(refreshed);
  }

  function handleAcknowledgeSagataveStructureIntro() {
    if (!project || editorLocked || isAcknowledgingSagataveIntro) return;

    clearFeedback();
    startAcknowledgeSagataveIntroTransition(async () => {
      const result = await acknowledgeSagataveStructureIntroAction(project.id);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setMeta((current) => {
        const nextMeta = { ...current };
        delete nextMeta.unacknowledgedSagataveStructureIds;
        return nextMeta;
      });
    });
  }

  function handleApplySagataveChanges(selectedChangeIds: Set<string>) {
    if (!highlightSagatavePositionChanges || editorLocked) return;

    const applied = applySelectedSagataveChangesToProject(
      categories,
      sagataveSections,
      selectedChangeIds,
    );
    let nextCategories = applied.categories;

    if (moduleSizeOptions.length > 0) {
      nextCategories = syncCategoriesQuantitiesFromModuleSizes(
        nextCategories,
        moduleSizeOptions[0].projectDescription,
        catalogPositions,
      );
    }

    setCategories(nextCategories);
    setMergedSagataveHighlightIds(new Set(applied.appliedNodeIds));

    const remainingChanges = listSagatavePositionChanges(
      sagataveSections,
      nextCategories,
    );
    setHideSagataveChangesBanner(remainingChanges.length === 0);
  }

  function handleFileDownload(url: string, setLoading: (v: boolean) => void) {
    setLoading(true);

    const a = document.createElement("a");
    a.href = url;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.setTimeout(() => {
      setLoading(false);
    }, 1500);
  }

  async function handleSave() {
    if (!project || isSaving || editorLocked) return;

    const missingQuantityCount = collectEstimateLineItems(categories).filter(
      (item) => isVariableQuantityLineItem(item, catalogPositions) && item.quantity <= 0,
    ).length;

    if (missingQuantityCount > 0) {
      showFeedback({
        type: "error",
        text: t(
          "estimate.validation.variable_quantity_required",
          "Jāievada apjoms {count} pozīcijām ar individuālu apjomu.",
          { count: missingQuantityCount },
        ),
      });
      return;
    }

    setIsSaving(true);
    clearFeedback();

    const syncedCategories =
      moduleSizeOptions.length > 0
        ? syncCategoriesQuantitiesFromModuleSizes(
            categories,
            moduleSizeOptions[0].projectDescription,
            catalogPositions,
          )
        : categories;

    const bakedCategories = bakeInCatalogPrices(
      syncedCategories,
      catalogPositions,
      defaultHourlyRate,
    );

    const savedAtIso = new Date().toISOString();
    const nextMeta = {
      ...meta,
      savedAt: savedAtIso,
      pricesFrozen: true,
    };

    const result = await saveProjectEstimateAction(project.id, {
      title,
      meta: nextMeta,
      categories: bakedCategories,
      multiOptionLinks,
    });

    setIsSaving(false);

    if (result.ok) {
      setMeta(nextMeta);
      setCategories(bakedCategories);
      setSavedSnapshot(
        serializeEstimatePositionDocument(title, bakedCategories, multiOptionLinks),
      );
      setSavedPlannedProfitPercent(
        normalizePlannedProfitPercent(nextMeta.plannedProfitPercent ?? 0),
      );
      setSavedAt(savedAtIso);
      showFeedback({ type: "success", text: t("estimate.feedback.saved", "Tāme saglabāta.") });
    } else {
      showFeedback({ type: "error", text: translateActionError(t, result) });
    }
  }

  const currentSnapshot = useMemo(
    () => serializeEstimatePositionDocument(title, categories, multiOptionLinks),
    [title, categories, multiOptionLinks],
  );
  const isPlannedProfitDirty =
    project != null &&
    plannedProfitPercent !== savedPlannedProfitPercent;
  const isDirty = currentSnapshot !== savedSnapshot || isPlannedProfitDirty;

  const showQuantityColumn = Boolean(project);
  const isEstimateSaved = isProjectEstimateSaved(meta, {
    projectCreatedAt: project?.createdAt,
    estimateUpdatedAt,
  });
  const highlightStaleCatalogPrices = Boolean(
    project &&
      isEstimateSaved &&
      shouldShowStaleCatalogPriceWarnings(project.status),
  );

  const hasStaleCatalogPrices = useMemo(() => {
    if (!project || !isEstimateSaved) {
      return false;
    }
    if (!shouldShowStaleCatalogPriceWarnings(project.status)) {
      return false;
    }
    return estimateHasStaleCatalogPrices(
      categories,
      catalogPositions,
      defaultHourlyRate,
    );
  }, [project, isEstimateSaved, categories, catalogPositions, defaultHourlyRate]);

  const highlightSagatavePositionChanges = Boolean(
    project &&
      shouldShowStaleCatalogPriceWarnings(project.status) &&
      sagataveSections.length > 0,
  );

  const sagataveStructureIntroEntries = useMemo(
    () =>
      listSagataveStructureIntroEntries(
        categories,
        meta.unacknowledgedSagataveStructureIds ?? [],
      ),
    [categories, meta.unacknowledgedSagataveStructureIds],
  );

  const hasSagataveStructureIntro = sagataveStructureIntroEntries.length > 0;

  const sagatavePositionChanges = useMemo(
    () =>
      highlightSagatavePositionChanges
        ? listSagatavePositionChanges(sagataveSections, categories)
        : [],
    [highlightSagatavePositionChanges, sagataveSections, categories],
  );

  useEffect(() => {
    setHideSagataveChangesBanner(false);
  }, [sagataveSections, project?.id]);

  const hasSagatavePositionChanges =
    sagatavePositionChanges.length > 0 && !hideSagataveChangesBanner;

  const totals = useMemo(
    () =>
      calculateEstimateTotals(
        categories,
        catalogPositions,
        defaultHourlyRate,
        plannedProfitPercent,
      ),
    [categories, catalogPositions, defaultHourlyRate, plannedProfitPercent],
  );

  const pendingMaterialsSummary = useMemo(
    () =>
      countPendingProjectMaterials(
        categories,
        catalogPositions,
        moduleSizeOptions,
        meta.orderedMaterialPositionIds ?? [],
      ),
    [
      categories,
      catalogPositions,
      moduleSizeOptions,
      meta.orderedMaterialPositionIds,
    ],
  );

  const positionCount = useMemo(
    () => collectEstimateLineItems(categories).length,
    [categories],
  );

  const hiddenEstimateRowCount = useMemo(
    () => (project ? countHiddenEstimateRows(categories) : 0),
    [project, categories],
  );

  const allDragIds = useMemo(
    () =>
      collectVisibleSectionDragIds(categories, collapsedSectionIds, {
        includeHiddenRows: showHiddenEstimateRows,
      }),
    [categories, collapsedSectionIds, showHiddenEstimateRows],
  );
  const { flushSyncFromLineItem, scheduleSyncFromLineItem } =
    useSyncCatalogPositionFromLineItem(catalogPositions);

  const displayModuleName = moduleName ?? t("projects.individual_project", "Individuāls projekts");
  const showModuleDataSpotlight = Boolean(
    project &&
      project.buildingModuleId === null &&
      !isIndividualProjectModuleDataComplete(project) &&
      !moduleDataSpotlightDismissed,
  );

  const estimateTableToolbar = (
    <>
      {variant === "tableOnly" ? (
        editorLocked ? (
          <p className="min-w-[12rem] flex-1 text-sm font-semibold text-zinc-900">
            {title}
          </p>
        ) : (
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="min-w-[12rem] flex-1 border-0 bg-transparent text-sm font-semibold text-zinc-900 focus:outline-none"
            aria-label={t("estimate.title.aria", "Tāmes nosaukums")}
          />
        )
      ) : null}
      <p className="text-xs text-zinc-500">
        {t("estimate.table.counts", "{sections} tāmes pozīcijas · {rows} rindas", {
          sections: categories.length,
          rows: positionCount,
        })}
      </p>
      {project && hiddenEstimateRowCount > 0 ? (
        <button
          type="button"
          onClick={() => setShowHiddenEstimateRows((current) => !current)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            showHiddenEstimateRows
              ? "border-zinc-400 bg-zinc-200 text-zinc-900"
              : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          <i
            className={`fas ${showHiddenEstimateRows ? "fa-eye-slash" : "fa-eye"} text-[10px]`}
            aria-hidden="true"
          />
          {showHiddenEstimateRows
            ? t("estimate.hidden.hide", "Paslēpt noņemtās")
            : t("estimate.hidden.show", "Rādīt noņemtās ({count})", {
                count: hiddenEstimateRowCount,
              })}
        </button>
      ) : null}
      {!editorLocked ? (
        <AddEstimateSectionButton
          onAdd={(section) => setCategories([...categories, section])}
        />
      ) : null}
    </>
  );

  const tablePanel = (
    <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <SectionTitleFocusProvider>
      <EstimatePlannedProfitProvider percent={plannedProfitPercent}>
        <PositionModalProvider openPositionModal={openPositionModal}>
          <EstimateDndTable
            categories={categories}
            allDragIds={allDragIds}
            setCategories={setCategories}
            multiOptionLinks={multiOptionLinks}
            setMultiOptionLinks={setMultiOptionLinks}
            totals={totals}
            onSyncCatalogPosition={flushSyncFromLineItem}
            onScheduleCatalogSync={scheduleSyncFromLineItem}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            currency={currency}
            showQuantityColumn={showQuantityColumn}
            moduleSizeOptions={moduleSizeOptions}
            highlightStaleCatalogPrices={highlightStaleCatalogPrices}
            mergedSagataveHighlightIds={mergedSagataveHighlightIds}
            estimateLocked={editorLocked}
            openMultiPositionModal={openMultiPositionModal}
            estimateUnits={estimateUnits}
            softDeleteRows={Boolean(project)}
            showHiddenEstimateRows={showHiddenEstimateRows}
            toolbar={estimateTableToolbar}
            collapsedSectionIds={collapsedSectionIds}
            toggleSectionCollapsed={toggleSectionCollapsed}
            expandSection={expandSection}
          />
        </PositionModalProvider>
      </EstimatePlannedProfitProvider>
      </SectionTitleFocusProvider>
    </div>
  );

  if (variant === "tableOnly") {
    return (
      <div className="max-w-full space-y-4">
        {tablePanel}
        {positionModalState ? (
          <PositionModal
            open
            onOpenChange={(open) => {
              if (!open) {
                setPositionModalState(null);
              }
            }}
            value={positionModalState.item}
            onSave={(next) => {
              positionModalState.onSave(next);
              setPositionModalState(null);
            }}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            currency={currency}
            moduleSizeOptions={moduleSizeOptions}
            estimateUnits={estimateUnits}
          />
        ) : null}
        {multiPositionModalState ? (
          <MultiPositionModal
            open
            onOpenChange={(open) => {
              if (!open) {
                setMultiPositionModalState(null);
              }
            }}
            value={multiPositionModalState.value}
            onSave={(next) => multiPositionModalState.onSave(next)}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            currency={currency}
            moduleSizeOptions={moduleSizeOptions}
            estimateUnits={estimateUnits}
          />
        ) : null}
      </div>
    );
  }

  return (
    <>
      {showModuleDataSpotlight ? (
        <IndividualProjectModuleDataSpotlight
          onDismiss={() => setModuleDataSpotlightDismissed(true)}
        />
      ) : null}
      <div className="max-w-full space-y-4">
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <ModuleVisualizationGallery
          blocks={moduleVisualizations}
          className="h-full"
        />

        <div className="space-y-5">
        {project ? (
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 text-2xl font-bold tracking-tight text-zinc-900">
              {displayModuleName}
            </h2>
            <ProjectCardActions
              project={project}
              modules={modules}
              moduleDataSpotlight={showModuleDataSpotlight}
            />
          </div>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              {t("estimate.offer.title", "Tāmes piedāvājums")}
            </p>
            {editorLocked ? (
              <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
                {title}
              </p>
            ) : (
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full border-0 bg-transparent text-xl font-semibold tracking-tight text-zinc-900 focus:outline-none"
              />
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {meta.number.trim() ? (
              <span className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-600">
                {meta.number}
              </span>
            ) : null}
            <div className="rounded-lg bg-zinc-900 px-3 py-1.5 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                {t("common.total", "Kopā")}
              </p>
              <p className="text-sm font-semibold tabular-nums text-white">
                {formatMoneyDisplay(totals.grand, currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <MetaField
            label={t("projects.client_name", "Pasūtītāja vārds, uzvārds")}
            value={meta.client}
            readOnly={editorLocked}
            onChange={(client) => setMeta({ ...meta, client })}
          />
          <MetaField
            label={t("estimate.object", "Objekts")}
            value={meta.project}
            readOnly={editorLocked}
            onChange={(project) => setMeta({ ...meta, project })}
            fullWidth
          />
          <div
            className={
              estimateStatusLocked
                ? project
                  ? "grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)]"
                  : "grid grid-cols-1 gap-y-4"
                : project
                  ? "grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(0,1fr)]"
                  : "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2"
            }
          >
            {project ? (
              <div className="w-full max-w-[8.5rem] shrink-0">
                <MetaField
                  label={t("estimate.planned_profit", "Plānotā peļņa")}
                  value={
                    meta.plannedProfitPercent != null
                      ? String(meta.plannedProfitPercent)
                      : estimateStatusLocked
                        ? "0"
                        : ""
                  }
                  type="number"
                  suffix="%"
                  disabled={estimateStatusLocked}
                  readOnly={!estimateStatusLocked && editorLocked}
                  onChange={(raw) => {
                    const parsed = parsePlannedProfitInput(raw);
                    setMeta({
                      ...meta,
                      plannedProfitPercent: parsed > 0 ? parsed : undefined,
                    });
                  }}
                />
              </div>
            ) : null}
            <MetaField
              label={t("common.date", "Datums")}
              type="date"
              value={meta.date}
              readOnly={datesReadOnly}
              onChange={handleEstimateDateChange}
            />
            {!estimateStatusLocked ? (
              <div>
                <MetaField
                  label={t("estimate.deadline.label", "Tāmes termiņš")}
                  type="date"
                  value={meta.deadline}
                  readOnly={datesReadOnly}
                  onChange={handleEstimateDeadlineChange}
                />
                {!isDirty && isEstimateSaved && savedAt && meta.deadline ? (() => {
                  const days = daysUntilDeadline(meta.deadline);
                  if (days === null) return null;
                  const isExpired = days < 0;
                  return (
                    <p className={`mt-1 text-[11px] font-medium ${isExpired ? "text-red-500" : "text-zinc-400"}`}>
                      {formatDeadlineDays(days, t)}
                    </p>
                  );
                })() : null}
              </div>
            ) : null}
          </div>
        </div>
        </div>
      </div>

      {project && estimateStatusLocked ? <ApprovedEstimateStatusLabel /> : null}

      {project && estimateStatusLocked ? (
        <PendingProjectMaterialsBanner summary={pendingMaterialsSummary} />
      ) : null}

      {project && estimateStatusLocked ? (
        <ProjectMaterialsDelegationPanel
          projectId={project.id}
          users={users}
          materialAssigneeUserIds={meta.materialAssigneeUserIds ?? {}}
          showMaterialsColumn={pendingMaterialsSummary.pendingCount > 0}
          categories={categories}
          catalogPositions={catalogPositions}
          moduleSizeOptions={moduleSizeOptions}
          orderedMaterialPositionIds={meta.orderedMaterialPositionIds ?? []}
          currency={currency}
          useFrozenPrices
          onMaterialOrdered={(orderedIds) =>
            setMeta((current) => ({
              ...current,
              orderedMaterialPositionIds: orderedIds,
            }))
          }
          onMaterialAssigneeChange={(assigneeUserIds) =>
            setMeta((current) => ({
              ...current,
              materialAssigneeUserIds: assigneeUserIds,
            }))
          }
        />
      ) : null}

      {project && hasStaleCatalogPrices ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <i className="fas fa-sync-alt text-xs" aria-hidden="true" />
          {t("estimate.stale_prices.available", "Pieejami jauni izcenojumi")}
        </div>
      ) : null}

      {project && hasSagatavePositionChanges ? (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900"
        >
          <div className="flex items-center gap-2">
            <i className="fas fa-pen-to-square text-xs" aria-hidden="true" />
            {t(
              "estimate.sagatave.changes_available",
              "Sagatavē ir izmaiņas, kuras var pielāgot šai tāmei",
            )}
          </div>
          <button
            type="button"
            onClick={() => setSyncSagataveChangesModalOpen(true)}
            disabled={isSaving || editorLocked}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-sm font-medium text-sky-900 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("estimate.sagatave.sync_changes", "Pielāgot no sagataves")}
          </button>
        </div>
      ) : null}

      {project && hasSagatavePositionChanges ? (
        <SyncSagataveChangesModal
          open={syncSagataveChangesModalOpen}
          onOpenChange={setSyncSagataveChangesModalOpen}
          changes={sagatavePositionChanges}
          disabled={isSaving || editorLocked}
          onConfirm={handleApplySagataveChanges}
        />
      ) : null}

      {project && hasSagataveStructureIntro ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <i className="fas fa-layer-group text-xs" aria-hidden="true" />
                {t(
                  "estimate.sagatave.auto_hidden_intro.title",
                  "Sagatavē ir jaunas kategorijas, subkategorijas vai pozīcijas",
                )}
              </div>
              <p className="text-amber-800">
                {t(
                  "estimate.sagatave.auto_hidden_intro.description",
                  "Tās automātiski pievienotas šai tāmei kā paslēptas. Apskati sarakstu un apstiprini, kad iepazinies.",
                )}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-amber-900">
                {sagataveStructureIntroEntries.map((entry) => (
                  <li key={entry.nodeId}>
                    {entry.kind === "category"
                      ? t(
                          "estimate.sagatave.auto_hidden_intro.category",
                          "Kategorija: {name}",
                          { name: entry.label },
                        )
                      : entry.kind === "subcategory"
                        ? t(
                            "estimate.sagatave.auto_hidden_intro.subcategory",
                            "Subkategorija: {category} → {name}",
                            {
                              category: entry.categoryTitle ?? "—",
                              name: entry.label,
                            },
                          )
                        : entry.subcategoryTitle
                          ? t(
                              "estimate.sagatave.auto_hidden_intro.position_in_sub",
                              "Pozīcija: {category} → {subcategory} → {name}",
                              {
                                category: entry.categoryTitle ?? "—",
                                subcategory: entry.subcategoryTitle,
                                name: entry.label,
                              },
                            )
                          : t(
                              "estimate.sagatave.auto_hidden_intro.position",
                              "Pozīcija: {category} → {name}",
                              {
                                category: entry.categoryTitle ?? "—",
                                name: entry.label,
                              },
                            )}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={handleAcknowledgeSagataveStructureIntro}
              disabled={isAcknowledgingSagataveIntro || editorLocked}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isAcknowledgingSagataveIntro
                ? t("actions.confirming", "Apstiprina…")
                : t("estimate.sagatave.auto_hidden_intro.confirm", "Sapratu")}
            </button>
          </div>
        </div>
      ) : null}

      {showPlannedProfitMissingNotice ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <i
            className="fas fa-info-circle mt-0.5 shrink-0 text-xs text-amber-700"
            aria-hidden="true"
          />
          <p>
            {t(
              "estimate.planned_profit.missing_notice",
              "Plānotā peļņa nav norādīta vai ir 0%. Vai tiešām vēlaties turpināt bez plānotās peļņas? Visas summas tabulā tiek rādītas bez peļņas piemērošanas.",
            )}
          </p>
        </div>
      ) : null}

      {tablePanel}

      {project ? (
        <ProjectExcludedPositionsPanel
          projectId={project.id}
          globalPositions={excludedPositions}
          omittedIds={meta.excludedPositionIdsOmitted ?? []}
          readOnly={editorLocked}
          canManage={canSaveEstimate}
          onOmit={(omittedIds) =>
            setMeta((current) => ({
              ...current,
              excludedPositionIdsOmitted: omittedIds,
            }))
          }
          onPositionsChange={setExcludedPositions}
        />
      ) : null}

      {project ? (
        <div className="flex w-full flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center justify-end gap-3">
            {isDirty ? (
              <span className="text-xs text-zinc-400">
                {t("common.unsaved_changes", "Nesaglabātas izmaiņas")}
              </span>
            ) : isEstimateSaved && savedAt ? (
              <span className="text-xs text-zinc-400">
                {t("common.saved_at", "Saglabāts: {date}", {
                  date: formatDisplayDateDdMmYy(savedAt),
                })}
              </span>
            ) : null}

            {!isDirty && isEstimateSaved && savedAt && canExportEstimate ? (
              <>
                <button
                  type="button"
                  disabled={isPdfDownloading}
                  onClick={() =>
                    handleFileDownload(
                      `/api/estimates/${project.id}/pdf`,
                      setIsPdfDownloading,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPdfDownloading ? (
                    <i className="fas fa-circle-notch fa-spin text-red-500 text-xs" aria-hidden="true" />
                  ) : (
                    <i className="fas fa-file-pdf text-red-500 text-xs" aria-hidden="true" />
                  )}
                  PDF
                  <span className="text-xs text-zinc-400">
                    {t("estimate.export.offer_suffix", "(piedāvājums)")}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={isExcelDownloading}
                  onClick={() =>
                    handleFileDownload(
                      `/api/estimates/${project.id}/excel`,
                      setIsExcelDownloading,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isExcelDownloading ? (
                    <i className="fas fa-circle-notch fa-spin text-green-600 text-xs" aria-hidden="true" />
                  ) : (
                    <i className="fas fa-file-excel text-green-600 text-xs" aria-hidden="true" />
                  )}
                  Excel
                  <span className="text-xs text-zinc-400">
                    {t("estimate.export.estimate_suffix", "(tāme)")}
                  </span>
                </button>
              </>
            ) : null}

            {!editorLocked ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving
                  ? t("actions.saving", "Saglabā…")
                  : t("estimate.actions.save", "Saglabāt tāmi")}
              </button>
            ) : null}

            {hasStaleCatalogPrices && !editorLocked ? (
              <button
                type="button"
                onClick={handleRefreshCatalogPrices}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <i className="fas fa-sync-alt text-xs" aria-hidden="true" />
                {t("estimate.actions.refresh_prices", "Atjaunot cenas")}
              </button>
            ) : null}
          </div>

          {showPlannedProfitMissingNotice ? (
            <p className="max-w-lg text-right text-xs text-amber-700">
              {t(
                "estimate.planned_profit.export_hint",
                "Piedāvājums un tāme tiks eksportēti bez plānotās peļņas",
              )}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
      {positionModalState ? (
        <PositionModal
          open
          onOpenChange={(open) => {
            if (!open) {
              setPositionModalState(null);
            }
          }}
          value={positionModalState.item}
          onSave={(next) => {
            positionModalState.onSave(next);
            setPositionModalState(null);
          }}
          catalogPositions={catalogPositions}
          defaultHourlyRate={defaultHourlyRate}
          currency={currency}
          moduleSizeOptions={moduleSizeOptions}
          estimateUnits={estimateUnits}
        />
      ) : null}
      {multiPositionModalState ? (
        <MultiPositionModal
          open
          onOpenChange={(open) => {
            if (!open) {
              setMultiPositionModalState(null);
            }
          }}
          value={multiPositionModalState.value}
          onSave={(next) => multiPositionModalState.onSave(next)}
          catalogPositions={catalogPositions}
          defaultHourlyRate={defaultHourlyRate}
          currency={currency}
          moduleSizeOptions={moduleSizeOptions}
          estimateUnits={estimateUnits}
        />
      ) : null}
    </>
  );
}
