"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createExcludedPositionAction } from "@/app/(protected)/excluded-positions/actions";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import { translateActionError } from "@/app/lib/i18n/action-errors";

export function AddExcludedPositionButton() {
  const router = useRouter();
  const canManage = useActionPermission("excluded_positions.manage");
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setName("");
    setNameError(undefined);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      resetForm();
    }
    setOpen(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setError(null);
    setNameError(undefined);

    if (!name.trim()) {
      setNameError(t("validation.name_required", "Ievadi nosaukumu."));
      return;
    }

    startTransition(async () => {
      const result = await createExcludedPositionAction({ name: name.trim() });

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
        text: t("positions.feedback.added", "Pozīcija pievienota."),
      });
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
        {t("positions.add.action", "Pievienot pozīciju")}
      </button>

      <AppModal
        open={open}
        onOpenChange={handleOpenChange}
        title={t("excluded_positions.add.title", "Pievienot neiekļauto pozīciju")}
        description={t(
          "excluded_positions.add.description",
          "Norādi pozīciju, kas nav iekļauta piedāvājumā",
        )}
        blocking={isPending}
        dirty={Boolean(name.trim())}
        panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
      >
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="excluded-position-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("common.name", "Nosaukums")}
            </label>
            <input
              id="excluded-position-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(undefined);
                setError(null);
              }}
              autoFocus
              className={`${formInputClassName(Boolean(nameError))} ${formInputFullWidthClass}`}
              placeholder={t("excluded_positions.name_placeholder", "Piem., Demontāžas darbi")}
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
            cancelDisabled={isPending}
          >
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? t("actions.adding", "Pievieno…") : t("actions.add", "Pievienot")}
            </button>
          </ModalFormActions>
        </form>
      </AppModal>
    </>
  );
}
