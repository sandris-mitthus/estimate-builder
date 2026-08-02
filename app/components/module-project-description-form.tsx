"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { DeleteButton } from "@/app/components/delete-button";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import {
  calculateCrossSectionVolumeM3,
  calculateFoundationFootprint,
  calculateGablePedimentAreaM2,
  calculateNetFoundationVolumeM3,
  calculateRoofPlane,
  calculateRoofTotals,
  calculateSanitaryRoom,
  calculateSanitaryRoomTotals,
  calculateTotalCrossSectionVolumeM3,
  calculateWalls,
} from "@/app/lib/modules/project-description-calculations";
import {
  formatFoundationPlaneOptionLabel,
  listFoundationPlaneOptions,
  type GablePedimentFoundationContext,
} from "@/app/lib/modules/foundation-plane-options";
import {
  parseProjectDescriptionFormState,
  serializeProjectDescriptionFormState,
} from "@/app/lib/modules/parse-project-description";
import {
  createCrossSectionEntry,
  createDoorEntry,
  createGablePedimentEntry,
  createRoofPlaneEntry,
  createSanitaryRoomEntry,
  createWindowEntry,
  type DoorEntry,
  type FoundationCrossSectionEntry,
  type GablePedimentEntry,
  type OpeningEntry,
  type ProjectDescriptionFormState,
  type RoofPlaneEntry,
  type SanitaryRoomEntry,
  type WindowEntry,
} from "@/app/lib/modules/project-description-types";
import {
  formatAmountDisplay,
  isAmountDisplayEmpty,
} from "@/app/lib/estimates/calculate-line";
import {
  sanitizeQuantityInputString,
} from "@/app/lib/positions/variable-quantity";

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

function CalculatedField({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  const display = isAmountDisplayEmpty(value) ? "—" : formatAmountDisplay(value);

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5">
      <span className="block text-xs font-medium text-zinc-500">{label}</span>
      <span className="mt-0.5 block text-sm font-semibold tabular-nums text-zinc-900">
        {display}
        {!isAmountDisplayEmpty(value) ? (
          <span className="ml-1 font-normal text-zinc-500">{unit}</span>
        ) : null}
      </span>
    </div>
  );
}

function DimensionInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={value}
      placeholder={placeholder}
      onChange={(event) =>
        onChange(sanitizeQuantityInputString(event.target.value))
      }
      className={`${formInputFullWidthClass} ${formInputClassName()}`}
    />
  );
}

function CountInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
      className={`${formInputFullWidthClass} ${formInputClassName()}`}
    />
  );
}

function MarkInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      maxLength={40}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`${formInputFullWidthClass} ${formInputClassName()}`}
    />
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold text-zinc-900">
      {children}
    </h3>
  );
}

