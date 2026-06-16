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
  useEffect,
  useMemo,
  useState,
  useTransition,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  saveProjectEstimateAction,
  updateProjectEstimateDatesAction,
} from "@/app/(protected)/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useActionPermission } from "@/app/components/action-permissions-context";
import {
  VolumeSumCells,
  resolveLaborWorkloadHours,
  resolveLineItemVolumeSum,
  volumeSumFooterCell,
  volumeSumFooterCellTotal,
} from "@/app/components/estimate-volume-sum-cells";
import {
  VOLUME_PRICE_COLUMN_COUNT,
  VOLUME_PRICE_SUBHEADER_LABELS,
} from "@/app/lib/estimates/volume-price-columns";
import { formatAmountDisplay } from "@/app/lib/estimates/calculate-line";
import { calculateEstimateTotals, collectEstimateLineItems } from "@/app/lib/estimates/calculate-totals";
import {
  createLineItem,
  createSubcategory,
} from "@/app/lib/estimates/create-empty";
import { createEstimatePositionSection } from "@/app/lib/estimate-positions/create-empty";
import { formatMoneyDisplay } from "@/app/lib/estimates/format-money";
import {
  createSampleCategories,
  defaultEstimateDeadline,
  SAMPLE_META,
  SAMPLE_TITLE,
} from "@/app/lib/estimates/sample-data";
import { serializeEstimatePositionDocument } from "@/app/lib/estimate-positions/serialize-document";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import { ESTIMATE_UNITS } from "@/app/lib/estimates/units";
import { IndividualProjectModuleDataSpotlight } from "@/app/components/individual-project-module-data-spotlight";
import { ModuleVisualizationGallery } from "@/app/components/module-visualization-gallery";
import { ApprovedEstimateStatusLabel } from "@/app/components/approved-estimate-status-label";
import { ProjectCardActions } from "@/app/components/project-card-actions";
import { ProjectExcludedPositionsPanel } from "@/app/components/project-excluded-positions-panel";
import { PendingProjectMaterialsBanner } from "@/app/components/pending-project-materials-banner";
import { ProjectMaterialsDelegationPanel } from "@/app/components/project-materials-delegation-panel";
import { DeleteButton } from "@/app/components/delete-button";
import { AttachedModuleSizeLabel } from "@/app/components/attached-module-size-label";
import { EstimateMultiPositionRow } from "@/app/components/estimate-multi-position-row";
import { EstimateUnitPriceCells } from "@/app/components/estimate-unit-price-cells";
import {
  deriveCompositeUnitPrice,
  isCompositeLineItem,
} from "@/app/lib/estimates/composite-line-item";
import { resolveLineItemDisplayUnitFromModuleSize } from "@/app/lib/estimates/sync-module-size-quantities";
import {
  UNIT_PRICE_COLUMN_COUNT,
  getUnitPriceSubheaderLabels,
} from "@/app/lib/estimates/unit-price-columns";
import { EstimateLineItemNameField } from "@/app/components/estimate-line-item-name-field";
import { EstimateQuantityInput } from "@/app/components/estimate-quantity-input";
import { PositionVariableQuantityIcon } from "@/app/components/position-variable-quantity-icon";
import { Tooltip } from "@/app/components/tooltip";
import { useSyncCatalogPositionFromLineItem } from "@/app/lib/hooks/use-sync-catalog-position-from-line-item";
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
  isMaterialsOrMechanismsLineItem,
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
  collectAllDragIds,
  reorderEstimate,
} from "@/app/lib/estimates/reorder-estimate";
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
  isEstimateMultiPosition,
  removeRowItemById,
  updateRowItemById,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateMultiPosition,
  EstimateRowItem,
  EstimateSubcategory,
  PriceBreakdown,
} from "@/app/lib/estimates/types";
import type {
  BuildingModuleSizeOption,
  BuildingModuleSummary,
  ModuleContentBlock,
} from "@/app/lib/modules/types";
import { isProjectEstimateLocked, shouldShowStaleCatalogPriceWarnings } from "@/app/lib/projects/project-status";
import {
  mergeNewSagatavePositionsIntoProject,
  sagataveHasNewPositionsForProject,
} from "@/app/lib/estimate-positions/sagatave-has-new-positions";
import type { EstimateMeta, ProjectSummary } from "@/app/lib/projects/types";
import type { UserSummary } from "@/app/lib/users/types";
import { isIndividualProjectModuleDataComplete } from "@/app/lib/projects/project-module-data";
import { countPendingProjectMaterials } from "@/app/lib/projects/pending-project-materials";
import { DEFAULT_ESTIMATE_VALIDITY_DAYS } from "@/app/lib/settings/estimate-validity-days";
function getEstimateTableColCount(showQuantityColumn: boolean): number {
  return showQuantityColumn ? 15 : 9;
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

function formatDeadlineDays(days: number): string {
  if (days === 0) return "Termiņš šodien";
  if (days < 0) return `Termiņš beidzies pirms ${Math.abs(days)} d.`;
  const abs = Math.abs(days);
  const label = abs === 1 ? "diena" : "dienas";
  return `${abs} ${label} līdz termiņam`;
}

const cellInput =
  "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm transition focus:border-zinc-300 focus:bg-white focus:outline-none";
const nameInput =
  "w-full min-h-[2.75rem] resize-none rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm leading-snug whitespace-normal break-words transition [field-sizing:content] focus:border-zinc-300 focus:bg-white focus:outline-none";
const cellNum = `${cellInput} text-right tabular-nums`;
const nameCell = "border-b border-zinc-100 py-1 pr-2 align-top";
const readOnlyNum = "block px-2 py-1.5 text-right text-sm tabular-nums text-zinc-700";
/** Stable DndContext id — avoids SSR/client mismatch on aria-describedby. */
const ESTIMATE_DND_CONTEXT_ID = "estimate-table-dnd";

const footerCell =
  "border-t-2 border-zinc-300 px-2 py-2.5 text-right text-xs font-semibold tabular-nums text-zinc-900";

/** Shared left gutter + fixed drag column so handles align across all row types. */
const rowLead = "pl-3";
const dragHandleColumn =
  "flex h-7 w-6 shrink-0 items-center justify-center self-center";
const subcategoryNameIndent = "ml-[10px]";
const subcategoryItemNameIndent = "ml-[20px]";
const dropLineClass = "shadow-[inset_0_4px_0_0_rgb(24_24_27)]";
const mergedSagataveRowClass = "bg-emerald-50/80 hover:bg-emerald-50";
const mergedSagataveCategoryRowClass = "bg-emerald-100/90";
const mergedSagataveSubcategoryRowClass =
  "border-b border-b-zinc-200 bg-emerald-50/90";

function LineItemRow({
  item,
  onChange,
  onDelete,
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
}: {
  item: EstimateLineItem;
  onChange: (item: EstimateLineItem) => void;
  onDelete: () => void;
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
}) {
  const catalogPosition = findCatalogPositionForLineItem(item, catalogPositions);
  const isCatalogLinked = catalogPosition != null;
  const isComposite = isCompositeLineItem(item);
  const isMaterialsOrMechanisms = isMaterialsOrMechanismsLineItem(
    item,
    catalogPositions,
  );
  const displayName = catalogPosition?.name ?? item.name;
  const moduleSizeUnit =
    isComposite && !item.variableQuantity
      ? resolveLineItemDisplayUnitFromModuleSize(item, moduleSizeOptions ?? [])
      : null;
  const displayUnit = moduleSizeUnit ?? catalogPosition?.unit ?? item.unit;
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
  const displayUnitPrice = highlightStaleCatalogPrices
    ? resolveFrozenEstimateDisplayUnitPrice(
        item,
        catalogPositions,
        defaultHourlyRate,
      )
    : resolveLiveDisplayUnitPrice(item, catalogPositions, defaultHourlyRate);
  const staleCatalogPriceHints = highlightStaleCatalogPrices
    ? resolveStaleCatalogPriceHints(
        item,
        catalogPositions,
        defaultHourlyRate,
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

  return (
    <tbody
      ref={rowRef}
      style={rowStyle}
      className={`group ${showDropLine ? dropLineClass : ""}`}
    >
    <tr
      className={`align-middle ${
        highlightMergedSagatave
          ? mergedSagataveRowClass
          : quantityMissing && !estimateLocked
            ? "bg-red-50/60 hover:bg-red-50"
            : "hover:bg-sky-50/40"
      }`}
    >
      <td className={nameCell}>
        <div className={`flex items-center gap-1 ${rowLead}`}>
          <span className={dragHandleColumn}>{dragHandle}</span>
          <span className="inline-flex min-w-0 flex-1 items-start gap-1.5">
            <span className="min-w-0 flex-1">
              <EstimateLineItemNameField
                value={displayName}
                readOnly={estimateLocked || isCatalogLinked}
                catalogPositions={catalogPositions}
                defaultHourlyRate={defaultHourlyRate}
                currency={currency}
                className={`${nameInput} ${indentName ? subcategoryItemNameIndent : ""}`}
                footer={
                  isComposite ? (
                    <AttachedModuleSizeLabel
                      attachment={item.moduleSizeAttachment}
                      moduleSizeOptions={moduleSizeOptions ?? []}
                    />
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
            </span>
            {showQuantityColumn && !estimateLocked && item.variableQuantity ? (
              <Tooltip label="Noņemt individuālo apjomu">
                <button
                  type="button"
                  aria-label="Noņemt individuālo apjomu"
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
          </span>
        </div>
      </td>
      <td className="border-b border-zinc-100 px-1 py-0.5 align-top">
        {isCatalogLinked || isComposite ? (
          <span className={`${readOnlyNum} text-zinc-700`}>
            {displayUnit.trim() || "—"}
          </span>
        ) : (
          <select
            className={`${cellInput} cursor-pointer`}
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
        <td className="border-b border-zinc-100 px-1 py-0.5 align-top">
          {hasAttachedQuantity ? (
            <span className={`${readOnlyNum} text-zinc-700`}>
              {formatQuantityDisplay(attachedQuantity)}
            </span>
          ) : showQuantityInput ? (
            estimateLocked ? (
              <span className={`${readOnlyNum} ${item.quantity <= 0 ? "text-red-500" : "text-zinc-700"}`}>
                {item.quantity <= 0 ? "—" : formatQuantityDisplay(item.quantity)}
              </span>
            ) : (
              <EstimateQuantityInput
                className={`${cellNum} ${quantityMissing ? "border-red-300 bg-red-50 text-red-700 placeholder-red-300" : ""}`}
                value={item.quantity}
                onChange={(quantity) => onChange({ ...item, quantity })}
                emptyValue={0}
              />
            )
          ) : (
            <span className={`${readOnlyNum} text-zinc-300`}>—</span>
          )}
        </td>
      ) : null}
      <EstimateUnitPriceCells
        item={item}
        defaultHourlyRate={defaultHourlyRate}
        values={displayUnitPrice}
        staleCatalogPriceHints={staleCatalogPriceHints}
      />
      {showQuantityColumn ? (
        <VolumeSumCells
          values={volumeSum}
          laborWorkloadHours={laborWorkloadHours}
          staleCatalogPriceHints={staleCatalogPriceHints}
        />
      ) : null}
      <td className="border-b border-zinc-100 px-1 py-0.5 text-center align-top">
        {estimateLocked ? null : (
          <DeleteButton
            label="Dzēst pozīciju"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100"
          />
        )}
      </td>
    </tr>
    </tbody>
  );
}

const actionBtn =
  "inline-flex h-7 items-center rounded-md px-2 text-xs text-zinc-500 transition hover:bg-white hover:text-zinc-800";

function RowActions({
  onAddSub,
  onAddMulti,
  onAddItem,
  onDelete,
  deleteLabel,
  showSub = true,
  estimateLocked = false,
}: {
  onAddSub?: () => void;
  onAddMulti?: () => void;
  onAddItem: () => void;
  onDelete: () => void;
  deleteLabel: string;
  showSub?: boolean;
  estimateLocked?: boolean;
}) {
  if (estimateLocked) {
    return null;
  }

  return (
    <div className="flex h-7 shrink-0 items-center gap-1 self-center">
      {showSub && onAddSub ? (
        <button type="button" className={actionBtn} onClick={onAddSub}>
          + Sub
        </button>
      ) : null}
      {onAddMulti ? (
        <button type="button" className={actionBtn} onClick={onAddMulti}>
          + Multi
        </button>
      ) : null}
      <button type="button" className={actionBtn} onClick={onAddItem}>
        + Pozīcija
      </button>
      <DeleteButton label={deleteLabel} onClick={onDelete} />
    </div>
  );
}

function SortableMultiPositionRow({
  sortId,
  subcategoryId,
  value,
  optionLinkActions,
  catalogPositions,
  defaultHourlyRate,
  showQuantityColumn,
  allCategories,
  moduleSizeOptions = [],
  highlightStaleCatalogPrices = false,
  highlightMergedSagatave = false,
  estimateLocked = false,
}: {
  sortId: string;
  categoryId: string;
  subcategoryId?: string;
  value: EstimateMultiPosition;
  optionLinkActions: MultiOptionLinkActions;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  showQuantityColumn: boolean;
  allCategories: EstimateCategory[];
  moduleSizeOptions?: BuildingModuleSizeOption[];
  highlightStaleCatalogPrices?: boolean;
  highlightMergedSagatave?: boolean;
  estimateLocked?: boolean;
}) {
  const showDropLine = useShowDropLine(sortId);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: sortId,
    disabled: estimateLocked,
    animateLayoutChanges: () => false,
  });
  return (
    <EstimateMultiPositionRow
      mode="offer"
      value={value}
      onChange={
        estimateLocked
          ? () => {}
          : (next) => optionLinkActions.onMultiChange(value.id, next, true)
      }
      onDelete={
        estimateLocked
          ? () => {}
          : () => optionLinkActions.onMultiDelete(value.id)
      }
      catalogPositions={catalogPositions}
      defaultHourlyRate={defaultHourlyRate}
      optionLinkActions={optionLinkActions}
      indentName={subcategoryId != null}
      showDropLine={showDropLine}
      showQuantityColumn={showQuantityColumn}
      moduleSizeOptions={moduleSizeOptions}
      readOnlyPrices={true}
      highlightStaleCatalogPrices={highlightStaleCatalogPrices}
      highlightMergedSagatave={highlightMergedSagatave}
      rowRef={setNodeRef}
      rowStyle={isDragging ? { opacity: 0.45 } : undefined}
      dragHandle={
        estimateLocked ? null : (
          <DragHandle
            label="Pārvietot multi-pozīciju"
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
  ...props
}: {
  sortId: string;
  categoryId: string;
  subcategoryId?: string;
  item: EstimateLineItem;
  onChange: (item: EstimateLineItem) => void;
  onDelete: () => void;
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
}) {
  const showDropLine = useShowDropLine(sortId);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: sortId,
    disabled: props.estimateLocked,
    animateLayoutChanges: () => false,
  });

  return (
    <LineItemRow
      {...props}
      highlightStaleCatalogPrices={props.highlightStaleCatalogPrices}
      highlightMergedSagatave={props.highlightMergedSagatave}
      estimateLocked={props.estimateLocked}
      moduleSizeOptions={moduleSizeOptions}
      indentName={subcategoryId != null}
      showDropLine={showDropLine}
      rowRef={setNodeRef}
      rowStyle={isDragging ? { opacity: 0.45 } : undefined}
      dragHandle={
        props.estimateLocked ? null : (
          <DragHandle
            label="Pārvietot pozīciju"
            attributes={attributes}
            listeners={listeners}
          />
        )
      }
    />
  );
}

function SectionRow({
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
}: {
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
}) {
  const isCategory = kind === "category";
  const topBorderClass = showDropLine
    ? "border-t-4 border-t-zinc-900"
    : isCategory
      ? ""
      : "border-t border-t-zinc-300";

  return (
    <tbody
      ref={rowRef}
      style={rowStyle}
      className={`${isCategory ? "category-row" : "subcategory-row"} ${showDropLine ? dropLineClass : ""}`}
    >
    <tr>
      <td
        colSpan={colSpan}
        className={`p-0 ${
          highlightMergedSagatave
            ? isCategory
              ? mergedSagataveCategoryRowClass
              : mergedSagataveSubcategoryRowClass
            : isCategory
              ? "bg-zinc-200/90"
              : "border-b border-b-zinc-200 bg-zinc-50"
        }`}
      >
        <div
          className={`flex min-h-[3.25rem] items-center gap-2 py-2 pr-3 ${rowLead} ${topBorderClass}`}
        >
          <span className={dragHandleColumn}>
            {estimateLocked ? null : dragHandle}
          </span>
          <div
            className={`min-w-0 flex-1 ${isCategory ? "" : subcategoryNameIndent}`}
          >
            {estimateLocked ? (
              <span
                className={`block w-full text-sm text-zinc-900 ${
                  isCategory ? "font-semibold" : "font-normal"
                }`}
              >
                {value.trim() || placeholder}
              </span>
            ) : (
              <input
                type="text"
                className={`w-full border-0 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none ${
                  isCategory ? "font-semibold" : "font-normal"
                }`}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
              />
            )}
          </div>
          {actions}
        </div>
      </td>
    </tr>
    </tbody>
  );
}

function SortableSectionRow({
  sortId,
  dragLabel,
  estimateLocked = false,
  ...props
}: {
  sortId: string;
  dragLabel: string;
  kind: "category" | "subcategory";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  actions: ReactNode;
  colSpan: number;
  estimateLocked?: boolean;
  highlightMergedSagatave?: boolean;
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
}) {
  return (
    <>
      <SortableSectionRow
        sortId={subcategoryDragId(subcategory.id)}
        dragLabel="Pārvietot subkategoriju"
        colSpan={colSpan}
        kind="subcategory"
        placeholder="Subkategorijas nosaukums"
        value={subcategory.title}
        onChange={(title) => onChange({ ...subcategory, title })}
        estimateLocked={estimateLocked}
        highlightMergedSagatave={mergedSagataveHighlightIds.has(subcategory.id)}
        actions={
          <RowActions
            showSub={false}
            deleteLabel="Dzēst subkategoriju"
            estimateLocked={estimateLocked}
            onAddMulti={
              showQuantityColumn
                ? undefined
                : () =>
                    onChange({
                      ...subcategory,
                      items: [...subcategory.items, createMultiPosition()],
                    })
            }
            onAddItem={() =>
              onChange({
                ...subcategory,
                items: [...subcategory.items, createLineItem()],
              })
            }
            onDelete={onDelete}
          />
        }
      />
      {subcategory.items.map((row) =>
        isEstimateMultiPosition(row) ? (
          <SortableMultiPositionRow
            key={row.id}
            sortId={itemDragId(row.id)}
            categoryId={categoryId}
            subcategoryId={subcategory.id}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            showQuantityColumn={showQuantityColumn}
            allCategories={allCategories}
            optionLinkActions={optionLinkActions}
            moduleSizeOptions={moduleSizeOptions}
            highlightStaleCatalogPrices={highlightStaleCatalogPrices}
            highlightMergedSagatave={mergedSagataveHighlightIds.has(row.id)}
            estimateLocked={estimateLocked}
            value={row}
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
                items: removeRowItemById(subcategory.items, row.id),
              })
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
}) {
  return (
    <>
      <SortableSectionRow
        sortId={categoryDragId(category.id)}
        dragLabel="Pārvietot kategoriju"
        colSpan={colSpan}
        kind="category"
        placeholder="Kategorijas nosaukums"
        value={category.title}
        onChange={(title) => onChange({ ...category, title })}
        estimateLocked={estimateLocked}
        highlightMergedSagatave={mergedSagataveHighlightIds.has(category.id)}
        actions={
          <RowActions
            deleteLabel="Dzēst kategoriju"
            estimateLocked={estimateLocked}
            onAddSub={() =>
              onChange({
                ...category,
                subcategories: [...category.subcategories, createSubcategory()],
              })
            }
            onAddMulti={
              showQuantityColumn
                ? undefined
                : () =>
                    onChange({
                      ...category,
                      items: [...category.items, createMultiPosition()],
                    })
            }
            onAddItem={() =>
              onChange({
                ...category,
                items: [...category.items, createLineItem()],
              })
            }
            onDelete={onDelete}
          />
        }
      />

      {category.subcategories.map((subcategory) => (
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
          onChange={(next) =>
            onChange({
              ...category,
              subcategories: category.subcategories.map((entry) =>
                entry.id === subcategory.id ? next : entry,
              ),
            })
          }
          onDelete={() =>
            onChange({
              ...category,
              subcategories: category.subcategories.filter(
                (entry) => entry.id !== subcategory.id,
              ),
            })
          }
        />
      ))}

      {category.items.map((row) =>
        isEstimateMultiPosition(row) ? (
          <SortableMultiPositionRow
            key={row.id}
            sortId={itemDragId(row.id)}
            categoryId={category.id}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            showQuantityColumn={showQuantityColumn}
            allCategories={allCategories}
            optionLinkActions={optionLinkActions}
            moduleSizeOptions={moduleSizeOptions}
            highlightStaleCatalogPrices={highlightStaleCatalogPrices}
            highlightMergedSagatave={mergedSagataveHighlightIds.has(row.id)}
            estimateLocked={estimateLocked}
            value={row}
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
                items: removeRowItemById(category.items, row.id),
              })
            }
          />
        ),
      )}
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
}) {
  const colSpan = getEstimateTableColCount(showQuantityColumn);

  return (
    <DropIndicatorProvider>
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
        colSpan={colSpan}
      />
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
}) {
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
        getLinkedOptionSummaries(categories, multiOptionLinks, optionId),
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
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col style={{ width: showQuantityColumn ? "26%" : "35%" }} />
          <col style={{ width: "5%" }} />
          {showQuantityColumn ? <col style={{ width: "6%" }} /> : null}
          {Array.from({ length: UNIT_PRICE_COLUMN_COUNT }).map((_, index) => (
            <col
              key={`unit-${index}`}
              style={{ width: showQuantityColumn ? "6.5%" : "8%" }}
            />
          ))}
          {showQuantityColumn
            ? Array.from({ length: VOLUME_PRICE_COLUMN_COUNT }).map((_, index) => (
                <col
                  key={`volume-${index}`}
                  style={{ width: index === VOLUME_PRICE_COLUMN_COUNT - 1 ? "6.5%" : "6%" }}
                />
              ))
            : null}
          <col style={{ width: "3%" }} />
        </colgroup>
        <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgb(228_228_231)]">
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            <th
              rowSpan={2}
              className="border-b border-r border-zinc-200 px-3 py-2.5 text-left whitespace-normal"
            >
              Nosaukums
            </th>
            <th rowSpan={2} className="border-b border-r border-zinc-200 px-2 py-2.5 text-center">
              Mērv.
            </th>
            {showQuantityColumn ? (
              <th
                rowSpan={2}
                className="border-b border-r border-zinc-200 px-2 py-2.5 text-center"
                title="Individuāls apjoms katram projektam"
              >
                Apj.
              </th>
            ) : null}
            <th
              colSpan={UNIT_PRICE_COLUMN_COUNT}
              className="border-b border-r border-zinc-200 bg-sky-50/80 px-2 py-2 text-center text-sky-800/70"
            >
              Vienības cena
            </th>
            {showQuantityColumn ? (
              <th
                colSpan={VOLUME_PRICE_COLUMN_COUNT}
                className="border-b border-r border-zinc-200 bg-emerald-50/80 px-2 py-2 text-center text-emerald-800/70"
              >
                Apjoma cena
              </th>
            ) : null}
            <th rowSpan={2} className="border-b border-zinc-200" />
          </tr>
          <tr className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            {getUnitPriceSubheaderLabels(currency).map((label) => (
              <th
                key={label}
                className="border-b border-r border-zinc-200 bg-sky-50/40 px-2 py-1.5 text-right"
              >
                {label}
              </th>
            ))}
            {showQuantityColumn
              ? VOLUME_PRICE_SUBHEADER_LABELS.map((label) => (
                  <th
                    key={`volume-${label}`}
                    className={`border-b border-r border-zinc-200 px-2 py-1.5 text-right ${
                      label === "Kopā"
                        ? "bg-emerald-50/60"
                        : "bg-emerald-50/40"
                    }`}
                  >
                    {label}
                  </th>
                ))
              : null}
          </tr>
        </thead>
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
              colSpan={colSpan}
              allCategories={categories}
              optionLinkActions={optionLinkActions}
              onSyncCatalogPosition={onSyncCatalogPosition}
              onScheduleCatalogSync={onScheduleCatalogSync}
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
              Kopā
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
}: {
  label: string;
  value: string;
  type?: string;
  onChange?: (value: string) => void;
  fullWidth?: boolean;
  suffix?: string;
  readOnly?: boolean;
}) {
  const fieldClassName =
    "w-full border-0 bg-transparent pb-1.5 text-sm text-zinc-800 transition focus:outline-none";

  const inputElement =
    fullWidth && type === "text" ? (
      <textarea
        rows={2}
        value={value}
        readOnly={readOnly}
        onChange={
          readOnly || !onChange
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
        onChange={
          readOnly || !onChange
            ? undefined
            : (event) => onChange(event.target.value)
        }
        className={fieldClassName}
      />
    );

  return (
    <label className="block w-full">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      {suffix ? (
        <div className="flex items-center border-b border-zinc-200 transition focus-within:border-zinc-400">
          <div className="min-w-0 flex-1">{inputElement}</div>
          <span className="shrink-0 border-l border-zinc-200 pl-2 text-sm text-zinc-500">
            {suffix}
          </span>
        </div>
      ) : (
        <div className="border-b border-zinc-200 transition focus-within:border-zinc-400">
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
  const [, startSaveDatesTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isExcelDownloading, setIsExcelDownloading] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serializeEstimatePositionDocument(initialTitle, initialCategories, initialMultiOptionLinks),
  );
  const [savedAt, setSavedAt] = useState<string | undefined>(
    initialMeta.savedAt,
  );
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const canSaveEstimate = useActionPermission("estimate.save");
  const canExportEstimate = useActionPermission("estimate.export");
  const canEditEstimateDates = useActionPermission("estimate.dates");
  const estimateStatusLocked = project
    ? isProjectEstimateLocked(project.status)
    : false;
  const editorLocked = estimateStatusLocked || !canSaveEstimate;
  const datesReadOnly = estimateStatusLocked || !canEditEstimateDates;

  useEffect(() => {
    setMeta(initialMeta);
    setSavedAt(initialMeta.savedAt);
  }, [initialMeta]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

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

  function handleMergeNewSagatavePositions() {
    if (!highlightNewSagatavePositions || editorLocked) return;

    const merged = mergeNewSagatavePositionsIntoProject(
      categories,
      multiOptionLinks,
      sagataveSections,
      sagataveMultiOptionLinks,
    );
    let nextCategories = merged.categories;

    if (moduleSizeOptions.length > 0) {
      nextCategories = syncCategoriesQuantitiesFromModuleSizes(
        nextCategories,
        moduleSizeOptions[0].projectDescription,
        catalogPositions,
      );
    }

    setCategories(nextCategories);
    setMultiOptionLinks(merged.multiOptionLinks);
    setMergedSagataveHighlightIds(new Set(merged.addedNodeIds));
  }

  async function handleFileDownload(
    url: string,
    filename: string,
    setLoading: (v: boolean) => void,
  ) {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      showFeedback({ type: "error", text: "Lejupiel\u0101de neizdeva\u0161. M\u0113\u0123iniet v\u0113lreiz." });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!project || isSaving || editorLocked) return;

    const missingQuantityCount = collectEstimateLineItems(categories).filter(
      (item) => isVariableQuantityLineItem(item, catalogPositions) && item.quantity <= 0,
    ).length;

    if (missingQuantityCount > 0) {
      showFeedback({
        type: "error",
        text: `Jāievada apjoms ${missingQuantityCount === 1 ? "1 pozīcijai" : `${missingQuantityCount} pozīcijām`} ar individuālu apjomu.`,
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
      setSavedAt(savedAtIso);
      showFeedback({ type: "success", text: "Tāme saglabāta." });
    } else {
      showFeedback({ type: "error", text: result.error });
    }
  }

  const isDirty =
    serializeEstimatePositionDocument(title, categories, multiOptionLinks) !==
    savedSnapshot;

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

  const highlightNewSagatavePositions = Boolean(
    project &&
      shouldShowStaleCatalogPriceWarnings(project.status) &&
      !meta.clonedFromProjectId &&
      sagataveSections.length > 0,
  );

  const hasNewSagatavePositions = useMemo(
    () =>
      highlightNewSagatavePositions &&
      sagataveHasNewPositionsForProject(sagataveSections, categories),
    [highlightNewSagatavePositions, sagataveSections, categories],
  );

  const totals = useMemo(
    () =>
      calculateEstimateTotals(
        categories,
        catalogPositions,
        defaultHourlyRate,
      ),
    [categories, catalogPositions, defaultHourlyRate],
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

  const positionCount = collectEstimateLineItems(categories).length;

  const allDragIds = useMemo(
    () => collectAllDragIds(categories),
    [categories],
  );
  const { flushSyncFromLineItem, scheduleSyncFromLineItem } =
    useSyncCatalogPositionFromLineItem(catalogPositions);

  const displayModuleName = moduleName ?? "Individuāls projekts";
  const showModuleDataSpotlight = Boolean(
    project &&
      project.buildingModuleId === null &&
      !isIndividualProjectModuleDataComplete(project) &&
      !moduleDataSpotlightDismissed,
  );

  const tablePanel = (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/50 px-4 py-2.5">
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
            aria-label="Tāmes nosaukums"
          />
          )
        ) : null}
        <p className="text-xs text-zinc-500">
          {categories.length} tāmes pozīcijas · {positionCount} rindas
        </p>
        {!editorLocked ? (
          <button
            type="button"
            onClick={() =>
              setCategories([...categories, createEstimatePositionSection()])
            }
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
          >
            + Tāmes pozīcija
          </button>
        ) : null}
      </div>

      <div className="max-h-[calc(100vh-14rem)] overflow-x-hidden overflow-y-auto">
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
        />
      </div>
    </div>
  );

  if (variant === "tableOnly") {
    return <div className="max-w-full space-y-4">{tablePanel}</div>;
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
              Tāmes piedāvājums
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
                Kopā
              </p>
              <p className="text-sm font-semibold tabular-nums text-white">
                {formatMoneyDisplay(totals.grand, currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <MetaField
            label="Pasūtītāja vārds, uzvārds"
            value={meta.client}
            readOnly={editorLocked}
            onChange={(client) => setMeta({ ...meta, client })}
          />
          <MetaField
            label="Objekts"
            value={meta.project}
            readOnly={editorLocked}
            onChange={(project) => setMeta({ ...meta, project })}
            fullWidth
          />
          <div
            className={
              estimateStatusLocked
                ? "grid grid-cols-1 gap-y-4"
                : "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2"
            }
          >
            <MetaField
              label="Datums"
              type="date"
              value={meta.date}
              readOnly={datesReadOnly}
              onChange={handleEstimateDateChange}
            />
            {!estimateStatusLocked ? (
              <div>
                <MetaField
                  label="Tāmes termiņš"
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
                      {formatDeadlineDays(days)}
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
          Pieejami jauni izcenojumi
        </div>
      ) : null}

      {project && hasNewSagatavePositions ? (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
        >
          <div className="flex items-center gap-2">
            <i className="fas fa-layer-group text-xs" aria-hidden="true" />
            Sagatavē pievienotas jaunas pozīcijas
          </div>
          <button
            type="button"
            onClick={handleMergeNewSagatavePositions}
            disabled={isSaving || editorLocked}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Atjaunot pozicijas
          </button>
        </div>
      ) : null}

      {tablePanel}

      {project && globalExcludedPositions.length > 0 ? (
        <ProjectExcludedPositionsPanel
          projectId={project.id}
          globalPositions={globalExcludedPositions}
          omittedIds={meta.excludedPositionIdsOmitted ?? []}
          readOnly={editorLocked}
          onOmit={(omittedIds) =>
            setMeta((current) => ({
              ...current,
              excludedPositionIdsOmitted: omittedIds,
            }))
          }
        />
      ) : null}

      {project ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {isDirty ? (
            <span className="text-xs text-zinc-400">Nesaglabātas izmaiņas</span>
          ) : isEstimateSaved && savedAt ? (
            <span className="text-xs text-zinc-400">
              Saglabāts: {formatDisplayDateDdMmYy(savedAt)}
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
                    `piedavajums-${project.id.slice(0, 8)}.pdf`,
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
                <span className="text-xs text-zinc-400">(piedāvājums)</span>
              </button>
              <button
                type="button"
                disabled={isExcelDownloading}
                onClick={() =>
                  handleFileDownload(
                    `/api/estimates/${project.id}/excel`,
                    `tame-${project.id.slice(0, 8)}.xlsx`,
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
                <span className="text-xs text-zinc-400">(tāme)</span>
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
              {isSaving ? "Saglabā..." : "Saglabāt tāmi"}
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
              Atjaunot cenas
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
    </>
  );
}
