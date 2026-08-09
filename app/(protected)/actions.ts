"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { requireAction } from "@/app/lib/auth/require-permission";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { DEFAULT_CALLING_CODE } from "@/app/lib/geo/country-calling-codes";
import {
  createAdditionalWorkEstimate,
  deleteAdditionalWorkEstimate,
  saveAdditionalWorkEstimate,
} from "@/app/lib/additional-work-estimates/repository";
import {
  createProject,
  createExcludedPositionFromProject,
  deleteProject,
  omitProjectExcludedPosition,
  reorderProjectExcludedPositions,
  restoreProjectExcludedPosition,
  markProjectMaterialOrdered,
  assignProjectMaterialUser,
  saveProjectEstimate,
  updateProject,
  updateProjectEstimateDates,
  updateProjectEstimatePlannedProfit,
  updateProjectStatus,
} from "@/app/lib/projects/repository";
import { acknowledgeSagataveStructureIntro } from "@/app/lib/estimate-positions/sagatave-to-other-projects";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import type { ReorderExcludedPositionsInput } from "@/app/lib/excluded-positions/types";
import type { ProjectStatus } from "@/app/lib/projects/project-status";
import type { CreateProjectInput, UpdateProjectInput } from "@/app/lib/projects/types";
import type { EstimateMeta } from "@/app/lib/projects/types";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import type { MultiOptionLinkGroup } from "@/app/lib/estimates/types";
import { validateProjectContactFields } from "@/app/lib/validation/contact-fields";

const PROFIT_MODULE_DISABLED = {
  ok: false as const,
  error: "Plānotās peļņas modulis nav pieejams.",
};

const DELEGATED_ORDERS_MODULE_DISABLED = {
  ok: false as const,
  error: "Materiālu pasūtīšanas modulis nav pieejams.",
};

function statusActionPermission(status: ProjectStatus) {
  switch (status) {
    case "approved":
      return "project.approve" as const;
    case "rejected":
      return "project.reject" as const;
    case "completed":
      return "project.complete" as const;
    default:
      return "project.edit" as const;
  }
}

export async function createProjectAction(input: CreateProjectInput) {
  const { denied } = await requireAction("project.create");
  if (denied) return denied;

  const contact = validateProjectContactFields({
    email: input.email,
    phone: input.phone,
    phoneCallingCode: input.phoneCallingCode ?? DEFAULT_CALLING_CODE,
  });

  if (contact.error) {
    return { ok: false as const, error: contact.error };
  }

  const user = await getCurrentUser();
  const author = user ? mapUserDisplay(user).name : "";

  const result = await createProject(
    {
      ...input,
      email: contact.email,
      phone: contact.phone,
    },
    author,
  );

  if (result.ok) {
    revalidatePath("/");
  }

  return result;
}

