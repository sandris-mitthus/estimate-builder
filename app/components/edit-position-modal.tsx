"use client";

import { useEffect, useState } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { PositionCostTypeField } from "@/app/components/position-cost-type-field";
import { PositionNameUnitFields } from "@/app/components/position-name-unit-fields";
import { useTranslations } from "@/app/components/translations-provider";
import type {
  CatalogPositionCostType,
  PositionCostType,
} from "@/app/lib/positions/position-cost-type";
import {
  DEFAULT_CATALOG_POSITION_COST_TYPE,
  isCatalogPositionCostType,
} from "@/app/lib/positions/position-cost-type";
import type { PositionPriceSummary } from "@/app/lib/positions/types";

type FieldErrors = {
  name?: string;
  unit?: string;
  costType?: string;
};

type EditPositionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: PositionPriceSummary;
  knownUnits: string[];
  onSave: (input: {
    name: string;
    unit: string;
    costType: PositionCostType;
    variableQuantity: boolean;
  }) => void;
  blocking?: boolean;
};

function resolveCatalogCostType(
  costType: PositionCostType,
): CatalogPositionCostType {
  return isCatalogPositionCostType(costType)
    ? costType
    : DEFAULT_CATALOG_POSITION_COST_TYPE;
}

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
  const [costType, setCostType] = useState<CatalogPositionCostType>(
    resolveCatalogCostType(position.costType),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { t } = useTranslations();

  useEffect(() => {
    if (!open) return;
    setName(position.name);
    setUnit(position.unit);
    setCostType(resolveCatalogCostType(position.costType));
    setFieldErrors({});
  }, [open, position]);

  function validateForm(): boolean {
    const nextErrors: FieldErrors = {};

    if (!name.trim()) {
      nextErrors.name = t("validation.name_required", "Ievadi nosaukumu.");
    }

    if (!unit.trim()) {
      nextErrors.unit = t("validation.unit_required", "Ievadi mērvienību.");
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
      costType,
      variableQuantity: position.variableQuantity,
    });
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("positions.edit.title", "Labot pozīciju")}
      description={t(
        "positions.edit.description",
        "Atjaunini pozīcijas nosaukumu, mērvienību un izmaksu veidu",
      )}
      blocking={blocking}
      dirty={
        name !== position.name ||
        unit !== position.unit ||
        costType !== resolveCatalogCostType(position.costType)
      }
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <PositionCostTypeField
          id={`edit-position-cost-type-${position.id}`}
          value={costType}
          onChange={(value) => {
            setCostType(value);
            setFieldErrors((current) => ({ ...current, costType: undefined }));
          }}
          error={fieldErrors.costType}
          catalogOnly
        />

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
            {blocking ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
