"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/app/components/translations-provider";

type WorkerPhotoUploadModalProps = {
  open: boolean;
};

export function WorkerPhotoUploadModal({ open }: WorkerPhotoUploadModalProps) {
  const { t } = useTranslations();
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="absolute inset-0 bg-zinc-900/50" aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-xl">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
          <i className="fas fa-spinner animate-spin text-xl" aria-hidden="true" />
        </div>
        <h2 id={titleId} className="mt-4 text-lg font-semibold text-zinc-900">
          {t("workers.photo.uploading_title", "Foto tiek ielādēts")}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-zinc-600">
          {t(
            "workers.photo.uploading_description",
            "Lūdzu, uzgaidi nedaudz, kamēr augšupielāde pabeidzas.",
          )}
        </p>
      </div>
    </div>,
    document.body,
  );
}
