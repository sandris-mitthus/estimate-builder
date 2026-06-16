"use client";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { assignProjectMaterialUserAction } from "@/app/(protected)/actions";
import { ProjectMaterialsTable } from "@/app/components/project-materials-table";
import { ProjectUsersPanel } from "@/app/components/project-users-panel";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import type { UserSummary } from "@/app/lib/users/types";

const PROJECT_MATERIAL_DELEGATION_DND_ID = "project-material-delegation-dnd";

type ProjectMaterialsDelegationPanelProps = {
  projectId: string;
  users: UserSummary[];
  materialAssigneeUserIds: Record<string, string>;
  showMaterialsColumn: boolean;
  categories: EstimateCategory[];
  catalogPositions: PositionPriceSummary[];
  moduleSizeOptions: BuildingModuleSizeOption[];
  orderedMaterialPositionIds: string[];
  currency?: string | null;
  useFrozenPrices?: boolean;
  onMaterialOrdered: (orderedIds: string[]) => void;
  onMaterialAssigneeChange: (assigneeUserIds: Record<string, string>) => void;
};

export function ProjectMaterialsDelegationPanel({
  projectId,
  users,
  materialAssigneeUserIds,
  showMaterialsColumn,
  categories,
  catalogPositions,
  moduleSizeOptions,
  orderedMaterialPositionIds,
  currency = null,
  useFrozenPrices = false,
  onMaterialOrdered,
  onMaterialAssigneeChange,
}: ProjectMaterialsDelegationPanelProps) {
  const router = useRouter();
  const canAssignMaterials = useActionPermission("materials.assign");
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeData = active.data.current as
      | { type?: string; userId?: string }
      | undefined;
    const overData = over.data.current as
      | { type?: string; positionPriceId?: string }
      | undefined;

    if (
      activeData?.type !== "delegation-user" ||
      overData?.type !== "delegation-material"
    ) {
      return;
    }

    const userId = activeData.userId;
    const positionPriceId = overData.positionPriceId;
    if (!userId || !positionPriceId) {
      return;
    }

    if (materialAssigneeUserIds[positionPriceId] === userId) {
      return;
    }

    clearFeedback();
    startTransition(async () => {
      const result = await assignProjectMaterialUserAction(
        projectId,
        positionPriceId,
        userId,
      );

      if (!result.ok) {
        showFeedback({ type: "error", text: result.error });
        return;
      }

      onMaterialAssigneeChange(result.materialAssigneeUserIds);
      router.refresh();
      showFeedback({
        type: "success",
        text: "Materiāls piešķirts lietotājam.",
      });
    });
  }

  if (!showMaterialsColumn) {
    return null;
  }

  return (
    <DndContext
      id={PROJECT_MATERIAL_DELEGATION_DND_ID}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div
          className={`lg:col-span-2 ${isPending ? "pointer-events-none opacity-90" : ""}`}
        >
          <ProjectMaterialsTable
            projectId={projectId}
            categories={categories}
            catalogPositions={catalogPositions}
            moduleSizeOptions={moduleSizeOptions}
            orderedMaterialPositionIds={orderedMaterialPositionIds}
            materialAssigneeUserIds={materialAssigneeUserIds}
            users={users}
            delegationEnabled={canAssignMaterials}
            currency={currency}
            useFrozenPrices={useFrozenPrices}
            onMaterialOrdered={onMaterialOrdered}
          />
        </div>
        {users.length > 0 ? (
          <div className="lg:col-span-1">
            <ProjectUsersPanel users={users} dragEnabled={canAssignMaterials} />
          </div>
        ) : null}
      </div>
    </DndContext>
  );
}
