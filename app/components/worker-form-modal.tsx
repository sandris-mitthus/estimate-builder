"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createWorkerAction,
  updateWorkerAction,
  uploadWorkerPhotoAction,
} from "@/app/(protected)/workers/actions";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { PhoneField } from "@/app/components/phone-field";
import {
  PendingWorkerPhotoDropzone,
  WorkerPhotoDropzone,
} from "@/app/components/worker-photo-dropzone";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { DEFAULT_CALLING_CODE } from "@/app/lib/geo/country-calling-codes";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { WorkerSummary } from "@/app/lib/workers/types";
import { formatWorkerName } from "@/app/lib/workers/types";

type WorkerFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker?: WorkerSummary | null;
};

export function WorkerFormModal({
  open,
  onOpenChange,
  worker = null,
}: WorkerFormModalProps) {
  const isEdit = Boolean(worker);
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [firstName, setFirstName] = useState(worker?.firstName ?? "");
  const [lastName, setLastName] = useState(worker?.lastName ?? "");
  const [phone, setPhone] = useState(worker?.phone ?? "");
  const [phoneCallingCode, setPhoneCallingCode] = useState(
    worker?.phoneCallingCode ?? DEFAULT_CALLING_CODE,
  );
  const [photoUrl, setPhotoUrl] = useState(worker?.photoUrl ?? "");
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phone?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setFirstName(worker?.firstName ?? "");
    setLastName(worker?.lastName ?? "");
    setPhone(worker?.phone ?? "");
    setPhoneCallingCode(worker?.phoneCallingCode ?? DEFAULT_CALLING_CODE);
    setPhotoUrl(worker?.photoUrl ?? "");
    setPendingPhoto(null);
    setPendingPreviewUrl("");
    setFieldErrors({});
    setError(null);
    setPhotoError(null);
  }, [open, worker]);

  useEffect(() => {
    if (!pendingPhoto) {
      setPendingPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(pendingPhoto);
    setPendingPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pendingPhoto]);

  const initialSnapshot = useMemo(
    () => ({
      firstName: worker?.firstName ?? "",
      lastName: worker?.lastName ?? "",
      phone: worker?.phone ?? "",
      phoneCallingCode: worker?.phoneCallingCode ?? DEFAULT_CALLING_CODE,
    }),
    [worker],
  );

  const isDirty =
    firstName.trim() !== initialSnapshot.firstName ||
    lastName.trim() !== initialSnapshot.lastName ||
    phone.trim() !== initialSnapshot.phone ||
    phoneCallingCode !== initialSnapshot.phoneCallingCode ||
    pendingPhoto !== null;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      setFieldErrors({});
      setError(null);
      setPhotoError(null);
      setPendingPhoto(null);
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst) {
      setFieldErrors({
        firstName: t("workers.validation.first_name_required", "Ievadi vārdu."),
      });
      return;
    }

    if (!trimmedLast) {
      setFieldErrors({
        lastName: t("workers.validation.last_name_required", "Ievadi uzvārdu."),
      });
      return;
    }

    const payload = {
      firstName: trimmedFirst,
      lastName: trimmedLast,
      phone: phone.trim(),
      phoneCallingCode,
    };

    startTransition(async () => {
      if (isEdit && worker) {
        const result = await updateWorkerAction({ id: worker.id, ...payload });

        if (!result.ok) {
          setError(translateActionError(t, result));
          return;
        }

        handleOpenChange(false);
        showFeedback({
          type: "success",
          text: t("workers.feedback.updated", "Darbinieks saglabāts."),
        });
        router.refresh();
        return;
      }

      const result = await createWorkerAction(payload);

      if (!result.ok) {
        setError(translateActionError(t, result));
        return;
      }

      if (pendingPhoto) {
        const formData = new FormData();
        formData.set("photo", pendingPhoto);
        const uploadResult = await uploadWorkerPhotoAction(result.worker.id, formData);
        if (!uploadResult.ok) {
          showFeedback({
            type: "info",
            text: translateActionError(t, uploadResult),
          });
        }
      }

      handleOpenChange(false);
      showFeedback({
        type: "success",
        text: t("workers.feedback.created", "Darbinieks pievienots."),
      });
      router.refresh();
    });
  }

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title={
        isEdit
          ? t("workers.modal.edit_title", "Labot darbinieku")
          : t("workers.modal.create_title", "Jauns darbinieks")
      }
      description={
        isEdit && worker
          ? formatWorkerName(worker)
          : undefined
      }
      blocking={isPending}
      dirty={isDirty}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="worker-first-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("workers.field.first_name", "Vārds")}
            </label>
            <input
              id="worker-first-name"
              type="text"
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
                setFieldErrors((current) => ({ ...current, firstName: undefined }));
                setError(null);
              }}
              autoFocus
              className={`${formInputClassName(Boolean(fieldErrors.firstName))} ${formInputFullWidthClass}`}
            />
            {fieldErrors.firstName ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {fieldErrors.firstName}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="worker-last-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("workers.field.last_name", "Uzvārds")}
            </label>
            <input
              id="worker-last-name"
              type="text"
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
                setFieldErrors((current) => ({ ...current, lastName: undefined }));
                setError(null);
              }}
              className={`${formInputClassName(Boolean(fieldErrors.lastName))} ${formInputFullWidthClass}`}
            />
            {fieldErrors.lastName ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {fieldErrors.lastName}
              </p>
            ) : null}
          </div>
        </div>

        <PhoneField
          id="worker-phone"
          value={phone}
          onChange={(value) => {
            setPhone(value);
            setFieldErrors((current) => ({ ...current, phone: undefined }));
            setError(null);
          }}
          callingCode={phoneCallingCode}
          onCallingCodeChange={setPhoneCallingCode}
          error={fieldErrors.phone}
        />

        {isEdit && worker ? (
          <WorkerPhotoDropzone
            workerId={worker.id}
            photoUrl={photoUrl}
            onPhotoChange={setPhotoUrl}
            onError={setPhotoError}
            disabled={isPending}
          />
        ) : (
          <PendingWorkerPhotoDropzone
            previewUrl={pendingPreviewUrl}
            onFileSelect={setPendingPhoto}
            onError={setPhotoError}
            disabled={isPending}
          />
        )}

        {photoError ? (
          <p className="text-sm text-red-600" role="alert">
            {photoError}
          </p>
        ) : null}

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
