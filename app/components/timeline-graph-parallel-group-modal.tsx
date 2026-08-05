"use client";

import { AppModal } from "@/app/components/app-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { useTranslations } from "@/app/components/translations-provider";

export type TimelineGraphParallelGroupMember = {
  sectionId: string;
  title: string;
};

type TimelineGraphParallelGroupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: TimelineGraphParallelGroupMember[];
  canManage: boolean;
  pendingSectionIds: ReadonlySet<string>;
  onUnpair: (sectionId: string) => void;
};

export function TimelineGraphParallelGroupModal({
  open,
  onOpenChange,
  members,
  canManage,
  pendingSectionIds,
  onUnpair,
}: TimelineGraphParallelGroupModalProps) {
  const { t } = useTranslations();
  const isBusy = pendingSectionIds.size > 0;

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("timeline_graph.parallel.badge", "Paralēli")}
      description={t(
        "timeline_graph.parallel.modal.description",
        "Šīs pozīcijas sākas vienlaikus tajā pašā projektā. Noņem, lai atkal ietu secīgi.",
      )}
      dirty={false}
      blocking={isBusy}
    >
      {members.length > 0 ? (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200">
          {members.map((member) => {
            const loading = pendingSectionIds.has(member.sectionId);
            return (
              <li
                key={member.sectionId}
                className="flex items-center gap-2 px-3 py-2.5"
              >
                <i
                  className="fas fa-link shrink-0 text-[11px] text-violet-500"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800">
                  {member.title}
                </span>
                {canManage ? (
                  loading ? (
                    <i
                      className="fas fa-circle-notch fa-spin text-[12px] text-violet-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <IconActionButton
                      label={t(
                        "timeline_graph.parallel.unpair",
                        "Atvienot no paralēlās grupas",
                      )}
                      icon="fas fa-unlink"
                      variant="delete"
                      onClick={() => onUnpair(member.sectionId)}
                    />
                  )
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
          {t(
            "timeline_graph.parallel.modal.empty",
            "Šajā grupā vairs nav sapārotu pozīciju.",
          )}
        </p>
      )}
    </AppModal>
  );
}
