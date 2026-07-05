"use client";

import { IconActionButton } from "@/app/components/icon-action-button";
import { DeleteButton } from "@/app/components/delete-button";
import { useTranslations } from "@/app/components/translations-provider";

const sectionIconBtnClass = "h-7 w-7 rounded-md";

export function EstimateSectionRowActions({
  onAddSub,
  onAddMulti,
  onAddItem,
  onDelete,
  deleteLabel,
  showSub = true,
  estimateLocked = false,
}: {
  onAddSub?: () => void;
  onAddMulti?: () => void;
  onAddItem: () => void;
  onDelete: () => void;
  deleteLabel: string;
  showSub?: boolean;
  estimateLocked?: boolean;
}) {
  const { t } = useTranslations();

  if (estimateLocked) {
    return null;
  }

  return (
    <div className="flex h-7 shrink-0 items-center gap-0.5">
      {showSub && onAddSub ? (
        <IconActionButton
          label={t("estimate.actions.add_subcategory", "Pievienot subkategoriju")}
          icon="fas fa-stream"
          onClick={onAddSub}
          variant="edit"
          tooltipAlign="end"
          className={sectionIconBtnClass}
        />
      ) : null}
      {onAddMulti ? (
        <IconActionButton
          label={t("estimate.actions.add_multi", "Pievienot multi-pozīciju")}
          icon="fas fa-table-cells"
          onClick={onAddMulti}
          variant="edit"
          tooltipAlign="end"
          className={sectionIconBtnClass}
        />
      ) : null}
      <IconActionButton
        label={t("estimate.actions.add_position", "Pievienot pozīciju")}
        icon="fas fa-list-ol"
        onClick={onAddItem}
        variant="edit"
        tooltipAlign="end"
        className={sectionIconBtnClass}
      />
      <DeleteButton label={deleteLabel} onClick={onDelete} tooltipAlign="end" />
    </div>
  );
}
