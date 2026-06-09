"use client";

import { useEffect, useRef, useState } from "react";
import {
  CALLING_CODE_OPTIONS,
  DEFAULT_CALLING_CODE,
  normalizeCallingCode,
} from "@/app/lib/geo/country-calling-codes";

import {
  formInputClassName,
  formInputFlexClass,
} from "@/app/lib/form/input-styles";

type PhoneFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  callingCode: string;
  onCallingCodeChange: (code: string) => void;
  error?: string | null;
  skipGeoLookup?: boolean;
};

function isKnownCallingCode(code: string) {
  return CALLING_CODE_OPTIONS.some((option) => option.value === code);
}

export function PhoneField({
  id,
  value,
  onChange,
  callingCode,
  onCallingCodeChange,
  error,
  skipGeoLookup = false,
}: PhoneFieldProps) {
  const [loadingCode, setLoadingCode] = useState(!skipGeoLookup);
  const codeTouchedRef = useRef(false);

  useEffect(() => {
    if (skipGeoLookup) {
      setLoadingCode(false);
      return;
    }

    let cancelled = false;
    codeTouchedRef.current = false;

    fetch("/api/geo/calling-code")
      .then((response) => response.json())
      .then((data: { callingCode?: string }) => {
        if (cancelled || codeTouchedRef.current) return;
        if (data.callingCode) {
          onCallingCodeChange(normalizeCallingCode(data.callingCode));
        }
      })
      .catch(() => {
        if (!cancelled && !codeTouchedRef.current) {
          onCallingCodeChange(DEFAULT_CALLING_CODE);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCode(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onCallingCodeChange, skipGeoLookup]);

  function handleCallingCodeChange(nextValue: string) {
    codeTouchedRef.current = true;
    onCallingCodeChange(normalizeCallingCode(nextValue));
  }

  const selectValue = isKnownCallingCode(callingCode)
    ? callingCode
    : DEFAULT_CALLING_CODE;

  const invalid = Boolean(error);

  return (
    <div className="block">
      <label htmlFor={id} className="block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">
          Telefons
        </span>
        <div className="flex gap-2">
          <select
            value={selectValue}
            onChange={(event) => handleCallingCodeChange(event.target.value)}
            disabled={loadingCode}
            aria-label="Valsts kods"
            aria-invalid={invalid}
            className={`shrink-0 px-2 ${formInputClassName(invalid)} bg-zinc-50 font-medium text-zinc-700`}
          >
            {CALLING_CODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            id={id}
            name={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={value}
            placeholder="29123456"
            onChange={(event) => onChange(event.target.value)}
            className={`${formInputFlexClass} ${formInputClassName(invalid)}`}
            aria-invalid={invalid}
            aria-describedby={error ? `${id}-error` : `${id}-hint`}
          />
        </div>
      </label>
      <p id={`${id}-hint`} className="mt-1.5 text-xs text-zinc-400">
        {loadingCode
          ? "Noteic valsts kodu…"
          : "Valsts kods noteikts automātiski. Maini sarakstā, ja pasūtītājs ir ārzemnieks."}
      </p>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
