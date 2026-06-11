"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { DragHandle } from "@/app/components/drag-handle";
import { EstimateLineItemNameField } from "@/app/components/estimate-line-item-name-field";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { DeleteButton } from "@/app/components/delete-button";
import {
  applyLineItemCatalogEdit,
  hydrateLineItemWithCatalog,
} from "@/app/lib/positions/sync-from-estimate-line-items";
import { applyCatalogPositionToLineItem } from "@/app/lib/positions/apply-catalog-to-line-item";
import {
  createMultiPositionOption,
  ensureTrailingEmptyMultiOption,
  getExcludedKeysForMultiOptionEdit,
  hasDuplicateMultiOptions,
  isBlankLineItem,
  normalizeMultiPosition,
  wouldDuplicateMultiOption,
} from "@/app/lib/estimates/multi-position";
import type {
  EstimateLineItem,
  EstimateMultiPosition,
  EstimateMultiPositionOption,
} from "@/app/lib/estimates/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

type MultiPositionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: EstimateMultiPosition;
  onSave: (value: EstimateMultiPosition) => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  hydrateCatalogPrices?: boolean;
};

const hydrateCatalogPricesDefault = { forceCatalogPrices: true } as const;
const EMPTY_EXCLUDED_CATALOG_KEYS = new Set<string>();
const MULTI_POSITION_MODAL_DND_CONTEXT_ID = "multi-position-modal-options-dnd";

type SortableMultiOptionBlockProps = {
  option: EstimateMultiPositionOption;
  index: number;
  sortable: boolean;
  canDelete: boolean;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate: number | null;
  excludedCatalogKeys: ReadonlySet<string>;
  hydrateOptions: typeof hydrateCatalogPricesDefault | undefined;
  onDelete: () => void;
  onNameChange: (name: string) => void;
  onNameBlur: (name: string) => void;
  onCatalogSelect: (position: PositionPriceSummary) => void;
};

function SortableMultiOptionBlock({
  option,
  index,
  sortable,
  canDelete,
  catalogPositions,
  defaultHourlyRate,
  excludedCatalogKeys,
  hydrateOptions,
  onDelete,
  onNameChange,
  onNameBlur,
  onCatalogSelect,
}: SortableMultiOptionBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: option.id,
      disabled: !sortable,
    });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {sortable ? (
            <DragHandle
              label="Pārvietot opciju"
              attributes={attributes}
              listeners={listeners}
            />
          ) : null}
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Opcija {index + 1}
          </span>
        </div>
        {canDelete ? (
          <DeleteButton label="Dzēst opciju" onClick={onDelete} />
        ) : null}
      </div>
      <EstimateLineItemNameField
        value={option.lineItem.name}
        catalogPositions={catalogPositions}
        defaultHourlyRate={defaultHourlyRate}
        excludedCatalogKeys={excludedCatalogKeys}
        className="w-full min-h-[2.75rem] resize-none rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm leading-snug whitespace-normal break-words transition [field-sizing:content] focus:border-zinc-300 focus:outline-none"
        onNameChange={onNameChange}
        onNameBlur={onNameBlur}
        onCatalogSelect={onCatalogSelect}
      />
    </div>
  );
}

