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
import { updateProjectEstimateDatesAction } from "@/app/(protected)/actions";
import {
  formatAmountDisplay,
  isAmountDisplayEmpty,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
import {
  VolumeSumCells,
  resolveLineItemVolumeSum,
  volumeSumFooterCell,
  volumeSumFooterCellTotal,
} from "@/app/components/estimate-volume-sum-cells";
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
import { ESTIMATE_UNITS } from "@/app/lib/estimates/units";
import { AddressMapEmbed } from "@/app/components/address-map-embed";
import { IndividualProjectModuleDataSpotlight } from "@/app/components/individual-project-module-data-spotlight";
import { ModuleVisualizationGallery } from "@/app/components/module-visualization-gallery";
import { ProjectCardActions } from "@/app/components/project-card-actions";
import { DeleteButton } from "@/app/components/delete-button";
import { EstimateMultiPositionRow } from "@/app/components/estimate-multi-position-row";
import { EstimateLineItemNameField } from "@/app/components/estimate-line-item-name-field";
import { EstimateQuantityInput } from "@/app/components/estimate-quantity-input";
import { PositionVariableQuantityIcon } from "@/app/components/position-variable-quantity-icon";
import { useSyncCatalogPositionFromLineItem } from "@/app/lib/hooks/use-sync-catalog-position-from-line-item";
import {
  applyCatalogPositionToLineItem,
  buildUnitPriceForCatalogPosition,
} from "@/app/lib/positions/apply-catalog-to-line-item";
import {
  applyLineItemCatalogEdit,
  findCatalogPositionForLineItem,
  hydrateLineItemWithCatalog,
  isMaterialsOrMechanismsLineItem,
} from "@/app/lib/positions/sync-from-estimate-line-items";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import {
  hasModuleSizeAttachment,
  resolveLineItemDisplayQuantityFromModuleSize,
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
  collectSelectedMultiOptionKeys,
  createMultiPosition,
  isEstimateMultiPosition,
  removeRowItemById,
  updateRowItemById,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateMultiPosition,
  EstimateSubcategory,
  PriceBreakdown,
} from "@/app/lib/estimates/types";
import type {
  BuildingModuleSizeOption,
  BuildingModuleSummary,
  ModuleContentBlock,
} from "@/app/lib/modules/types";
import type { EstimateMeta, ProjectSummary } from "@/app/lib/projects/types";
import { isIndividualProjectModuleDataComplete } from "@/app/lib/projects/project-module-data";
import { DEFAULT_ESTIMATE_VALIDITY_DAYS } from "@/app/lib/settings/estimate-validity-days";
import { isGoogleMapsEmbedConfigured } from "@/app/lib/google-maps/env";

function getEstimateTableColCount(showQuantityColumn: boolean): number {
  return showQuantityColumn ? 12 : 7;
}

const cellInput =
  "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm transition focus:border-zinc-300 focus:bg-white focus:outline-none";
const nameInput =
  "w-full min-h-[2.75rem] resize-none rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm leading-snug whitespace-normal break-words transition [field-sizing:content] focus:border-zinc-300 focus:bg-white focus:outline-none";
const nameInputRightAlign = "text-right";
const cellNum = `${cellInput} text-right tabular-nums`;
const nameCell = "border-b border-zinc-100 py-1 pr-2 align-top";
const readOnlyNum = "block px-2 py-1.5 text-right text-sm tabular-nums text-zinc-700";
const priceCell = "border-b border-zinc-100 px-1 py-0.5 align-top";
const priceCellTotal = `${priceCell} bg-zinc-50/60`;
/** Stable DndContext id — avoids SSR/client mismatch on aria-describedby. */
const ESTIMATE_DND_CONTEXT_ID = "estimate-table-dnd";

const footerCell =
  "border-t-2 border-zinc-300 px-2 py-2.5 text-right text-sm font-semibold tabular-nums text-zinc-900";

/** Shared left gutter + fixed drag column so handles align across all row types. */
const rowLead = "pl-3";
const dragHandleColumn =
  "flex h-7 w-6 shrink-0 items-center justify-center self-center";
const subcategoryNameIndent = "ml-[10px]";
const subcategoryItemNameIndent = "ml-[20px]";
const dropLineClass = "shadow-[inset_0_4px_0_0_rgb(24_24_27)]";

function resolveLineItemDisplayUnitPrice(
  item: EstimateLineItem,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
): PriceBreakdown {
  const position = findCatalogPositionForLineItem(item, catalogPositions);
  if (position) {
    return buildUnitPriceForCatalogPosition(position, defaultHourlyRate);
  }

  return item.unitPrice;
}

function PriceCells({
  values,
  readOnly = false,
  onChange,
}: {
  values: PriceBreakdown;
  readOnly?: boolean;
  onChange?: (field: keyof PriceBreakdown, value: number) => void;
}) {
  const total = sumBreakdown(values);

  return (
    <>
      {(["labor", "materials", "mechanisms"] as const).map((field) => (
        <td key={field} className={priceCell}>
          {readOnly ? (
            <span
              className={`${readOnlyNum} ${
                isAmountDisplayEmpty(values[field]) ? "text-zinc-300" : ""
              }`}
            >
              {formatAmountDisplay(values[field])}
            </span>
          ) : (
            <input
              type="number"
              min={0}
              step="any"
              className={cellNum}
              value={values[field]}
              onChange={(event) =>
                onChange?.(field, parseFloat(event.target.value) || 0)
              }
            />
          )}
        </td>
      ))}
      <td className={priceCellTotal}>
        <span
          className={`${readOnlyNum} ${
            isAmountDisplayEmpty(total)
              ? "text-zinc-300"
              : "font-medium text-zinc-900"
          }`}
        >
          {formatAmountDisplay(total)}
        </span>
      </td>
    </>
  );
}

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
  showQuantityColumn,
  moduleSizeOptions = [],
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
  showQuantityColumn: boolean;
  moduleSizeOptions?: BuildingModuleSizeOption[];
}) {
  const catalogPosition = findCatalogPositionForLineItem(item, catalogPositions);
  const isCatalogLinked = catalogPosition != null;
  const isMaterialsOrMechanisms = isMaterialsOrMechanismsLineItem(
    item,
    catalogPositions,
  );
  const displayName = catalogPosition?.name ?? item.name;
  const displayUnit = catalogPosition?.unit ?? item.unit;
  const unitOptions = getEstimateUnitOptions(item.unit);
  const showQuantityInput = isVariableQuantityLineItem(item, catalogPositions);
  const attachedQuantity = resolveLineItemDisplayQuantityFromModuleSize(
    item,
    moduleSizeOptions,
  );
  const hasAttachedQuantity = hasModuleSizeAttachment(item) && attachedQuantity != null;
  const effectiveQuantity = attachedQuantity ?? item.quantity;
  const displayUnitPrice = resolveLineItemDisplayUnitPrice(
    item,
    catalogPositions,
    defaultHourlyRate,
  );
  const volumeSum = showQuantityColumn
    ? resolveLineItemVolumeSum(
        effectiveQuantity,
        displayUnitPrice,
        showQuantityInput || hasAttachedQuantity,
      )
    : null;

  return (
    <tbody
      ref={rowRef}
      style={rowStyle}
      className={`group ${showDropLine ? dropLineClass : ""}`}
    >
    <tr className="align-middle hover:bg-sky-50/40">
      <td className={nameCell}>
        <div className={`flex items-center gap-1 ${rowLead}`}>
          <span className={dragHandleColumn}>{dragHandle}</span>
          <span className="inline-flex min-w-0 flex-1 items-start gap-1.5">
            <EstimateLineItemNameField
              value={displayName}
              readOnly={isCatalogLinked}
              catalogPositions={catalogPositions}
              defaultHourlyRate={defaultHourlyRate}
              className={`${nameInput} ${indentName ? subcategoryItemNameIndent : ""} ${isMaterialsOrMechanisms ? nameInputRightAlign : ""}`}
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
            <PositionVariableQuantityIcon enabled={showQuantityInput} />
          </span>
        </div>
      </td>
      <td className="border-b border-zinc-100 px-1 py-0.5 align-top">
        {isCatalogLinked ? (
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
            <EstimateQuantityInput
              className={cellNum}
              value={item.quantity}
              onChange={(quantity) => onChange({ ...item, quantity })}
            />
          ) : (
            <span className={`${readOnlyNum} text-zinc-300`}>—</span>
          )}
        </td>
      ) : null}
      <PriceCells readOnly values={displayUnitPrice} />
      {showQuantityColumn ? <VolumeSumCells values={volumeSum} /> : null}
      <td className="border-b border-zinc-100 px-1 py-0.5 text-center align-top">
        <DeleteButton
          label="Dzēst pozīciju"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100"
        />
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
}: {
  onAddSub?: () => void;
  onAddMulti?: () => void;
  onAddItem: () => void;
  onDelete: () => void;
  deleteLabel: string;
  showSub?: boolean;
}) {
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
}) {
  const showDropLine = useShowDropLine(sortId);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: sortId,
    animateLayoutChanges: () => false,
  });
  const excludedSelectionKeys = useMemo(
    () => collectSelectedMultiOptionKeys(allCategories, value.id),
    [allCategories, value.id],
  );
  return (
    <EstimateMultiPositionRow
      mode="offer"
      value={value}
      onChange={(next) =>
        optionLinkActions.onMultiChange(value.id, next, true)
      }
      onDelete={() => optionLinkActions.onMultiDelete(value.id)}
      catalogPositions={catalogPositions}
      defaultHourlyRate={defaultHourlyRate}
      excludedSelectionKeys={excludedSelectionKeys}
      optionLinkActions={optionLinkActions}
      indentName={subcategoryId != null}
      showDropLine={showDropLine}
      showQuantityColumn={showQuantityColumn}
      moduleSizeOptions={moduleSizeOptions}
      readOnlyPrices={true}
      rowRef={setNodeRef}
      rowStyle={isDragging ? { opacity: 0.45 } : undefined}
      dragHandle={
        <DragHandle
          label="Pārvietot multi-pozīciju"
          attributes={attributes}
          listeners={listeners}
        />
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
  showQuantityColumn: boolean;
  moduleSizeOptions?: BuildingModuleSizeOption[];
}) {
  const showDropLine = useShowDropLine(sortId);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: sortId,
    animateLayoutChanges: () => false,
  });

  return (
    <LineItemRow
      {...props}
      moduleSizeOptions={moduleSizeOptions}
      indentName={subcategoryId != null}
      showDropLine={showDropLine}
      rowRef={setNodeRef}
      rowStyle={isDragging ? { opacity: 0.45 } : undefined}
      dragHandle={
        <DragHandle
          label="Pārvietot pozīciju"
          attributes={attributes}
          listeners={listeners}
        />
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
          isCategory
            ? "bg-zinc-200/90"
            : "border-b border-b-zinc-200 bg-zinc-50"
        }`}
      >
        <div
          className={`flex min-h-[3.25rem] items-center gap-2 py-2 pr-3 ${rowLead} ${topBorderClass}`}
        >
          <span className={dragHandleColumn}>{dragHandle}</span>
          <div
            className={`min-w-0 flex-1 ${isCategory ? "" : subcategoryNameIndent}`}
          >
            <input
              type="text"
              className={`w-full border-0 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none ${
                isCategory ? "font-semibold" : "font-normal"
              }`}
              value={value}
              placeholder={placeholder}
              onChange={(event) => onChange(event.target.value)}
            />
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
}) {
  const showDropLine = useShowDropLine(sortId);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: sortId,
    animateLayoutChanges: () => false,
  });

  return (
    <SectionRow
      {...props}
      colSpan={props.colSpan}
      showDropLine={showDropLine}
      rowRef={setNodeRef}
      rowStyle={isDragging ? { opacity: 0.45 } : undefined}
      dragHandle={
        <DragHandle
          label={dragLabel}
          attributes={attributes}
          listeners={listeners}
        />
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
  showQuantityColumn,
  colSpan,
  allCategories,
  optionLinkActions,
  moduleSizeOptions = [],
}: {
  categoryId: string;
  subcategory: EstimateSubcategory;
  onChange: (subcategory: EstimateSubcategory) => void;
  onDelete: () => void;
  onSyncCatalogPosition: (item: EstimateLineItem) => void;
  onScheduleCatalogSync: (item: EstimateLineItem) => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  showQuantityColumn: boolean;
  colSpan: number;
  allCategories: EstimateCategory[];
  optionLinkActions: MultiOptionLinkActions;
  moduleSizeOptions?: BuildingModuleSizeOption[];
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
        actions={
          <RowActions
            showSub={false}
            deleteLabel="Dzēst subkategoriju"
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
            showQuantityColumn={showQuantityColumn}
            moduleSizeOptions={moduleSizeOptions}
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
  showQuantityColumn,
  colSpan,
  allCategories,
  optionLinkActions,
  moduleSizeOptions = [],
}: {
  category: EstimateCategory;
  onChange: (category: EstimateCategory) => void;
  onDelete: () => void;
  onSyncCatalogPosition: (item: EstimateLineItem) => void;
  onScheduleCatalogSync: (item: EstimateLineItem) => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  showQuantityColumn: boolean;
  colSpan: number;
  allCategories: EstimateCategory[];
  optionLinkActions: MultiOptionLinkActions;
  moduleSizeOptions?: BuildingModuleSizeOption[];
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
        actions={
          <RowActions
            deleteLabel="Dzēst kategoriju"
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
          showQuantityColumn={showQuantityColumn}
          colSpan={colSpan}
          allCategories={allCategories}
          optionLinkActions={optionLinkActions}
          moduleSizeOptions={moduleSizeOptions}
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
            value={row}
          />
        ) : (
          <SortableLineItemRow
            key={row.id}
            sortId={itemDragId(row.id)}
            categoryId={category.id}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            showQuantityColumn={showQuantityColumn}
            moduleSizeOptions={moduleSizeOptions}
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
  showQuantityColumn,
  moduleSizeOptions = [],
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
  showQuantityColumn: boolean;
  moduleSizeOptions?: BuildingModuleSizeOption[];
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
        showQuantityColumn={showQuantityColumn}
        moduleSizeOptions={moduleSizeOptions}
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
  showQuantityColumn,
  moduleSizeOptions = [],
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
  showQuantityColumn: boolean;
  moduleSizeOptions?: BuildingModuleSizeOption[];
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
          {Array.from({ length: 4 }).map((_, index) => (
            <col
              key={`unit-${index}`}
              style={{ width: showQuantityColumn ? "9%" : "12%" }}
            />
          ))}
          {showQuantityColumn
            ? Array.from({ length: 4 }).map((_, index) => (
                <col
                  key={`volume-${index}`}
                  style={{ width: index === 3 ? "7%" : "7.5%" }}
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
              colSpan={4}
              className="border-b border-r border-zinc-200 bg-sky-50/80 px-2 py-2 text-center text-sky-800/70"
            >
              Vienības cena
            </th>
            {showQuantityColumn ? (
              <th
                colSpan={4}
                className="border-b border-r border-zinc-200 bg-emerald-50/80 px-2 py-2 text-center text-emerald-800/70"
              >
                Apjoma cena
              </th>
            ) : null}
            <th rowSpan={2} className="border-b border-zinc-200" />
          </tr>
          <tr className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            {["Darbs", "Materiāls", "Mehānismi", "Kopā"].map((label) => (
              <th
                key={label}
                className="border-b border-r border-zinc-200 bg-sky-50/40 px-2 py-1.5 text-right"
              >
                {label}
              </th>
            ))}
            {showQuantityColumn
              ? ["Darbs", "Materiāls", "Mehānismi", "Kopā"].map((label) => (
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
              showQuantityColumn={showQuantityColumn}
              moduleSizeOptions={moduleSizeOptions}
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
              Array.from({ length: 4 }).map((_, index) => (
                <td
                  key={`footer-unit-${index}`}
                  className="border-t-2 border-zinc-300 bg-sky-50/30"
                />
              ))
            ) : (
              <>
                <td className={`${footerCell} bg-sky-50/50`}>
                  {formatMoneyDisplay(totals.labor)}
                </td>
                <td className={`${footerCell} bg-sky-50/50`}>
                  {formatMoneyDisplay(totals.materials)}
                </td>
                <td className={`${footerCell} bg-sky-50/50`}>
                  {formatMoneyDisplay(totals.mechanisms)}
                </td>
                <td className={`${footerCell} bg-sky-100/60 text-base`}>
                  {formatMoneyDisplay(totals.grand)}
                </td>
              </>
            )}
            {showQuantityColumn ? (
              <>
                <td className={volumeSumFooterCell}>
                  {formatMoneyDisplay(totals.labor)}
                </td>
                <td className={volumeSumFooterCell}>
                  {formatMoneyDisplay(totals.materials)}
                </td>
                <td className={volumeSumFooterCell}>
                  {formatMoneyDisplay(totals.mechanisms)}
                </td>
                <td className={volumeSumFooterCellTotal}>
                  {formatMoneyDisplay(totals.grand)}
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
  moduleName?: string | null;
  moduleVisualizations?: ModuleContentBlock[];
  moduleSizeOptions?: BuildingModuleSizeOption[];
  project?: ProjectSummary;
  modules?: BuildingModuleSummary[];
  estimateValidityDays?: number;
  catalogPositions?: PositionPriceSummary[];
  defaultHourlyRate?: number | null;
};

export function EstimateTable({
  variant = "full",
  initialTitle = SAMPLE_TITLE,
  initialMeta = SAMPLE_META,
  initialCategories = createSampleCategories(),
  initialMultiOptionLinks = [],
  moduleName = null,
  moduleVisualizations = [],
  moduleSizeOptions = [],
  project,
  modules = [],
  estimateValidityDays = DEFAULT_ESTIMATE_VALIDITY_DAYS,
  catalogPositions = [],
  defaultHourlyRate = null,
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
  const [, startSaveDatesTransition] = useTransition();

  useEffect(() => {
    setMeta(initialMeta);
  }, [initialMeta]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    setModuleDataSpotlightDismissed(false);
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

  const showQuantityColumn = Boolean(project);

  const totals = useMemo(
    () =>
      calculateEstimateTotals(
        categories,
        catalogPositions,
        defaultHourlyRate,
      ),
    [categories, catalogPositions, defaultHourlyRate],
  );

  const positionCount = collectEstimateLineItems(categories).length;

  const allDragIds = useMemo(
    () => collectAllDragIds(categories),
    [categories],
  );
  const { flushSyncFromLineItem, scheduleSyncFromLineItem } =
    useSyncCatalogPositionFromLineItem(catalogPositions);

  const mapEmbedEnabled = isGoogleMapsEmbedConfigured();
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
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="min-w-[12rem] flex-1 border-0 bg-transparent text-sm font-semibold text-zinc-900 focus:outline-none"
            aria-label="Tāmes nosaukums"
          />
        ) : null}
        <p className="text-xs text-zinc-500">
          {categories.length} tāmes pozīcijas · {positionCount} rindas
        </p>
        <button
          type="button"
          onClick={() =>
            setCategories([...categories, createEstimatePositionSection()])
          }
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
        >
          + Tāmes pozīcija
        </button>
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
          showQuantityColumn={showQuantityColumn}
          moduleSizeOptions={moduleSizeOptions}
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
      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        {mapEmbedEnabled ? (
          <AddressMapEmbed
            address={meta.project}
            title="Objekta karte"
            className="h-full"
          />
        ) : (
          <div className="flex h-full min-h-[14rem] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 text-center text-sm text-zinc-400">
            Karte nav pieejama.
          </div>
        )}

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
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full border-0 bg-transparent text-xl font-semibold tracking-tight text-zinc-900 focus:outline-none"
            />
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
                {formatMoneyDisplay(totals.grand)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <MetaField
            label="Pasūtītāja vārds, uzvārds"
            value={meta.client}
            onChange={(client) => setMeta({ ...meta, client })}
          />
          <MetaField
            label="Objekts"
            value={meta.project}
            onChange={(project) => setMeta({ ...meta, project })}
            fullWidth
          />
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <MetaField
              label="Sagatavotājs"
              value={meta.author}
              onChange={(author) => setMeta({ ...meta, author })}
            />
            <MetaField
              label="Datums"
              type="date"
              value={meta.date}
              onChange={handleEstimateDateChange}
            />
            <MetaField
              label="Tāmes termiņš"
              type="date"
              value={meta.deadline}
              onChange={handleEstimateDeadlineChange}
            />
          </div>
        </div>
        </div>
      </div>

      {tablePanel}
    </div>
    </>
  );
}
