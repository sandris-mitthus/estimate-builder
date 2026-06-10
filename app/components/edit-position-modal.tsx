"use client";

import { useEffect, useState } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { PositionNameUnitFields } from "@/app/components/position-name-unit-fields";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

type FieldErrors = {
  name?: string;
  unit?: string;
};

type EditPositionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: PositionPriceSummary;
  knownUnits: string[];
  onSave: (input: { name: string; unit: string }) => void;
  blocking?: boolean;
};

export function EditPositionModal({
  open,
  onOpenChange,
  position,
  knownUnits,
  onSave,
  blocking = false,
}: EditPositionModalProps) {
  const [name, setName] = useState(position.name);
  const [unit, setUnit] = useState(position.unit);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!open) return;
    setName(position.name);
    setUnit(position.unit);
    setFieldErrors({});
  }, [open, position]);

  function validateForm(): boolean {
    const nextErrors: FieldErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Ievadi nosaukumu.";
    }

    if (!unit.trim()) {
      nextErrors.unit = "Ievadi mērvienību.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave({
      name: name.trim(),
      unit: unit.trim(),
    });
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Labot pozīciju"
      description="Atjaunini pozīcijas nosaukumu un mērvienību"
      blocking={blocking}
      dirty={name !== position.name || unit !== position.unit}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <PositionNameUnitFields
          nameId={`edit-position-name-${position.id}`}
          unitId={`edit-position-unit-${position.id}`}
          name={name}
          unit={unit}
          onNameChange={(value) => {
            setName(value);
            setFieldErrors((current) => ({ ...current, name: undefined }));
          }}
          onUnitChange={(value) => {
            setUnit(value);
            setFieldErrors((current) => ({ ...current, unit: undefined }));
          }}
          knownUnits={knownUnits}
          nameError={fieldErrors.name}
          unitError={fieldErrors.unit}
        />

        <ModalFormActions
          onCancel={() => onOpenChange(false)}
          cancelDisabled={blocking}
        >
          <button
            type="submit"
            disabled={blocking}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {blocking ? "Saglabā…" : "Saglabāt"}
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
