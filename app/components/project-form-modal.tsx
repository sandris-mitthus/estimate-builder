"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createProjectAction,
  updateProjectAction,
} from "@/app/(protected)/actions";
import { AddressAutocompleteField } from "@/app/components/address-autocomplete-field";
import { AppModal } from "@/app/components/app-modal";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { PhoneField } from "@/app/components/phone-field";
import { DEFAULT_CALLING_CODE } from "@/app/lib/geo/country-calling-codes";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";
import {
  INDIVIDUAL_PROJECT_MODULE,
  type ProjectSummary,
} from "@/app/lib/projects/types";
import {
  parseStoredPhone,
  validateEmail,
  validatePhone,
} from "@/app/lib/validation/contact-fields";

type FormState = {
  clientName: string;
  phone: string;
  email: string;
  address: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  clientName: "",
  phone: "",
  email: "",
  address: "",
};

function moduleSelectionFromProject(project: ProjectSummary): string {
  if (project.buildingModuleId) {
    return project.buildingModuleId;
  }

  return INDIVIDUAL_PROJECT_MODULE;
}

function moduleLabelFromSelection(
  moduleSelection: string,
  modules: BuildingModuleSummary[],
): string {
  if (moduleSelection === INDIVIDUAL_PROJECT_MODULE) {
    return "Individuāls projekts";
  }

  return (
    modules.find((module) => module.id === moduleSelection)?.name ??
    "Individuāls projekts"
  );
}

function formFromProject(project: ProjectSummary): {
  form: FormState;
  callingCode: string;
} {
  const { callingCode, local } = parseStoredPhone(project.phone);

  return {
    form: {
      clientName: project.name,
      phone: local,
      email: project.email,
      address: project.address,
    },
    callingCode,
  };
}

