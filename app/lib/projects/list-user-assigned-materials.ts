import { aggregateProjectMaterials } from "@/app/lib/estimates/aggregate-project-materials";
import { syncCategoriesQuantitiesFromModuleSizes } from "@/app/lib/estimates/sync-module-size-quantities";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import { buildProjectModuleSizeOptions } from "@/app/lib/estimates/sync-module-size-quantities";
import { ensureDefaultEstimatePosition } from "@/app/lib/estimate-positions/repository";
import { syncVariableQuantityFromSagatave } from "@/app/lib/estimate-positions/sync-variable-quantity";
import { parseEstimatePositionDocumentPayload } from "@/app/lib/estimate-positions/serialize-document";
import { normalizeUserId } from "@/app/lib/auth/normalize-person-name";
import { resolveRelatedUserIds } from "@/app/lib/auth/resolve-related-user-ids";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { getBuildingModulesByIds } from "@/app/lib/modules/repository";
import type { BuildingModuleDetail } from "@/app/lib/modules/types";
import type { BuildingModuleSizeOption } from "@/app/lib/modules/types";
import { listPositionPrices } from "@/app/lib/positions/repository";
import type { PositionPriceSummary } from "@/app/lib/positions/types";
import { getProjectsByIds } from "@/app/lib/projects/repository";
import { isProjectEstimateLocked } from "@/app/lib/projects/project-status";
import type { EstimateMeta, ProjectSummary } from "@/app/lib/projects/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import type { UserSummary } from "@/app/lib/users/types";

export type UserAssignedMaterialsProjectGroup = {
  projectId: string;
  projectName: string;
  projectAddress: string;
  moduleName: string | null;
  assignedMaterialIds: string[];
  categories: EstimateCategory[];
  moduleSizeOptions: BuildingModuleSizeOption[];
  orderedMaterialPositionIds: string[];
  materialAssigneeUserIds: Record<string, string>;
};

type EstimateAssignmentRow = {
  project_id: string;
  meta: EstimateMeta | null;
  categories: unknown;
};

type MaterialAssignmentRow = {
  project_id: string;
  position_price_id: string;
  assignee_user_id: string;
};

type ListUserAssignedMaterialGroupsOptions = {
  relatedUserIds?: string[];
  allUsers?: UserSummary[];
  catalogPositions?: PositionPriceSummary[];
};

function resolveMatchingUserIds(
  userId: string,
  relatedUserIds: string[] = [],
): Set<string> {
  const matchingUserIds = new Set<string>();
  matchingUserIds.add(normalizeUserId(userId));

  for (const relatedUserId of relatedUserIds) {
    const normalized = normalizeUserId(relatedUserId);
    if (normalized) {
      matchingUserIds.add(normalized);
    }
  }

  return matchingUserIds;
}

function prepareCategoriesForMaterials(
  categories: EstimateCategory[],
  sagataveSections: EstimateCategory[],
  moduleSizeOptions: BuildingModuleSizeOption[],
  catalogPositions: PositionPriceSummary[],
): EstimateCategory[] {
  const categoriesWithVariableQty = syncVariableQuantityFromSagatave(
    categories,
    sagataveSections,
  );

  if (moduleSizeOptions.length === 0) {
    return categoriesWithVariableQty;
  }

  return syncCategoriesQuantitiesFromModuleSizes(
    categoriesWithVariableQty,
    moduleSizeOptions[0].projectDescription,
    catalogPositions,
  );
}

async function resolveProjectGroup(
  project: ProjectSummary,
  meta: EstimateMeta,
  categories: EstimateCategory[],
  catalogPositions: PositionPriceSummary[],
  sagataveSections: EstimateCategory[],
  matchingUserIds: Set<string>,
  buildingModule: BuildingModuleDetail | null,
): Promise<UserAssignedMaterialsProjectGroup | null> {
  const assignees = meta.materialAssigneeUserIds ?? {};
  const assignedIds = Object.entries(assignees)
    .filter(([, assigneeUserId]) =>
      matchingUserIds.has(normalizeUserId(assigneeUserId)),
    )
    .map(([positionPriceId]) => positionPriceId);

  if (assignedIds.length === 0) {
    return null;
  }

  const orderedIds = new Set(meta.orderedMaterialPositionIds ?? []);
  const pendingAssignedIds = assignedIds.filter((id) => !orderedIds.has(id));
  if (pendingAssignedIds.length === 0) {
    return null;
  }

  const displayModuleName = buildingModule?.name ?? "Individuāls projekts";
  const moduleSizeOptions = buildProjectModuleSizeOptions(
    project,
    buildingModule,
    displayModuleName,
    categories,
  );
  const preparedCategories = prepareCategoriesForMaterials(
    categories,
    sagataveSections,
    moduleSizeOptions,
    catalogPositions,
  );

  const materials = aggregateProjectMaterials(
    preparedCategories,
    catalogPositions,
    moduleSizeOptions,
    { useFrozenPrices: true },
  ).filter((row) => pendingAssignedIds.includes(row.positionPriceId));

  if (materials.length === 0) {
    return null;
  }

  const materialAssigneeUserIds = Object.fromEntries(
    materials.map((row) => {
      const assigneeUserId =
        assignees[row.positionPriceId] ?? Array.from(matchingUserIds)[0] ?? "";
      return [row.positionPriceId, assigneeUserId];
    }),
  );

  return {
    projectId: project.id,
    projectName: project.name,
    projectAddress: project.address,
    moduleName: buildingModule?.name ?? null,
    assignedMaterialIds: materials.map((row) => row.positionPriceId),
    categories: preparedCategories,
    moduleSizeOptions,
    orderedMaterialPositionIds: meta.orderedMaterialPositionIds ?? [],
    materialAssigneeUserIds,
  };
}

