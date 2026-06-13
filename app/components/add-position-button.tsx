"use client";



import { useRouter } from "next/navigation";

import { useState, useTransition } from "react";

import { createPositionAction } from "@/app/(protected)/positions/actions";

import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ModalFormActions } from "@/app/components/modal-form-actions";

import { useActionPermission } from "@/app/components/action-permissions-context";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";

import { PositionCostTypeField } from "@/app/components/position-cost-type-field";
import { PositionNameUnitFields } from "@/app/components/position-name-unit-fields";
import {
  DEFAULT_CATALOG_POSITION_COST_TYPE,
  type CatalogPositionCostType,
} from "@/app/lib/positions/position-cost-type";



type FieldErrors = {

  name?: string;

  unit?: string;

  costType?: string;

};



type AddPositionButtonProps = {

  knownUnits: string[];

};



const emptyForm: {
  name: string;
  unit: string;
  costType: CatalogPositionCostType;
} = {

  name: "",

  unit: "",

  costType: DEFAULT_CATALOG_POSITION_COST_TYPE,

};



export function AddPositionButton({ knownUnits }: AddPositionButtonProps) {

  const router = useRouter();
  const canManage = useActionPermission("positions.manage");

  const { showFeedback, clearFeedback } = useFeedbackToast();

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();



  function resetForm() {

    setForm(emptyForm);

    setFieldErrors({});

    setError(null);

  }



  function handleOpenChange(nextOpen: boolean) {

    if (!nextOpen && !isPending) {

      resetForm();

    }

    setOpen(nextOpen);

  }



  function validateForm(): boolean {

    const nextErrors: FieldErrors = {};



    if (!form.name.trim()) {

      nextErrors.name = "Ievadi nosaukumu.";

    }



    if (!form.unit.trim()) {

      nextErrors.unit = "Ievadi mērvienību.";

    }



    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;

  }



  function updateField<K extends keyof typeof emptyForm>(
    field: K,
    value: (typeof emptyForm)[K],
  ) {

    setForm((current) => ({ ...current, [field]: value }));

    setFieldErrors((current) => ({ ...current, [field]: undefined }));

    setError(null);

  }



  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();

    clearFeedback();

    setError(null);



    if (!validateForm()) {

      return;

    }



    startTransition(async () => {

      const result = await createPositionAction({

        name: form.name.trim(),

        unit: form.unit.trim(),

        costType: form.costType,

        variableQuantity: false,

      });



      if (!result.ok) {
        if (result.error === "Ievadi nosaukumu.") {
          setFieldErrors({ name: result.error });
        } else if (result.error === "Ievadi mērvienību.") {
          setFieldErrors({ unit: result.error });
        } else if (result.error === "Izvēlies izmaksu veidu.") {
          setFieldErrors({ costType: result.error });
        } else {
          setError(result.error);
        }
        return;
      }



      handleOpenChange(false);

      showFeedback({ type: "success", text: "Pozīcija pievienota." });

      router.refresh();

    });

  }



  if (!canManage) {
    return null;
  }

  return (

    <>

      <button

        type="button"

        onClick={() => setOpen(true)}

        className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"

      >

        <i className="fas fa-plus text-xs" aria-hidden="true" />

        Pievienot Pozīciju

      </button>



      <AppModal

        open={open}

        onOpenChange={handleOpenChange}

        title="Pievienot pozīciju"

        description="Norādi pozīcijas nosaukumu, mērvienību un izmaksu veidu"

        blocking={isPending}

        dirty={
          Boolean(form.name.trim() || form.unit.trim()) ||
          form.costType !== DEFAULT_CATALOG_POSITION_COST_TYPE
        }

        panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}

      >

        <form noValidate onSubmit={handleSubmit} className="space-y-4">

          <PositionCostTypeField
            id="position-cost-type"
            value={form.costType}
            onChange={(value) => updateField("costType", value)}
            error={fieldErrors.costType}
            catalogOnly
          />

          <PositionNameUnitFields

            nameId="position-name"

            unitId="position-unit"

            name={form.name}

            unit={form.unit}

            onNameChange={(value) => updateField("name", value)}

            onUnitChange={(value) => updateField("unit", value)}

            knownUnits={knownUnits}

            nameError={fieldErrors.name}

            unitError={fieldErrors.unit}

            autoFocusName

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
              {isPending ? "Pievieno…" : "Pievienot"}
            </button>
          </ModalFormActions>

        </form>

      </AppModal>

    </>

  );

}

