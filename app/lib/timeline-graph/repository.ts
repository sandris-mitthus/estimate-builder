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
  normalizeTimelineGraphPeopleCount,
  timelineGraphPeopleCountKey,
} from "@/app/lib/timeline-graph/people-count";
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

type PeopleRow = {
  project_id: string;
  section_id: string;
  people_count: number;
};

type ParallelRow = {
  project_id: string;
  section_id: string;
  parallel_group_id: string;
};

const timelineGraphStatusSet = new Set<string>(TIMELINE_GRAPH_PROJECT_STATUSES);

export async function listTimelineGraphProjects(): Promise<TimelineGraphProject[]> {
  const projects = (await listAllProjects()).filter((project) =>
    timelineGraphStatusSet.has(project.status),
  );

  if (projects.length === 0) {
    return [];
  }

  const projectIds = projects.map((project) => project.id);
  const [orderByProjectId, peopleByKey, parallelByKey] = await Promise.all([
    loadTimelineGraphOrderMap(projectIds),
    loadTimelineGraphPeopleCountMap(projectIds),
    loadTimelineGraphParallelMap(projectIds),
  ]);
  const catalogPositions = await listPositionPrices();
  const moduleCache = new Map<
    string,
    Awaited<ReturnType<typeof getBuildingModule>>
  >();
  const categoriesByProjectId = await loadMainEstimateCategoriesByProjectId(
    projectIds,
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

    items.push(
      applyParallelGroupsToProject(
        applyPeopleCountsToProject(
          {
            id: project.id,
            name: project.name,
            address: project.address,
            status: project.status,
            laborWorkloadHours: calculateEstimateLaborWorkloadHours(categories, {
              catalogPositions,
              defaultHourlyRate: null,
              moduleSizeOptions,
            }),
            peopleCount: 1,
            categories: buildTimelineGraphCategories(
              categories,
              workloadOptions,
            ),
          },
          peopleByKey,
        ),
        parallelByKey,
      ),
    );
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

  // Jauna struktūra katram izsaukumam — bez kopīgām nested atsaucēm starp projektiem.
  return items.map((project) => ({
    ...project,
    categories: project.categories.map((category) => ({
      ...category,
      children: category.children.map((child) => ({ ...child })),
    })),
  }));
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

export async function updateTimelineGraphPeopleCount(
  projectId: string,
  sectionId: string,
  peopleCount: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const trimmedProjectId = projectId.trim();
  const trimmedSectionId = sectionId.trim();
  if (!trimmedProjectId || !trimmedSectionId) {
    return { ok: false, error: "Nederīgs cilvēku skaits." };
  }

  if (
    !Number.isFinite(peopleCount) ||
    peopleCount < 1 ||
    peopleCount > 99 ||
    !Number.isInteger(peopleCount)
  ) {
    return { ok: false, error: "Nederīgs cilvēku skaits." };
  }

  const normalizedPeople = normalizeTimelineGraphPeopleCount(peopleCount);

  const supabase = createAdminClient();
  const { data: owned, error: ownedError } = await supabase
    .from("projects")
    .select("id")
    .eq("company_id", companyId)
    .eq("id", trimmedProjectId)
    .in("status", [...TIMELINE_GRAPH_PROJECT_STATUSES])
    .maybeSingle();

  if (ownedError || !owned) {
    return { ok: false, error: "Neizdevās saglabāt cilvēku skaitu." };
  }

  if (normalizedPeople === 1) {
    const { error: deleteError } = await supabase
      .from("company_timeline_graph_people")
      .delete()
      .eq("company_id", companyId)
      .eq("project_id", trimmedProjectId)
      .eq("section_id", trimmedSectionId);

    if (deleteError) {
      return { ok: false, error: "Neizdevās saglabāt cilvēku skaitu." };
    }

    return { ok: true };
  }

  const { error: upsertError } = await supabase
    .from("company_timeline_graph_people")
    .upsert(
      {
        company_id: companyId,
        project_id: trimmedProjectId,
        section_id: trimmedSectionId,
        people_count: normalizedPeople,
      },
      { onConflict: "company_id,project_id,section_id" },
    );

  if (upsertError) {
    return { ok: false, error: "Neizdevās saglabāt cilvēku skaitu." };
  }

  return { ok: true };
}

/** Dzēš cilvēku skaita ierakstus konkrētām sadaļām vienā projektā (legacy tīrīšana). */
export async function clearTimelineGraphPeopleSections(
  projectId: string,
  sectionIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const trimmedProjectId = projectId.trim();
  const uniqueSectionIds = Array.from(
    new Set(sectionIds.map((id) => id.trim()).filter(Boolean)),
  );

  if (!trimmedProjectId || uniqueSectionIds.length === 0) {
    return { ok: true };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("company_timeline_graph_people")
    .delete()
    .eq("company_id", companyId)
    .eq("project_id", trimmedProjectId)
    .in("section_id", uniqueSectionIds);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt cilvēku skaitu." };
  }

  return { ok: true };
}

/**
 * Sapāro `sectionId` ar `targetSectionId` tajā pašā projektā (paralēli).
 * `targetSectionId === null` — atvieno no grupas.
 */
export async function setTimelineGraphParallelPair(
  projectId: string,
  sectionId: string,
  targetSectionId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const trimmedProjectId = projectId.trim();
  const trimmedSectionId = sectionId.trim();
  const trimmedTargetId = targetSectionId?.trim() || null;

  if (!trimmedProjectId || !trimmedSectionId) {
    return { ok: false, error: "Nevar sapārot šos darbus." };
  }

  if (trimmedTargetId && trimmedTargetId === trimmedSectionId) {
    return { ok: false, error: "Nevar sapārot šos darbus." };
  }

  const supabase = createAdminClient();
  const { data: owned, error: ownedError } = await supabase
    .from("projects")
    .select("id")
    .eq("company_id", companyId)
    .eq("id", trimmedProjectId)
    .in("status", [...TIMELINE_GRAPH_PROJECT_STATUSES])
    .maybeSingle();

  if (ownedError || !owned) {
    return { ok: false, error: "Neizdevās saglabāt paralēlo sapārojumu." };
  }

  if (!trimmedTargetId) {
    return clearParallelMembership(
      supabase,
      companyId,
      trimmedProjectId,
      trimmedSectionId,
    );
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("company_timeline_graph_parallel")
    .select("section_id, parallel_group_id")
    .eq("company_id", companyId)
    .eq("project_id", trimmedProjectId)
    .in("section_id", [trimmedSectionId, trimmedTargetId]);

  if (existingError) {
    return { ok: false, error: "Neizdevās saglabāt paralēlo sapārojumu." };
  }

  const bySection = new Map(
    (existingRows as ParallelRow[] | null)?.map((row) => [
      row.section_id,
      row.parallel_group_id,
    ]) ?? [],
  );

  const targetGroup = bySection.get(trimmedTargetId);
  const sourceGroup = bySection.get(trimmedSectionId);
  const groupId = targetGroup ?? sourceGroup ?? crypto.randomUUID();

  // Visas abās grupās esošās pozīcijas — vienu var sapārot ar vairākām.
  const sectionIdsToUpsert = new Set<string>([
    trimmedSectionId,
    trimmedTargetId,
  ]);

  for (const existingGroup of [sourceGroup, targetGroup]) {
    if (!existingGroup) {
      continue;
    }
    const { data: members, error: membersError } = await supabase
      .from("company_timeline_graph_parallel")
      .select("section_id")
      .eq("company_id", companyId)
      .eq("project_id", trimmedProjectId)
      .eq("parallel_group_id", existingGroup);

    if (membersError) {
      return { ok: false, error: "Neizdevās saglabāt paralēlo sapārojumu." };
    }

    for (const row of members ?? []) {
      sectionIdsToUpsert.add(row.section_id as string);
    }
  }

  const { error: upsertError } = await supabase
    .from("company_timeline_graph_parallel")
    .upsert(
      Array.from(sectionIdsToUpsert).map((sectionId) => ({
        company_id: companyId,
        project_id: trimmedProjectId,
        section_id: sectionId,
        parallel_group_id: groupId,
      })),
      { onConflict: "company_id,project_id,section_id" },
    );

  if (upsertError) {
    return { ok: false, error: "Neizdevās saglabāt paralēlo sapārojumu." };
  }

  return { ok: true };
}

async function clearParallelMembership(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string,
  projectId: string,
  sectionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: existing, error: existingError } = await supabase
    .from("company_timeline_graph_parallel")
    .select("parallel_group_id")
    .eq("company_id", companyId)
    .eq("project_id", projectId)
    .eq("section_id", sectionId)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: "Neizdevās saglabāt paralēlo sapārojumu." };
  }

  if (!existing) {
    return { ok: true };
  }

  const groupId = existing.parallel_group_id as string;

  const { error: deleteError } = await supabase
    .from("company_timeline_graph_parallel")
    .delete()
    .eq("company_id", companyId)
    .eq("project_id", projectId)
    .eq("section_id", sectionId);

  if (deleteError) {
    return { ok: false, error: "Neizdevās saglabāt paralēlo sapārojumu." };
  }

  const { data: remaining, error: remainingError } = await supabase
    .from("company_timeline_graph_parallel")
    .select("section_id")
    .eq("company_id", companyId)
    .eq("project_id", projectId)
    .eq("parallel_group_id", groupId);

  if (remainingError) {
    return { ok: false, error: "Neizdevās saglabāt paralēlo sapārojumu." };
  }

  if ((remaining?.length ?? 0) === 1) {
    const { error: soloDeleteError } = await supabase
      .from("company_timeline_graph_parallel")
      .delete()
      .eq("company_id", companyId)
      .eq("project_id", projectId)
      .eq("parallel_group_id", groupId);

    if (soloDeleteError) {
      return { ok: false, error: "Neizdevās saglabāt paralēlo sapārojumu." };
    }
  }

  return { ok: true };
}