function GablePedimentRow({
  entry,
  index,
  foundationContext,
  onChange,
  onDelete,
}: {
  entry: GablePedimentEntry;
  index: number;
  foundationContext: GablePedimentFoundationContext;
  onChange: (next: GablePedimentEntry) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslations();
  const foundationPlaneOptions = listFoundationPlaneOptions(foundationContext, t);
  const areaM2 = calculateGablePedimentAreaM2(entry, foundationContext);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500">
          {t("project_description.gable.item", "Frontons {index}", { index: index + 1 })}
        </span>
        <DeleteButton
          label={t("project_description.gable.delete", "Dzēst frontonu {index}", {
            index: index + 1,
          })}
          onClick={onDelete}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("project_description.field.height_m", "Augstums (m)")} id={`gable-height-${entry.id}`}>
          <DimensionInput
            id={`gable-height-${entry.id}`}
            value={entry.heightM}
            onChange={(heightM) => onChange({ ...entry, heightM })}
            placeholder="2,5"
          />
        </Field>

        <Field label={t("common.count", "Skaits")} id={`gable-count-${entry.id}`}>
          <CountInput
            id={`gable-count-${entry.id}`}
            value={entry.count}
            onChange={(count) => onChange({ ...entry, count })}
          />
        </Field>

        <Field label={t("project_description.foundation_plane", "Pamata plakne")} id={`gable-plane-${entry.id}`}>
          <select
            id={`gable-plane-${entry.id}`}
            value={entry.foundationPlaneKey}
            onChange={(event) =>
              onChange({
                ...entry,
                foundationPlaneKey: event.target.value as GablePedimentEntry["foundationPlaneKey"],
              })
            }
            className={`${formInputFullWidthClass} ${formInputClassName()} cursor-pointer`}
          >
            <option value="">{t("project_description.choose_plane", "Izvēlies plakni")}</option>
            {foundationPlaneOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {formatFoundationPlaneOptionLabel(option, foundationContext)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-3">
        <CalculatedField label={t("project_description.gable.area", "Frontona platība")} value={areaM2} unit="m²" />
      </div>
    </div>
  );
}

function OpeningRow({
  entry,
  index,
  prefix,
  markPlaceholder,
  onChange,
  onDelete,
  extra,
}: {
  entry: OpeningEntry;
  index: number;
  prefix: string;
  markPlaceholder: string;
  onChange: (next: OpeningEntry) => void;
  onDelete: () => void;
  extra?: ReactNode;
}) {
  const { t } = useTranslations();

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500">
          {t("project_description.opening.item", "Veids {index}", { index: index + 1 })}
        </span>
        <DeleteButton
          label={t("project_description.opening.delete", "Dzēst {prefix} veidu {index}", {
            prefix,
            index: index + 1,
          })}
          onClick={onDelete}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Field label={t("project_description.field.mark", "Marka")} id={`${prefix}-mark-${entry.id}`}>
          <MarkInput
            id={`${prefix}-mark-${entry.id}`}
            value={entry.mark}
            onChange={(mark) => onChange({ ...entry, mark })}
            placeholder={markPlaceholder}
          />
        </Field>

        <Field label={t("project_description.field.height_m", "Augstums (m)")} id={`${prefix}-height-${entry.id}`}>
          <DimensionInput
            id={`${prefix}-height-${entry.id}`}
            value={entry.heightM}
            onChange={(heightM) => onChange({ ...entry, heightM })}
            placeholder="1,2"
          />
        </Field>

        <Field label={t("project_description.field.width_m", "Platums (m)")} id={`${prefix}-width-${entry.id}`}>
          <DimensionInput
            id={`${prefix}-width-${entry.id}`}
            value={entry.widthM}
            onChange={(widthM) => onChange({ ...entry, widthM })}
            placeholder="0,9"
          />
        </Field>

        <Field label={t("common.count", "Skaits")} id={`${prefix}-count-${entry.id}`}>
          <CountInput
            id={`${prefix}-count-${entry.id}`}
            value={entry.count}
            onChange={(count) => onChange({ ...entry, count })}
          />
        </Field>
      </div>

      {extra ? <div className="mt-3">{extra}</div> : null}
    </div>
  );
}

