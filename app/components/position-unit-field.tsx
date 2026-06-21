"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/app/components/translations-provider";
import { filterUnitSuggestions } from "@/app/lib/positions/collect-known-units";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";

type PositionUnitFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  knownUnits: string[];
  error?: string;
};

type DropdownRect = {
  top: number;
  left: number;
  width: number;
};

export function PositionUnitField({
  id,
  value,
  onChange,
  knownUnits,
  error,
}: PositionUnitFieldProps) {
  const { t } = useTranslations();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);

  const suggestions = filterUnitSuggestions(value, knownUnits);
  const invalid = Boolean(error);

  function updateDropdownRect() {
    const input = inputRef.current;
    if (!input) return;

    const rect = input.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }

  useLayoutEffect(() => {
    if (!open) {
      setDropdownRect(null);
      return;
    }

    updateDropdownRect();

    window.addEventListener("resize", updateDropdownRect);
    window.addEventListener("scroll", updateDropdownRect, true);

    return () => {
      window.removeEventListener("resize", updateDropdownRect);
      window.removeEventListener("scroll", updateDropdownRect, true);
    };
  }, [open, value, knownUnits]);

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
  }, [value, knownUnits]);

  function updateSuggestionsVisibility(nextValue: string) {
    const nextSuggestions = filterUnitSuggestions(nextValue, knownUnits);
    setOpen(nextSuggestions.length > 0);
  }

  function handleInputChange(nextValue: string) {
    onChange(nextValue);
    updateSuggestionsVisibility(nextValue);
  }

  function selectSuggestion(unit: string) {
    onChange(unit);
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
        {suggestions.map((unit, index) => (
          <li key={unit} role="option" aria-selected={index === activeIndex}>
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                selectSuggestion(unit);
              }}
              className={`flex w-full items-center px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 ${
                index === activeIndex ? "bg-zinc-50" : ""
              }`}
            >
              {unit}
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div ref={rootRef} className="relative block">
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="text"
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        placeholder={t("positions.unit.placeholder", "piem. m², m³, gab.")}
        onChange={(event) => handleInputChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        className={`${formInputFullWidthClass} ${formInputClassName(invalid)}`}
        aria-invalid={invalid}
        aria-describedby={error ? `${id}-error` : undefined}
      />

      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}

      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