export async function listUserAssignedMaterialGroups(
  userId: string,
  options: ListUserAssignedMaterialGroupsOptions = {},
): Promise<UserAssignedMaterialsProjectGroup[]> {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    return [];
  }

  const relatedUserIds =
    options.relatedUserIds ??
    (options.allUsers
      ? resolveRelatedUserIds(
          trimmedUserId,
          options.allUsers.find((user) => user.id === trimmedUserId)?.name ??
            "",
          options.allUsers,
        )
      : undefined);

  const matchingUserIds = resolveMatchingUserIds(
    trimmedUserId,
    relatedUserIds,
  );

  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return [];
  }

  const supabase = createAdminClient();
  const { data: assignmentData, error: assignmentError } = await supabase
    .from("project_material_assignments")
    .select("project_id, position_price_id, assignee_user_id")
    .eq("company_id", companyId)
    .in("assignee_user_id", Array.from(matchingUserIds));

  if (assignmentError || !assignmentData || assignmentData.length === 0) {
    return [];
  }

  const assignments = assignmentData as MaterialAssignmentRow[];
  const assignmentsByProjectId = new Map<string, MaterialAssignmentRow[]>();
  for (const assignment of assignments) {
    const existing = assignmentsByProjectId.get(assignment.project_id) ?? [];
    existing.push(assignment);
    assignmentsByProjectId.set(assignment.project_id, existing);
  }

  const projectIds = Array.from(assignmentsByProjectId.keys());

  const [projects, catalogPositions, sagatave] = await Promise.all([
    getProjectsByIds(projectIds),
    options.catalogPositions
      ? Promise.resolve(options.catalogPositions)
      : listPositionPrices(),
    ensureDefaultEstimatePosition(),
  ]);

  const lockedProjects = projects.filter((project) =>
    isProjectEstimateLocked(project.status),
  );

  if (lockedProjects.length === 0) {
    return [];
  }

  const projectById = new Map(
    lockedProjects.map((project) => [project.id, project]),
  );

  const { data, error } = await supabase
    .from("estimates")
    .select("project_id, meta, categories")
    .eq("company_id", companyId)
    .in("project_id", lockedProjects.map((project) => project.id));

  if (error || !data) {
    return [];
  }

  const rows = (data as EstimateAssignmentRow[]).filter((row) => {
    const project = projectById.get(row.project_id);
    if (!project) {
      return false;
    }

    return assignmentsByProjectId.has(row.project_id);
  });
  const moduleIds = Array.from(
    new Set(
      rows
        .map((row) => projectById.get(row.project_id)?.buildingModuleId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const moduleCache = await getBuildingModulesByIds(moduleIds);
  const groups: UserAssignedMaterialsProjectGroup[] = [];

  for (const row of rows) {
    const project = projectById.get(row.project_id);
    if (!project) {
      continue;
    }

    const meta = (row.meta ?? {}) as EstimateMeta;
    const projectAssignments = assignmentsByProjectId.get(row.project_id) ?? [];
    const materialAssigneeUserIds = {
      ...(meta.materialAssigneeUserIds ?? {}),
      ...Object.fromEntries(
        projectAssignments.map((assignment) => [
          assignment.position_price_id,
          assignment.assignee_user_id,
        ]),
      ),
    };
    const metaWithAssignments: EstimateMeta = {
      ...meta,
      materialAssigneeUserIds,
    };
    const parsed = parseEstimatePositionDocumentPayload(row.categories);

    let buildingModule: BuildingModuleDetail | null = null;
    if (project.buildingModuleId) {
      buildingModule = moduleCache.get(project.buildingModuleId) ?? null;
    }

    const group = await resolveProjectGroup(
      project,
      metaWithAssignments,
      parsed.sections,
      catalogPositions,
      sagatave.sections,
      matchingUserIds,
      buildingModule,
    );

    if (group) {
      groups.push(group);
    }
  }

  return groups.sort((a, b) =>
    a.projectName.localeCompare(b.projectName, "lv"),
  );
}
