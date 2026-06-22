"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBuildingModuleAction } from "@/app/(protected)/modules/actions";
import { AppModal } from "@/app/components/app-modal";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import { translateActionError } from "@/app/lib/i18n/action-errors";

export function AddModuleButton() {
  const router = useRouter();
  const canManage = useActionPermission("modules.manage");
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [noteError, setNoteError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setName("");
    setNote("");
    setNameError(undefined);
    setNoteError(undefined);
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

    if (!name.trim()) {
      setNameError(t("validation.name_required", "Ievadi nosaukumu."));
      return;
    }

    if (note.trim().length > 255) {
      setNoteError(
        t(
          "modules.validation.note_too_long",
          "Piezīme nedrīkst būt garāka par 255 zīmēm.",
        ),
      );
      return;
    }

    setNameError(undefined);
    setNoteError(undefined);

    startTransition(async () => {
      const result = await createBuildingModuleAction({
        name: name.trim(),
        note: note.trim(),
      });

      if (!result.ok) {
        if (result.error === "Ievadi nosaukumu.") {
          setNameError(t("validation.name_required", result.error));
        } else if (result.error === "Piezīme nedrīkst būt garāka par 255 zīmēm.") {
          setNoteError(translateActionError(t, result));
        } else {
          setError(translateActionError(t, result));
        }
        return;
      }

      handleOpenChange(false);
      showFeedback({
        type: "success",
        text: t("modules.feedback.created", "Modulis pievienots."),
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
        {t("modules.create.action", "Pievienot moduli")}
      </button>

      <AppModal
        open={open}
        onOpenChange={handleOpenChange}
        title={t("modules.create.title", "Pievienot moduli")}
        description={t("modules.create.description", "Ievadi moduļa nosaukumu")}
        blocking={isPending}
        dirty={name.trim().length > 0 || note.trim().length > 0}
      >
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="module-name" className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("common.name", "Nosaukums")}
            </span>
            <input
              id="module-name"
              name="module-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(undefined);
                setError(null);
              }}
              autoFocus
              className={`${formInputFullWidthClass} ${formInputClassName(Boolean(nameError))}`}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "module-name-error" : undefined}
            />
            {nameError ? (
              <p id="module-name-error" className="mt-1 text-sm text-red-600" role="alert">
                {nameError}
              </p>
            ) : null}
          </label>

          <label htmlFor="module-note" className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("common.note", "Piezīme")}
            </span>
            <input
              id="module-note"
              name="module-note"
              type="text"
              value={note}
              maxLength={255}
              placeholder={t("modules.note.placeholder", "Piemēram: Spogulis")}
              onChange={(event) => {
                setNote(event.target.value);
                setNoteError(undefined);
                setError(null);
              }}
              className={`${formInputFullWidthClass} ${formInputClassName(Boolean(noteError))}`}
              aria-invalid={Boolean(noteError)}
              aria-describedby={noteError ? "module-note-error" : undefined}
            />
            {noteError ? (
              <p id="module-note-error" className="mt-1 text-sm text-red-600" role="alert">
                {noteError}
              </p>
            ) : null}
          </label>

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