function FormField({
  label,
  id,
  value,
  onChange,
  type = "text",
  error,
}: {
  label: string;
  id: keyof FormState;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
}) {
  const invalid = Boolean(error);

  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${formInputFullWidthClass} ${formInputClassName(invalid)}`}
        aria-invalid={invalid}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}

type ProjectFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  project?: ProjectSummary;
  modules?: BuildingModuleSummary[];
  /** Clone estimate from this project when creating (empty form, optional module prefill). */
  copyFromProject?: ProjectSummary;
};

export function ProjectFormModal({
  open,
  onOpenChange,
  mode,
  project,
  modules = [],
  copyFromProject,
}: ProjectFormModalProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const isCopyCreate = !isEdit && Boolean(copyFromProject);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [moduleSelection, setModuleSelection] = useState("");
  const [moduleError, setModuleError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [phoneCallingCode, setPhoneCallingCode] = useState(DEFAULT_CALLING_CODE);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    if (isEdit && project) {
      const initial = formFromProject(project);
      setForm(initial.form);
      setPhoneCallingCode(initial.callingCode);
      setModuleSelection(moduleSelectionFromProject(project));
    } else if (copyFromProject) {
      setForm(emptyForm);
      setPhoneCallingCode(DEFAULT_CALLING_CODE);
      setModuleSelection(moduleSelectionFromProject(copyFromProject));
    } else {
      setForm(emptyForm);
      setPhoneCallingCode(DEFAULT_CALLING_CODE);
      setModuleSelection("");
    }

    setFieldErrors({});
    setModuleError(undefined);
    setError(null);
  }, [open, isEdit, project, copyFromProject]);

  const handleCallingCodeChange = useCallback((code: string) => {
    setPhoneCallingCode(code);
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      setForm(emptyForm);
      setModuleSelection("");
      setModuleError(undefined);
      setFieldErrors({});
      setError(null);
      setPhoneCallingCode(DEFAULT_CALLING_CODE);
    }
    onOpenChange(nextOpen);
  }

  function resolveBuildingModuleId(): string | null | undefined {
    if (moduleSelection === INDIVIDUAL_PROJECT_MODULE) {
      return null;
    }

    return moduleSelection;
  }

  function validateForm(): boolean {
    const nextErrors: FieldErrors = {};
    let nextModuleError: string | undefined;

    if (!moduleSelection) {
      nextModuleError = "Izvēlies moduli.";
    }

    if (!form.clientName.trim()) {
      nextErrors.clientName = "Ievadi pasūtītāja vārdu un uzvārdu.";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Ievadi adresi.";
    }

    const emailError = validateEmail(form.email);
    if (emailError) nextErrors.email = emailError;

    const phoneError = validatePhone(form.phone, phoneCallingCode);
    if (phoneError) nextErrors.phone = phoneError;

    setFieldErrors(nextErrors);
    setModuleError(nextModuleError);
    return Object.keys(nextErrors).length === 0 && !nextModuleError;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      if (isEdit) {
        if (!project) return;

        const result = await updateProjectAction({
          id: project.id,
          ...form,
          phoneCallingCode,
          buildingModuleId: resolveBuildingModuleId() ?? null,
        });

        if (!result.ok) {
          setError(result.error);
          return;
        }

        handleOpenChange(false);
        router.refresh();
        return;
      }

      const result = await createProjectAction({
        ...form,
        phoneCallingCode,
        buildingModuleId: resolveBuildingModuleId() ?? null,
        copyEstimateFromProjectId: copyFromProject?.id,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      handleOpenChange(false);
      router.push(`/${result.id}`);
      router.refresh();
    });
  }

  const isDirty =
    isEdit && project
      ? (() => {
          const initial = formFromProject(project);
          const initialModule = moduleSelectionFromProject(project);
          return (
            form.clientName !== initial.form.clientName ||
            form.phone !== initial.form.phone ||
            form.email !== initial.form.email ||
            form.address !== initial.form.address ||
            phoneCallingCode !== initial.callingCode ||
            moduleSelection !== initialModule
          );
        })()
      : isCopyCreate
        ? Boolean(
            form.clientName.trim() ||
              form.phone.trim() ||
              form.email.trim() ||
              form.address.trim(),
          )
        : Boolean(
            form.clientName.trim() ||
              form.phone.trim() ||
              form.email.trim() ||
              form.address.trim() ||
              moduleSelection,
          );

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title={isEdit ? "Labot projektu" : "Jauns projekts"}
      description="Ievadi pasūtītāja kontaktinformāciju"
      blocking={isPending}
      dirty={isDirty}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Pasūtītāja vārds, uzvārds"
          id="clientName"
          value={form.clientName}
          onChange={(value) => updateField("clientName", value)}
          error={fieldErrors.clientName}
        />
        <label htmlFor="moduleSelection" className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700">
            Modulis
          </span>
          {isCopyCreate ? (
            <input
              id="moduleSelection"
              name="moduleSelection"
              type="text"
              value={moduleLabelFromSelection(moduleSelection, modules)}
              readOnly
              className={`${formInputFullWidthClass} ${formInputClassName()} cursor-not-allowed bg-zinc-50 text-zinc-600`}
              aria-readonly="true"
            />
          ) : (
            <select
              id="moduleSelection"
              name="moduleSelection"
              value={moduleSelection}
              onChange={(event) => {
                setModuleSelection(event.target.value);
                setModuleError(undefined);
              }}
              className={`${formInputFullWidthClass} ${formInputClassName(Boolean(moduleError))}`}
              aria-invalid={Boolean(moduleError)}
              aria-describedby={moduleError ? "moduleSelection-error" : undefined}
              required
            >
              <option value="">Izvēlies Moduli</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
              <option value={INDIVIDUAL_PROJECT_MODULE}>Individuāls projekts</option>
            </select>
          )}
          {moduleError ? (
            <p
              id="moduleSelection-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {moduleError}
            </p>
          ) : null}
        </label>
        <PhoneField
          id="phone"
          value={form.phone}
          onChange={(value) => updateField("phone", value)}
          callingCode={phoneCallingCode}
          onCallingCodeChange={handleCallingCodeChange}
          error={fieldErrors.phone}
          skipGeoLookup={isEdit}
        />
        <FormField
          label="Epasts"
          id="email"
          type="email"
          value={form.email}
          onChange={(value) => updateField("email", value)}
          error={fieldErrors.email}
        />
        <AddressAutocompleteField
          label="Adrese"
          id="address"
          value={form.address}
          onChange={(value) => updateField("address", value)}
          error={fieldErrors.address}
        />

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <ModalFormActions
          onCancel={() => handleOpenChange(false)}
          cancelDisabled={isPending}
        >
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? isEdit
                ? "Saglabā…"
                : "Izveido…"
              : isEdit
                ? "Saglabāt"
                : "Izveidot projektu"}
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
