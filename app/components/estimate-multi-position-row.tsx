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
import { AttachModuleSizeButton } from "@/app/components/attach-module-size-button";
import { DeleteButton } from "@/app/components/delete-button";
import { IconActionButton } from "@/app/components/icon-action-button";
import {
  formatAmountDisplay,
  isAmountDisplayEmpty,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
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
  findCatalogPositionForLineItem,
  isMaterialsOrMechanismsLineItem,
} from "@/app/lib/positions/sync-from-estimate-line-items";
import { EstimateQuantityInput } from "@/app/components/estimate-quantity-input";
import {
  VolumeSumCells,
  resolveLineItemVolumeSum,
} from "@/app/components/estimate-volume-sum-cells";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import {
  hasModuleSizeAttachment,
  resolveLineItemDisplayQuantityFromModuleSize,
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
const priceCell = "border-b border-zinc-100 px-1 py-0.5 align-top";
const priceCellTotal = `${priceCell} bg-zinc-50/60`;
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
  optionLinkActions?: MultiOptionLinkActions;
  moduleSizeOptions?: BuildingModuleSizeOption[];
};

function resolveDisplayUnitPrice(
  item: EstimateLineItem | null,
  catalogPositions: PositionPriceSummary[],
  defaultHourlyRate: number | null,
  readOnlyPrices: boolean,
): PriceBreakdown {
  if (!item) {
    return { labor: 0, materials: 0, mechanisms: 0 };
  }

  if (readOnlyPrices) {
    const position = findCatalogPositionForLineItem(item, catalogPositions);
    if (position) {
      return buildUnitPriceForCatalogPosition(position, defaultHourlyRate);
    }
  }

  return item.unitPrice;
}

function PriceCells({ values }: { values: PriceBreakdown }) {
  const total = sumBreakdown(values);

  return (
    <>
      {(["labor", "materials", "mechanisms"] as const).map((field) => (
        <td key={field} className={priceCell}>
          <span
            className={`${readOnlyNum} ${
              isAmountDisplayEmpty(values[field]) ? "text-zinc-300" : ""
            }`}
          >
            {formatAmountDisplay(values[field])}
          </span>
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
      {Array.from({ length: 4 }).map((_, index) => (
        <td
          key={index}
          className={`border-b border-zinc-100 px-1 py-0.5 align-top ${
            index === 3 ? "bg-zinc-50/60" : ""
          }`}
        />
      ))}
      {showQuantityColumn
        ? Array.from({ length: 4 }).map((_, index) => (
            <td
              key={`volume-${index}`}
              className={`border-b border-zinc-100 px-1 py-0.5 align-top ${
                index === 3 ? "bg-emerald-50/50" : "bg-emerald-50/25"
              }`}
            />
          ))
        : null}
    </>
  );
}

function MultiOptionSubRow({
  option,
  catalogPositions,
  defaultHourlyRate,
  readOnlyPrices,
  indentName,
  showQuantityColumn,
  linkedOptions,
  linkDragSourceOptionId,
  onLinkDragStart,
  onLinkDragEnd,
  onLinkDrop,
  onUnlink,
  moduleSizeOptions = [],
}: {
  option: EstimateMultiPosition["options"][number];
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  readOnlyPrices: boolean;
  indentName: boolean;
  showQuantityColumn: boolean;
  linkedOptions: LinkedOptionSummary[];
  linkDragSourceOptionId: string | null;
  onLinkDragStart?: (optionId: string) => void;
  onLinkDragEnd?: () => void;
  onLinkDrop?: (sourceOptionId: string) => void;
  onUnlink?: (targetOptionId: string) => void;
  moduleSizeOptions?: BuildingModuleSizeOption[];
}) {
  const [isLinkDropTarget, setIsLinkDropTarget] = useState(false);
  const label = option.lineItem.name.trim() || "—";
  const showAttachModuleSize = hasDefinedLaborLineItem(
    option.lineItem,
    catalogPositions,
    defaultHourlyRate,
  );
  const isMaterialsOrMechanisms = isMaterialsOrMechanismsLineItem(
    option.lineItem,
    catalogPositions,
  );
  const displayPrices = resolveDisplayUnitPrice(
    option.lineItem,
    catalogPositions,
    defaultHourlyRate,
    readOnlyPrices,
  );
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

  return (
    <tr
      className={`align-middle bg-violet-50/20 ${
        isLinkDropTarget ? "bg-violet-100/70 ring-1 ring-inset ring-violet-300" : ""
      }`}
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
              <div className="min-w-0 flex-1 leading-snug">
                <div
                  className={`text-sm text-zinc-700 ${showAttachModuleSize ? "font-semibold" : ""} ${isMaterialsOrMechanisms ? "text-right" : ""}`}
                >
                  {label}
                </div>
                <AttachedModuleSizeLabel
                  attachment={option.lineItem.moduleSizeAttachment}
                  moduleSizeOptions={moduleSizeOptions}
                />
              </div>
              <AttachModuleSizeButton
                enabled={showAttachModuleSize}
                lineItemId={option.lineItem.id}
                positionName={option.lineItem.name}
              />
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
          {option.lineItem.unit.trim() || "—"}
        </span>
      </td>
      {showQuantityColumn ? (
        <td className="border-b border-zinc-100 px-1 py-0.5 align-top">
          <span className={`${readOnlyNum} text-zinc-300`}>—</span>
        </td>
      ) : null}
      <PriceCells values={displayPrices} />
      {showQuantityColumn ? (
        <VolumeSumCells
          values={resolveLineItemVolumeSum(
            option.lineItem.quantity,
            displayPrices,
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
  optionLinkActions,
  moduleSizeOptions = [],
}: EstimateMultiPositionRowProps) {
  const [editOpen, setEditOpen] = useState(false);
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
  );
  const showQuantityInput =
    selectedLineItem != null &&
    isVariableQuantityLineItem(selectedLineItem, catalogPositions);
  const attachedQuantity =
    selectedLineItem != null
      ? resolveLineItemDisplayQuantityFromModuleSize(
          selectedLineItem,
          moduleSizeOptions,
        )
      : null;
  const hasAttachedQuantity =
    selectedLineItem != null &&
    hasModuleSizeAttachment(selectedLineItem) &&
    attachedQuantity != null;
  const effectiveQuantity = attachedQuantity ?? selectedLineItem?.quantity ?? 0;
  const volumeSum =
    showQuantityColumn && selectedLineItem
      ? resolveLineItemVolumeSum(
          effectiveQuantity,
          displayPrices,
          showQuantityInput || hasAttachedQuantity,
        )
      : null;
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
          <tr className="align-middle hover:bg-violet-50/30">
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
                {selectedLineItem?.unit.trim() || "—"}
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
                    className={cellNum}
                    value={selectedLineItem.quantity}
                    onChange={(quantity) =>
                      onChange(
                        updateMultiOptionLineItem(value, selectedOption.id, {
                          ...selectedLineItem,
                          quantity,
                        }),
                      )
                    }
                  />
                ) : (
                  <span className={`${readOnlyNum} text-zinc-300`}>—</span>
                )}
              </td>
            ) : null}
            <PriceCells values={displayPrices} />
            {showQuantityColumn ? <VolumeSumCells values={volumeSum} /> : null}
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
          hydrateCatalogPrices
          lockCatalogIdentity={false}
        />
      ) : null}
    </>
  );
}