function CrossSectionRow({
  entry,
  index,
  canDelete,
  onChange,
  onDelete,
}: {
  entry: FoundationCrossSectionEntry;
  index: number;
  canDelete: boolean;
  onChange: (next: FoundationCrossSectionEntry) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslations();
  const volumeM3 = calculateCrossSectionVolumeM3(entry);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500">
          {t("project_description.cross_section.item", "Izgriezums {index}", {
            index: index + 1,
          })}
        </span>
        {canDelete ? (
          <DeleteButton
            label={t("project_description.cross_section.delete", "Dzēst izgriezumu {index}", {
              index: index + 1,
            })}
            onClick={onDelete}
          />
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("project_description.field.width_m", "Platums (m)")} id={`cross-section-width-${entry.id}`}>
          <DimensionInput
            id={`cross-section-width-${entry.id}`}
            value={entry.widthM}
            onChange={(widthM) => onChange({ ...entry, widthM })}
            placeholder="12"
          />
        </Field>
        <Field label={t("project_description.field.depth_m", "Dziļums (m)")} id={`cross-section-depth-${entry.id}`}>
          <DimensionInput
            id={`cross-section-depth-${entry.id}`}
            value={entry.depthM}
            onChange={(depthM) => onChange({ ...entry, depthM })}
            placeholder="8"
          />
        </Field>
        <Field label={t("project_description.field.height_m", "Augstums (m)")} id={`cross-section-height-${entry.id}`}>
          <DimensionInput
            id={`cross-section-height-${entry.id}`}
            value={entry.heightM}
            onChange={(heightM) => onChange({ ...entry, heightM })}
            placeholder="0,4"
          />
        </Field>
      </div>

      <div className="mt-3">
        <CalculatedField
          label={t("project_description.cross_section.volume_removed", "Izgriezuma tilpums (atņemams)")}
          value={volumeM3}
          unit="m³"
        />
      </div>
    </div>
  );
}

function RoofPlaneRow({
  plane,
  index,
  floorHeightM,
  canDelete,
  onChange,
  onDelete,
}: {
  plane: RoofPlaneEntry;
  index: number;
  floorHeightM: string;
  canDelete: boolean;
  onChange: (next: RoofPlaneEntry) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslations();
  const calc = calculateRoofPlane(plane, floorHeightM);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500">
          {t("project_description.roof.plane_item", "Plakne {index}", {
            index: index + 1,
          })}
        </span>
        {canDelete ? (
          <DeleteButton
            label={t("project_description.roof.delete_plane", "Dzēst jumta plakni {index}", {
              index: index + 1,
            })}
            onClick={onDelete}
          />
        ) : null}
      </div>

      <p className="mb-3 text-xs text-zinc-500">
        {t(
          "project_description.roof.gutter_hint",
          "Ieslēdz slēdzi \"Tekne\" pie platuma vai augstuma. Aktīvs var būt tikai viens slēdzis.",
        )}
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <DimensionFieldWithPlaneToggle
          label={t("project_description.field.width_m", "Platums (m)")}
          id={`roof-width-${plane.id}`}
          value={plane.widthM}
          onChange={(widthM) => onChange({ ...plane, widthM })}
          placeholder="10"
          attachmentEnabled={plane.gutterEdge === "width"}
          onAttachmentSelect={() => onChange({ ...plane, gutterEdge: "width" })}
          attachmentToggleId={`roof-width-gutter-${plane.id}`}
          attachmentLabel={t("project_description.roof.gutter", "Tekne")}
        />
        <DimensionFieldWithPlaneToggle
          label={t("project_description.field.height_m", "Augstums (m)")}
          id={`roof-height-${plane.id}`}
          value={plane.heightM}
          onChange={(heightM) => onChange({ ...plane, heightM })}
          placeholder="6"
          attachmentEnabled={plane.gutterEdge === "height"}
          onAttachmentSelect={() => onChange({ ...plane, gutterEdge: "height" })}
          attachmentToggleId={`roof-height-gutter-${plane.id}`}
          attachmentLabel={t("project_description.roof.gutter", "Tekne")}
        />
        <Field label={t("common.count", "Skaits")} id={`roof-count-${plane.id}`}>
          <CountInput
            id={`roof-count-${plane.id}`}
            value={plane.count}
            onChange={(count) => onChange({ ...plane, count })}
          />
        </Field>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <CalculatedField
          label={t("project_description.roof.plane_area", "Plaknes laukums")}
          value={calc.areaM2}
          unit="m²"
        />
        <CalculatedField
          label={t("project_description.roof.gutter_length", "Teknes garums")}
          value={calc.gutterLengthM}
          unit="m"
        />
        <CalculatedField
          label={t("project_description.roof.downpipe_length", "Noteku garums")}
          value={calc.downpipeLengthM}
          unit="m"
        />
      </div>
    </div>
  );
}

function SanitaryRoomRow({
  entry,
  index,
  floorHeightM,
  onChange,
  onDelete,
}: {
  entry: SanitaryRoomEntry;
  index: number;
  floorHeightM: string;
  onChange: (next: SanitaryRoomEntry) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslations();
  const calc = calculateSanitaryRoom(entry, floorHeightM);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500">
          {t("project_description.sanitary.item", "Sanmezgls {index}", {
            index: index + 1,
          })}
        </span>
        <DeleteButton
          label={t("project_description.sanitary.delete", "Dzēst sanmezglu {index}", {
            index: index + 1,
          })}
          onClick={onDelete}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("common.name", "Nosaukums")} id={`sanitary-name-${entry.id}`}>
          <MarkInput
            id={`sanitary-name-${entry.id}`}
            value={entry.name}
            onChange={(name) => onChange({ ...entry, name })}
            placeholder={t("project_description.sanitary.name_placeholder", "WC")}
          />
        </Field>

        <Field
          label={t("project_description.field.length_m", "Garums (m)")}
          id={`sanitary-length-${entry.id}`}
        >
          <DimensionInput
            id={`sanitary-length-${entry.id}`}
            value={entry.lengthM}
            onChange={(lengthM) => onChange({ ...entry, lengthM })}
            placeholder="2,4"
          />
        </Field>

        <Field
          label={t("project_description.field.width_m", "Platums (m)")}
          id={`sanitary-width-${entry.id}`}
        >
          <DimensionInput
            id={`sanitary-width-${entry.id}`}
            value={entry.widthM}
            onChange={(widthM) => onChange({ ...entry, widthM })}
            placeholder="1,6"
          />
        </Field>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <CalculatedField
          label={t("project_description.sanitary.perimeter", "Perimetrs")}
          value={calc.perimeterM}
          unit="m"
        />
        <CalculatedField
          label={t("project_description.sanitary.wall_area", "Sienu laukums")}
          value={calc.wallAreaM2}
          unit="m²"
        />
        <CalculatedField
          label={t("project_description.sanitary.floor_area", "Grīdas laukums")}
          value={calc.floorAreaM2}
          unit="m²"
        />
      </div>
    </div>
  );
}

