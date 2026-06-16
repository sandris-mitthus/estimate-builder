"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
} from "react";
import { MultiPositionModal } from "@/app/components/multi-position-modal";
import { MultiPositionLinkHandle } from "@/app/components/multi-position-link-handle";
import { AttachedModuleSizeLabel } from "@/app/components/attached-module-size-label";
import { DeleteButton } from "@/app/components/delete-button";
import { IconActionButton } from "@/app/components/icon-action-button";
import { EstimateUnitPriceCells } from "@/app/components/estimate-unit-price-cells";
import {
  UNIT_PRICE_COLUMN_COUNT,
} from "@/app/lib/estimates/unit-price-columns";
import {
  MULTI_POSITION_NONE_OPTION_ID,
  getMultiOptionIdentityKey,
  getMultiPositionSelectionOptions,
  resolveSelectedMultiLineItem,
} from "@/app/lib/estimates/multi-position";
import {
  MULTI_OPTION_LINK_DRAG_MIME,
  isLinkableMultiOption,
  type LinkedOptionSummary,
  type MultiOptionLinkActions,
} from "@/app/lib/estimates/multi-position-links";
import { buildUnitPriceForCatalogPosition } from "@/app/lib/positions/apply-catalog-to-line-item";
import {
  resolveFrozenEstimateDisplayUnitPrice,
  resolveLiveDisplayUnitPrice,
  resolveStaleCatalogPriceHints,
} from "@/app/lib/positions/stale-catalog-price";
import {
  findCatalogPositionForLineItem,
  isMaterialsOrMechanismsLineItem,
} from "@/app/lib/positions/sync-from-estimate-line-items";
import {
  deriveCompositeUnitPrice,
  isCompositeLineItem,
} from "@/app/lib/estimates/composite-line-item";
import { EstimateQuantityInput } from "@/app/components/estimate-quantity-input";
import { useEstimatePlannedProfitPercent } from "@/app/components/estimate-planned-profit-context";
import { applyPlannedProfitPercent } from "@/app/lib/estimates/planned-profit";
import {
  EmptyVolumePriceCells,
  VolumeSumCells,
  resolveLaborWorkloadHours,
  resolveLineItemVolumeSum,
} from "@/app/components/estimate-volume-sum-cells";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import {
  hasModuleSizeAttachment,
  resolveLineItemDisplayQuantityFromModuleSize,
  resolveLineItemDisplayUnitFromModuleSize,
} from "@/app/lib/estimates/sync-module-size-quantities";
import { hasDefinedLaborLineItem } from "@/app/lib/positions/has-defined-labor";
import {
  formatQuantityDisplay,
  isVariableQuantityLineItem,
} from "@/app/lib/positions/variable-quantity";
import type {
  EstimateLineItem,
  EstimateMultiPosition,
  PriceBreakdown,
} from "@/app/lib/estimates/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

const readOnlyNum =
  "block px-2 py-1.5 text-right text-sm tabular-nums text-zinc-700";
const cellInput =
  "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm transition focus:border-zinc-300 focus:bg-white focus:outline-none";
const cellNum = `${cellInput} text-right tabular-nums`;
const dropLineClass = "shadow-[inset_0_4px_0_0_rgb(24_24_27)]";
const subcategoryItemNameIndent = "ml-[20px]";
const rowActionCell =
  "border-b border-zinc-100 px-1 py-0.5 text-center align-top";

function updateMultiOptionLineItem(
  multi: EstimateMultiPosition,
  optionId: string,
  lineItem: EstimateLineItem,
): EstimateMultiPosition {
  return {
    ...multi,
    options: multi.options.map((option) =>
      option.id === optionId ? { ...option, lineItem } : option,
    ),
  };
}

type EstimateMultiPositionRowProps = {
  value: EstimateMultiPosition;
  mode: "template" | "offer";
  onChange: (value: EstimateMultiPosition) => void;
  onDelete: () => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  excludedSelectionKeys?: ReadonlySet<string>;
  dragHandle?: ReactNode;
  rowRef?: (element: HTMLTableSectionElement | null) => void;
  rowStyle?: CSSProperties;
  indentName?: boolean;
  showDropLine?: boolean;
  showQuantityColumn?: boolean;
  readOnlyPrices?: boolean;
  highlightStaleCatalogPrices?: boolean;
  highlightMergedSagatave?: boolean;
  optionLinkActions?: MultiOptionLinkActions;
  moduleSizeOptions?: BuildingModuleSizeOption[];
};