export async function updateProjectAction(input: UpdateProjectInput) {
  const { denied } = await requireAction("project.edit");
  if (denied) return denied;

  const contact = validateProjectContactFields({
    email: input.email,
    phone: input.phone,
    phoneCallingCode: input.phoneCallingCode ?? DEFAULT_CALLING_CODE,
  });

  if (contact.error) {
    return { ok: false as const, error: contact.error };
  }

  const result = await updateProject({
    ...input,
    email: contact.email,
    phone: contact.phone,
  });

  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/${input.id}`);
  }

  return result;
}

export async function updateProjectEstimateDatesAction(
  projectId: string,
  dates: { date: string; deadline: string },
) {
  const { denied } = await requireAction("estimate.dates");
  if (denied) return denied;

  const result = await updateProjectEstimateDates(projectId, dates);

  if (result.ok) {
    revalidatePath(`/${projectId}`);
  }

  return result;
}

export async function updateProjectEstimatePlannedProfitAction(
  projectId: string,
  plannedProfitPercent: number,
) {
  const { denied } = await requireAction("estimate.save");
  if (denied) return denied;

  if (!(await isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.profit))) {
    return PROFIT_MODULE_DISABLED;
  }

  const result = await updateProjectEstimatePlannedProfit(
    projectId,
    plannedProfitPercent,
  );

  if (result.ok) {
    revalidatePath(`/${projectId}`);
  }

  return result;
}

export async function saveProjectEstimateAction(
  projectId: string,
  payload: {
    title: string;
    meta: EstimateMeta;
    categories: EstimateCategory[];
    multiOptionLinks: MultiOptionLinkGroup[];
  },
) {
  const { denied } = await requireAction("estimate.save");
  if (denied) return denied;

  const result = await saveProjectEstimate(projectId, payload);

  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/estimate");
    revalidatePath(`/${projectId}`);
  }

  return result;
}

export async function createAdditionalWorkEstimateAction(projectId: string) {
  const { denied } = await requireAction("estimate.save");
  if (denied) return denied;

  const user = await getCurrentUser();
  const author = user ? mapUserDisplay(user).name : "";

  const result = await createAdditionalWorkEstimate(projectId, author);

  if (result.ok) {
    revalidatePath(`/${projectId}`);
    revalidatePath(`/${projectId}/additional-work/${result.id}`);
  }

  return result;
}

export async function saveAdditionalWorkEstimateAction(
  projectId: string,
  estimateId: string,
  payload: {
    title: string;
    meta: EstimateMeta;
    categories: EstimateCategory[];
    multiOptionLinks: MultiOptionLinkGroup[];
  },
) {
  const { denied } = await requireAction("estimate.save");
  if (denied) return denied;

  const result = await saveAdditionalWorkEstimate(projectId, estimateId, payload);

  if (result.ok) {
    revalidatePath(`/${projectId}`);
    revalidatePath(`/${projectId}/additional-work/${estimateId}`);
  }

  return result;
}

export async function deleteAdditionalWorkEstimateAction(
  projectId: string,
  estimateId: string,
) {
  const { denied } = await requireAction("estimate.save");
  if (denied) return denied;

  const result = await deleteAdditionalWorkEstimate(projectId, estimateId);

  if (result.ok) {
    revalidatePath(`/${projectId}`);
    revalidatePath(`/${projectId}/additional-work/${estimateId}`);
  }

  return result;
}

export async function omitProjectExcludedPositionAction(
  projectId: string,
  excludedPositionId: string,
) {
  const { denied } = await requireAction("estimate.save");
  if (denied) return denied;

  const result = await omitProjectExcludedPosition(projectId, excludedPositionId);

  if (result.ok) {
    revalidatePath(`/${projectId}`);
  }

  return result;
}

export async function restoreProjectExcludedPositionAction(
  projectId: string,
  excludedPositionId: string,
) {
  const { denied } = await requireAction("estimate.save");
  if (denied) return denied;

  const result = await restoreProjectExcludedPosition(
    projectId,
    excludedPositionId,
  );

  if (result.ok) {
    revalidatePath(`/${projectId}`);
  }

  return result;
}

export async function createExcludedPositionFromProjectAction(
  projectId: string,
  name: string,
) {
  const { denied } = await requireAction("estimate.save");
  if (denied) return denied;

  const result = await createExcludedPositionFromProject(projectId, name);

  if (result.ok) {
    revalidatePath(`/${projectId}`);
    revalidatePath("/excluded-positions");
  }

  return result;
}

export async function reorderExcludedPositionsFromProjectAction(
  projectId: string,
  input: ReorderExcludedPositionsInput,
) {
  const { denied } = await requireAction("estimate.save");
  if (denied) return denied;

  const result = await reorderProjectExcludedPositions(projectId, input);

  if (result.ok) {
    revalidatePath(`/${projectId}`);
    revalidatePath("/excluded-positions");
  }

  return result;
}

export async function acknowledgeSagataveStructureIntroAction(projectId: string) {
  const { denied } = await requireAction("estimate.save");
  if (denied) return denied;

  const result = await acknowledgeSagataveStructureIntro(projectId);

  if (result.ok) {
    revalidatePath(`/${projectId}`);
    revalidatePath("/");
  }

  return result;
}

export async function markProjectMaterialOrderedAction(
  projectId: string,
  positionPriceId: string,
) {
  const { denied } = await requireAction("materials.order");
  if (denied) return denied;

  if (!(await isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.delegatedOrders))) {
    return DELEGATED_ORDERS_MODULE_DISABLED;
  }

  const result = await markProjectMaterialOrdered(projectId, positionPriceId);

  if (result.ok) {
    revalidatePath(`/${projectId}`);
    revalidatePath("/tasks");
    revalidatePath("/positions");
    revalidatePath("/", "layout");
    revalidatePath("/");
  }

  return result;
}

export async function assignProjectMaterialUserAction(
  projectId: string,
  positionPriceId: string,
  userId: string,
) {
  const { denied } = await requireAction("materials.assign");
  if (denied) return denied;

  if (!(await isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.delegatedOrders))) {
    return DELEGATED_ORDERS_MODULE_DISABLED;
  }

  const result = await assignProjectMaterialUser(
    projectId,
    positionPriceId,
    userId,
  );

  if (result.ok) {
    revalidatePath(`/${projectId}`);
    revalidatePath("/tasks");
    revalidatePath("/", "layout");
    revalidatePath("/");
  }

  return result;
}

export async function deleteProjectAction(id: string) {
  const { denied } = await requireAction("project.delete");
  if (denied) return denied;

  const result = await deleteProject(id);

  if (result.ok) {
    revalidatePath("/");
  }

  return result;
}

export async function updateProjectStatusAction(
  projectId: string,
  status: ProjectStatus,
) {
  const { denied } = await requireAction(statusActionPermission(status));
  if (denied) return denied;

  const result = await updateProjectStatus(projectId, status);

  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/${projectId}`);
  }

  return result;
}
