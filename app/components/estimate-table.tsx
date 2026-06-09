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
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  formatAmount,
  multiplyBreakdown,
  sumBreakdown,
} from "@/app/lib/estimates/calculate-line";
import {
  createCategory,
  createLineItem,
  createSubcategory,
} from "@/app/lib/estimates/create-empty";
import { formatMoney } from "@/app/lib/estimates/format-money";
import {
  createSampleCategories,
  SAMPLE_META,
  SAMPLE_TITLE,
} from "@/app/lib/estimates/sample-data";
import { ESTIMATE_UNITS } from "@/app/lib/estimates/units";
import { DeleteButton } from "@/app/components/delete-button";
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
import type {
  EstimateCategory,
  EstimateLineItem,
  EstimateSubcategory,
  PriceBreakdown,
} from "@/app/lib/estimates/types";
import type { EstimateMeta } from "@/app/lib/projects/types";

const FULL_COL_COUNT = 12;

const cellInput =
  "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm transition focus:border-zinc-300 focus:bg-white focus:outline-none";
const nameInput =
  "w-full min-h-[2.75rem] resize-y rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm leading-snug whitespace-normal break-words transition [field-sizing:content] focus:border-zinc-300 focus:bg-white focus:outline-none";
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
            <span className={readOnlyNum}>{formatAmount(values[field])}</span>
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
        <span className={`${readOnlyNum} font-medium text-zinc-900`}>
          {formatAmount(total)}
        </span>
      </td>
    </>
  );
}

