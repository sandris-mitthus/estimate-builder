"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateExcludedPositionAction } from "@/app/(protected)/excluded-positions/actions";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { ExcludedPosition } from "@/app/lib/excluded-positions/types";

type EditExcludedPositionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: ExcludedPosition;
  blocking?: boolean;
};

export function EditExcludedPositionModal({
  open,
  onOpenChange,
  position,
  blocking = false,
}: EditExcludedPositionModalProps) {
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [name, setName] = useState(position.name);
  const [nameError, setNameError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isBlocking = blocking || isPending;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isBlocking) {
      setName(position.name);
      setNameError(undefined);
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNameError(undefined);

    if (!name.trim()) {
      setNameError(t("validation.name_required", "Ievadi nosaukumu."));
      return;
    }

    startTransition(async () => {
      const result = await updateExcludedPositionAction({
        id: position.id,
        name: name.trim(),
      });

      if (!result.ok) {
        if (result.error === "Ievadi nosaukumu.") {
          setNameError(translateActionError(t, result));
        } else {
          setError(translateActionError(t, result));
        }
        return;
      }

      handleOpenChange(false);
      showFeedback({
        type: "success",
        text: t("positions.feedback.updated", "Pozīcija atjaunināta."),
      });
      router.refresh();
    });
  }

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title={t("excluded_positions.edit.title", "Labot neiekļauto pozīciju")}
      description={t("positions.edit_name.description", "Atjaunini pozīcijas nosaukumu")}
      blocking={isBlocking}
      dirty={name.trim() !== position.name}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-excluded-position-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
            {t("common.name", "Nosaukums")}
          </label>
          <input
            id="edit-excluded-position-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(undefined);
              setError(null);
            }}
            autoFocus
            className={`${formInputClassName(Boolean(nameError))} ${formInputFullWidthClass}`}
          />
          {nameError ? (
            <p className="mt-1.5 text-sm text-red-600" role="alert">
              {nameError}
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <ModalFormActions
          onCancel={() => handleOpenChange(false)}
          cancelDisabled={isBlocking}
        >
          <button
            type="submit"
            disabled={isBlocking}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