function resolveDisplayUnitPrice(
  item: EstimateLineItem | null,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  readOnlyPrices: boolean,
  highlightStaleCatalogPrices: boolean,
  plannedProfitPercent: number,
): PriceBreakdown {
  if (!item) {
    return { labor: 0, materials: 0, mechanisms: 0 };
  }

  let baseUnitPrice: PriceBreakdown;

  if (highlightStaleCatalogPrices) {
    baseUnitPrice = resolveFrozenEstimateDisplayUnitPrice(
      item,
      catalogPositions,
      defaultHourlyRate,
    );
  } else if (readOnlyPrices) {
    baseUnitPrice = resolveLiveDisplayUnitPrice(
      item,
      catalogPositions,
      defaultHourlyRate,
    );
  } else if (isCompositeLineItem(item)) {
    baseUnitPrice = deriveCompositeUnitPrice(
      item,
      catalogPositions,
      defaultHourlyRate,
    );
  } else {
    baseUnitPrice = item.unitPrice;
  }

  // Apply planned profit coefficient to all unit price components.
  return applyPlannedProfitPercent(baseUnitPrice, plannedProfitPercent);
}

function EmptyHeaderMetricCells({
  showQuantityColumn = false,
}: {
  showQuantityColumn?: boolean;
}) {
  return (
    <>
      <td className="border-b border-zinc-100 px-1 py-0.5 align-top" />
      {showQuantityColumn ? (
        <td className="border-b border-zinc-100 px-1 py-0.5 align-top" />
      ) : null}
      {Array.from({ length: UNIT_PRICE_COLUMN_COUNT }).map((_, index) => (
        <td
          key={index}
          className={`border-b border-zinc-100 px-1 py-0.5 align-top ${
            index === UNIT_PRICE_COLUMN_COUNT - 1 ? "bg-zinc-50/60" : ""
          }`}
        />
      ))}
      {showQuantityColumn ? <EmptyVolumePriceCells /> : null}
    </>
  );
}

