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
import { useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
  useTransition,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { saveEstimatePositionDocumentAction } from "@/app/(protected)/estimate/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { UnsavedChangesConfirmModal } from "@/app/components/unsaved-changes-confirm-modal";
import { useUnsavedChangesGuard } from "@/app/lib/hooks/use-unsaved-changes-guard";
import { hydrateSectionsWithCatalogLinks } from "@/app/lib/positions/sync-from-estimate-line-items";
import { serializeEstimatePositionDocument } from "@/app/lib/estimate-positions/serialize-document";
import {
  createEstimatePositionSection,
  createSubcategory,
  ensureSectionHasLineItem,
} from "@/app/lib/estimate-positions/create-empty";
import { collectSectionLineItems } from "@/app/lib/estimate-positions/collect-section-items";
import {
  collectVisibleSectionDragIds,
  getCollapsedSectionSummary,
  getCollapsedSubcategorySummary,
} from "@/app/lib/estimate-positions/collapsed-sections-cookie";
import { reorderEstimatePositionSections } from "@/app/lib/estimate-positions/reorder-sections";
import { useCollapsedEstimateSections } from "@/app/lib/hooks/use-collapsed-estimate-sections";
import type { EstimatePositionSection } from "@/app/lib/estimate-positions/types";
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
import {
  createMultiPosition,
  isEstimateMultiPosition,
  removeRowItemById,
  updateRowItemById,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateLineItem,
  EstimateMultiPosition,
  EstimateSubcategory,
  MultiOptionLinkGroup,
  PriceBreakdown,
} from "@/app/lib/estimates/types";
import { AttachedModuleSizeLabel } from "@/app/components/attached-module-size-label";
import { PositionVariableQuantityIcon } from "@/app/components/position-variable-quantity-icon";
import { LineItemPriceVisibilityToggle } from "@/app/components/line-item-price-visibility-toggle";
import { SubcategoryOfferVisibilityToggle } from "@/app/components/subcategory-offer-visibility-toggle";
import { SubcategoryPriceVisibilityToggle } from "@/app/components/subcategory-price-visibility-toggle";
import { DeleteButton } from "@/app/components/delete-button";
import { IconActionButton } from "@/app/components/icon-action-button";
import { EstimateMultiPositionRow } from "@/app/components/estimate-multi-position-row";
import { PositionModal } from "@/app/components/position-modal";
import {
  PositionModalProvider,
  usePositionModal,
} from "@/app/components/position-modal-context";
import { resolveLiveDisplayUnitPrice } from "@/app/lib/positions/stale-catalog-price";
import {
  createCompositePosition,
  isCompositeLineItem,
  patchLineItemLaborTimeNorm,
} from "@/app/lib/estimates/composite-line-item";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import { EstimateUnitPriceCells } from "@/app/components/estimate-unit-price-cells";
import { collectEstimateDocumentUnits } from "@/app/lib/estimates/collect-estimate-document-units";
import { resolveCompositeLineItemDisplayUnit } from "@/app/lib/estimates/sync-module-size-quantities";
import { formatTimeNormDisplay } from "@/app/lib/positions/variable-quantity";
import {
  UNIT_PRICE_COLUMN_COUNT,
  getUnitPriceSubheaderLabels,
} from "@/app/lib/estimates/unit-price-columns";
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

const FULL_COL_COUNT = 9;
const ESTIMATE_POSITION_DND_CONTEXT_ID = "estimate-position-table-dnd";

const nameCell = "border-b border-zinc-100 py-1 pr-2 align-top";
const readOnlyNum = "block px-2 py-1.5 text-right text-sm tabular-nums text-zinc-700";
const rowLead = "pl-3";
const dragHandleColumn =
  "flex h-7 w-6 shrink-0 items-center justify-center self-center";
const subcategoryNameIndent = "ml-[10px]";
const subcategoryItemNameIndent = "ml-[20px]";
const dropLineClass = "shadow-[inset_0_4px_0_0_rgb(24_24_27)]";
const actionBtn =
  "inline-flex h-7 items-center rounded-md px-2 text-xs text-zinc-500 transition hover:bg-white hover:text-zinc-800";
const rowActionCell =
  "border-b border-zinc-100 px-1 py-0.5 text-center align-top";

const hydrateCatalogPrices = { forceCatalogPrices: true } as const;


function LineItemRow({
  item,
  onChange,
  onDelete,
  dragHandle,
  rowRef,
  rowStyle,
  indentName,
  showOfferPriceToggle = false,
  showDropLine,
  catalogPositions,
  defaultHourlyRate,
  moduleSizeOptions,
}: {
  item: EstimateLineItem;
  onChange: (item: EstimateLineItem) => void;
  onDelete: () => void;
  dragHandle?: ReactNode;
  rowRef?: (element: HTMLTableSectionElement | null) => void;
  rowStyle?: CSSProperties;
  indentName?: boolean;
  showOfferPriceToggle?: boolean;
  showDropLine?: boolean;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  moduleSizeOptions: BuildingModuleSizeOption[];
}) {
  const { openPositionModal } = usePositionModal();
  const missingModuleSize =
    moduleSizeOptions.length > 0 &&
    !item.moduleSizeAttachment &&
    !item.variableQuantity &&
    !item.manualUnitEnabled;
  const missingTimeNorm =
    isCompositeLineItem(item) && !((item.laborTimeNorm ?? 0) > 0);

  const rowBg = missingModuleSize
    ? "bg-red-50/60 hover:bg-red-50"
    : missingTimeNorm
      ? "bg-amber-50/60 hover:bg-amber-50"
      : "hover:bg-sky-50/40";
  const hiddenPriceInOffer = item.hiddenPriceInOffer === true;
  const hoverOnlyActionClass = "opacity-0 group-hover:opacity-100";
  const priceToggleClass = hiddenPriceInOffer
    ? "opacity-100"
    : hoverOnlyActionClass;

  return (
    <tbody
      ref={rowRef}
      style={rowStyle}
      className={`group ${showDropLine ? dropLineClass : ""}`}
    >
    <tr
      className={`align-middle ${rowBg}`}
    >
      <td className={nameCell}>
        <div className={`flex items-start gap-1 py-1 ${rowLead}`}>
          <span className={dragHandleColumn}>{dragHandle}</span>
          <div
            className={`min-w-0 flex-1 ${indentName ? subcategoryItemNameIndent : ""}`}
          >
            <div className="flex min-w-0 flex-col gap-0 leading-snug">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openPositionModal(item, onChange)}
                  className={`block min-w-0 flex-1 text-left text-sm font-medium transition hover:underline ${
                    item.name.trim()
                      ? missingModuleSize
                        ? "text-red-700 hover:text-red-900"
                        : missingTimeNorm
                          ? "text-amber-700 hover:text-amber-900"
                          : "text-zinc-900 hover:text-sky-700"
                      : "italic text-zinc-400"
                  }`}
                >
                  {item.name.trim() || "Nenosaukta pozīcija"}
                  {missingModuleSize ? (
                    <i
                      className="fas fa-exclamation-triangle ml-1.5 text-xs text-red-500"
                      aria-hidden="true"
                    />
                  ) : missingTimeNorm ? (
                    <i
                      className="fas fa-exclamation-triangle ml-1.5 text-xs text-amber-500"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
                <PositionVariableQuantityIcon enabled={item.variableQuantity ?? false} />
              </div>
              {missingModuleSize ? (
                <span className="text-xs text-red-500">
                  Nav pievienots moduļa apjoms
                </span>
              ) : null}
              {missingTimeNorm ? (
                <span className="text-xs text-amber-600">
                  <i className="fas fa-exclamation-triangle mr-1" aria-hidden="true" />
                  Nav ievadīta Laika norma
                </span>
              ) : null}
              <AttachedModuleSizeLabel
                attachment={item.moduleSizeAttachment}
                moduleSizeOptions={moduleSizeOptions}
              />
            </div>
          </div>
        </div>
      </td>
      <td className="border-b border-zinc-100 px-1 py-0.5 align-top">
        <span className={`${readOnlyNum} text-zinc-500`}>
          {(isCompositeLineItem(item)
            ? resolveCompositeLineItemDisplayUnit(item, moduleSizeOptions)
            : item.unit.trim()) || "—"}
        </span>
      </td>
      <EstimateUnitPriceCells
        item={item}
        defaultHourlyRate={defaultHourlyRate}
        values={resolveLiveDisplayUnitPrice(
          item,
          catalogPositions,
          defaultHourlyRate,
        )}
        onTimeNormChange={(laborTimeNorm) =>
          onChange(
            patchLineItemLaborTimeNorm(
              item,
              laborTimeNorm,
              catalogPositions,
              defaultHourlyRate,
            ),
          )
        }
      />
      <td className={rowActionCell}>
        <div className="flex items-center justify-center gap-0.5">
          {showOfferPriceToggle ? (
            <LineItemPriceVisibilityToggle
              hiddenPriceInOffer={item.hiddenPriceInOffer}
              onChange={(nextHidden) =>
                onChange({ ...item, hiddenPriceInOffer: nextHidden })
              }
              className={priceToggleClass}
            />
          ) : null}
          <IconActionButton
            label="Labot pozīciju"
            icon="fas fa-pen"
            variant="edit"
            onClick={() => openPositionModal(item, onChange)}
            className={hoverOnlyActionClass}
          />
          <DeleteButton
            label="Dzēst pozīciju"
            onClick={onDelete}
            className={hoverOnlyActionClass}
          />
        </div>
      </td>
    </tr>
    </tbody>
  );
}

function SortableLineItemRow({
  sortId,
  subcategoryId,
  ...props
}: {
  sortId: string;
  sectionId: string;
  subcategoryId?: string;
  item: EstimateLineItem;
  onChange: (item: EstimateLineItem) => void;
  onDelete: () => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  moduleSizeOptions: BuildingModuleSizeOption[];
}) {
  const showDropLine = useShowDropLine(sortId);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: sortId,
    animateLayoutChanges: () => false,
  });

  return (
    <LineItemRow
      {...props}
      indentName={subcategoryId != null}
      showOfferPriceToggle={subcategoryId == null}
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
  moduleSizeOptions,
}: {
  sortId: string;
  sectionId: string;
  subcategoryId?: string;
  value: EstimateMultiPosition;
  optionLinkActions: MultiOptionLinkActions;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  moduleSizeOptions: BuildingModuleSizeOption[];
}) {
  const showDropLine = useShowDropLine(sortId);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: sortId,
    animateLayoutChanges: () => false,
  });
  return (
    <EstimateMultiPositionRow
      mode="template"
      value={value}
      onChange={(next) =>
        optionLinkActions.onMultiChange(value.id, next, false)
      }
      onDelete={() => optionLinkActions.onMultiDelete(value.id)}
      catalogPositions={catalogPositions}
      defaultHourlyRate={defaultHourlyRate}
      moduleSizeOptions={moduleSizeOptions}
      optionLinkActions={optionLinkActions}
      indentName={subcategoryId != null}
      showDropLine={showDropLine}
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
  collapsed = false,
  collapsedSummary,
  onToggleCollapse,
  nameTrailing,
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
  collapsed?: boolean;
  collapsedSummary?: string;
  onToggleCollapse?: () => void;
  nameTrailing?: ReactNode;
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
        colSpan={FULL_COL_COUNT}
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
          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded={!collapsed}
              aria-label={
                collapsed
                  ? isCategory
                    ? "Izvērst tāmes pozīciju"
                    : "Izvērst subkategoriju"
                  : isCategory
                    ? "Sakļaut tāmes pozīciju"
                    : "Sakļaut subkategoriju"
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
            <div className="flex min-w-0 items-center gap-2">
              <input
                type="text"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
              />
              {collapsed && collapsedSummary ? (
                <span className="shrink-0 text-xs font-normal text-zinc-500">
                  {collapsedSummary}
                </span>
              ) : null}
              {nameTrailing ? (
                <span className="shrink-0">{nameTrailing}</span>
              ) : null}
            </div>
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
  collapsed?: boolean;
  collapsedSummary?: string;
  onToggleCollapse?: () => void;
  nameTrailing?: ReactNode;
}) {
  const showDropLine = useShowDropLine(sortId);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: sortId,
    animateLayoutChanges: () => false,
  });

  return (
    <SectionRow
      {...props}
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
  sectionId,
  subcategory,
  onChange,
  onDelete,
  catalogPositions,
  defaultHourlyRate,
  moduleSizeOptions,
  collapsed,
  collapsedSummary,
  onToggleCollapse,
  onEnsureExpanded,
  optionLinkActions,
}: {
  sectionId: string;
  subcategory: EstimateSubcategory;
  onChange: (subcategory: EstimateSubcategory) => void;
  onDelete: () => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  moduleSizeOptions: BuildingModuleSizeOption[];
  collapsed: boolean;
  collapsedSummary: string;
  onToggleCollapse: () => void;
  onEnsureExpanded: () => void;
  optionLinkActions: MultiOptionLinkActions;
}) {
  const { openPositionModal } = usePositionModal();

  function withExpandedContent(
    updater: (current: EstimateSubcategory) => EstimateSubcategory,
  ) {
    onEnsureExpanded();
    onChange(updater(subcategory));
  }

  function handleAddItem() {
    openPositionModal(createCompositePosition(), (saved) =>
      withExpandedContent((current) => ({
        ...current,
        items: [...current.items, saved],
      })),
    );
  }

  return (
    <>
      <SortableSectionRow
        sortId={subcategoryDragId(subcategory.id)}
        dragLabel="Pārvietot subkategoriju"
        kind="subcategory"
        placeholder="Subkategorijas nosaukums"
        value={subcategory.title}
        onChange={(title) => onChange({ ...subcategory, title })}
        collapsed={collapsed}
        collapsedSummary={collapsedSummary}
        onToggleCollapse={onToggleCollapse}
        nameTrailing={
          <>
            <SubcategoryPriceVisibilityToggle
              hiddenPricesInOffer={subcategory.hiddenPricesInOffer}
              onChange={(hiddenPricesInOffer) =>
                onChange({ ...subcategory, hiddenPricesInOffer })
              }
            />
            <SubcategoryOfferVisibilityToggle
              hiddenInOffer={subcategory.hiddenInOffer}
              onChange={(hiddenInOffer) =>
                onChange({ ...subcategory, hiddenInOffer })
              }
            />
          </>
        }
        actions={
          <RowActions
            showSub={false}
            deleteLabel="Dzēst subkategoriju"
            onAddMulti={() =>
              withExpandedContent((current) => ({
                ...current,
                items: [...current.items, createMultiPosition()],
              }))
            }
            onAddItem={handleAddItem}
            onDelete={onDelete}
          />
        }
      />
      {collapsed ? null : subcategory.items.map((row) =>
        isEstimateMultiPosition(row) ? (
          <SortableMultiPositionRow
            key={row.id}
            sortId={itemDragId(row.id)}
            sectionId={sectionId}
            subcategoryId={subcategory.id}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            moduleSizeOptions={moduleSizeOptions}
            optionLinkActions={optionLinkActions}
            value={row}
          />
        ) : (
          <SortableLineItemRow
            key={row.id}
            sortId={itemDragId(row.id)}
            sectionId={sectionId}
            subcategoryId={subcategory.id}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            moduleSizeOptions={moduleSizeOptions}
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

function SectionBlock({
  section,
  onChange,
  onDelete,
  catalogPositions,
  defaultHourlyRate,
  moduleSizeOptions,
  collapsed,
  collapsedSummary,
  onToggleCollapse,
  onEnsureExpanded,
  collapsedSectionIds,
  toggleSectionCollapsed,
  expandSection,
  optionLinkActions,
}: {
  section: EstimatePositionSection;
  onChange: (section: EstimatePositionSection) => void;
  onDelete: () => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  moduleSizeOptions: BuildingModuleSizeOption[];
  collapsed: boolean;
  collapsedSummary: string;
  onToggleCollapse: () => void;
  onEnsureExpanded: () => void;
  collapsedSectionIds: ReadonlySet<string>;
  toggleSectionCollapsed: (rowId: string) => void;
  expandSection: (rowId: string) => void;
  optionLinkActions: MultiOptionLinkActions;
}) {
  const { openPositionModal } = usePositionModal();

  function withExpandedContent(
    updater: (current: EstimatePositionSection) => EstimatePositionSection,
  ) {
    onEnsureExpanded();
    onChange(updater(section));
  }

  function handleAddItem() {
    openPositionModal(createCompositePosition(), (saved) =>
      withExpandedContent((current) => ({
        ...current,
        items: [...current.items, saved],
      })),
    );
  }

  return (
    <>
      <SortableSectionRow
        sortId={categoryDragId(section.id)}
        dragLabel="Pārvietot tāmes pozīciju"
        kind="category"
        placeholder="Tāmes pozīcijas grupas nosaukums"
        value={section.title}
        onChange={(title) => onChange({ ...section, title })}
        collapsed={collapsed}
        collapsedSummary={collapsedSummary}
        onToggleCollapse={onToggleCollapse}
        actions={
          <RowActions
            deleteLabel="Dzēst tāmes pozīciju"
            onAddSub={() =>
              withExpandedContent((current) => ({
                ...current,
                subcategories: [...current.subcategories, createSubcategory()],
              }))
            }
            onAddMulti={() =>
              withExpandedContent((current) => ({
                ...current,
                items: [...current.items, createMultiPosition()],
              }))
            }
            onAddItem={handleAddItem}
            onDelete={onDelete}
          />
        }
      />

      {collapsed ? null : section.subcategories.map((subcategory) => (
        <SubcategoryBlock
          key={subcategory.id}
          sectionId={section.id}
          catalogPositions={catalogPositions}
          defaultHourlyRate={defaultHourlyRate}
          moduleSizeOptions={moduleSizeOptions}
          collapsed={collapsedSectionIds.has(subcategory.id)}
          collapsedSummary={getCollapsedSubcategorySummary(subcategory)}
          onToggleCollapse={() => toggleSectionCollapsed(subcategory.id)}
          onEnsureExpanded={() => expandSection(subcategory.id)}
          optionLinkActions={optionLinkActions}
          subcategory={subcategory}
          onChange={(next) =>
            onChange({
              ...section,
              subcategories: section.subcategories.map((entry) =>
                entry.id === subcategory.id ? next : entry,
              ),
            })
          }
          onDelete={() =>
            onChange({
              ...section,
              subcategories: section.subcategories.filter(
                (entry) => entry.id !== subcategory.id,
              ),
            })
          }
        />
      ))}

      {collapsed ? null : section.items.map((row) =>
        isEstimateMultiPosition(row) ? (
          <SortableMultiPositionRow
            key={row.id}
            sortId={itemDragId(row.id)}
            sectionId={section.id}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            moduleSizeOptions={moduleSizeOptions}
            optionLinkActions={optionLinkActions}
            value={row}
          />
        ) : (
          <SortableLineItemRow
            key={row.id}
            sortId={itemDragId(row.id)}
            sectionId={section.id}
            catalogPositions={catalogPositions}
            defaultHourlyRate={defaultHourlyRate}
            moduleSizeOptions={moduleSizeOptions}
            item={row}
            onChange={(next) =>
              onChange({
                ...section,
                items: updateRowItemById(section.items, row.id, next),
              })
            }
            onDelete={() =>
              onChange({
                ...section,
                items: removeRowItemById(section.items, row.id),
              })
            }
          />
        ),
      )}
    </>
  );
}

function EstimatePositionDndTable({
  sections,
  allDragIds,
  setSections,
  multiOptionLinks,
  setMultiOptionLinks,
  catalogPositions,
  defaultHourlyRate,
  currency = null,
  moduleSizeOptions,
  collapsedSectionIds,
  toggleSectionCollapsed,
  expandSection,
}: {
  sections: EstimatePositionSection[];
  allDragIds: string[];
  setSections: Dispatch<SetStateAction<EstimatePositionSection[]>>;
  multiOptionLinks: MultiOptionLinkGroup[];
  setMultiOptionLinks: Dispatch<SetStateAction<MultiOptionLinkGroup[]>>;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  currency?: string | null;
  moduleSizeOptions: BuildingModuleSizeOption[];
  collapsedSectionIds: ReadonlySet<string>;
  toggleSectionCollapsed: (sectionId: string) => void;
  expandSection: (sectionId: string) => void;
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
        getLinkedOptionSummaries(sections, multiOptionLinks, optionId),
      onLinkDrop: (sourceOptionId, targetOptionId) => {
        setMultiOptionLinks((current) =>
          linkMultiOptions(
            sections,
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
        setSections((current) =>
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
        setSections((current) => {
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
      linkDragSourceOptionId,
      multiOptionLinks,
      sections,
      setMultiOptionLinks,
      setSections,
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

    setSections((current) =>
      reorderEstimatePositionSections(
        current,
        String(active.id),
        String(over.id),
      ),
    );
  }

  return (
    <DndContext
      id={ESTIMATE_POSITION_DND_CONTEXT_ID}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={clear}
    >
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col style={{ width: "35%" }} />
          <col style={{ width: "6%" }} />
          {Array.from({ length: UNIT_PRICE_COLUMN_COUNT }).map((_, index) => (
            <col key={index} style={{ width: "8%" }} />
          ))}
          <col style={{ width: "5%" }} />
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
            <th
              colSpan={UNIT_PRICE_COLUMN_COUNT}
              className="border-b border-r border-zinc-200 bg-sky-50/80 px-2 py-2 text-center text-sky-800/70"
            >
              Vienības cena
            </th>
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
          </tr>
        </thead>
        <SortableContext
          items={allDragIds}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section) => (
            <SectionBlock
              key={section.id}
              catalogPositions={catalogPositions}
              defaultHourlyRate={defaultHourlyRate}
              moduleSizeOptions={moduleSizeOptions}
              collapsed={collapsedSectionIds.has(section.id)}
              collapsedSummary={getCollapsedSectionSummary(section)}
              optionLinkActions={optionLinkActions}
                onToggleCollapse={() => toggleSectionCollapsed(section.id)}
                onEnsureExpanded={() => expandSection(section.id)}
                collapsedSectionIds={collapsedSectionIds}
                toggleSectionCollapsed={toggleSectionCollapsed}
                expandSection={expandSection}
              section={section}
              onChange={(next) =>
                setSections((current) =>
                  current.map((entry) =>
                    entry.id === section.id ? next : entry,
                  ),
                )
              }
              onDelete={() =>
                setSections((current) =>
                  current.filter((entry) => entry.id !== section.id),
                )
              }
            />
          ))}
        </SortableContext>
      </table>
    </DndContext>
  );
}

type EstimatePositionTableProps = {
  estimatePositionId: string;
  initialTitle: string;
  initialSections?: EstimatePositionSection[];
  initialMultiOptionLinks?: MultiOptionLinkGroup[];
  catalogPositions?: PositionPriceSummary[];
  defaultHourlyRate?: number | null;
  currency?: string | null;
  moduleSizeOptions?: BuildingModuleSizeOption[];
};

export function EstimatePositionTable({
  estimatePositionId,
  initialTitle,
  initialSections = [],
  initialMultiOptionLinks = [],
  catalogPositions = [],
  defaultHourlyRate = null,
  currency = null,
  moduleSizeOptions = [],
}: EstimatePositionTableProps) {
  const router = useRouter();
  const canSaveSagatave = useActionPermission("sagatave.save");
  const readOnly = !canSaveSagatave;
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [isSaving, startSaveTransition] = useTransition();
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const normalizedInitialSections = useMemo(
    () =>
      hydrateSectionsWithCatalogLinks(
        initialSections.map(ensureSectionHasLineItem),
        catalogPositions,
        defaultHourlyRate,
        hydrateCatalogPrices,
      ),
    // Sagataves sākuma stāvoklis — tikai pirmā mount vērtība no servera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [title, setTitle] = useState(initialTitle);
  const [sections, setSections] =
    useState<EstimatePositionSection[]>(normalizedInitialSections);
  const [multiOptionLinks, setMultiOptionLinks] = useState<
    MultiOptionLinkGroup[]
  >(initialMultiOptionLinks);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serializeEstimatePositionDocument(
      initialTitle,
      normalizedInitialSections,
      initialMultiOptionLinks,
    ),
  );

  const lineItemCount = collectSectionLineItems(sections).length;
  const estimateUnits = useMemo(
    () => collectEstimateDocumentUnits(sections, moduleSizeOptions),
    [sections, moduleSizeOptions],
  );
  const {
    collapsedSectionIds,
    toggleSectionCollapsed,
    expandSection,
  } = useCollapsedEstimateSections(estimatePositionId);
  const allDragIds = useMemo(
    () => collectVisibleSectionDragIds(sections, collapsedSectionIds),
    [sections, collapsedSectionIds],
  );
  const isDirty = useMemo(
    () =>
      serializeEstimatePositionDocument(title, sections, multiOptionLinks) !==
      savedSnapshot,
    [title, sections, multiOptionLinks, savedSnapshot],
  );
  const { confirmOpen, stayOnPage, confirmLeave } = useUnsavedChangesGuard({
    isDirty,
  });
  const [positionModalState, setPositionModalState] = useState<{
    item: EstimateLineItem;
    onSave: (next: EstimateLineItem) => void;
  } | null>(null);

  const openPositionModal = useCallback(
    (item: EstimateLineItem, onSave: (next: EstimateLineItem) => void) => {
      setPositionModalState({ item, onSave });
    },
    [],
  );

  function handleSave() {
    if (!isDirty || isSaving) {
      return;
    }

    clearFeedback();
    startSaveTransition(async () => {
      const linkedSections = hydrateSectionsWithCatalogLinks(
        sections,
        catalogPositions,
        defaultHourlyRate,
        hydrateCatalogPrices,
      );

      const result = await saveEstimatePositionDocumentAction({
        id: estimatePositionId,
        title,
        sections: linkedSections,
        multiOptionLinks,
      });

      if (!mountedRef.current) {
        return;
      }

      if (!result.ok) {
        showFeedback({ type: "error", text: result.error });
        return;
      }

      setSections(linkedSections);
      const nextSnapshot = serializeEstimatePositionDocument(
        title,
        linkedSections,
        multiOptionLinks,
      );
      setSavedSnapshot(nextSnapshot);
      router.refresh();
      showFeedback({ type: "success", text: "Tāmes pozīcija saglabāta." });
    });
  }

  return (
    <div className="max-w-full space-y-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm max-w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/50 px-4 py-2.5">
          {readOnly ? (
            <p className="min-w-[12rem] flex-1 text-sm font-semibold text-zinc-900">
              {title}
            </p>
          ) : (
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="min-w-[12rem] flex-1 border-0 bg-transparent text-sm font-semibold text-zinc-900 focus:outline-none"
              aria-label="Bibliotēkas ieraksta nosaukums"
            />
          )}
          <p className="text-xs text-zinc-500">
            {sections.length} tāmes pozīcijas · {lineItemCount} rindas
          </p>
          {!readOnly ? (
          <button
            type="button"
            onClick={() =>
              setSections([...sections, createEstimatePositionSection()])
            }
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
          >
            + Tāmes pozīcija
          </button>
          ) : null}
        </div>

        <div
          className={`max-h-[calc(100vh-14rem)] overflow-x-hidden overflow-y-auto${
            readOnly ? " pointer-events-none opacity-80" : ""
          }`}
        >
          <PositionModalProvider openPositionModal={openPositionModal}>
            <DropIndicatorProvider>
              <EstimatePositionDndTable
                sections={sections}
                allDragIds={allDragIds}
                setSections={setSections}
                multiOptionLinks={multiOptionLinks}
                setMultiOptionLinks={setMultiOptionLinks}
                catalogPositions={catalogPositions}
                defaultHourlyRate={defaultHourlyRate}
                currency={currency}
                moduleSizeOptions={moduleSizeOptions}
                collapsedSectionIds={collapsedSectionIds}
                toggleSectionCollapsed={toggleSectionCollapsed}
                expandSection={expandSection}
              />
            </DropIndicatorProvider>
          </PositionModalProvider>
        </div>
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
          onSave={(next) => positionModalState.onSave(next)}
          catalogPositions={catalogPositions}
          defaultHourlyRate={defaultHourlyRate}
          moduleSizeOptions={moduleSizeOptions}
          estimateUnits={estimateUnits}
        />
      ) : null}

      {!readOnly ? (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saglabā…" : "Saglabāt"}
        </button>
      </div>
      ) : null}

      <UnsavedChangesConfirmModal
        open={confirmOpen}
        onStay={stayOnPage}
        onLeave={confirmLeave}
      />
    </div>
  );
}
