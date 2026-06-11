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
import { DeleteButton } from "@/app/components/delete-button";
import { IconActionButton } from "@/app/components/icon-action-button";
import { formatAmount, sumBreakdown } from "@/app/lib/estimates/calculate-line";
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
import { findCatalogPositionForLineItem } from "@/app/lib/positions/sync-from-estimate-line-items";
import type {
  EstimateLineItem,
  EstimateMultiPosition,
  PriceBreakdown,
} from "@/app/lib/estimates/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

const readOnlyNum =
  "block px-2 py-1.5 text-right text-sm tabular-nums text-zinc-700";
const priceCell = "border-b border-zinc-100 px-1 py-0.5 align-top";
const priceCellTotal = `${priceCell} bg-zinc-50/60`;
const dropLineClass = "shadow-[inset_0_4px_0_0_rgb(24_24_27)]";
const subcategoryItemNameIndent = "ml-[20px]";

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
          <span className={readOnlyNum}>{formatAmount(values[field])}</span>
        </td>
      ))}
      <td className={priceCellTotal}>
        <span className={`${readOnlyNum} font-medium text-zinc-900`}>
          {formatAmount(total)}
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
}) {
  const [isLinkDropTarget, setIsLinkDropTarget] = useState(false);
  const label = option.lineItem.name.trim() || "—";
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
            <div className="text-sm text-zinc-700">{label}</div>
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
      <td className="border-b border-zinc-100 px-1 py-0.5" />
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

  return (
    <>
      <tbody
        ref={rowRef}
        style={rowStyle}
        className={`group/multi align-middle ${showDropLine ? dropLineClass : ""}`}
      >
        <tr className="hover:bg-violet-50/30">
          <td className="border-b border-zinc-100 py-1 pr-2 align-top">
            <div className="flex items-start gap-1 pl-3">
              <span className="flex h-7 w-6 shrink-0 items-center justify-center self-center">
                {dragHandle}
              </span>
              <span className="inline-block w-5 shrink-0" aria-hidden="true" />
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
                    {mode === "offer" ? (
                      <fieldset>
                        <legend className="sr-only">Izvēlēties opciju</legend>
                        <div
                          role="radiogroup"
                          aria-label="Multi-pozīcijas izvēle"
                          className="space-y-1"
                        >
                          {selectionOptions.map((option) => {
                            const inputId = `${value.id}-${option.id}`;
                            const isSelected = selectedId === option.id;

                            return (
                              <label
                                key={option.id}
                                htmlFor={inputId}
                                className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm transition ${
                                  isSelected
                                    ? "bg-violet-100 text-violet-900"
                                    : "text-zinc-700 hover:bg-zinc-50"
                                }`}
                              >
                                <input
                                  id={inputId}
                                  type="radio"
                                  name={value.id}
                                  checked={isSelected}
                                  onChange={() =>
                                    onChange({
                                      ...value,
                                      selectedOptionId:
                                        option.id ===
                                        MULTI_POSITION_NONE_OPTION_ID
                                          ? null
                                          : option.id,
                                    })
                                  }
                                  className="shrink-0"
                                />
                                <span>{option.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    ) : null}
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
          <td className="border-b border-zinc-100 px-1 py-0.5 text-center align-top">
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
                ? (targetId) => optionLinkActions.onUnlink(option.id, targetId)
                : undefined
            }
          />
        ))}
      </tbody>

      {editOpen ? (
        <MultiPositionModal
          open={editOpen}
          onOpenChange={setEditOpen}
          value={value}
          onSave={onChange}
          catalogPositions={catalogPositions}
          defaultHourlyRate={defaultHourlyRate}
          hydrateCatalogPrices={mode === "template"}
        />
      ) : null}
    </>
  );
}
