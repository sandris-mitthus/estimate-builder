"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateBuildingModuleAction } from "@/app/(protected)/modules/actions";
import { AppModal } from "@/app/components/app-modal";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";

type ModuleFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: BuildingModuleSummary;
};

export function ModuleFormModal({
  open,
  onOpenChange,
  module,
}: ModuleFormModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [noteError, setNoteError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslations();

  useEffect(() => {
    if (!open) return;

    setName(module.name);
    setNote(module.note);
    setNameError(undefined);
    setNoteError(undefined);
    setError(null);
  }, [open, module]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      setNameError(undefined);
      setNoteError(undefined);
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    startTransition(async () => {
      const result = await updateBuildingModuleAction({
        id: module.id,
        name: name.trim(),
        note: note.trim(),
      });

      if (!result.ok) {
        if (result.error === "Ievadi nosaukumu.") {
          setNameError(translateActionError(t, result));
        } else if (result.error === "Piezīme nedrīkst būt garāka par 255 zīmēm.") {
          setNoteError(translateActionError(t, result));
        } else {
          setError(translateActionError(t, result));
        }
        return;
      }

      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title={t("modules.edit.title", "Labot moduli")}
      description={t("modules.create.description", "Ievadi moduļa nosaukumu")}
      blocking={isPending}
      dirty={name !== module.name || note !== module.note}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="module-edit-name" className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700">
            {t("common.name", "Nosaukums")}
          </span>
          <input
            id="module-edit-name"
            name="module-edit-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(undefined);
              setError(null);
            }}
            className={`${formInputFullWidthClass} ${formInputClassName(Boolean(nameError))}`}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "module-edit-name-error" : undefined}
          />
          {nameError ? (
            <p id="module-edit-name-error" className="mt-1 text-sm text-red-600" role="alert">
              {nameError}
            </p>
          ) : null}
        </label>

        <label htmlFor="module-edit-note" className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700">
            {t("common.note", "Piezīme")}
          </span>
          <input
            id="module-edit-note"
            name="module-edit-note"
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
            aria-describedby={noteError ? "module-edit-note-error" : undefined}
          />
          {noteError ? (
            <p id="module-edit-note-error" className="mt-1 text-sm text-red-600" role="alert">
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
            {isPending ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
