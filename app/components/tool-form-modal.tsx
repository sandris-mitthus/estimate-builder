"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createToolAction,
  updateToolAction,
} from "@/app/(protected)/tools/actions";
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
import type { ToolPriceType, ToolSummary } from "@/app/lib/tools/types";
import type { WorkerSummary } from "@/app/lib/workers/types";
import { formatWorkerName } from "@/app/lib/workers/types";

type ToolFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool?: ToolSummary | null;
  workers: WorkerSummary[];
};

export function ToolFormModal({
  open,
  onOpenChange,
  tool = null,
  workers,
}: ToolFormModalProps) {
  const isEdit = Boolean(tool);
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [toolNumber, setToolNumber] = useState(tool?.toolNumber ?? "");
  const [name, setName] = useState(tool?.name ?? "");
  const [purchaseDate, setPurchaseDate] = useState(tool?.purchaseDate ?? "");
  const [price, setPrice] = useState(
    tool?.price !== null && tool?.price !== undefined ? String(tool.price) : "",
  );
  const [priceType, setPriceType] = useState<ToolPriceType>(
    tool?.priceType ?? "purchase",
  );
  const [assignedWorkerId, setAssignedWorkerId] = useState(
    tool?.assignedWorkerId ?? "",
  );
  const [fieldErrors, setFieldErrors] = useState<{
    toolNumber?: string;
    name?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setToolNumber(tool?.toolNumber ?? "");
    setName(tool?.name ?? "");
    setPurchaseDate(tool?.purchaseDate ?? "");
    setPrice(
      tool?.price !== null && tool?.price !== undefined ? String(tool.price) : "",
    );
    setPriceType(tool?.priceType ?? "purchase");
    setAssignedWorkerId(tool?.assignedWorkerId ?? "");
    setFieldErrors({});
    setError(null);
  }, [open, tool]);

  const initialSnapshot = useMemo(
    () => ({
      toolNumber: tool?.toolNumber ?? "",
      name: tool?.name ?? "",
      purchaseDate: tool?.purchaseDate ?? "",
      price:
        tool?.price !== null && tool?.price !== undefined ? String(tool.price) : "",
      priceType: tool?.priceType ?? "purchase",
      assignedWorkerId: tool?.assignedWorkerId ?? "",
    }),
    [tool],
  );

  const isDirty =
    toolNumber.trim() !== initialSnapshot.toolNumber ||
    name.trim() !== initialSnapshot.name ||
    purchaseDate !== initialSnapshot.purchaseDate ||
    price.trim() !== initialSnapshot.price ||
    priceType !== initialSnapshot.priceType ||
    assignedWorkerId !== initialSnapshot.assignedWorkerId;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      setFieldErrors({});
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const trimmedNumber = toolNumber.trim();
    const trimmedName = name.trim();

    if (!trimmedNumber) {
      setFieldErrors({
        toolNumber: t("tools.validation.number_required", "Ievadi instrumenta numuru."),
      });
      return;
    }

    if (!trimmedName) {
      setFieldErrors({
        name: t("tools.validation.name_required", "Ievadi instrumenta nosaukumu."),
      });
      return;
    }

    const payload = {
      toolNumber: trimmedNumber,
      name: trimmedName,
      purchaseDate,
      price,
      priceType,
      assignedWorkerId: assignedWorkerId || null,
    };

    startTransition(async () => {
      const result = isEdit && tool
        ? await updateToolAction({ id: tool.id, ...payload })
        : await createToolAction(payload);

      if (!result.ok) {
        setError(translateActionError(t, result));
        return;
      }

      handleOpenChange(false);
      showFeedback({
        type: "success",
        text: isEdit
          ? t("tools.feedback.updated", "Instruments saglabāts.")
          : t("tools.feedback.created", "Instruments pievienots."),
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
          ? t("tools.modal.edit_title", "Labot instrumentu")
          : t("tools.modal.create_title", "Jauns instruments")
      }
      description={isEdit ? tool?.name : undefined}
      blocking={isPending}
      dirty={isDirty}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tool-number" className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("tools.field.number", "Numurs")}
            </label>
            <input
              id="tool-number"
              type="text"
              value={toolNumber}
              onChange={(event) => {
                setToolNumber(event.target.value);
                setFieldErrors((current) => ({ ...current, toolNumber: undefined }));
                setError(null);
              }}
              autoFocus
              className={`${formInputClassName(Boolean(fieldErrors.toolNumber))} ${formInputFullWidthClass}`}
            />
            {fieldErrors.toolNumber ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {fieldErrors.toolNumber}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="tool-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("tools.field.name", "Nosaukums")}
            </label>
            <input
              id="tool-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setFieldErrors((current) => ({ ...current, name: undefined }));
                setError(null);
              }}
              className={`${formInputClassName(Boolean(fieldErrors.name))} ${formInputFullWidthClass}`}
            />
            {fieldErrors.name ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tool-purchase-date" className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("tools.field.purchase_date", "Iegādes datums")}
            </label>
            <input
              id="tool-purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
              className={`${formInputClassName()} ${formInputFullWidthClass}`}
            />
          </div>

          <div>
            <label htmlFor="tool-price" className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("tools.field.price", "Cena")}
            </label>
            <input
              id="tool-price"
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={`${formInputClassName()} ${formInputFullWidthClass}`}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tool-price-type" className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("tools.field.price_type", "Cenas veids")}
            </label>
            <select
              id="tool-price-type"
              value={priceType}
              onChange={(event) => setPriceType(event.target.value as ToolPriceType)}
              className={`${formInputClassName()} ${formInputFullWidthClass}`}
            >
              <option value="purchase">
                {t("tools.price_type.purchase", "Pirkšanas")}
              </option>
              <option value="amortization">
                {t("tools.price_type.amortization", "Amortizācijas")}
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="tool-assigned-worker" className="mb-1.5 block text-sm font-medium text-zinc-700">
              {t("tools.field.assigned_worker", "Pie darbinieka")}
            </label>
            <select
              id="tool-assigned-worker"
              value={assignedWorkerId}
              onChange={(event) => setAssignedWorkerId(event.target.value)}
              className={`${formInputClassName()} ${formInputFullWidthClass}`}
            >
              <option value="">
                {t("tools.assigned_worker.none", "Nav piesaistīts")}
              </option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {formatWorkerName(worker)}
                </option>
              ))}
            </select>
          </div>
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
            {isPending ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