function MultiOptionSubRow({
  option,
  catalogPositions,
  defaultHourlyRate,
  readOnlyPrices,
  highlightStaleCatalogPrices = false,
  indentName,
  showQuantityColumn,
  linkedOptions,
  linkDragSourceOptionId,
  onLinkDragStart,
  onLinkDragEnd,
  onLinkDrop,
  onUnlink,
  onTimeNormChange,
  moduleSizeOptions = [],
}: {
  option: EstimateMultiPosition["options"][number];
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  readOnlyPrices: boolean;
  highlightStaleCatalogPrices?: boolean;
  indentName: boolean;
  showQuantityColumn: boolean;
  linkedOptions: LinkedOptionSummary[];
  linkDragSourceOptionId: string | null;
  onLinkDragStart?: (optionId: string) => void;
  onLinkDragEnd?: () => void;
  onLinkDrop?: (sourceOptionId: string) => void;
  onUnlink?: (targetOptionId: string) => void;
  onTimeNormChange?: (value: number) => void;
  moduleSizeOptions?: BuildingModuleSizeOption[];
}) {
  const plannedProfitPercent = useEstimatePlannedProfitPercent();
  const [isLinkDropTarget, setIsLinkDropTarget] = useState(false);
  const label =
    option.lineItem.name.trim() ||
    option.lineItem.materials?.[0]?.name ||
    option.lineItem.mechanisms?.[0]?.name ||
    "—";
  const showAttachModuleSize = hasDefinedLaborLineItem(
    option.lineItem,
    catalogPositions,
    defaultHourlyRate,
  );
  const isMaterialsOrMechanisms = isMaterialsOrMechanismsLineItem(
    option.lineItem,
    catalogPositions,
  );
  const missingTimeNorm =
    isCompositeLineItem(option.lineItem) &&
    !((option.lineItem.laborTimeNorm ?? 0) > 0);
  const missingModuleSize =
    moduleSizeOptions.length > 0 &&
    !hasModuleSizeAttachment(option.lineItem) &&
    !isVariableQuantityLineItem(option.lineItem, catalogPositions);
  const moduleSizeUnit =
    !isVariableQuantityLineItem(option.lineItem, catalogPositions)
      ? resolveLineItemDisplayUnitFromModuleSize(option.lineItem, moduleSizeOptions)
      : null;
  const displayUnit = moduleSizeUnit ?? (option.lineItem.unit.trim() || "—");
  const displayPrices = resolveDisplayUnitPrice(
    option.lineItem,
    catalogPositions,
    defaultHourlyRate,
    readOnlyPrices,
    highlightStaleCatalogPrices,
    plannedProfitPercent,
  );
  const staleCatalogPriceHints = highlightStaleCatalogPrices
    ? resolveStaleCatalogPriceHints(
        option.lineItem,
        catalogPositions,
        defaultHourlyRate,
      )
    : undefined;
  const linkable = isLinkableMultiOption(option);
  const canAcceptLinkDrop =
    linkable &&
    linkDragSourceOptionId != null &&
    linkDragSourceOptionId !== option.id &&
    onLinkDrop != null;

  function handleLinkDragOver(event: DragEvent<HTMLTableRowElement>) {
    if (!canAcceptLinkDrop) {
      return;
    }

    if (!event.dataTransfer.types.includes(MULTI_OPTION_LINK_DRAG_MIME)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "link";
    setIsLinkDropTarget(true);
  }

  function handleLinkDragLeave(event: DragEvent<HTMLTableRowElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsLinkDropTarget(false);
  }

  function handleLinkDrop(event: DragEvent<HTMLTableRowElement>) {
    setIsLinkDropTarget(false);

    if (!onLinkDrop) {
      return;
    }

    const sourceId = event.dataTransfer.getData(MULTI_OPTION_LINK_DRAG_MIME);
    if (!sourceId || sourceId === option.id) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onLinkDrop(sourceId);
  }

  const rowBg = isLinkDropTarget
    ? "bg-violet-100/70 ring-1 ring-inset ring-violet-300"
    : missingModuleSize
      ? "bg-red-50/60"
      : missingTimeNorm
        ? "bg-amber-50/60"
        : "bg-violet-50/20";

  return (
    <tr
      className={`align-middle ${rowBg}`}
      onDragOver={handleLinkDragOver}
      onDragLeave={handleLinkDragLeave}
      onDrop={handleLinkDrop}
    >
      <td className="border-b border-zinc-100 py-1 pr-2 align-top">
        <div
          className={`flex items-start gap-1 py-1 pl-[2.35rem] ${indentName ? subcategoryItemNameIndent : ""}`}
        >
          {linkable ? (
            <MultiPositionLinkHandle
              optionId={option.id}
              onDragStart={onLinkDragStart}
              onDragEnd={onLinkDragEnd}
            />
          ) : (
            <span className="inline-block w-5 shrink-0" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5">
              <div className="flex min-w-0 flex-1 flex-col gap-0 leading-snug">
                <div
                  className={`text-sm ${
                    missingModuleSize
                      ? "font-medium text-red-700"
                      : missingTimeNorm
                        ? "text-amber-700 font-medium"
                        : showAttachModuleSize
                          ? "font-semibold text-zinc-700"
                          : "text-zinc-700"
                  }`}
                >
                  {label}
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
                </div>
                {missingModuleSize ? (
                  <span className="text-xs text-red-500">
                    Nav pievienots moduļa apjoms
                  </span>
                ) : null}
                {missingTimeNorm ? (
                  <span className="text-xs text-amber-600">
                    Nav ievadīta Laika norma
                  </span>
                ) : null}
                <AttachedModuleSizeLabel
                  attachment={option.lineItem.moduleSizeAttachment}
                  moduleSizeOptions={moduleSizeOptions}
                />
              </div>
            </div>
            {linkedOptions.length > 0 ? (
              <ul className="mt-0.5 space-y-0.5">
                {linkedOptions.map((linked) => (
                  <li
                    key={linked.optionId}
                    className="flex items-center gap-1.5 text-[11px] text-zinc-400"
                  >
                    <i
                      className="fas fa-link text-[9px] text-violet-400/80"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 truncate">
                      <span className="text-zinc-500">{linked.multiName}</span>
                      <span className="text-zinc-300"> · </span>
                      {linked.optionLabel}
                    </span>
                    {onUnlink ? (
                      <button
                        type="button"
                        onClick={() => onUnlink(linked.optionId)}
                        className="inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded text-zinc-300 transition hover:bg-zinc-100 hover:text-zinc-600"
                        aria-label={`Atvienot no ${linked.optionLabel}`}
                        title="Atvienot"
                      >
                        <i
                          className="fas fa-times text-[9px]"
                          aria-hidden="true"
                        />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </td>
      <td className="border-b border-zinc-100 px-1 py-0.5 align-top">
        <span className={`${readOnlyNum} text-zinc-500`}>
          {displayUnit}
        </span>
      </td>
      {showQuantityColumn ? (
        <td className="border-b border-zinc-100 px-1 py-0.5 align-top">
          <span className={`${readOnlyNum} text-zinc-300`}>—</span>
        </td>
      ) : null}
      <EstimateUnitPriceCells
        item={option.lineItem}
        defaultHourlyRate={defaultHourlyRate}
        values={displayPrices}
        staleCatalogPriceHints={staleCatalogPriceHints}
        onTimeNormChange={onTimeNormChange}
      />
      {showQuantityColumn ? (
        <VolumeSumCells
          values={resolveLineItemVolumeSum(
            option.lineItem.quantity,
            displayPrices,
            isVariableQuantityLineItem(option.lineItem, catalogPositions),
          )}
          staleCatalogPriceHints={staleCatalogPriceHints}
          laborWorkloadHours={resolveLaborWorkloadHours(
            option.lineItem.quantity,
            option.lineItem,
            isVariableQuantityLineItem(option.lineItem, catalogPositions),
          )}
        />
      ) : null}
      <td className={rowActionCell} />
    </tr>
  );
}

export function EstimateMultiPositionRow({
  value,
  mode,
  onChange,
  onDelete,
  catalogPositions,
  defaultHourlyRate,
  excludedSelectionKeys = new Set(),
  dragHandle,
  rowRef,
  rowStyle,
  indentName = false,
  showDropLine = false,
  showQuantityColumn = false,
  readOnlyPrices = true,
  highlightStaleCatalogPrices = false,
  highlightMergedSagatave = false,
  optionLinkActions,
  moduleSizeOptions = [],
}: EstimateMultiPositionRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const plannedProfitPercent = useEstimatePlannedProfitPercent();
  const selectionOptions = getMultiPositionSelectionOptions(
    value,
    excludedSelectionKeys,
  );
  const selectedId =
    value.selectedOptionId ?? MULTI_POSITION_NONE_OPTION_ID;
  const selectedLineItem = resolveSelectedMultiLineItem(value);

  useEffect(() => {
    if (mode !== "offer" || !selectedLineItem) {
      return;
    }

    if (!excludedSelectionKeys.has(getMultiOptionIdentityKey(selectedLineItem))) {
      return;
    }

    onChange({
      ...value,
      selectedOptionId: null,
    });
  }, [excludedSelectionKeys, mode, onChange, selectedLineItem, value]);

  const selectedOption =
    selectedId && selectedId !== MULTI_POSITION_NONE_OPTION_ID
      ? value.options.find((option) => option.id === selectedId)
      : undefined;
  const displayPrices = resolveDisplayUnitPrice(
    selectedLineItem,
    catalogPositions,
    defaultHourlyRate,
    readOnlyPrices,
    highlightStaleCatalogPrices,
    plannedProfitPercent,
  );
  const showQuantityInput =
    selectedLineItem != null &&
    isVariableQuantityLineItem(selectedLineItem, catalogPositions);
  const selectedModuleSizeUnit =
    selectedLineItem != null && !showQuantityInput
      ? resolveLineItemDisplayUnitFromModuleSize(selectedLineItem, moduleSizeOptions)
      : null;
  const selectedDisplayUnit =
    selectedModuleSizeUnit ?? (selectedLineItem?.unit.trim() || "—");
  const attachedQuantity =
    selectedLineItem != null
      ? resolveLineItemDisplayQuantityFromModuleSize(
          selectedLineItem,
          moduleSizeOptions,
        )
      : null;
  const hasAttachedQuantity =
    selectedLineItem != null &&
    !selectedLineItem.variableQuantity &&
    hasModuleSizeAttachment(selectedLineItem) &&
    attachedQuantity != null;
  const effectiveQuantity = attachedQuantity ?? selectedLineItem?.quantity ?? 0;
  const volumeVariable = showQuantityInput || hasAttachedQuantity;
  const volumeSum =
    showQuantityColumn && selectedLineItem
      ? resolveLineItemVolumeSum(
          effectiveQuantity,
          displayPrices,
          volumeVariable,
        )
      : null;
  const laborWorkloadHours =
    showQuantityColumn && selectedLineItem
      ? resolveLaborWorkloadHours(
          effectiveQuantity,
          selectedLineItem,
          volumeVariable,
        )
      : null;
  const selectedStaleCatalogPriceHints =
    highlightStaleCatalogPrices && selectedLineItem
      ? resolveStaleCatalogPriceHints(
          selectedLineItem,
          catalogPositions,
          defaultHourlyRate,
        )
      : undefined;
  const linkedOptions =
    selectedOption && optionLinkActions
      ? optionLinkActions.getLinkedOptions(selectedOption.id)
      : [];

  return (
    <>
      <tbody
        ref={rowRef}
        style={rowStyle}
        className={`group/multi align-middle ${showDropLine ? dropLineClass : ""}`}
      >
        {mode === "offer" ? (
          <tr className={`align-middle ${
            highlightMergedSagatave
              ? "bg-emerald-50/80 hover:bg-emerald-50"
              : showQuantityInput && selectedLineItem && selectedLineItem.quantity <= 0
                ? "bg-red-50/60 hover:bg-red-50"
                : "hover:bg-violet-50/30"
          }`}>
            <td className="border-b border-zinc-100 py-1 pr-2 align-top">
              <div
                className={`flex items-start gap-1 py-1 pl-3 ${indentName ? subcategoryItemNameIndent : ""}`}
              >
                <span className="flex h-7 w-6 shrink-0 items-center justify-center self-center">
                  {dragHandle}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <select
                        className={`${cellInput} cursor-pointer text-zinc-800`}
                        value={selectedId}
                        aria-label="Multi-pozīcijas opcija"
                        onChange={(event) => {
                          const nextId = event.target.value;
                          onChange({
                            ...value,
                            selectedOptionId:
                              nextId === MULTI_POSITION_NONE_OPTION_ID
                                ? null
                                : nextId,
                          });
                        }}
                      >
                        {selectionOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-normal uppercase tracking-wide text-zinc-400">
                          Multi
                        </span>
                        <span className="text-xs font-normal text-zinc-500">
                          {value.name.trim() || "Multi-pozīcija"}
                        </span>
                      </div>
                      {linkedOptions.length > 0 ? (
                        <ul className="mt-1 space-y-0.5">
                          {linkedOptions.map((linked) => (
                            <li
                              key={linked.optionId}
                              className="flex items-center gap-1.5 text-[11px] text-zinc-400"
                            >
                              <i
                                className="fas fa-link text-[9px] text-violet-400/80"
                                aria-hidden="true"
                              />
                              <span className="min-w-0 truncate">
                                <span className="text-zinc-500">
                                  {linked.multiName}
                                </span>
                                <span className="text-zinc-300"> · </span>
                                {linked.optionLabel}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </td>
            <td className="border-b border-zinc-100 px-1 py-0.5 align-top">
              <span className={`${readOnlyNum} text-zinc-500`}>
                {selectedDisplayUnit}
              </span>
            </td>
            {showQuantityColumn ? (
              <td className="border-b border-zinc-100 px-1 py-0.5 align-top">
                {hasAttachedQuantity && selectedLineItem ? (
                  <span className={`${readOnlyNum} text-zinc-700`}>
                    {formatQuantityDisplay(attachedQuantity)}
                  </span>
                ) : showQuantityInput && selectedOption && selectedLineItem ? (
                  <EstimateQuantityInput
                    className={`${cellNum} ${selectedLineItem.quantity <= 0 ? "border-red-300 bg-red-50 text-red-700" : ""}`}
                    value={selectedLineItem.quantity}
                    onChange={(quantity) =>
                      onChange(
                        updateMultiOptionLineItem(value, selectedOption.id, {
                          ...selectedLineItem,
                          quantity,
                        }),
                      )
                    }
                    emptyValue={0}
                  />
                ) : (
                  <span className={`${readOnlyNum} text-zinc-300`}>—</span>
                )}
              </td>
            ) : null}
            <EstimateUnitPriceCells
              item={selectedLineItem}
              defaultHourlyRate={defaultHourlyRate}
              values={displayPrices}
              staleCatalogPriceHints={selectedStaleCatalogPriceHints}
            />
            {showQuantityColumn ? (
              <VolumeSumCells
                values={volumeSum}
                laborWorkloadHours={laborWorkloadHours}
                staleCatalogPriceHints={selectedStaleCatalogPriceHints}
              />
            ) : null}
            <td className={rowActionCell} />
          </tr>
        ) : (
          <>
            <tr className="hover:bg-violet-50/30">
              <td className="border-b border-zinc-100 py-1 pr-2 align-top">
                <div className="flex items-start gap-1 pl-3">
                  <span className="flex h-7 w-6 shrink-0 items-center justify-center self-center">
                    {dragHandle}
                  </span>
                  <span
                    className="inline-block w-5 shrink-0"
                    aria-hidden="true"
                  />
                  <div
                    className={`min-w-0 flex-1 space-y-2 py-1 ${indentName ? subcategoryItemNameIndent : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                            Multi
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditOpen(true)}
                            className="text-left text-sm font-medium text-zinc-900 transition hover:text-violet-700 hover:underline"
                          >
                            {value.name.trim() || "Multi-pozīcija"}
                          </button>
                        </div>
                      </div>
                      <IconActionButton
                        label="Labot multi-pozīciju"
                        icon="fas fa-pen"
                        variant="edit"
                        onClick={() => setEditOpen(true)}
                        className="opacity-0 group-hover/multi:opacity-100"
                      />
                    </div>
                  </div>
                </div>
              </td>
              <EmptyHeaderMetricCells showQuantityColumn={showQuantityColumn} />
              <td className={rowActionCell}>
                <DeleteButton
                  label="Dzēst multi-pozīciju"
                  onClick={onDelete}
                  className="opacity-0 group-hover/multi:opacity-100"
                />
              </td>
            </tr>

            {value.options.map((option) => (
              <MultiOptionSubRow
                key={option.id}
                option={option}
                catalogPositions={catalogPositions}
                defaultHourlyRate={defaultHourlyRate}
                readOnlyPrices={readOnlyPrices}
                highlightStaleCatalogPrices={highlightStaleCatalogPrices}
                indentName={indentName}
                showQuantityColumn={showQuantityColumn}
                linkedOptions={
                  optionLinkActions?.getLinkedOptions(option.id) ?? []
                }
                linkDragSourceOptionId={
                  optionLinkActions?.linkDragSourceOptionId ?? null
                }
                onLinkDragStart={optionLinkActions?.onLinkDragStart}
                onLinkDragEnd={optionLinkActions?.onLinkDragEnd}
                onLinkDrop={
                  optionLinkActions
                    ? (sourceId) =>
                        optionLinkActions.onLinkDrop(sourceId, option.id)
                    : undefined
                }
                onUnlink={
                  optionLinkActions
                    ? (targetId) =>
                        optionLinkActions.onUnlink(option.id, targetId)
                    : undefined
                }
                onTimeNormChange={(laborTimeNorm) =>
                  onChange({
                    ...value,
                    options: value.options.map((o) =>
                      o.id === option.id
                        ? {
                            ...o,
                            lineItem: { ...o.lineItem, laborTimeNorm },
                          }
                        : o,
                    ),
                  })
                }
                moduleSizeOptions={moduleSizeOptions}
              />
            ))}
          </>
        )}
      </tbody>

      {mode === "template" && editOpen ? (
        <MultiPositionModal
          open={editOpen}
          onOpenChange={setEditOpen}
          value={value}
          onSave={onChange}
          catalogPositions={catalogPositions}
          defaultHourlyRate={defaultHourlyRate}
          moduleSizeOptions={moduleSizeOptions}
        />
      ) : null}
    </>
  );
}
