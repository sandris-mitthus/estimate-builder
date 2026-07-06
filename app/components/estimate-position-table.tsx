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
  useMemo,
  useState,
  useEffect,
  useRef,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { saveEstimatePositionDocumentAction } from "@/app/(protected)/estimate/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useCatalogPositionsWithRefresh } from "@/app/lib/hooks/use-catalog-positions-with-refresh";
import { resolveEstimateGroupTitle } from "@/app/lib/estimates/resolve-group-title";
import { EstimateSectionRowActions } from "@/app/components/estimate-section-row-actions";
import { EstimateSectionActionsCell } from "@/app/components/estimate-section-actions-cell";
import { EstimateTableStickyShell } from "@/app/components/estimate-table-sticky-shell";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { UnsavedChangesConfirmModal } from "@/app/components/unsaved-changes-confirm-modal";
import {
  SectionTitleFocusProvider,
  useSectionTitleFocus,
  AddEstimateSectionButton,
} from "@/app/components/section-title-focus-context";
import { useUnsavedChangesGuard } from "@/app/lib/hooks/use-unsaved-changes-guard";
import { hydrateSectionsWithCatalogLinks } from "@/app/lib/positions/sync-from-estimate-line-items";
import { serializeEstimatePositionDocument } from "@/app/lib/estimate-positions/serialize-document";
import {
  createSubcategory,
  ensureSectionHasLineItem,
  normalizeEstimatePositionSection,
} from "@/app/lib/estimate-positions/create-empty";
import { collectSectionLineItems } from "@/app/lib/estimate-positions/collect-section-items";
import {
  collectVisibleSectionDragIds,
  getCollapsedSectionSummaryParts,
  getCollapsedSubcategorySummaryParts,
  type CollapsedSectionSummaryParts,
} from "@/app/lib/estimate-positions/collapsed-sections-cookie";
import { reorderEstimatePositionSections } from "@/app/lib/estimate-positions/reorder-sections";
import {
  appendCategoryChild,
  removeCategoryChildRef,
  resolveCategoryChildren,
} from "@/app/lib/estimates/category-child-order";
import { useCollapsedEstimateSections } from "@/app/lib/hooks/use-collapsed-estimate-sections";
import {
  mergeSectionGroupHoverHandlers,
  useSectionGroupHover,
  type SectionGroupHoverHandlers,
} from "@/app/lib/hooks/use-section-group-hover";
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
  getRowItemId,
  isEstimateMultiPosition,
  removeRowItemById,
  resolveLineItemDisplayName,
  updateRowItemById,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateLineItem,
  EstimateMultiPosition,
  EstimateSubcategory,
  MultiOptionLinkGroup,
} from "@/app/lib/estimates/types";
import { AttachedModuleSizeLabel } from "@/app/components/attached-module-size-label";
import { EstimateLineItemNote } from "@/app/components/estimate-line-item-note";
import { PositionVariableQuantityIcon } from "@/app/components/position-variable-quantity-icon";
import { LineItemPriceVisibilityToggle } from "@/app/components/line-item-price-visibility-toggle";
import { LineItemTotalOnlyToggle } from "@/app/components/line-item-total-only-toggle";
import { EstimateAttentionBudgetControl } from "@/app/components/estimate-attention-budget-control";
import {
  EstimateAttentionIcon,
  LineItemAttentionToggle,
  estimateAttentionRowClassName,
} from "@/app/components/line-item-attention-toggle";
import { patchRequiresAttention } from "@/app/lib/estimates/attention-budget";
import { SubcategoryOfferVisibilityToggle } from "@/app/components/subcategory-offer-visibility-toggle";
import { SubcategoryPriceVisibilityToggle } from "@/app/components/subcategory-price-visibility-toggle";
import { DeleteButton } from "@/app/components/delete-button";
import { IconActionButton } from "@/app/components/icon-action-button";
import { EstimateMultiPositionRow } from "@/app/components/estimate-multi-position-row";
import { MultiPositionModal } from "@/app/components/multi-position-modal";
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
import { EstimateTableSubheaderLabel } from "@/app/components/estimate-table-header-label";
import { collectEstimateDocumentUnits } from "@/app/lib/estimates/collect-estimate-document-units";
import { resolveCompositeLineItemDisplayUnit } from "@/app/lib/estimates/sync-module-size-quantities";
import {
  UNIT_PRICE_COLUMN_COUNT,
  getUnitPriceSubheaderLabels,
} from "@/app/lib/estimates/unit-price-columns";
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

