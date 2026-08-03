"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/app/components/translations-provider";
import {
  resolveEffectiveMaterials,
  resolveEffectiveMechanisms,
} from "@/app/lib/estimates/composite-line-item";
import {
  filterPositionTemplatesByQuery,
  resolvePositionTemplateName,
} from "@/app/lib/estimates/position-templates";
import type { EstimateLineItem } from "@/app/lib/estimates/types";

type DropdownRect = {
  top: number;
  left: number;
  width: number;
};

type PositionTemplateNameFieldProps = {
  value: string;
  onNameChange: (name: string) => void;
  onTemplateSelect: (template: EstimateLineItem) => void;
  templates: EstimateLineItem[];
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
};

export function PositionTemplateNameField({
  value,
  onNameChange,
  onTemplateSelect,
  templates,
  className,
  placeholder,
  autoFocus = false,
}: PositionTemplateNameFieldProps) {
  const { t } = useTranslations();
  const resolvedPlaceholder =
    placeholder ??
    t(
      "positions.modal.name_search_placeholder",
      "Meklēt sagataves pozīciju vai ievadīt jaunu",
    );
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const suggestions = useMemo(
    () => filterPositionTemplatesByQuery(templates, value).slice(0, 30),
    [templates, value],
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
  }, [value, templates]);

  function handleInputChange(nextValue: string) {
    onNameChange(nextValue);
    setOpen(nextValue.trim().length > 0);
  }

  function selectSuggestion(template: EstimateLineItem) {
    onTemplateSelect(template);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
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
        {suggestions.map((template, index) => {
          const name = resolvePositionTemplateName(template);
          const materialCount = resolveEffectiveMaterials(template).length;
          const mechanismCount = resolveEffectiveMechanisms(template).length;

          return (
            <li
              key={template.id}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectSuggestion(template);
                }}
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-zinc-50 ${
                  index === activeIndex ? "bg-zinc-50" : ""
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="truncate text-zinc-900">{name}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
                    {template.unit.trim() ? <span>{template.unit}</span> : null}
                    {materialCount > 0 ? (
                      <span>
                        {t("estimate.column.materials", "Materiāli")}:{" "}
                        {materialCount}
                      </span>
                    ) : null}
                    {mechanismCount > 0 ? (
                      <span>
                        {t("estimate.column.mechanisms", "Mehānismi")}:{" "}
                        {mechanismCount}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div ref={rootRef} className="min-w-0 flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        autoFocus={autoFocus}
        placeholder={resolvedPlaceholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        className={className}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => {
          if (value.trim()) {
            setOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
      />
      {portalReady && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
