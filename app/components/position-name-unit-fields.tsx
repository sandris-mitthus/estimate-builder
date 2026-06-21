"use client";

import { useTranslations } from "@/app/components/translations-provider";
import { PositionUnitField } from "@/app/components/position-unit-field";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";

type PositionNameUnitFieldsProps = {
  nameId: string;
  unitId: string;
  name: string;
  unit: string;
  onNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  knownUnits: string[];
  nameError?: string;
  unitError?: string;
  autoFocusName?: boolean;
};

export function PositionNameUnitFields({
  nameId,
  unitId,
  name,
  unit,
  onNameChange,
  onUnitChange,
  knownUnits,
  nameError,
  unitError,
  autoFocusName = false,
}: PositionNameUnitFieldsProps) {
  const { t } = useTranslations();

  return (
    <div className="grid grid-cols-[minmax(0,8fr)_minmax(0,2fr)] items-start gap-3">
      <label htmlFor={nameId} className="block min-w-0">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">
          {t("common.name", "Nosaukums")}
        </span>
        <input
          id={nameId}
          name={nameId}
          type="text"
          autoFocus={autoFocusName}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className={`${formInputFullWidthClass} ${formInputClassName(Boolean(nameError))}`}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? `${nameId}-error` : undefined}
        />
        {nameError ? (
          <p
            id={`${nameId}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {nameError}
          </p>
        ) : null}
      </label>

      <label htmlFor={unitId} className="block min-w-0">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">
          {t("common.unit", "Mērvienība")}
        </span>
        <PositionUnitField
          id={unitId}
          value={unit}
          onChange={onUnitChange}
          knownUnits={knownUnits}
          error={unitError}
        />
      </label>
    </div>
  );
}