const FULL_COL_COUNT = 9;
const ESTIMATE_POSITION_DND_CONTEXT_ID = "estimate-position-table-dnd";
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

function EstimatePositionTableColgroup() {
  return (
    <colgroup>
      <col style={{ width: "30%" }} />
      <col style={{ width: "7%" }} />
      {Array.from({ length: UNIT_PRICE_COLUMN_COUNT }).map((_, index) => (
        <col key={index} style={{ width: "9%" }} />
      ))}
      <col style={{ width: "9%" }} />
    </colgroup>
  );
}

const nameCell = "border-b border-zinc-100 py-1 pr-2 align-top";
const readOnlyNum = "block px-2 py-1.5 text-center text-sm tabular-nums text-zinc-700";
const rowLead = "pl-[22px]";
const dragHandleColumn =
  "flex h-7 w-6 shrink-0 items-center justify-center self-start";
const subcategoryNameIndent = "ml-[10px]";
const subcategoryItemNameIndent = "ml-[20px]";
const dropLineClass = "shadow-[inset_0_4px_0_0_rgb(24_24_27)]";
const rowActionCell =
  "border-b border-zinc-100 px-1 py-0.5 text-center align-middle";

function buildHydrateCatalogOptions(
  moduleSizeOptions: BuildingModuleSizeOption[],
) {
  return { forceCatalogPrices: true as const, moduleSizeOptions };
}

