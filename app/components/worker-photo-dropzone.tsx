"use client";

import { useRef, useState, useTransition } from "react";
import {
  removeWorkerPhotoAction,
  uploadWorkerPhotoAction,
} from "@/app/(protected)/workers/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { WorkerPhotoUploadModal } from "@/app/components/worker-photo-upload-modal";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { validateWorkerPhotoFile } from "@/app/lib/workers/photo-validation";

type WorkerPhotoDropzoneProps = {
  workerId: string;
  photoUrl: string;
  onPhotoChange: (photoUrl: string) => void;
  disabled?: boolean;
};

export function WorkerPhotoDropzone({
  workerId,
  photoUrl,
  onPhotoChange,
  disabled = false,
}: WorkerPhotoDropzoneProps) {
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isBlocked = disabled || isPending || isUploadingPhoto;

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const validation = validateWorkerPhotoFile(file);
    if (!validation.ok) {
      showFeedback({ type: "error", text: translateActionError(t, validation) });
      return;
    }

    const formData = new FormData();
    formData.set("photo", file);
    setIsUploadingPhoto(true);

    startTransition(async () => {
      try {
        await new Promise((resolve) => window.requestAnimationFrame(resolve));
        const result = await uploadWorkerPhotoAction(workerId, formData);

        if (!result.ok) {
          showFeedback({ type: "error", text: translateActionError(t, result) });
          return;
        }

        onPhotoChange(result.photoUrl);
      } finally {
        setIsUploadingPhoto(false);
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeWorkerPhotoAction(workerId);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      onPhotoChange("");
    });
  }

  return (
    <div>
      <WorkerPhotoUploadModal open={isUploadingPhoto} />

      <p className="mb-1.5 text-sm font-medium text-zinc-700">
        {t("workers.field.photo", "Foto")}
      </p>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!isBlocked) setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isBlocked) setIsDragging(true);
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
          if (!isBlocked) handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
          isDragging
            ? "border-zinc-900 bg-zinc-50"
            : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300"
        } ${isBlocked ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={t("workers.field.photo", "Foto")}
                className="size-full object-cover"
              />
            ) : (
              <i className="fas fa-user text-2xl text-zinc-300" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-700">
              {t("workers.photo.drop_hint", "Velc attēlu šeit vai klikšķini, lai izvēlētos")}
            </p>
            <button
              type="button"
              onClick={openFilePicker}
              disabled={isBlocked}
              className="mt-2 text-sm font-medium text-zinc-900 underline-offset-2 hover:underline disabled:opacity-50"
            >
              {t("files.choose_file", "izvēlies failu")}
            </button>

            {photoUrl ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isBlocked}
                className="mt-3 block text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
              >
                {t("workers.photo.remove", "Noņemt foto")}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

type PendingWorkerPhotoDropzoneProps = {
  previewUrl: string;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
};

export function PendingWorkerPhotoDropzone({
  previewUrl,
  onFileSelect,
  disabled = false,
}: PendingWorkerPhotoDropzoneProps) {
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const validation = validateWorkerPhotoFile(file);
    if (!validation.ok) {
      showFeedback({ type: "error", text: translateActionError(t, validation) });
      return;
    }

    onFileSelect(file);
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-zinc-700">
        {t("workers.field.photo", "Foto")}
      </p>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
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
          if (!disabled) handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
          isDragging
            ? "border-zinc-900 bg-zinc-50"
            : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={t("workers.field.photo", "Foto")}
                className="size-full object-cover"
              />
            ) : (
              <i className="fas fa-user text-2xl text-zinc-300" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-700">
              {t("workers.photo.drop_hint", "Velc attēlu šeit vai klikšķini, lai izvēlētos")}
            </p>
            <button
              type="button"
              onClick={openFilePicker}
              disabled={disabled}
              className="mt-2 text-sm font-medium text-zinc-900 underline-offset-2 hover:underline disabled:opacity-50"
            >
              {t("files.choose_file", "izvēlies failu")}
            </button>

            {previewUrl ? (
              <button
                type="button"
                onClick={() => onFileSelect(null)}
                disabled={disabled}
                className="mt-3 block text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
              >
                {t("workers.photo.remove", "Noņemt foto")}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
