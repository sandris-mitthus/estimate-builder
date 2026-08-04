import { ESTIMATE_KIND_MAIN } from "@/app/lib/estimates/kind";
import { calculateEstimateLaborWorkloadHours } from "@/app/lib/estimates/calculate-section-volume-totals";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import { parseEstimatePositionDocumentPayload } from "@/app/lib/estimate-positions/serialize-document";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { getBuildingModule } from "@/app/lib/modules/repository";
import { buildProjectModuleSizeOptions } from "@/app/lib/estimates/sync-module-size-quantities";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { listAllProjects } from "@/app/lib/projects/repository";
import { buildTimelineGraphCategories } from "@/app/lib/timeline-graph/build-sections";
import {
  TIMELINE_GRAPH_PROJECT_STATUSES,
  type TimelineGraphProject,
} from "@/app/lib/timeline-graph/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

type OrderRow = {
  project_id: string;
  sort_order: number;
};

const timelineGraphStatusSet = new Set<string>(TIMELINE_GRAPH_PROJECT_STATUSES);

export async function listTimelineGraphProjects(): Promise<TimelineGraphProject[]> {
  const projects = (await listAllProjects()).filter((project) =>
    timelineGraphStatusSet.has(project.status),
  );

  if (projects.length === 0) {
    return [];
  }

  const orderByProjectId = await loadTimelineGraphOrderMap(
    projects.map((project) => project.id),
  );
  const catalogPositions = await listPositionPrices();
  const moduleCache = new Map<
    string,
    Awaited<ReturnType<typeof getBuildingModule>>
  >();
  const categoriesByProjectId = await loadMainEstimateCategoriesByProjectId(
    projects.map((project) => project.id),
  );

  const items: TimelineGraphProject[] = [];

  for (const project of projects) {
    const categories = categoriesByProjectId.get(project.id) ?? [];
    let buildingModule = null;

    if (project.buildingModuleId) {
      if (!moduleCache.has(project.buildingModuleId)) {
        moduleCache.set(
          project.buildingModuleId,
          await getBuildingModule(project.buildingModuleId),
        );
      }
      buildingModule = moduleCache.get(project.buildingModuleId) ?? null;
    }

    const moduleSizeOptions = buildProjectModuleSizeOptions(
      project,
      buildingModule,
      buildingModule?.name ?? project.name,
      categories,
    );
    const workloadOptions = {
      catalogPositions,
      moduleSizeOptions,
    };

    items.push({
      id: project.id,
      name: project.name,
      address: project.address,
      status: project.status,
      laborWorkloadHours: calculateEstimateLaborWorkloadHours(categories, {
        catalogPositions,
        defaultHourlyRate: null,
        moduleSizeOptions,
      }),
      categories: buildTimelineGraphCategories(categories, workloadOptions),
    });
  }

  items.sort((left, right) => {
    const leftOrder = orderByProjectId.get(left.id);
    const rightOrder = orderByProjectId.get(right.id);

    if (leftOrder != null && rightOrder != null && leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    if (leftOrder != null && rightOrder == null) {
      return -1;
    }

    if (leftOrder == null && rightOrder != null) {
      return 1;
    }

    return left.name.localeCompare(right.name, "lv");
  });

  return items;
}

export async function reorderTimelineGraphProjects(
  projectIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const uniqueIds = Array.from(
    new Set(projectIds.map((id) => id.trim()).filter(Boolean)),
  );

  if (uniqueIds.length === 0) {
    return { ok: false, error: "Nav projektu secībai." };
  }

  const supabase = createAdminClient();
  const { data: owned, error: ownedError } = await supabase
    .from("projects")
    .select("id")
    .eq("company_id", companyId)
    .in("id", uniqueIds)
    .in("status", [...TIMELINE_GRAPH_PROJECT_STATUSES]);

  if (ownedError || !owned) {
    return { ok: false, error: "Neizdevās saglabāt secību." };
  }

  const ownedIds = new Set(owned.map((row) => row.id as string));
  const orderedOwnedIds = uniqueIds.filter((id) => ownedIds.has(id));

  if (orderedOwnedIds.length === 0) {
    return { ok: false, error: "Nav projektu secībai." };
  }

  const { error: deleteError } = await supabase
    .from("company_timeline_graph_order")
    .delete()
    .eq("company_id", companyId)
    .in("project_id", orderedOwnedIds);

  if (deleteError) {
    return { ok: false, error: "Neizdevās saglabāt secību." };
  }

  const rows = orderedOwnedIds.map((projectId, index) => ({
    company_id: companyId,
    project_id: projectId,
    sort_order: index,
  }));

  const { error: insertError } = await supabase
    .from("company_timeline_graph_order")
    .insert(rows);

  if (insertError) {
    return { ok: false, error: "Neizdevās saglabāt secību." };
  }

  return { ok: true };
}

async function loadTimelineGraphOrderMap(
  projectIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  if (!isSupabaseAdminConfigured() || projectIds.length === 0) {
    return map;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return map;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_timeline_graph_order")
    .select("project_id, sort_order")
    .eq("company_id", companyId)
    .in("project_id", projectIds);

  if (error || !data) {
    return map;
  }

  for (const row of data as OrderRow[]) {
    map.set(row.project_id, row.sort_order);
  }

  return map;
}

async function loadMainEstimateCategoriesByProjectId(
  projectIds: string[],
): Promise<Map<string, EstimateCategory[]>> {
  const map = new Map<string, EstimateCategory[]>();

  if (!isSupabaseAdminConfigured() || projectIds.length === 0) {
    return map;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return map;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("project_id, categories")
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN)
    .in("project_id", projectIds);

  if (error || !data) {
    return map;
  }

  for (const row of data) {
    const projectId = row.project_id as string;
    const parsed = parseEstimatePositionDocumentPayload(row.categories);
    map.set(projectId, parsed.sections);
  }

  return map;
}
