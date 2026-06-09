"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  getGoogleMapsApiKey,
  isGoogleMapsConfigured,
  isGoogleMapsEmbedConfigured,
} from "@/app/lib/google-maps/env";
import { formInputClassName, formInputFullWidthClass } from "@/app/lib/form/input-styles";

type PlaceSuggestion = {
  placeId: string;
  label: string;
};

type AddressAutocompleteFieldProps = {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function AddressAutocompleteField({
  label,
  id,
  value,
  onChange,
  error,
}: AddressAutocompleteFieldProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapQuery, setMapQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const configured = isGoogleMapsConfigured();
  const embedConfigured = isGoogleMapsEmbedConfigured();
  const apiKey = getGoogleMapsApiKey();
  const invalid = Boolean(error);

  useEffect(() => {
    if (!value.trim()) {
      setMapQuery(null);
    }
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function fetchSuggestions(query: string) {
    if (!configured || query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    fetch(`/api/places/autocomplete?input=${encodeURIComponent(query.trim())}`)
      .then(async (response) => {
        const data = (await response.json()) as {
          suggestions?: PlaceSuggestion[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Neizdevās ielādēt ieteikumus.");
        }

        setSuggestions(data.suggestions ?? []);
        setOpen((data.suggestions ?? []).length > 0);
        setActiveIndex(-1);
      })
      .catch((fetchError: unknown) => {
        setSuggestions([]);
        setOpen(false);
        setLoadError(
          fetchError instanceof Error
            ? fetchError.message
            : "Neizdevās ielādēt ieteikumus.",
        );
      })
      .finally(() => setLoading(false));
  }

  function handleInputChange(nextValue: string) {
    onChange(nextValue);
    setMapQuery(null);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      fetchSuggestions(nextValue);
    }, 300);
  }

  async function selectSuggestion(suggestion: PlaceSuggestion) {
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(
        `/api/places/autocomplete?placeId=${encodeURIComponent(suggestion.placeId)}`,
      );
      const data = (await response.json()) as {
        formattedAddress?: string;
        error?: string;
      };

      const address =
        data.formattedAddress?.trim() || suggestion.label.trim();

      if (!response.ok || !address) {
        throw new Error(data.error ?? "Neizdevās ielādēt adresi.");
      }

      onChange(address);
      setMapQuery(address);
    } catch (selectError: unknown) {
      onChange(suggestion.label);
      setMapQuery(suggestion.label);
      setLoadError(
        selectError instanceof Error
          ? selectError.message
          : "Neizdevās ielādēt adresi.",
      );
    } finally {
      setLoading(false);
    }
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

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void selectSuggestion(suggestions[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const mapEmbedUrl =
    mapQuery && embedConfigured && apiKey
      ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(mapQuery)}`
      : null;

  return (
    <div ref={rootRef} className="relative block">
      <label htmlFor={id} className="block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">
          {label}
        </span>
        <input
          id={id}
          name={id}
          type="text"
          value={value}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          placeholder={
            configured
              ? "Sāc rakstīt adresi…"
              : "Brīvības iela 45, Rīga, LV-1010"
          }
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          className={`${formInputFullWidthClass} ${formInputClassName(invalid)}`}
          aria-invalid={invalid}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
        />
      </label>

      {open && suggestions.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-[10000] mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.placeId} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void selectSuggestion(suggestion)}
                className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 ${
                  index === activeIndex ? "bg-zinc-50" : ""
                }`}
              >
                <i
                  className="fas fa-location-dot mt-0.5 shrink-0 text-xs text-zinc-400"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">{suggestion.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <p id={`${id}-hint`} className="mt-1.5 text-xs text-zinc-400">
        {!configured
          ? "Google Maps nav konfigurēts — ievadi adresi manuāli."
          : loading
            ? "Meklē adreses…"
            : "Adreses ieteikumi no Google Maps"}
      </p>

      {loadError ? (
        <p className="mt-1 text-xs text-amber-600" role="alert">
          {loadError} Pārbaudi, vai ieslēgts Places API (New).
        </p>
      ) : null}

      {mapEmbedUrl ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200">
          <iframe
            title="Adreses karte"
            src={mapEmbedUrl}
            className="h-40 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : null}
    </div>
  );
}
