"use client";

import { useRef, useState, useTransition } from "react";
import {
  removeCompanyLogoAction,
  uploadCompanyLogoAction,
} from "@/app/(protected)/settings/actions";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { validateCompanyLogoFile } from "@/app/lib/settings/logo-validation";

type CompanyLogoDropzoneProps = {
  logoUrl: string;
  onLogoChange: (logoUrl: string) => void;
  onError: (message: string | null) => void;
};

export function CompanyLogoDropzone({
  logoUrl,
  onLogoChange,
  onError,
}: CompanyLogoDropzoneProps) {
  const canSave = useActionPermission("settings.save");
  const { t } = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const validation = validateCompanyLogoFile(file);
    if (!validation.ok) {
      onError(translateActionError(t, validation));
      return;
    }

    onError(null);
    const formData = new FormData();
    formData.set("logo", file);

    startTransition(async () => {
      const result = await uploadCompanyLogoAction(formData);

      if (!result.ok) {
        onError(translateActionError(t, result));
        return;
      }

      onLogoChange(result.logoUrl);
    });
  }

  function handleRemove() {
    onError(null);

    startTransition(async () => {
      const result = await removeCompanyLogoAction();

      if (!result.ok) {
        onError(translateActionError(t, result));
        return;
      }

      onLogoChange("");
    });
  }

  if (!canSave) {
    return (
      <div className="sm:col-span-2">
        <p className="mb-1.5 text-sm font-medium text-zinc-700">
          {t("settings.company_logo", "Uzņēmuma logotips")}
        </p>
        <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={t("settings.company_logo", "Uzņēmuma logotips")}
              className="max-h-full max-w-full object-contain p-2"
            />
          ) : (
            <i className="fas fa-image text-2xl text-zinc-300" aria-hidden="true" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2">
      <p className="mb-1.5 text-sm font-medium text-zinc-700">
        {t("settings.company_logo", "Uzņēmuma logotips")}
      </p>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
          isDragging
            ? "border-zinc-900 bg-zinc-50"
            : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300"
        } ${isPending ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={t("settings.company_logo", "Uzņēmuma logotips")}
                className="max-h-full max-w-full object-contain p-2"
              />
            ) : (
              <i
                className="fas fa-image text-2xl text-zinc-300"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-700">
              {t("settings.logo_drop_hint_prefix", "Velc un nomet logotipu šeit vai")}{" "}
              <button
                type="button"
                onClick={openFilePicker}
                className="font-medium text-zinc-900 underline-offset-2 hover:underline"
              >
                {t("files.choose_file", "izvēlies failu")}
              </button>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {t(
                "settings.logo_formats_hint",
                "PNG, JPG, WEBP vai SVG · max 2 MB",
              )}
            </p>

            {logoUrl ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                className="mt-3 text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
              >
              {t("settings.logo_remove", "Noņemt logotipu")}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {isPending ? (
        <p className="mt-2 text-xs text-zinc-500">
          {t("settings.logo_uploading", "Augšupielādē logotipu…")}
        </p>
      ) : null}
    </div>
  );
}
