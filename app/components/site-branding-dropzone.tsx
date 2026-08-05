"use client";

import { useRef, useState, useTransition } from "react";
import {
  removeSiteBrandingAction,
  uploadSiteBrandingAction,
} from "@/app/(protected)/site_settings/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  validateSiteBrandingFile,
  type SiteBrandingAssetKind,
} from "@/app/lib/site-admin/branding-validation";

type SiteBrandingDropzoneProps = {
  kind: SiteBrandingAssetKind;
  url: string;
  onUrlChange: (url: string) => void;
};

export function SiteBrandingDropzone({
  kind,
  url,
  onUrlChange,
}: SiteBrandingDropzoneProps) {
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  const title =
    kind === "logo"
      ? t("site_settings.form.logo", "Logotips")
      : t("site_settings.form.favicon", "Favicon");
  const dropHint =
    kind === "logo"
      ? t(
          "site_settings.branding.logo_drop_hint",
          "Velc un nomet logotipu šeit vai",
        )
      : t(
          "site_settings.branding.favicon_drop_hint",
          "Velc un nomet favicon šeit vai",
        );
  const removeLabel =
    kind === "logo"
      ? t("site_settings.branding.logo_remove", "Noņemt logotipu")
      : t("site_settings.branding.favicon_remove", "Noņemt favicon");
  const uploadingLabel =
    kind === "logo"
      ? t("site_settings.branding.logo_uploading", "Augšupielādē logotipu…")
      : t("site_settings.branding.favicon_uploading", "Augšupielādē favicon…");
  const savedLabel =
    kind === "logo"
      ? t("site_settings.branding.logo_saved", "Logotips saglabāts.")
      : t("site_settings.branding.favicon_saved", "Favicon saglabāts.");
  const removedLabel =
    kind === "logo"
      ? t("site_settings.branding.logo_removed", "Logotips noņemts.")
      : t("site_settings.branding.favicon_removed", "Favicon noņemts.");

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const validation = validateSiteBrandingFile(file);
    if (!validation.ok) {
      showFeedback({ type: "error", text: translateActionError(t, validation) });
      return;
    }

    clearFeedback();
    const formData = new FormData();
    formData.set(kind, file);

    startTransition(async () => {
      const result = await uploadSiteBrandingAction(kind, formData);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      onUrlChange(result.url);
      showFeedback({ type: "success", text: savedLabel });
    });
  }

  function handleRemove() {
    clearFeedback();

    startTransition(async () => {
      const result = await removeSiteBrandingAction(kind);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      onUrlChange("");
      showFeedback({ type: "success", text: removedLabel });
    });
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-zinc-800">{title}</p>

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
          <div
            className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white ${
              kind === "favicon" ? "size-16" : "size-24"
            }`}
          >
            {url ? (
              <img
                src={url}
                alt={title}
                className="max-h-full max-w-full object-contain p-2"
              />
            ) : (
              <i
                className={`fas ${kind === "favicon" ? "fa-globe" : "fa-image"} text-zinc-300 ${
                  kind === "favicon" ? "text-lg" : "text-2xl"
                }`}
                aria-hidden="true"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-700">
              {dropHint}{" "}
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
                "site_settings.branding.formats_hint",
                "PNG, JPG, WEBP vai SVG · max 2 MB",
              )}
            </p>

            {url ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                className="mt-3 text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
              >
                {removeLabel}
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
        <p className="mt-2 text-xs text-zinc-500">{uploadingLabel}</p>
      ) : null}
    </div>
  );
}
