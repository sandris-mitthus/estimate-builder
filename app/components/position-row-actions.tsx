"use client";



import { useRouter } from "next/navigation";

import { useState, useTransition } from "react";

import {

  deletePositionAction,

  updatePositionAction,

  updatePositionUnitPriceAction,

} from "@/app/(protected)/positions/actions";

import { ConfirmModal } from "@/app/components/confirm-modal";

import { EditPositionModal } from "@/app/components/edit-position-modal";

import { IconActionButton } from "@/app/components/icon-action-button";

import { useActionPermission } from "@/app/components/action-permissions-context";

import { UpdatePositionPriceModal } from "@/app/components/update-position-price-modal";

import { PositionPriceHistoryModal } from "@/app/components/position-price-history-modal";

import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";

import type {
  PositionPriceSummary,
  UpdatePositionUnitPriceInput,
} from "@/app/lib/positions/types";



import type { CurrencyCode } from "@/app/lib/settings/currencies";



type PositionRowActionsProps = {

  position: PositionPriceSummary;

  knownUnits: string[];

  currency: CurrencyCode;

};



export function PositionRowActions({

  position,

  knownUnits,

  currency,

}: PositionRowActionsProps) {

  const router = useRouter();
  const canManage = useActionPermission("positions.manage");
  const { t } = useTranslations();

  const { showFeedback } = useFeedbackToast();

  const [editOpen, setEditOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [updatePriceOpen, setUpdatePriceOpen] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();



  function handleEditSave(input: {
    name: string;
    unit: string;
    costType: PositionPriceSummary["costType"];
    variableQuantity: boolean;
  }) {

    startTransition(async () => {

      const result = await updatePositionAction({

        id: position.id,

        name: input.name,

        unit: input.unit,

        costType: input.costType,

        variableQuantity: input.variableQuantity,

      });



      if (!result.ok) {

        showFeedback({ type: "error", text: translateActionError(t, result) });

        return;

      }



      setEditOpen(false);

      showFeedback({ type: "success", text: t("positions.feedback.updated", "Pozīcija atjaunināta.") });

      router.refresh();

    });

  }



  function handlePriceSave(
    input: Omit<UpdatePositionUnitPriceInput, "id">,
  ) {

    startTransition(async () => {

      const result = await updatePositionUnitPriceAction({

        id: position.id,

        ...input,

      });



      if (!result.ok) {

        showFeedback({ type: "error", text: translateActionError(t, result) });

        return;

      }



      setUpdatePriceOpen(false);

      showFeedback({ type: "success", text: t("positions.feedback.price_updated", "Cena atjaunināta.") });

      router.refresh();

    });

  }



  function handleConfirmDelete() {

    setDeleteError(null);



    startTransition(async () => {

      const result = await deletePositionAction(position.id);



      if (!result.ok) {

        setDeleteError(translateActionError(t, result));

        return;

      }



      setDeleteOpen(false);

      showFeedback({ type: "success", text: t("positions.feedback.deleted", "Pozīcija dzēsta.") });

      router.refresh();

    });

  }



  if (!canManage) {
    return null;
  }

  return (

    <>

      <div className="flex items-center justify-end gap-0.5">

        <IconActionButton

          label={t("actions.update", "Atjaunot")}

          icon="fas fa-level-up-alt"

          variant="approve"

          onClick={() => setUpdatePriceOpen(true)}

        />

        <IconActionButton

          label={t("common.history", "Vēsture")}

          icon="fas fa-history"

          variant="history"

          onClick={() => setHistoryOpen(true)}

        />

        <IconActionButton

          label={t("actions.edit", "Labot")}

          icon="fas fa-pen"

          variant="edit"

          onClick={() => setEditOpen(true)}

        />

        <IconActionButton

          label={t("actions.delete", "Dzēst")}

          icon="fas fa-trash"

          variant="delete"

          onClick={() => setDeleteOpen(true)}

        />

      </div>



      <EditPositionModal

        open={editOpen}

        onOpenChange={setEditOpen}

        position={position}

        knownUnits={knownUnits}

        onSave={handleEditSave}

        blocking={isPending}

      />



      <UpdatePositionPriceModal

        open={updatePriceOpen}

        onOpenChange={setUpdatePriceOpen}

        position={position}

        currency={currency}

        onSave={handlePriceSave}

        blocking={isPending}

      />



      <PositionPriceHistoryModal

        open={historyOpen}

        onOpenChange={setHistoryOpen}

        position={position}

        currency={currency}

      />



      <ConfirmModal

        open={deleteOpen}

        onOpenChange={setDeleteOpen}

        title={t("positions.delete.title", "Dzēst pozīciju?")}

        description={

          <>

            <p>

              {t("positions.delete.confirm_prefix", "Vai tiešām vēlies dzēst pozīciju")}{" "}

              <span className="font-medium text-zinc-900">{position.name}</span>?

            </p>

            {deleteError ? (

              <p className="mt-2 text-red-600" role="alert">

                {deleteError}

              </p>

            ) : null}

          </>

        }

        confirmLabel={
          isPending ? t("actions.deleting", "Dzēš…") : t("actions.delete", "Dzēst")
        }

        confirmVariant="danger"

        onConfirm={handleConfirmDelete}

        blocking={isPending}

      />

    </>

  );

}