function CompactToggle({
  id,
  enabled,
  onChange,
  ariaLabel,
}: {
  id: string;
  enabled: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
        enabled ? "bg-violet-600" : "bg-zinc-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${
          enabled ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function DimensionFieldWithPlaneToggle({
  label,
  id,
  value,
  onChange,
  placeholder,
  attachmentEnabled,
  onAttachmentSelect,
  attachmentToggleId,
  attachmentLabel,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  attachmentEnabled: boolean;
  onAttachmentSelect: () => void;
  attachmentToggleId: string;
  attachmentLabel?: string;
}) {
  const { t } = useTranslations();
  const resolvedAttachmentLabel =
    attachmentLabel ??
    t("project_description.foundation.attached_first", "Pievienots 1. pamatam");

  return (
    <div className="block">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{resolvedAttachmentLabel}</span>
          <CompactToggle
            id={attachmentToggleId}
            enabled={attachmentEnabled}
            onChange={onAttachmentSelect}
            ariaLabel={`${label} – ${attachmentLabel}`}
          />
        </div>
      </div>
      <DimensionInput
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

function ToggleSwitch({
  id,
  label,
  enabled,
  onChange,
}: {
  id: string;
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  const labelId = `${id}-label`;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
      <div id={labelId} className="text-sm text-zinc-700">
        {label}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={enabled}
        aria-labelledby={labelId}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          enabled ? "bg-violet-600" : "bg-zinc-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ExteriorWallToggle({
  id,
  enabled,
  onChange,
}: {
  id: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  const { t } = useTranslations();

  return (
    <ToggleSwitch
      id={id}
      label={t("project_description.opening.exterior_wall", "Atrodas ārsienā")}
      enabled={enabled}
      onChange={onChange}
    />
  );
}

function ShowcaseWindowToggle({
  id,
  enabled,
  onChange,
}: {
  id: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  const { t } = useTranslations();

  return (
    <ToggleSwitch
      id={id}
      label={t(
        "project_description.windows.showcase",
        "Vitrīna (īpašas stikla durvis)",
      )}
      enabled={enabled}
      onChange={onChange}
    />
  );
}

type ModuleProjectDescriptionFormProps = {
  initialProjectDescription: ProjectDescriptionFormState;
  onSave: (
    projectDescription: ProjectDescriptionFormState,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
};

export function ModuleProjectDescriptionForm({
  initialProjectDescription,
  onSave,
}: ModuleProjectDescriptionFormProps) {
  const { t } = useTranslations();
  const [form, setForm] = useState(initialProjectDescription);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serializeProjectDescriptionFormState(initialProjectDescription),
  );
  const [isSaving, startSaveTransition] = useTransition();

  const incomingSnapshot = useMemo(
    () => serializeProjectDescriptionFormState(initialProjectDescription),
    [initialProjectDescription],
  );

  useEffect(() => {
    const nextForm = parseProjectDescriptionFormState(
      JSON.parse(incomingSnapshot),
    );
    setForm(nextForm);
    setSavedSnapshot(incomingSnapshot);
  }, [incomingSnapshot]);

  const isDirty = useMemo(
    () => serializeProjectDescriptionFormState(form) !== savedSnapshot,
    [form, savedSnapshot],
  );

  function handleSave() {
    if (!isDirty || isSaving) {
      return;
    }

    startSaveTransition(async () => {
      const result = await onSave(form);
      if (result.ok) {
        setSavedSnapshot(serializeProjectDescriptionFormState(form));
      }
    });
  }

  const footprint = useMemo(
    () =>
      calculateFoundationFootprint(
        form.foundationWidthM,
        form.foundationDepthM,
        form.foundationHeightM,
        form.foundationLShape,
        form.foundationExtensionWidthM,
        form.foundationExtensionDepthM,
        form.foundationAttachmentPlane,
      ),
    [
      form.foundationAttachmentPlane,
      form.foundationDepthM,
      form.foundationExtensionDepthM,
      form.foundationExtensionWidthM,
      form.foundationHeightM,
      form.foundationLShape,
      form.foundationWidthM,
    ],
  );

  const removedCrossSectionVolumeM3 = useMemo(
    () => calculateTotalCrossSectionVolumeM3(form.foundationCrossSections),
    [form.foundationCrossSections],
  );

  const netFoundationVolumeM3 = useMemo(
    () => calculateNetFoundationVolumeM3(footprint.volumeM3, form.foundationCrossSections),
    [footprint.volumeM3, form.foundationCrossSections],
  );

  function updateCrossSections(nextSections: FoundationCrossSectionEntry[]) {
    setForm((current) => ({ ...current, foundationCrossSections: nextSections }));
  }

  const gableFoundationContext = useMemo<GablePedimentFoundationContext>(
    () => ({
      foundationWidthM: form.foundationWidthM,
      foundationDepthM: form.foundationDepthM,
      foundationLShape: form.foundationLShape,
      foundationExtensionWidthM: form.foundationExtensionWidthM,
      foundationExtensionDepthM: form.foundationExtensionDepthM,
    }),
    [
      form.foundationDepthM,
      form.foundationExtensionDepthM,
      form.foundationExtensionWidthM,
      form.foundationLShape,
      form.foundationWidthM,
    ],
  );

  const walls = useMemo(
    () =>
      calculateWalls(
        form.floorHeightM,
        form.exteriorWallLengthM,
        form.interiorWallLengthM,
        form.windows,
        form.doors,
        form.gablePediments,
        gableFoundationContext,
      ),
    [
      form.doors,
      form.exteriorWallLengthM,
      form.floorHeightM,
      form.gablePediments,
      form.interiorWallLengthM,
      form.windows,
      gableFoundationContext,
    ],
  );

  function updateGablePediments(nextPediments: GablePedimentEntry[]) {
    setForm((current) => ({ ...current, gablePediments: nextPediments }));
  }

  function updateWindows(nextWindows: WindowEntry[]) {
    setForm((current) => ({ ...current, windows: nextWindows }));
  }

  function updateDoors(nextDoors: DoorEntry[]) {
    setForm((current) => ({ ...current, doors: nextDoors }));
  }

  function updateRoofPlanes(nextPlanes: RoofPlaneEntry[]) {
    setForm((current) => ({ ...current, roofPlanes: nextPlanes }));
  }

  const roofTotals = useMemo(
    () => calculateRoofTotals(form.roofPlanes, form.floorHeightM),
    [form.floorHeightM, form.roofPlanes],
  );

  function updateSanitaryRooms(nextRooms: SanitaryRoomEntry[]) {
    setForm((current) => ({ ...current, sanitaryRooms: nextRooms }));
  }

  const sanitaryTotals = useMemo(
    () => calculateSanitaryRoomTotals(form.sanitaryRooms, form.floorHeightM),
    [form.floorHeightM, form.sanitaryRooms],
  );

  return (
    <section className="min-w-0">
      <h2 className="text-sm font-semibold text-zinc-900">
        {t("project_description.title", "Projekta apraksts")}
      </h2>

      <div className="mt-3 space-y-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <section className="space-y-4">
          <SectionHeading>{t("project_description.section.foundation", "Pamats")}</SectionHeading>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("project_description.field.width_m", "Platums (m)")} id="foundation-width">
              <DimensionInput
                id="foundation-width"
                value={form.foundationWidthM}
                onChange={(foundationWidthM) =>
                  setForm((current) => ({ ...current, foundationWidthM }))
                }
                placeholder="12"
              />
            </Field>
            <Field label={t("project_description.field.depth_m", "Dziļums (m)")} id="foundation-depth">
              <DimensionInput
                id="foundation-depth"
                value={form.foundationDepthM}
                onChange={(foundationDepthM) =>
                  setForm((current) => ({ ...current, foundationDepthM }))
                }
                placeholder="8"
              />
            </Field>
            <Field label={t("project_description.field.height_m", "Augstums (m)")} id="foundation-height">
              <DimensionInput
                id="foundation-height"
                value={form.foundationHeightM}
                onChange={(foundationHeightM) =>
                  setForm((current) => ({ ...current, foundationHeightM }))
                }
                placeholder="0,4"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label={t("project_description.field.living_area_m2", "Dzīvojamā platība (m²)")}
              id="living-area"
            >
              <DimensionInput
                id="living-area"
                value={form.livingAreaM2}
                onChange={(livingAreaM2) =>
                  setForm((current) => ({ ...current, livingAreaM2 }))
                }
                placeholder="96"
              />
            </Field>
          </div>

          <ToggleSwitch
            id="foundation-l-shape"
            label={t("project_description.foundation.l_shape", "L veida pamats")}
            enabled={form.foundationLShape}
            onChange={(foundationLShape) =>
              setForm((current) => ({ ...current, foundationLShape }))
            }
          />

          {form.foundationLShape ? (
            <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
              <p className="text-xs font-medium text-zinc-500">
                {t("project_description.foundation.l_shape_extension", "L veida papildu pamats")}
              </p>
              <p className="text-xs text-zinc-500">
                {t(
                  "project_description.foundation.attachment_hint",
                  "Ieslēdz slēdzi pie plaknes, kas piegulst pamatam. Aktīvs var būt tikai viens slēdzis.",
                )}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <DimensionFieldWithPlaneToggle
                  label={t("project_description.field.width_m", "Platums (m)")}
                  id="foundation-extension-width"
                  value={form.foundationExtensionWidthM}
                  onChange={(foundationExtensionWidthM) =>
                    setForm((current) => ({ ...current, foundationExtensionWidthM }))
                  }
                  placeholder="6"
                  attachmentEnabled={form.foundationAttachmentPlane === "width"}
                  onAttachmentSelect={() =>
                    setForm((current) => ({
                      ...current,
                      foundationAttachmentPlane: "width",
                    }))
                  }
                  attachmentToggleId="foundation-extension-width-attach"
                />
                <DimensionFieldWithPlaneToggle
                  label={t("project_description.field.depth_m", "Dziļums (m)")}
                  id="foundation-extension-depth"
                  value={form.foundationExtensionDepthM}
                  onChange={(foundationExtensionDepthM) =>
                    setForm((current) => ({ ...current, foundationExtensionDepthM }))
                  }
                  placeholder="4"
                  attachmentEnabled={form.foundationAttachmentPlane === "depth"}
                  onAttachmentSelect={() =>
                    setForm((current) => ({
                      ...current,
                      foundationAttachmentPlane: "depth",
                    }))
                  }
                  attachmentToggleId="foundation-extension-depth-attach"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <CalculatedField
                  label={t("project_description.foundation.shared_edge", "Savienojuma plaknes garums")}
                  value={footprint.sharedEdgeLengthM}
                  unit="m"
                />
                <CalculatedField
                  label={t("project_description.foundation.perimeter_deduction", "Atņemams no perimetra (×2)")}
                  value={footprint.perimeterDeductionM}
                  unit="m"
                />
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <CalculatedField label={t("project_description.foundation.perimeter", "Perimetrs")} value={footprint.perimeterM} unit="m" />
            <CalculatedField label={t("project_description.foundation.area", "Laukums")} value={footprint.areaM2} unit="m²" />
            <CalculatedField label={t("project_description.foundation.volume", "Pamatu tilpums")} value={footprint.volumeM3} unit="m³" />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <SectionHeading>{t("project_description.section.cross_sections", "Pamata izgriezumi")}</SectionHeading>
            <button
              type="button"
              onClick={() =>
                updateCrossSections([
                  ...form.foundationCrossSections,
                  createCrossSectionEntry(),
                ])
              }
              className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              {t("project_description.cross_section.add", "+ Pievienot izgriezumu")}
            </button>
          </div>

          <div className="space-y-3">
            {form.foundationCrossSections.map((entry, index) => (
              <CrossSectionRow
                key={entry.id}
                entry={entry}
                index={index}
                canDelete={form.foundationCrossSections.length > 1}
                onChange={(next) =>
                  updateCrossSections(
                    form.foundationCrossSections.map((item) =>
                      item.id === entry.id ? next : item,
                    ),
                  )
                }
                onDelete={() =>
                  updateCrossSections(
                    form.foundationCrossSections.filter((item) => item.id !== entry.id),
                  )
                }
              />
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <CalculatedField
              label={t("project_description.cross_section.total_removed", "Atņemams tilpums (kopā)")}
              value={removedCrossSectionVolumeM3}
              unit="m³"
            />
            <CalculatedField
              label={t("project_description.foundation.net_volume", "Galīgais pamatu tilpums")}
              value={netFoundationVolumeM3}
              unit="m³"
            />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading>{t("project_description.section.walls", "Sienas")}</SectionHeading>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("project_description.field.floor_height_m", "Stāvu augstums (m)")} id="floor-height">
              <DimensionInput
                id="floor-height"
                value={form.floorHeightM}
                onChange={(floorHeightM) =>
                  setForm((current) => ({ ...current, floorHeightM }))
                }
                placeholder="3"
              />
            </Field>

            <Field label={t("project_description.field.exterior_wall_length_m", "Ārsienu garums (m)")} id="exterior-wall-length">
              <DimensionInput
                id="exterior-wall-length"
                value={form.exteriorWallLengthM}
                onChange={(exteriorWallLengthM) =>
                  setForm((current) => ({ ...current, exteriorWallLengthM }))
                }
                placeholder="40"
              />
            </Field>

            <Field label={t("project_description.field.interior_wall_length_m", "Starpsienu garums (m)")} id="interior-wall-length">
              <DimensionInput
                id="interior-wall-length"
                value={form.interiorWallLengthM}
                onChange={(interiorWallLengthM) =>
                  setForm((current) => ({ ...current, interiorWallLengthM }))
                }
                placeholder="24"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <CalculatedField
              label={t("project_description.walls.gross_exterior", "Ārsienu kvadratūra (bruto)")}
              value={walls.grossExteriorWallAreaM2}
              unit="m²"
            />
            <CalculatedField
              label={t("project_description.walls.gross_interior", "Starpsienu kvadratūra (bruto)")}
              value={walls.grossInteriorWallAreaM2}
              unit="m²"
            />
            <CalculatedField
              label={t("project_description.walls.window_area_removed", "Logu laukums (atņemams no ārsienām)")}
              value={walls.windowOpeningAreaM2}
              unit="m²"
            />
            <CalculatedField
              label={t("project_description.walls.exterior_door_area_removed", "Durvju laukums ārsienās (atņemams)")}
              value={walls.exteriorDoorOpeningAreaM2}
              unit="m²"
            />
            <CalculatedField
              label={t("project_description.walls.interior_door_area_removed", "Durvju laukums starpsienās (atņemams)")}
              value={walls.interiorDoorOpeningAreaM2}
              unit="m²"
            />
            <CalculatedField
              label={t("project_description.walls.total_net", "Kopējā sienu kvadratūra (neto)")}
              value={walls.totalNetWallAreaM2}
              unit="m²"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <CalculatedField
              label={t("project_description.walls.net_exterior", "Ārsienu kvadratūra (neto)")}
              value={walls.netExteriorWallAreaM2}
              unit="m²"
            />
            <CalculatedField
              label={t("project_description.walls.net_interior", "Starpsienu kvadratūra (neto)")}
              value={walls.netInteriorWallAreaM2}
              unit="m²"
            />
            <CalculatedField
              label={t("project_description.walls.gable_total_area", "Frontonu kopējā platība")}
              value={walls.gablePedimentAreaM2}
              unit="m²"
            />
          </div>

          <div className="space-y-3 border-t border-zinc-100 pt-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-zinc-900">
                {t("project_description.section.gables", "Frontoni")}
              </h4>
              <button
                type="button"
                onClick={() =>
                  updateGablePediments([
                    ...form.gablePediments,
                    createGablePedimentEntry(),
                  ])
                }
                className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                {t("project_description.gable.add", "+ Pievienot frontonu")}
              </button>
            </div>

            {form.gablePediments.length === 0 ? (
              <p className="text-sm text-zinc-500">
                {t("project_description.gable.empty", "Nav pievienotu frontonu.")}
              </p>
            ) : (
              <div className="space-y-3">
                {form.gablePediments.map((entry, index) => (
                  <GablePedimentRow
                    key={entry.id}
                    entry={entry}
                    index={index}
                    foundationContext={gableFoundationContext}
                    onChange={(next) =>
                      updateGablePediments(
                        form.gablePediments.map((item) =>
                          item.id === entry.id ? next : item,
                        ),
                      )
                    }
                    onDelete={() =>
                      updateGablePediments(
                        form.gablePediments.filter((item) => item.id !== entry.id),
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <SectionHeading>{t("project_description.section.windows", "Logi")}</SectionHeading>
            <button
              type="button"
              onClick={() => updateWindows([...form.windows, createWindowEntry()])}
              className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              {t("project_description.windows.add", "+ Pievienot logu veidu")}
            </button>
          </div>

          {form.windows.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {t("project_description.windows.empty", "Nav pievienotu logu veidu.")}
            </p>
          ) : (
            <div className="space-y-3">
              {form.windows.map((entry, index) => (
                <OpeningRow
                  key={entry.id}
                  entry={entry}
                  index={index}
                  prefix="logu"
                  markPlaceholder="L1"
                  onChange={(next) =>
                    updateWindows(
                      form.windows.map((item) =>
                        item.id === entry.id ? { ...item, ...next } : item,
                      ),
                    )
                  }
                  onDelete={() =>
                    updateWindows(form.windows.filter((item) => item.id !== entry.id))
                  }
                  extra={
                    <ShowcaseWindowToggle
                      id={`window-showcase-${entry.id}`}
                      enabled={entry.showcase}
                      onChange={(showcase) =>
                        updateWindows(
                          form.windows.map((item) =>
                            item.id === entry.id ? { ...item, showcase } : item,
                          ),
                        )
                      }
                    />
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <SectionHeading>{t("project_description.section.doors", "Durvis")}</SectionHeading>
            <button
              type="button"
              onClick={() => updateDoors([...form.doors, createDoorEntry()])}
              className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              {t("project_description.doors.add", "+ Pievienot durvju veidu")}
            </button>
          </div>

          {form.doors.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {t("project_description.doors.empty", "Nav pievienotu durvju veidu.")}
            </p>
          ) : (
            <div className="space-y-3">
              {form.doors.map((entry, index) => (
                <OpeningRow
                  key={entry.id}
                  entry={entry}
                  index={index}
                  prefix="durvju"
                  markPlaceholder="D2"
                  onChange={(next) =>
                    updateDoors(
                      form.doors.map((item) =>
                        item.id === entry.id ? { ...item, ...next } : item,
                      ),
                    )
                  }
                  onDelete={() =>
                    updateDoors(form.doors.filter((item) => item.id !== entry.id))
                  }
                  extra={
                    <ExteriorWallToggle
                      id={`door-exterior-${entry.id}`}
                      enabled={entry.exteriorWall}
                      onChange={(exteriorWall) =>
                        updateDoors(
                          form.doors.map((item) =>
                            item.id === entry.id ? { ...item, exteriorWall } : item,
                          ),
                        )
                      }
                    />
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <SectionHeading>{t("project_description.section.roof", "Jumts")}</SectionHeading>
            <button
              type="button"
              onClick={() =>
                updateRoofPlanes([...form.roofPlanes, createRoofPlaneEntry()])
              }
              className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              {t("project_description.roof.add_plane", "+ Pievienot plakni")}
            </button>
          </div>

          {form.roofPlanes.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {t("project_description.roof.empty", "Nav pievienotu jumta plakņu.")}
            </p>
          ) : (
            <div className="space-y-3">
              {form.roofPlanes.map((plane, index) => (
                <RoofPlaneRow
                  key={plane.id}
                  plane={plane}
                  index={index}
                  floorHeightM={form.floorHeightM}
                  canDelete
                  onChange={(next) =>
                    updateRoofPlanes(
                      form.roofPlanes.map((item) =>
                        item.id === plane.id ? next : item,
                      ),
                    )
                  }
                  onDelete={() =>
                    updateRoofPlanes(
                      form.roofPlanes.filter((item) => item.id !== plane.id),
                    )
                  }
                />
              ))}
            </div>
          )}

          {form.roofPlanes.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <CalculatedField
                label={t("project_description.roof.total_area", "Kopējā jumta platība")}
                value={roofTotals.totalAreaM2}
                unit="m²"
              />
              <CalculatedField
                label={t("project_description.roof.total_gutter_length", "Kopējais teknes garums")}
                value={roofTotals.totalGutterLengthM}
                unit="m"
              />
              <CalculatedField
                label={t("project_description.roof.total_downpipe_length", "Kopējais noteku garums")}
                value={roofTotals.totalDownpipeLengthM}
                unit="m"
              />
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <SectionHeading>
              {t("project_description.section.sanitary", "Sanmezgli")}
            </SectionHeading>
            <button
              type="button"
              onClick={() =>
                updateSanitaryRooms([...form.sanitaryRooms, createSanitaryRoomEntry()])
              }
              className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              {t("project_description.sanitary.add", "+ Pievienot sanmezglu")}
            </button>
          </div>

          {form.sanitaryRooms.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {t("project_description.sanitary.empty", "Nav pievienotu sanmezglu.")}
            </p>
          ) : (
            <div className="space-y-3">
              {form.sanitaryRooms.map((entry, index) => (
                <SanitaryRoomRow
                  key={entry.id}
                  entry={entry}
                  index={index}
                  floorHeightM={form.floorHeightM}
                  onChange={(next) =>
                    updateSanitaryRooms(
                      form.sanitaryRooms.map((item) =>
                        item.id === entry.id ? next : item,
                      ),
                    )
                  }
                  onDelete={() =>
                    updateSanitaryRooms(
                      form.sanitaryRooms.filter((item) => item.id !== entry.id),
                    )
                  }
                />
              ))}
            </div>
          )}

          {form.sanitaryRooms.length > 1 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <CalculatedField
                label={t(
                  "project_description.sanitary.total_perimeter",
                  "Sanmezglu kopējais perimetrs",
                )}
                value={sanitaryTotals.perimeterM}
                unit="m"
              />
              <CalculatedField
                label={t(
                  "project_description.sanitary.total_wall_area",
                  "Sanmezglu kopējais sienu laukums",
                )}
                value={sanitaryTotals.wallAreaM2}
                unit="m²"
              />
              <CalculatedField
                label={t(
                  "project_description.sanitary.total_floor_area",
                  "Sanmezglu kopējais grīdas laukums",
                )}
                value={sanitaryTotals.floorAreaM2}
                unit="m²"
              />
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <SectionHeading>
            {t("project_description.section.plumbing", "Ūdensapgāde")}
          </SectionHeading>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label={t(
                "project_description.field.cold_water_length_m",
                "Aukstā ūdens garums (m)",
              )}
              id="cold-water-length"
            >
              <DimensionInput
                id="cold-water-length"
                value={form.coldWaterLengthM}
                onChange={(coldWaterLengthM) =>
                  setForm((current) => ({ ...current, coldWaterLengthM }))
                }
                placeholder="120"
              />
            </Field>

            <Field
              label={t(
                "project_description.field.hot_water_length_m",
                "Karstā ūdens garums (m)",
              )}
              id="hot-water-length"
            >
              <DimensionInput
                id="hot-water-length"
                value={form.hotWaterLengthM}
                onChange={(hotWaterLengthM) =>
                  setForm((current) => ({ ...current, hotWaterLengthM }))
                }
                placeholder="80"
              />
            </Field>

            <Field
              label={t(
                "project_description.field.recirculation_length_m",
                "Recirkulācijas garums (m)",
              )}
              id="recirculation-length"
            >
              <DimensionInput
                id="recirculation-length"
                value={form.recirculationLengthM}
                onChange={(recirculationLengthM) =>
                  setForm((current) => ({ ...current, recirculationLengthM }))
                }
                placeholder="40"
              />
            </Field>
          </div>
        </section>
      </div>

      <div className="mt-4 flex justify-end border-t border-zinc-100 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
        </button>
      </div>
    </section>
  );
}
