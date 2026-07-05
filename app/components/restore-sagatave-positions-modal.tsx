"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ModalFormActions } from "@/app/components/modal-form-actions";
import { useTranslations } from "@/app/components/translations-provider";
import type { MissingSagatavePositionGroup } from "@/app/lib/estimate-positions/sagatave-has-new-positions";

type RestoreSagatavePositionsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: MissingSagatavePositionGroup[];
  disabled?: boolean;
  onConfirm: (selectedSagataveRowIds: Set<string>) => void;
};

function collectAllRowIds(groups: MissingSagatavePositionGroup[]): Set<string> {
  return new Set(
    groups.flatMap((group) => group.positions.map((position) => position.sagataveRowId)),
  );
}

export function RestoreSagatavePositionsModal({
  open,
  onOpenChange,
  groups,
  disabled = false,
  onConfirm,
}: RestoreSagatavePositionsModalProps) {
  const { t } = useTranslations();
  const allRowIds = useMemo(() => collectAllRowIds(groups), [groups]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(allRowIds));

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(allRowIds));
    }
  }, [open, allRowIds]);

  const dirty = useMemo(() => {
    if (selectedIds.size !== allRowIds.size) {
      return true;
    }

    for (const rowId of allRowIds) {
      if (!selectedIds.has(rowId)) {
        return true;
      }
    }

    return false;
  }, [allRowIds, selectedIds]);

  function toggleRow(rowId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedIds.size === 0 || disabled) {
      return;
    }

    onConfirm(selectedIds);
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("estimate.sagatave.restore_title", "Pozīcijas no sagataves")}
      description={t(
        "estimate.sagatave.restore_description",
        "Atzīmē kategorijas, subkategorijas un pozīcijas, kuras pievienot šai tāmei",
      )}
      blocking={disabled}
      dirty={dirty}
      panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="max-h-[min(24rem,calc(100vh-14rem))] space-y-4 overflow-y-auto pr-1">
          {groups.map((group) => (
            <section
              key={`${group.categoryTitle}\0${group.subcategoryTitle ?? ""}`}
              className="rounded-xl border border-zinc-200 bg-zinc-50/80"
            >
              <header className="border-b border-zinc-200 px-3 py-2">
                <p className="text-sm font-semibold text-zinc-800">{group.categoryTitle}</p>
                {group.subcategoryTitle ? (
                  <p className="text-xs text-zinc-500">{group.subcategoryTitle}</p>
                ) : null}
              </header>
              <ul className="divide-y divide-zinc-100">
                {group.positions.map((position) => {
                  const checked = selectedIds.has(position.sagataveRowId);
                  const structureLabel =
                    group.structureKind === "category"
                      ? t("estimate.sagatave.structure.category", "Kategorija")
                      : group.structureKind === "subcategory"
                        ? t(
                            "estimate.sagatave.structure.subcategory",
                            "Subkategorija",
                          )
                        : null;

                  return (
                    <li key={position.sagataveRowId}>
                      <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-white">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleRow(position.sagataveRowId)}
                        />
                        <span className="min-w-0 break-words">
                          {structureLabel ? (
                            <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                              {structureLabel}
                            </span>
                          ) : null}
                          {position.name.trim() ||
                            t("common.untitled", "Bez nosaukuma")}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <ModalFormActions
          onCancel={() => onOpenChange(false)}
          cancelDisabled={disabled}
        >
          <button
            type="submit"
            disabled={disabled || selectedIds.size === 0}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("estimate.sagatave.add_selected", "Pievienot izvēlētās")}
          </button>
        </ModalFormActions>
      </form>
    </AppModal>
  );
}