function applyParallelGroupsToProject(
  project: TimelineGraphProject,
  parallelByKey: Map<string, string>,
): TimelineGraphProject {
  return {
    ...project,
    parallelGroupId:
      parallelByKey.get(
        timelineGraphPeopleCountKey(project.id, project.id),
      ) || undefined,
    categories: project.categories.map((category) => {
      const hasSubcategories = category.children.some(
        (child) => child.kind === "subcategory",
      );
      const storedCategoryGroup = parallelByKey.get(
        timelineGraphPeopleCountKey(project.id, category.id),
      );
      const legacyDirectGroup =
        !hasSubcategories && category.children.length === 1
          ? parallelByKey.get(
              timelineGraphPeopleCountKey(
                project.id,
                category.children[0]!.id,
              ),
            )
          : undefined;
      const categoryGroup = storedCategoryGroup ?? legacyDirectGroup;

      return {
        ...category,
        parallelGroupId: categoryGroup || undefined,
        children: category.children.map((child) => ({
          ...child,
          parallelGroupId: hasSubcategories
            ? parallelByKey.get(
                timelineGraphPeopleCountKey(project.id, child.id),
              ) || undefined
            : categoryGroup || undefined,
        })),
      };
    }),
  };
}

async function loadTimelineGraphParallelMap(
  projectIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  if (!isSupabaseAdminConfigured() || projectIds.length === 0) {
    return map;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return map;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_timeline_graph_parallel")
    .select("project_id, section_id, parallel_group_id")
    .eq("company_id", companyId)
    .in("project_id", projectIds);

  if (error || !data) {
    return map;
  }

  for (const row of data as ParallelRow[]) {
    const groupId = row.parallel_group_id.trim();
    if (!groupId) {
      continue;
    }
    map.set(
      timelineGraphPeopleCountKey(row.project_id, row.section_id),
      groupId,
    );
  }

  return map;
}

function applyPeopleCountsToProject(
  project: TimelineGraphProject,
  peopleByKey: Map<string, number>,
): TimelineGraphProject {
  return {
    ...project,
    peopleCount:
      peopleByKey.get(
        timelineGraphPeopleCountKey(project.id, project.id),
      ) ?? 1,
    categories: project.categories.map((category) => {
      const hasSubcategories = category.children.some(
        (child) => child.kind === "subcategory",
      );
      const storedCategoryPeople = peopleByKey.get(
        timelineGraphPeopleCountKey(project.id, category.id),
      );
      const legacyDirectPeople =
        !hasSubcategories && category.children.length === 1
          ? peopleByKey.get(
              timelineGraphPeopleCountKey(
                project.id,
                category.children[0]!.id,
              ),
            )
          : undefined;
      const categoryPeople =
        storedCategoryPeople ?? legacyDirectPeople ?? 1;

      return {
        ...category,
        peopleCount: categoryPeople,
        children: category.children.map((child) => ({
          ...child,
          peopleCount: hasSubcategories
            ? (peopleByKey.get(
                timelineGraphPeopleCountKey(project.id, child.id),
              ) ?? 1)
            : categoryPeople,
        })),
      };
    }),
  };
}

async function loadTimelineGraphPeopleCountMap(
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
    .from("company_timeline_graph_people")
    .select("project_id, section_id, people_count")
    .eq("company_id", companyId)
    .in("project_id", projectIds);

  if (error || !data) {
    return map;
  }

  for (const row of data as PeopleRow[]) {
    map.set(
      timelineGraphPeopleCountKey(row.project_id, row.section_id),
      normalizeTimelineGraphPeopleCount(row.people_count),
    );
  }

  return map;
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