export function MultiPositionModal({
  open,
  onOpenChange,
  value,
  onSave,
  catalogPositions,
  defaultHourlyRate,
  hydrateCatalogPrices = true,
}: MultiPositionModalProps) {
  const [draft, setDraft] = useState(value);
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    JSON.stringify(normalizeMultiPosition(value)),
  );
  const [duplicateError, setDuplicateError] = useState(false);

  const hydrateOptions = hydrateCatalogPrices
    ? hydrateCatalogPricesDefault
    : undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const excludedCatalogKeysByOptionId = useMemo(() => {
    const entries = draft.options.map((option) => [
      option.id,
      getExcludedKeysForMultiOptionEdit(draft, option.id),
    ] as const);

    return new Map(entries);
  }, [draft]);

  const sortableOptionIds = useMemo(
    () =>
      draft.options
        .filter((option, index) => {
          const isTrailingBlank =
            index === draft.options.length - 1 &&
            isBlankLineItem(option.lineItem);
          return !isTrailingBlank;
        })
        .map((option) => option.id),
    [draft.options],
  );

  const dirty = useMemo(
    () =>
      JSON.stringify(normalizeMultiPosition(draft)) !== initialSnapshot,
    [draft, initialSnapshot],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const normalized = normalizeMultiPosition(value);
    const withTrailingOption = {
      ...normalized,
      options: ensureTrailingEmptyMultiOption(normalized.options),
    };
    setDraft(withTrailingOption);
    setInitialSnapshot(JSON.stringify(normalized));
  }, [open, value]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      const normalized = normalizeMultiPosition(value);
      setDraft({
        ...normalized,
        options: ensureTrailingEmptyMultiOption(normalized.options),
      });
      setInitialSnapshot(JSON.stringify(normalized));
      setDuplicateError(false);
    }
    onOpenChange(nextOpen);
  }

  function applyOptionLineItem(
    optionId: string,
    nextLineItem: EstimateLineItem,
  ) {
    if (wouldDuplicateMultiOption(draft, optionId, nextLineItem)) {
      setDuplicateError(true);
      return;
    }

    setDuplicateError(false);
    setDraft({
      ...draft,
      options: ensureTrailingEmptyMultiOption(
        draft.options.map((entry) =>
          entry.id === optionId ? { ...entry, lineItem: nextLineItem } : entry,
        ),
      ),
    });
  }

  function handleOptionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = draft.options.findIndex((entry) => entry.id === active.id);
    const newIndex = draft.options.findIndex((entry) => entry.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    setDraft({
      ...draft,
      options: ensureTrailingEmptyMultiOption(
        arrayMove(draft.options, oldIndex, newIndex),
      ),
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (hasDuplicateMultiOptions(draft)) {
      setDuplicateError(true);
      return;
    }

    onSave(normalizeMultiPosition(draft));
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Multi-pozīcija"
      description="Definē nosaukumu un vairākas izvēles pozīcijas. Piedāvājumā pēdējā opcija būs Neviena opcija."
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
      dirty={dirty}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Multi-pozīcijas nosaukums
          </span>
          <input
            type="text"
            value={draft.name}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
            placeholder="piem. Fasādes apdare"
            autoFocus
          />
        </label>

        <div className="space-y-3">
          {duplicateError ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Vienā multi-pozīcijā nevar atkārtot vienu un to pašu pozīciju.
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-700">Pozīcijas</p>
            <button
              type="button"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
              onClick={() => {
                setDuplicateError(false);
                setDraft({
                  ...draft,
                  options: [...draft.options, createMultiPositionOption()],
                });
              }}
            >
              + Pozīcija
            </button>
          </div>

          <DndContext
            id={MULTI_POSITION_MODAL_DND_CONTEXT_ID}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleOptionDragEnd}
          >
            <SortableContext
              items={sortableOptionIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {draft.options.map((option, index) => {
                  const isTrailingBlank =
                    index === draft.options.length - 1 &&
                    isBlankLineItem(option.lineItem);
                  const entry = option;

                  return (
                    <SortableMultiOptionBlock
                      key={option.id}
                      option={option}
                      index={index}
                      sortable={
                        !isTrailingBlank && sortableOptionIds.length > 1
                      }
                      canDelete={draft.options.length > 1}
                      catalogPositions={catalogPositions}
                      defaultHourlyRate={defaultHourlyRate}
                      excludedCatalogKeys={
                        excludedCatalogKeysByOptionId.get(option.id) ??
                        EMPTY_EXCLUDED_CATALOG_KEYS
                      }
                      hydrateOptions={hydrateOptions}
                      onDelete={() =>
                        setDraft({
                          ...draft,
                          options: ensureTrailingEmptyMultiOption(
                            draft.options.filter(
                              (candidate) => candidate.id !== option.id,
                            ),
                          ),
                        })
                      }
                      onNameChange={(name) => {
                        applyOptionLineItem(
                          option.id,
                          applyLineItemCatalogEdit(
                            entry.lineItem,
                            { name },
                            catalogPositions,
                          ),
                        );
                      }}
                      onNameBlur={(name) => {
                        const linked = applyLineItemCatalogEdit(
                          entry.lineItem,
                          { name },
                          catalogPositions,
                        );
                        const withPrices = hydrateLineItemWithCatalog(
                          linked,
                          catalogPositions,
                          defaultHourlyRate,
                          hydrateOptions,
                        );

                        applyOptionLineItem(option.id, withPrices);
                      }}
                      onCatalogSelect={(position) => {
                        applyOptionLineItem(
                          option.id,
                          applyCatalogPositionToLineItem(
                            entry.lineItem,
                            position,
                            defaultHourlyRate,
                          ),
                        );
                      }}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <ModalFormActions onCancel={() => handleOpenChange(false)}>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Saglabāt
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