type OpenMultiPositionModal = (
  value: EstimateMultiPosition,
  onSave: (next: EstimateMultiPosition) => void,
) => void;

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
  currency = null,
  moduleSizeOptions,
  sectionGroupHover,
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
  currency?: string | null;
  moduleSizeOptions: BuildingModuleSizeOption[];
  sectionGroupHover?: SectionGroupHoverHandlers;
}) {
  const { t } = useTranslations();
  const { openPositionModal } = usePositionModal();
  const missingModuleSize =
    moduleSizeOptions.length > 0 &&
    !item.moduleSizeAttachment &&
    !item.variableQuantity &&
    !item.manualUnitEnabled;
  const missingTimeNorm =
    isCompositeLineItem(item) && !((item.laborTimeNorm ?? 0) > 0);
  const requiresAttention = item.requiresAttention === true;
  const resolvedName = resolveLineItemDisplayName(item);
  const isUnnamed = resolvedName === "—";
  const rowLabel = isUnnamed
    ? t("positions.unnamed", "Nenosaukta pozīcija")
    : resolvedName;

  const rowBg = requiresAttention
    ? estimateAttentionRowClassName
    : missingModuleSize
    ? "bg-red-50/60 hover:bg-red-50"
    : missingTimeNorm
      ? "bg-amber-50/60 hover:bg-amber-50"
      : "hover:bg-sky-50/40";
  const hiddenPriceInOffer = item.hiddenPriceInOffer === true;
  const showOnlyTotalPrice = item.showOnlyTotalPrice === true;
  const hoverOnlyActionClass = "opacity-0 group-hover:opacity-100";
  const priceToggleClass = hiddenPriceInOffer
    ? "opacity-100"
    : hoverOnlyActionClass;
  const totalOnlyToggleClass = showOnlyTotalPrice
    ? "opacity-100"
    : hoverOnlyActionClass;
  const attentionToggleClass = requiresAttention
    ? "opacity-100"
    : hoverOnlyActionClass;

  return (
    <tbody
      ref={rowRef}
      style={rowStyle}
      onMouseEnter={sectionGroupHover?.onSectionGroupEnter}
      onMouseLeave={sectionGroupHover?.onSectionGroupLeave}
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
                {requiresAttention ? (
                  <EstimateAttentionIcon className="relative top-[3px]" />
                ) : null}
                <button
                  type="button"
                  onClick={() => openPositionModal(item, onChange)}
                  className={`block min-w-0 flex-1 text-left text-sm font-medium transition hover:underline ${
                    !isUnnamed
                      ? requiresAttention
                        ? "text-red-800 hover:text-red-900"
                        : missingModuleSize
                        ? "text-red-700 hover:text-red-900"
                        : missingTimeNorm
                          ? "text-amber-700 hover:text-amber-900"
                          : "text-zinc-900 hover:text-sky-700"
                      : "italic text-zinc-400"
                  }`}
                >
                  {rowLabel}
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
              <EstimateLineItemNote note={item.note} />
              {requiresAttention ? (
                <EstimateAttentionBudgetControl
                  id={`attention-budget-${item.id}`}
                  value={item.attentionBudget}
                  currency={currency}
                  compact
                  onChange={(attentionBudget) =>
                    onChange({ ...item, attentionBudget })
                  }
                />
              ) : null}
              {missingModuleSize ? (
                <span className="text-xs text-red-500">
                  {t("estimate.module_size.missing", "Nav pievienots moduļa apjoms")}
                </span>
              ) : null}
              {missingTimeNorm ? (
                <span className="text-xs text-amber-600">
                  <i className="fas fa-exclamation-triangle mr-1" aria-hidden="true" />
                  {t("estimate.time_norm.missing", "Nav ievadīta Laika norma")}
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
      <td className="border-b border-zinc-100 px-1 py-0.5 align-middle text-center">
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
          moduleSizeOptions,
        )}
        deemphasizeBreakdown={showOnlyTotalPrice}
        onTimeNormChange={(laborTimeNorm) =>
          onChange(
            patchLineItemLaborTimeNorm(
              item,
              laborTimeNorm,
              catalogPositions,
              defaultHourlyRate,
              moduleSizeOptions,
            ),
          )
        }
      />
      <td className={rowActionCell}>
        <div className="flex min-w-[9rem] items-center justify-end gap-0.5 whitespace-nowrap">
          <LineItemAttentionToggle
            id={`attention-${item.id}`}
            enabled={requiresAttention}
            onChange={(nextEnabled) =>
              onChange(patchRequiresAttention(item, nextEnabled))
            }
            className={attentionToggleClass}
          />
          {showOfferPriceToggle ? (
            <LineItemPriceVisibilityToggle
              hiddenPriceInOffer={item.hiddenPriceInOffer}
              onChange={(nextHidden) =>
                onChange({ ...item, hiddenPriceInOffer: nextHidden })
              }
              className={priceToggleClass}
            />
          ) : null}
          <LineItemTotalOnlyToggle
            showOnlyTotalPrice={item.showOnlyTotalPrice}
            onChange={(nextShowOnlyTotal) =>
              onChange({
                ...item,
                showOnlyTotalPrice: nextShowOnlyTotal ? true : undefined,
              })
            }
            className={totalOnlyToggleClass}
          />
          <IconActionButton
            label={t("positions.edit.title", "Labot pozīciju")}
            icon="fas fa-pen"
            variant="edit"
            onClick={() => openPositionModal(item, onChange)}
            className={hoverOnlyActionClass}
          />
          <DeleteButton
            label={t("positions.delete.action", "Dzēst pozīciju")}
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
  sectionGroupHover,
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
  sectionGroupHover?: SectionGroupHoverHandlers;
}) {
  const { t } = useTranslations();
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
      sectionGroupHover={sectionGroupHover}
      dragHandle={
        <DragHandle
          label={t("positions.drag.position", "Pārvietot pozīciju")}
          attributes={attributes}
          listeners={listeners}
        />
      }
    />
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
  moduleSizeOptions,
  estimateUnits = [],
  sectionGroupHover,
}: {
  sortId: string;
  sectionId: string;
  subcategoryId?: string;
  value: EstimateMultiPosition;
  optionLinkActions: MultiOptionLinkActions;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  currency?: string | null;
  moduleSizeOptions: BuildingModuleSizeOption[];
  estimateUnits?: string[];
  sectionGroupHover?: SectionGroupHoverHandlers;
}) {
  const { t } = useTranslations();
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
      showTotalOnlyToggle
      catalogPositions={catalogPositions}
      defaultHourlyRate={defaultHourlyRate}
      currency={currency}
      moduleSizeOptions={moduleSizeOptions}
      estimateUnits={estimateUnits}
      optionLinkActions={optionLinkActions}
      indentName={subcategoryId != null}
      showDropLine={showDropLine}
      rowRef={setNodeRef}
      rowStyle={isDragging ? { opacity: 0.45 } : undefined}
      sectionGroupHover={sectionGroupHover}
      dragHandle={
        <DragHandle
          label={t("estimate.drag.multi_position", "Pārvietot multi-pozīciju")}
          attributes={attributes}
          listeners={listeners}
        />
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
  collapsed = false,
  collapsedSummaryParts,
  onToggleCollapse,
  nameTrailing,
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
  collapsed?: boolean;
  collapsedSummaryParts?: CollapsedSectionSummaryParts;
  onToggleCollapse?: () => void;
  nameTrailing?: ReactNode;
  actionsVisible?: boolean;
  sectionGroupHover?: SectionGroupHoverHandlers;
}) {
  const { t } = useTranslations();
  const focusCtx = useSectionTitleFocus();
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldFocus = focusCtx?.focusRowId === sectionRowId;
  const isCategory = kind === "category";
  const topBorderClass = showDropLine
    ? "border-t-4 border-t-zinc-900"
    : isCategory
      ? ""
      : "border-t border-t-zinc-300";

  useEffect(() => {
    if (!shouldFocus) {
      return;
    }

    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.focus({ preventScroll: false });
    focusCtx?.clearFocus();
  }, [shouldFocus, focusCtx]);

  return (
    <tbody
      ref={rowRef}
      style={rowStyle}
      onMouseEnter={sectionGroupHover?.onSectionGroupEnter}
      onMouseLeave={sectionGroupHover?.onSectionGroupLeave}
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
          className={`flex min-h-[3.25rem] items-start gap-2 py-2 pr-3 ${rowLead} ${topBorderClass}`}
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
                    ? t("estimate.expand.category", "Izvērst tāmes pozīciju")
                    : t("estimate.expand.subcategory", "Izvērst subkategoriju")
                  : isCategory
                    ? t("estimate.collapse.category", "Sakļaut tāmes pozīciju")
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
            className={`min-w-0 flex-1 basis-0 ${isCategory ? "" : subcategoryNameIndent}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                className="min-w-0 w-full flex-1 border-0 bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                value={value ?? ""}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
              />
              {nameTrailing ? (
                <span className="shrink-0">{nameTrailing}</span>
              ) : null}
            </div>
          </div>
          <EstimateSectionActionsCell
            actions={actions}
            collapsedSummaryParts={collapsedSummaryParts}
            showSummary={collapsed}
            actionsVisible={actionsVisible}
            className="self-center"
          />
        </div>
      </td>
    </tr>
    </tbody>
  );
}

function SortableSectionRow({
  sortId,
  sectionRowId,
  dragLabel,
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
  collapsed?: boolean;
  collapsedSummaryParts?: CollapsedSectionSummaryParts;
  onToggleCollapse?: () => void;
  nameTrailing?: ReactNode;
  actionsVisible?: boolean;
  sectionGroupHover?: SectionGroupHoverHandlers;
}) {
  const showDropLine = useShowDropLine(sortId);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: sortId,
    animateLayoutChanges: () => false,
  });

  return (
    <SectionRow
      {...props}
      sectionRowId={sectionRowId}
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
  currency = null,
  moduleSizeOptions,
  collapsed,
  collapsedSummaryParts,
  onToggleCollapse,
  onEnsureExpanded,
  optionLinkActions,
  openMultiPositionModal,
  estimateUnits = [],
  parentSectionHover,
}: {
  sectionId: string;
  subcategory: EstimateSubcategory;
  onChange: (subcategory: EstimateSubcategory) => void;
  onDelete: () => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  currency?: string | null;
  moduleSizeOptions: BuildingModuleSizeOption[];
  collapsed: boolean;
  collapsedSummaryParts: CollapsedSectionSummaryParts;
  onToggleCollapse: () => void;
  onEnsureExpanded: () => void;
  optionLinkActions: MultiOptionLinkActions;
  openMultiPositionModal: OpenMultiPositionModal;
  estimateUnits?: string[];
  parentSectionHover?: SectionGroupHoverHandlers;
}) {
  const { t } = useTranslations();
  const { openPositionModal } = usePositionModal();
  const subcategoryHover = useSectionGroupHover();
  const sectionGroupHover = mergeSectionGroupHoverHandlers(
    subcategoryHover,
    parentSectionHover,
  );

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

  function handleAddMulti() {
    openMultiPositionModal(createMultiPosition(), (saved) =>
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
        sectionRowId={subcategory.id}
        dragLabel={t("estimate.drag.subcategory", "Pārvietot subkategoriju")}
        kind="subcategory"
        placeholder={t("estimate.placeholder.subcategory", "Subkategorijas nosaukums")}
        value={resolveEstimateGroupTitle(subcategory)}
        onChange={(title) => onChange({ ...subcategory, title })}
        collapsed={collapsed}
        collapsedSummaryParts={collapsedSummaryParts}
        onToggleCollapse={onToggleCollapse}
        actionsVisible={subcategoryHover.hovered}
        sectionGroupHover={sectionGroupHover}
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
          <EstimateSectionRowActions
            showSub={false}
            deleteLabel={t("estimate.delete.subcategory", "Dzēst subkategoriju")}
            onAddMulti={handleAddMulti}
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
            currency={currency}
            moduleSizeOptions={moduleSizeOptions}
            estimateUnits={estimateUnits}
            optionLinkActions={optionLinkActions}
            sectionGroupHover={sectionGroupHover}
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
  currency = null,
  moduleSizeOptions,
  collapsed,
  collapsedSummaryParts,
  onToggleCollapse,
  onEnsureExpanded,
  collapsedSectionIds,
  toggleSectionCollapsed,
  expandSection,
  optionLinkActions,
  openMultiPositionModal,
  estimateUnits = [],
}: {
  section: EstimatePositionSection;
  onChange: (section: EstimatePositionSection) => void;
  onDelete: () => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  currency?: string | null;
  moduleSizeOptions: BuildingModuleSizeOption[];
  collapsed: boolean;
  collapsedSummaryParts: CollapsedSectionSummaryParts;
  onToggleCollapse: () => void;
  onEnsureExpanded: () => void;
  collapsedSectionIds: ReadonlySet<string>;
  toggleSectionCollapsed: (rowId: string) => void;
  expandSection: (rowId: string) => void;
  optionLinkActions: MultiOptionLinkActions;
  openMultiPositionModal: OpenMultiPositionModal;
  estimateUnits?: string[];
}) {
  const { t } = useTranslations();
  const { openPositionModal } = usePositionModal();
  const { requestFocus } = useSectionTitleFocus() ?? {};
  const sectionHover = useSectionGroupHover();

  function withExpandedContent(
    updater: (current: EstimatePositionSection) => EstimatePositionSection,
  ) {
    onEnsureExpanded();
    onChange(updater(section));
  }

  function handleAddItem() {
    openPositionModal(createCompositePosition(), (saved) =>
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

  return (
    <>
      <SortableSectionRow
        sortId={categoryDragId(section.id)}
        sectionRowId={section.id}
        dragLabel={t("estimate.drag.section", "Pārvietot tāmes pozīciju")}
        kind="category"
        placeholder={t("estimate.placeholder.section", "Tāmes pozīcijas grupas nosaukums")}
        value={resolveEstimateGroupTitle(section)}
        onChange={(title) => onChange({ ...section, title })}
        collapsed={collapsed}
        collapsedSummaryParts={collapsedSummaryParts}
        onToggleCollapse={onToggleCollapse}
        actionsVisible={sectionHover.hovered}
        sectionGroupHover={sectionHover}
        actions={
          <EstimateSectionRowActions
            deleteLabel={t("estimate.delete.section", "Dzēst tāmes pozīciju")}
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
            onAddMulti={handleAddMulti}
            onAddItem={handleAddItem}
            onDelete={onDelete}
          />
        }
      />

      {collapsed
        ? null
        : resolveCategoryChildren(section).map((child) => {
            if (child.kind === "subcategory") {
              const subcategory = child.subcategory;
              return (
                <SubcategoryBlock
                  key={subcategory.id}
                  sectionId={section.id}
                  catalogPositions={catalogPositions}
                  defaultHourlyRate={defaultHourlyRate}
                  currency={currency}
                  moduleSizeOptions={moduleSizeOptions}
                  collapsed={collapsedSectionIds.has(subcategory.id)}
                  collapsedSummaryParts={getCollapsedSubcategorySummaryParts(subcategory, t)}
                  onToggleCollapse={() => toggleSectionCollapsed(subcategory.id)}
                  onEnsureExpanded={() => expandSection(subcategory.id)}
                  optionLinkActions={optionLinkActions}
                  openMultiPositionModal={openMultiPositionModal}
                  estimateUnits={estimateUnits}
                  parentSectionHover={sectionHover}
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
                    onChange(
                      removeCategoryChildRef(
                        {
                          ...section,
                          subcategories: section.subcategories.filter(
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
                sectionId={section.id}
                catalogPositions={catalogPositions}
                defaultHourlyRate={defaultHourlyRate}
                currency={currency}
                moduleSizeOptions={moduleSizeOptions}
                estimateUnits={estimateUnits}
                optionLinkActions={optionLinkActions}
                sectionGroupHover={sectionHover}
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
                sectionGroupHover={sectionHover}
                item={row}
                onChange={(next) =>
                  onChange({
                    ...section,
                    items: updateRowItemById(section.items, row.id, next),
                  })
                }
                onDelete={() =>
                  onChange(
                    removeCategoryChildRef(
                      {
                        ...section,
                        items: removeRowItemById(section.items, row.id),
                      },
                      { kind: "item", id: row.id },
                    ),
                  )
                }
              />
            );
          })}
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
  openMultiPositionModal,
  estimateUnits = [],
  toolbar = null,
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
  openMultiPositionModal: OpenMultiPositionModal;
  estimateUnits?: string[];
  toolbar?: ReactNode;
}) {
  const { t } = useTranslations();
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
        getLinkedOptionSummaries(sections, multiOptionLinks, optionId, t),
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

    setSections((current) =>
      reorderEstimatePositionSections(
        current,
        String(active.id),
        String(over.id),
      ),
    );
  }

  return (
    <EstimateDragCategoriesProvider categories={sections}>
      <DndContext
        id={ESTIMATE_POSITION_DND_CONTEXT_ID}
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
            <EstimatePositionTableColgroup />
            <thead>
              {toolbar ? (
                <tr>
                  <th colSpan={FULL_COL_COUNT} className={estimateTableToolbarRowClass}>
                    <div className={estimateTableToolbarInnerClass}>{toolbar}</div>
                  </th>
                </tr>
              ) : null}
              <tr>
                <th rowSpan={2} className={`${estimatePrimaryHeaderThClass} pl-[22px] pr-1 text-left`}>
                  {t("common.name", "Nosaukums")}
                </th>
                <th rowSpan={2} className={`${estimatePrimaryHeaderThClass} px-1 text-center`}>
                  {t("common.unit_short", "Mērv.")}
                </th>
                <th
                  colSpan={UNIT_PRICE_COLUMN_COUNT}
                  className={`${estimateGroupHeaderThClass} bg-sky-50/80 text-sky-800/70`}
                >
                  {t("estimate.unit_price", "Vienības cena")}
                </th>
                <th rowSpan={2} className="border-b border-zinc-200 bg-white" />
              </tr>
              <tr>
                {getUnitPriceSubheaderLabels(currency, t).map((label) => (
                  <th
                    key={label}
                    className={`${estimateSubheaderThClass} bg-sky-50/40`}
                  >
                    <EstimateTableSubheaderLabel label={label} />
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        }
      >
      <table className={estimateTableClassName}>
        <EstimatePositionTableColgroup />
        <SortableContext
          items={allDragIds}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section) => (
            <SectionBlock
              key={section.id}
              catalogPositions={catalogPositions}
              defaultHourlyRate={defaultHourlyRate}
              currency={currency}
              moduleSizeOptions={moduleSizeOptions}
              collapsed={collapsedSectionIds.has(section.id)}
              collapsedSummaryParts={getCollapsedSectionSummaryParts(section, t)}
              optionLinkActions={optionLinkActions}
              openMultiPositionModal={openMultiPositionModal}
              estimateUnits={estimateUnits}
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
      </EstimateTableStickyShell>
    </DndContext>
    </EstimateDragCategoriesProvider>
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
  catalogPositions: initialCatalogPositions = [],
  defaultHourlyRate = null,
  currency = null,
  moduleSizeOptions = [],
}: EstimatePositionTableProps) {
  const { t } = useTranslations();
  const { catalogPositions, refreshCatalogPositions } =
    useCatalogPositionsWithRefresh(initialCatalogPositions);
  const canSaveSagatave = useActionPermission("sagatave.save");
  const readOnly = !canSaveSagatave;
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const initialDocumentRef = useRef({
    sections: initialSections,
    catalogPositions: initialCatalogPositions,
    defaultHourlyRate,
    moduleSizeOptions,
  });

  function buildHydratedSections(
    sourceSections: EstimatePositionSection[],
    catalog: PositionPriceSummary[],
    hourlyRate: number | null,
    moduleOptions: BuildingModuleSizeOption[],
  ) {
    return hydrateSectionsWithCatalogLinks(
      sourceSections.map(ensureSectionHasLineItem),
      catalog,
      hourlyRate,
      buildHydrateCatalogOptions(moduleOptions),
    );
  }

  const normalizedInitialSections = useMemo(
    () =>
      buildHydratedSections(
        initialDocumentRef.current.sections,
        initialDocumentRef.current.catalogPositions,
        initialDocumentRef.current.defaultHourlyRate,
        initialDocumentRef.current.moduleSizeOptions,
      ),
    // Sagataves sākuma stāvoklis — tikai pirmā mount vērtība no servera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [title] = useState(initialTitle);
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

  const lineItemCount = useMemo(
    () => collectSectionLineItems(sections).length,
    [sections],
  );
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

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const catalogPositionsRef = useRef(catalogPositions);
  catalogPositionsRef.current = catalogPositions;

  // Sinhronizē ar servera props tikai kad tie mainās un lokāli nav nesaglabātu izmaiņu.
  // isDirty nedrīkst būt dependency — pēc veiksmīgas saglabāšanas initialSections vēl nav atjaunināts.
  useEffect(() => {
    if (isDirtyRef.current) {
      return;
    }

    setSections(
      buildHydratedSections(
        initialSections,
        catalogPositionsRef.current,
        defaultHourlyRate,
        moduleSizeOptions,
      ),
    );
  }, [initialSections, defaultHourlyRate, moduleSizeOptions]);

  // Kataloga atjauninājums — tikai kad nav lokālu izmaiņu (lai nepārrakstītu rediģējumu).
  useEffect(() => {
    if (isDirtyRef.current) {
      return;
    }

    setSections((current) =>
      buildHydratedSections(
        current,
        catalogPositions,
        defaultHourlyRate,
        moduleSizeOptions,
      ),
    );
  }, [catalogPositions, defaultHourlyRate, moduleSizeOptions]);

  useEffect(() => {
    setSections((current) =>
      current.map((section) => normalizeEstimatePositionSection(section)),
    );
  }, []);

  const [positionModalState, setPositionModalState] = useState<{
    item: EstimateLineItem;
    onSave: (next: EstimateLineItem) => void;
  } | null>(null);
  const [multiPositionModalState, setMultiPositionModalState] = useState<{
    value: EstimateMultiPosition;
    onSave: (next: EstimateMultiPosition) => void;
  } | null>(null);

  const openPositionModal = useCallback(
    (item: EstimateLineItem, onSave: (next: EstimateLineItem) => void) => {
      refreshCatalogPositions();
      setPositionModalState({ item, onSave });
    },
    [refreshCatalogPositions],
  );
  const openMultiPositionModal = useCallback(
    (
      value: EstimateMultiPosition,
      onSave: (next: EstimateMultiPosition) => void,
    ) => {
      refreshCatalogPositions();
      setMultiPositionModalState({ value, onSave });
    },
    [refreshCatalogPositions],
  );

  function handleSave() {
    if (!isDirty || isSaving) {
      return;
    }

    clearFeedback();
    setIsSaving(true);

    void (async () => {
      try {
        const result = await saveEstimatePositionDocumentAction({
          id: estimatePositionId,
          title,
          sections,
          multiOptionLinks,
        });

        if (!mountedRef.current) {
          return;
        }

        if (!result.ok) {
          showFeedback({ type: "error", text: translateActionError(t, result) });
          return;
        }

        const nextSnapshot = serializeEstimatePositionDocument(
          title,
          result.sections,
          multiOptionLinks,
        );

        setIsSaving(false);
        showFeedback({
          type: "success",
          text: t("estimate_position.feedback.saved", "Tāmes pozīcija saglabāta."),
        });
        setSections(result.sections);
        setSavedSnapshot(nextSnapshot);
      } catch (error) {
        console.error("Sagatave save failed:", error);
        if (!mountedRef.current) {
          return;
        }
        showFeedback({
          type: "error",
          text: t(
            "errors.estimate_position_save_failed",
            "Neizdevās saglabāt tāmes pozīciju.",
          ),
        });
      } finally {
        if (mountedRef.current) {
          setIsSaving(false);
        }
      }
    })();
  }

  return (
    <div className="max-w-full space-y-4">
      <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <SectionTitleFocusProvider>
        <div className={readOnly ? "pointer-events-none opacity-80" : undefined}>
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
                openMultiPositionModal={openMultiPositionModal}
                estimateUnits={estimateUnits}
                toolbar={
                  <>
                    {readOnly && title.trim() ? (
                      <p className="min-w-[12rem] flex-1 text-sm font-semibold text-zinc-900">
                        {title}
                      </p>
                    ) : (
                      <div className="min-w-[12rem] flex-1" aria-hidden="true" />
                    )}
                    <p className="text-xs text-zinc-500">
                      {t("estimate.table.counts", "{sections} tāmes pozīcijas · {rows} rindas", {
                        sections: sections.length,
                        rows: lineItemCount,
                      })}
                    </p>
                    {!readOnly ? (
                      <AddEstimateSectionButton
                        onAdd={(section) => setSections([...sections, section])}
                      />
                    ) : null}
                  </>
                }
              />
            </DropIndicatorProvider>
          </PositionModalProvider>
        </div>
        </SectionTitleFocusProvider>
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
          currency={currency}
          moduleSizeOptions={moduleSizeOptions}
          estimateUnits={estimateUnits}
          allowAttentionFlagEdit
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
          allowAttentionFlagEdit
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
          {isSaving ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
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
