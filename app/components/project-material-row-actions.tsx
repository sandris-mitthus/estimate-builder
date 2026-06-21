"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markProjectMaterialOrderedAction } from "@/app/(protected)/actions";
import { updatePositionUnitPriceAction } from "@/app/(protected)/positions/actions";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { UpdatePositionPriceModal } from "@/app/components/update-position-price-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { AggregatedProjectMaterial } from "@/app/lib/estimates/aggregate-project-materials";
import type {
  PositionPriceSummary,
  UpdatePositionUnitPriceInput,
} from "@/app/lib/positions/types";
import {
  DEFAULT_CURRENCY,
  isCurrencyCode,
  type CurrencyCode,
} from "@/app/lib/settings/currencies";

type ProjectMaterialRowActionsProps = {
  projectId: string;
  material: AggregatedProjectMaterial;
  catalogPosition?: PositionPriceSummary;
  currency?: string | null;
  onOrdered: (orderedIds: string[]) => void;
  disabled?: boolean;
};

export function ProjectMaterialRowActions({
  projectId,
  material,
  catalogPosition,
  currency = null,
  onOrdered,
  disabled = false,
}: ProjectMaterialRowActionsProps) {
  const router = useRouter();
  const canOrder = useActionPermission("materials.order");
  const canUpdatePrice = useActionPermission("positions.manage");
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [updatePriceOpen, setUpdatePriceOpen] = useState(false);
  const [orderedConfirmOpen, setOrderedConfirmOpen] = useState(false);
  const [isOrdering, startOrderTransition] = useTransition();
  const [isPricePending, startPriceTransition] = useTransition();

  const resolvedCurrency: CurrencyCode =
    currency && isCurrencyCode(currency) ? currency : DEFAULT_CURRENCY;

  const position: PositionPriceSummary | null =
    catalogPosition ??
    ({
      id: material.positionPriceId,
      name: material.name,
      unit: material.unit,
      costType: "materials",
      unitPrice: material.catalogUnitPrice || material.unitPrice,
      variableQuantity: false,
    } satisfies PositionPriceSummary);

  function handleMarkOrdered() {
    if (disabled || isOrdering || isPricePending) return;

    clearFeedback();
    startOrderTransition(async () => {
      const result = await markProjectMaterialOrderedAction(
        projectId,
        material.positionPriceId,
      );

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      onOrdered(result.orderedIds);
      showFeedback({ type: "success", text: t("materials.feedback.ordered", "Materiāls atzīmēts kā pasūtīts.") });
    });
  }

  function handlePriceSave(input: Omit<UpdatePositionUnitPriceInput, "id">) {
    startPriceTransition(async () => {
      const result = await updatePositionUnitPriceAction({
        id: material.positionPriceId,
        ...input,
      });

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setUpdatePriceOpen(false);
      showFeedback({ type: "success", text: t("positions.feedback.price_updated", "Cena atjaunināta.") });
      router.refresh();
      setOrderedConfirmOpen(true);
    });
  }

  function handleConfirmOrderedAfterPriceUpdate() {
    if (disabled || isOrdering || isPricePending) return;

    clearFeedback();
    startOrderTransition(async () => {
      const result = await markProjectMaterialOrderedAction(
        projectId,
        material.positionPriceId,
      );

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setOrderedConfirmOpen(false);
      onOrdered(result.orderedIds);
      showFeedback({ type: "success", text: t("materials.feedback.ordered", "Materiāls atzīmēts kā pasūtīts.") });
    });
  }

  if (!canOrder && !canUpdatePrice) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-end gap-0.5">
        {canUpdatePrice ? (
          <IconActionButton
            label={
              material.hasPriceChange
                ? t("materials.price.update_changed", "Atjaunot cenu (kataloga cena atšķiras no budžeta)")
                : t("positions.price.update_title", "Atjaunot cenu")
            }
            icon="fas fa-level-up-alt"
            variant="approve"
            tooltipAlign="end"
            onClick={() => setUpdatePriceOpen(true)}
            className={
              disabled || isOrdering || isPricePending
                ? "pointer-events-none opacity-50"
                : material.hasPriceChange
                  ? "text-red-500 hover:bg-red-50 hover:text-red-700"
                  : ""
            }
          />
        ) : null}
        {canOrder ? (
          isOrdering ? (
            <span
              className="inline-flex h-8 w-8 items-center justify-center"
              role="status"
              aria-label={t("actions.saving", "Saglabā…")}
            >
              <i
                className="fas fa-spinner animate-spin text-sm text-zinc-400"
                aria-hidden="true"
              />
            </span>
          ) : (
            <IconActionButton
              label={t("materials.order.mark_ordered", "Pasūtīts")}
              icon="fas fa-check"
              variant="complete"
              tooltipAlign="end"
              onClick={handleMarkOrdered}
              className={
                disabled || isPricePending ? "pointer-events-none opacity-50" : ""
              }
            />
          )
        ) : null}
      </div>

      {position && canUpdatePrice ? (
        <UpdatePositionPriceModal
          open={updatePriceOpen}
          onOpenChange={setUpdatePriceOpen}
          position={position}
          currency={resolvedCurrency}
          onSave={handlePriceSave}
          blocking={isPricePending}
        />
      ) : null}

      {canOrder ? (
        <ConfirmModal
        open={orderedConfirmOpen}
        onOpenChange={setOrderedConfirmOpen}
        title={t("materials.order.confirm_title", "Vai pasūtīji materiālu?")}
        description={
          <p>
            {t("materials.order.confirm_prefix", "Materiāls")}{" "}
            <span className="font-medium text-zinc-900">{material.name}</span> —
            {t(
              "materials.order.confirm_suffix",
              "ja pasūtījums ir veikts, apstiprini, lai noņemtu to no saraksta.",
            )}
          </p>
        }
        confirmLabel={
          isOrdering ? t("actions.saving", "Saglabā…") : t("materials.order.confirm", "Jā, pasūtīts")
        }
        cancelLabel={t("actions.no", "Nē")}
        onConfirm={handleConfirmOrderedAfterPriceUpdate}
        blocking={isOrdering}
      />
      ) : null}
    </>
  );
}
