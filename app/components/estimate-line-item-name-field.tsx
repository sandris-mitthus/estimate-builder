"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { PriceBreakdown } from "@/app/lib/estimates/types";
import { formatMoney } from "@/app/lib/estimates/format-money";
import {
  getCatalogHintPrice,
  isMaterialsOrMechanismsCostType,
} from "@/app/lib/positions/apply-catalog-to-line-item";
import {
  filterPositionsByQuery,
  sortPositionsByName,
} from "@/app/lib/positions/filter-positions";
import { PositionVariableQuantityIcon } from "@/app/components/position-variable-quantity-icon";
import { useTranslations } from "@/app/components/translations-provider";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

type DropdownRect = {
  top: number;
  left: number;
  width: number;
};

type EstimateLineItemNameFieldProps = {
  value: string;
  onNameChange: (name: string) => void;
  onNameBlur?: (name: string) => void;
  onCatalogSelect: (position: PositionPriceSummary) => void;
  catalogPositions: PositionPriceSummary[];
  defaultHourlyRate?: number | null;
  currency?: string | null;
  excludedCatalogKeys?: ReadonlySet<string>;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  /** Saturs tieši zem nosaukuma (piem. piesaistītais moduļa lielums). */
  footer?: ReactNode;
};

const EMPTY_EXCLUDED_CATALOG_KEYS = new Set<string>();

function filterCatalogPositionsByExcludedKeys(
  positions: PositionPriceSummary[],
  excludedCatalogKeys: ReadonlySet<string>,
): PositionPriceSummary[] {
  if (excludedCatalogKeys.size === 0) {
    return positions;
  }

  return positions.filter(
    (position) => !excludedCatalogKeys.has(`catalog:${position.id}`),
  );
}

function excludedCatalogKeysFingerprint(
  excludedCatalogKeys: ReadonlySet<string>,
): string {
  if (excludedCatalogKeys.size === 0) {
    return "";
  }

  return Array.from(excludedCatalogKeys).sort().join("\0");
}

export function EstimateLineItemNameField({
  value,
  onNameChange,
  onNameBlur,
  onCatalogSelect,
  catalogPositions,
  defaultHourlyRate = null,
  currency = null,
  excludedCatalogKeys = EMPTY_EXCLUDED_CATALOG_KEYS,
  className,
  placeholder,
  readOnly = false,
  footer,
}: EstimateLineItemNameFieldProps) {
  const { t } = useTranslations();
  const resolvedPlaceholder = placeholder ?? t("positions.search_catalog_placeholder", "Meklēt pozīciju katalogā");
  const compact = footer != null;
  const excludedKeysFingerprint = excludedCatalogKeysFingerprint(
    excludedCatalogKeys,
  );
  const availableCatalogPositions = useMemo(
    () =>
      filterCatalogPositionsByExcludedKeys(
        catalogPositions,
        excludedCatalogKeys,
      ),
    // excludedCatalogKeys content is captured by excludedKeysFingerprint
    [catalogPositions, excludedKeysFingerprint],
  );
  const sortedAvailableCatalogPositions = useMemo(
    () => sortPositionsByName(availableCatalogPositions),
    [availableCatalogPositions],
  );
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const suggestions = useMemo(
    () =>
      filterPositionsByQuery(sortedAvailableCatalogPositions, value, t).slice(
        0,
        30,
      ),
    [sortedAvailableCatalogPositions, value, t],
  );

  function updateDropdownRect() {
    const input = inputRef.current;
    if (!input) return;

    const rect = input.getBoundingClientRect();
    const next = {
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 280),
    };

    setDropdownRect((current) => {
      if (
        current &&
        current.top === next.top &&
        current.left === next.left &&
        current.width === next.width
      ) {
        return current;
      }

      return next;
    });
  }

  useLayoutEffect(() => {
    if (!open) {
      setDropdownRect((current) => (current === null ? current : null));
      return;
    }

    updateDropdownRect();

    window.addEventListener("resize", updateDropdownRect);
    window.addEventListener("scroll", updateDropdownRect, true);

    return () => {
      window.removeEventListener("resize", updateDropdownRect);
      window.removeEventListener("scroll", updateDropdownRect, true);
    };
  }, [open, value]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value, sortedAvailableCatalogPositions]);

  function updateSuggestionsVisibility(nextValue: string) {
    setOpen(
      filterPositionsByQuery(sortedAvailableCatalogPositions, nextValue, t)
        .length > 0,
    );
  }

  function handleInputChange(nextValue: string) {
    onNameChange(nextValue);
    updateSuggestionsVisibility(nextValue);
  }

  function selectSuggestion(position: PositionPriceSummary) {
    onCatalogSelect(position);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        current >= suggestions.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const dropdown =
    open && suggestions.length > 0 && dropdownRect ? (
      <ul
        ref={dropdownRef}
        id={listboxId}
        role="listbox"
        data-app-modal-ignore-backdrop
        style={{
          position: "fixed",
          top: dropdownRect.top,
          left: dropdownRect.left,
          width: dropdownRect.width,
        }}
        className="z-[10000] max-h-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
      >
        {suggestions.map((position, index) => (
          <li key={position.id} role="option" aria-selected={index === activeIndex}>
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                selectSuggestion(position);
              }}
              className={`flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-zinc-50 ${
                index === activeIndex ? "bg-zinc-50" : ""
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="inline-flex max-w-full items-center gap-1.5">
                  <span className="truncate text-zinc-900">{position.name}</span>
                  <PositionVariableQuantityIcon
                    enabled={position.variableQuantity}
                  />
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
                  <span>{position.unit}</span>
                  {isMaterialsOrMechanismsCostType(position.costType) ? (
                    <span className="font-medium tabular-nums text-zinc-700">
                      {getCatalogHintPrice(position, defaultHourlyRate) != null
                        ? formatMoney(
                            getCatalogHintPrice(position, defaultHourlyRate) ?? 0,
                            currency,
                          )
                        : "—"}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  if (readOnly) {
    return (
      <div
        className={`min-w-0 flex-1 text-sm leading-snug text-zinc-800 ${className ?? ""}`}
      >
        <div>{value.trim() || "—"}</div>
        {footer}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="min-w-0 flex-1">
      <textarea
        ref={inputRef}
        rows={compact ? 1 : 2}
        value={value}
        placeholder={resolvedPlaceholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        onChange={(event) => handleInputChange(event.target.value)}
        onBlur={(event) => onNameBlur?.(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (sortedAvailableCatalogPositions.length > 0 && suggestions.length > 0) {
            setOpen(true);
          }
        }}
        className={
          compact
            ? `${className ?? ""} !min-h-0 py-1`.trim()
            : className
        }
      />
      {footer}
      {portalReady && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