function LineItemRow({
  item,
  onChange,
  onDelete,
  dragHandle,
  rowRef,
  rowStyle,
  indentName,
  showDropLine,
}: {
  item: EstimateLineItem;
  onChange: (item: EstimateLineItem) => void;
  onDelete: () => void;
  dragHandle?: ReactNode;
  rowRef?: (element: HTMLTableRowElement | null) => void;
  rowStyle?: CSSProperties;
  indentName?: boolean;
  showDropLine?: boolean;
}) {
  const volume = multiplyBreakdown(item.quantity, item.unitPrice);

  return (
    <tr
      ref={rowRef}
      style={rowStyle}
      className={`group align-middle hover:bg-sky-50/40 ${showDropLine ? dropLineClass : ""}`}
    >
      <td className={nameCell}>
        <div className={`flex items-center gap-1 ${rowLead}`}>
          <span className={dragHandleColumn}>{dragHandle}</span>
          <textarea
            rows={2}
            className={`${nameInput} min-w-0 flex-1 ${indentName ? subcategoryItemNameIndent : ""}`}
            value={item.name}
            placeholder="Pozīcijas nosaukums"
            onChange={(event) => onChange({ ...item, name: event.target.value })}
          />
        </div>
      </td>
      <td className="border-b border-zinc-100 px-1 py-0.5 align-top">
        <select
          className={`${cellInput} cursor-pointer`}
          value={item.unit}
          onChange={(event) => onChange({ ...item, unit: event.target.value })}
        >
          {ESTIMATE_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </td>
      <td className="border-b border-zinc-100 px-1 py-0.5 align-top">
        <input
          type="number"
          min={0}
          step="any"
          className={cellNum}
          value={item.quantity}
          onChange={(event) =>
            onChange({ ...item, quantity: parseFloat(event.target.value) || 0 })
          }
        />
      </td>
      <PriceCells
        values={item.unitPrice}
        onChange={(field, value) =>
          onChange({
            ...item,
            unitPrice: { ...item.unitPrice, [field]: value },
          })
        }
      />
      <PriceCells values={volume} readOnly />
      <td className="border-b border-zinc-100 px-1 py-0.5 text-center align-top">
        <DeleteButton
          label="Dzēst pozīciju"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100"
        />
      </td>
    </tr>
  );
}

const actionBtn =
  "inline-flex h-7 items-center rounded-md px-2 text-xs text-zinc-500 transition hover:bg-white hover:text-zinc-800";

function RowActions({
  onAddSub,
  onAddItem,
  onDelete,
  deleteLabel,
  showSub = true,
}: {
  onAddSub?: () => void;
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
      <button type="button" className={actionBtn} onClick={onAddItem}>
        + Pozīcija
      </button>
      <DeleteButton label={deleteLabel} onClick={onDelete} />
    </div>
  );
}

function SortableLineItemRow({
  sortId,
  subcategoryId,
  ...props
}: {
  sortId: string;
  categoryId: string;
  subcategoryId?: string;
  item: EstimateLineItem;
  onChange: (item: EstimateLineItem) => void;
  onDelete: () => void;
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
}: {
  kind: "category" | "subcategory";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  actions: ReactNode;
  dragHandle?: ReactNode;
  rowRef?: (element: HTMLTableRowElement | null) => void;
  rowStyle?: CSSProperties;
  showDropLine?: boolean;
}) {
  const isCategory = kind === "category";
  const topBorderClass = showDropLine
    ? "border-t-4 border-t-zinc-900"
    : isCategory
      ? ""
      : "border-t border-t-zinc-300";

  return (
    <tr
      ref={rowRef}
      style={rowStyle}
      className={isCategory ? "category-row" : "subcategory-row"}
    >
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
  categoryId,
  subcategory,
  onChange,
  onDelete,
}: {
  categoryId: string;
  subcategory: EstimateSubcategory;
  onChange: (subcategory: EstimateSubcategory) => void;
  onDelete: () => void;
}) {
  return (
    <>
      <SortableSectionRow
        sortId={subcategoryDragId(subcategory.id)}
        dragLabel="Pārvietot subkategoriju"
        kind="subcategory"
        placeholder="Subkategorijas nosaukums"
        value={subcategory.title}
        onChange={(title) => onChange({ ...subcategory, title })}
        actions={
          <RowActions
            showSub={false}
            deleteLabel="Dzēst subkategoriju"
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
      {subcategory.items.map((item) => (
        <SortableLineItemRow
          key={item.id}
          sortId={itemDragId(item.id)}
          categoryId={categoryId}
          subcategoryId={subcategory.id}
          item={item}
          onChange={(next) =>
            onChange({
              ...subcategory,
              items: subcategory.items.map((entry) =>
                entry.id === item.id ? next : entry,
              ),
            })
          }
          onDelete={() =>
            onChange({
              ...subcategory,
              items: subcategory.items.filter((entry) => entry.id !== item.id),
            })
          }
        />
      ))}
    </>
  );
}

function CategoryBlock({
  category,
  onChange,
  onDelete,
}: {
  category: EstimateCategory;
  onChange: (category: EstimateCategory) => void;
  onDelete: () => void;
}) {
  return (
    <>
      <SortableSectionRow
        sortId={categoryDragId(category.id)}
        dragLabel="Pārvietot kategoriju"
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

      {category.items.map((item) => (
        <SortableLineItemRow
          key={item.id}
          sortId={itemDragId(item.id)}
          categoryId={category.id}
          item={item}
          onChange={(next) =>
            onChange({
              ...category,
              items: category.items.map((entry) =>
                entry.id === item.id ? next : entry,
              ),
            })
          }
          onDelete={() =>
            onChange({
              ...category,
              items: category.items.filter((entry) => entry.id !== item.id),
            })
          }
        />
      ))}
    </>
  );
}

function collectAllItems(categories: EstimateCategory[]): EstimateLineItem[] {
  return categories.flatMap((category) => [
    ...category.items,
    ...category.subcategories.flatMap((sub) => sub.items),
  ]);
}

function EstimateDndTable({
  categories,
  allDragIds,
  setCategories,
  totals,
}: {
  categories: EstimateCategory[];
  allDragIds: string[];
  setCategories: Dispatch<SetStateAction<EstimateCategory[]>>;
  totals: {
    labor: number;
    materials: number;
    mechanisms: number;
    grand: number;
  };
}) {
  return (
    <DropIndicatorProvider>
      <EstimateDndTableInner
        categories={categories}
        allDragIds={allDragIds}
        setCategories={setCategories}
        totals={totals}
      />
    </DropIndicatorProvider>
  );
}

function EstimateDndTableInner({
  categories,
  allDragIds,
  setCategories,
  totals,
}: {
  categories: EstimateCategory[];
  allDragIds: string[];
  setCategories: Dispatch<SetStateAction<EstimateCategory[]>>;
  totals: {
    labor: number;
    materials: number;
    mechanisms: number;
    grand: number;
  };
}) {
  const { setActiveId, setOverId, clear } = useDropIndicatorActions();

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
          <col style={{ width: "30%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "5%" }} />
          {Array.from({ length: 8 }).map((_, index) => (
            <col key={index} style={{ width: "7%" }} />
          ))}
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
            <th rowSpan={2} className="border-b border-r border-zinc-200 px-2 py-2.5 text-center">
              Daudz.
            </th>
            <th
              colSpan={4}
              className="border-b border-r border-zinc-200 bg-sky-50/80 px-2 py-2 text-center text-sky-800/70"
            >
              Vienības cena
            </th>
            <th
              colSpan={4}
              className="border-b border-r border-zinc-200 bg-emerald-50/80 px-2 py-2 text-center text-emerald-800/70"
            >
              Apjoma summa
            </th>
            <th rowSpan={2} className="border-b border-zinc-200" />
          </tr>
          <tr className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            {["Darbs", "Materiāls", "Mehānismi", "Kopā", "Darbs", "Materiāls", "Mehānismi", "Kopā"].map(
              (label, index) => (
                <th
                  key={`${label}-${index}`}
                  className={`border-b border-r border-zinc-200 px-2 py-1.5 text-right ${
                    index < 4 ? "bg-sky-50/40" : "bg-emerald-50/40"
                  }`}
                >
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          <SortableContext
            items={allDragIds}
            strategy={verticalListSortingStrategy}
          >
            {categories.map((category) => (
              <CategoryBlock
                key={category.id}
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
        </tbody>
        <tfoot>
          <tr className="bg-zinc-100/90">
            <td
              colSpan={3}
              className="border-t-2 border-zinc-300 px-3 py-2.5 text-right text-sm font-semibold text-zinc-600"
            >
              Kopā
            </td>
            <td colSpan={4} className="border-t-2 border-r border-zinc-300 bg-sky-50/30" />
            <td className={`${footerCell} bg-emerald-50/50`}>
              {formatMoney(totals.labor)}
            </td>
            <td className={`${footerCell} bg-emerald-50/50`}>
              {formatMoney(totals.materials)}
            </td>
            <td className={`${footerCell} bg-emerald-50/50`}>
              {formatMoney(totals.mechanisms)}
            </td>
            <td className={`${footerCell} bg-emerald-100/60 text-base`}>
              {formatMoney(totals.grand)}
            </td>
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
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border-0 border-b border-zinc-200 bg-transparent pb-1.5 text-sm text-zinc-800 transition focus:border-zinc-400 focus:outline-none"
      />
    </label>
  );
}

type EstimateTableProps = {
  initialTitle?: string;
  initialMeta?: EstimateMeta;
  initialCategories?: EstimateCategory[];
};

export function EstimateTable({
  initialTitle = SAMPLE_TITLE,
  initialMeta = SAMPLE_META,
  initialCategories = createSampleCategories(),
}: EstimateTableProps = {}) {
  const [title, setTitle] = useState(initialTitle);
  const [meta, setMeta] = useState(initialMeta);
  const [categories, setCategories] = useState<EstimateCategory[]>(
    initialCategories,
  );

  const totals = useMemo(() => {
    const items = collectAllItems(categories);
    let labor = 0;
    let materials = 0;
    let mechanisms = 0;

    for (const item of items) {
      const volume = multiplyBreakdown(item.quantity, item.unitPrice);
      labor += volume.labor;
      materials += volume.materials;
      mechanisms += volume.mechanisms;
    }

    return { labor, materials, mechanisms, grand: labor + materials + mechanisms };
  }, [categories]);

  const positionCount = collectAllItems(categories).length;

  const allDragIds = useMemo(
    () => collectAllDragIds(categories),
    [categories],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm max-w-full">
      {/* Header */}
      <div className="border-b border-zinc-100 px-6 py-5">
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
          <span className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-600">
            {meta.number}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <MetaField
            label="Klients"
            value={meta.client}
            onChange={(client) => setMeta({ ...meta, client })}
          />
          <MetaField
            label="Objekts"
            value={meta.project}
            onChange={(project) => setMeta({ ...meta, project })}
          />
          <MetaField
            label="Sagatavotājs"
            value={meta.author}
            onChange={(author) => setMeta({ ...meta, author })}
          />
          <MetaField
            label="Datums"
            type="date"
            value={meta.date}
            onChange={(date) => setMeta({ ...meta, date })}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/50 px-4 py-2.5">
        <p className="text-xs text-zinc-500">
          {positionCount} pozīcijas · {categories.length} kategorijas
        </p>
        <button
          type="button"
          onClick={() => setCategories([...categories, createCategory()])}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
        >
          + Kategorija
        </button>
      </div>

      {/* Table — DndContext wraps <table>, not inside it (valid HTML) */}
      <div className="max-h-[calc(100vh-18rem)] overflow-x-hidden overflow-y-auto">
        <EstimateDndTable
          categories={categories}
          allDragIds={allDragIds}
          setCategories={setCategories}
          totals={totals}
        />
      </div>
    </div>
  );
}
