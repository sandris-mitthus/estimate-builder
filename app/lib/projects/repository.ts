import { defaultEstimateDeadline, projectCreatedDateIso } from "@/app/lib/estimates/sample-data";
import { ESTIMATE_KIND_MAIN } from "@/app/lib/estimates/kind";
import { resolveEstimateMeta } from "@/app/lib/estimates/resolve-estimate-meta";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import type { MultiOptionLinkGroup } from "@/app/lib/estimates/types";
import {
  buildEstimatePositionSectionsStorage,
  parseEstimatePositionDocumentPayload,
} from "@/app/lib/estimate-positions/serialize-document";
import { cloneSagataveDocumentForProject } from "@/app/lib/estimate-positions/clone-sagatave-for-project";
import { getProjectEstimateBaseFromSagatave } from "@/app/lib/estimate-positions/project-estimate-base";
import { sagataveHasPositionChangesForProject } from "@/app/lib/estimate-positions/sagatave-position-changes";
import { ensureDefaultEstimatePosition } from "@/app/lib/estimate-positions/repository";
import { propagateLaborTimeNormsFromProject } from "@/app/lib/estimate-positions/labor-time-norm-sync";
import { propagateProjectStructureToSagatave } from "@/app/lib/estimate-positions/project-structure-to-sagatave";
import {
  mergeMissingSagataveAsHiddenForProject,
  propagateSagataveStructureToOtherProjects,
} from "@/app/lib/estimate-positions/sagatave-to-other-projects";
import {
  createExcludedPosition,
  deleteExcludedPosition,
  reorderExcludedPositions,
} from "@/app/lib/excluded-positions/repository";
import type {
  ExcludedPosition,
  ReorderExcludedPositionsInput,
} from "@/app/lib/excluded-positions/types";
import { listPositionPrices } from "@/app/lib/positions/repository";
import {
  estimateHasStaleCatalogPrices,
  isProjectEstimateSaved,
} from "@/app/lib/positions/stale-catalog-price";
import { DEFAULT_CALLING_CODE } from "@/app/lib/geo/country-calling-codes";
import {
  getBuildingModule,
  getBuildingModulesByIds,
} from "@/app/lib/modules/repository";
import {
  buildPendingMaterialsModuleSizeOptions,
  hasPendingProjectMaterials,
} from "@/app/lib/projects/pending-project-materials";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { isMissingColumnError } from "@/app/lib/supabase/missing-column";
import {
  deleteDelegatedMaterialTodoTask,
  upsertDelegatedMaterialTodoTask,
} from "@/app/lib/todo/repository";
import {
  getProjectById as getSampleProjectById,
  SAMPLE_PROJECTS,
} from "@/app/lib/projects/sample-projects";
import {
  isProjectEstimateLocked,
  isProjectVisibleInList,
  normalizeProjectStatus,
  shouldShowStaleCatalogPriceWarnings,
  type ProjectStatus,
} from "@/app/lib/projects/project-status";
import type {
  CreateProjectInput,
  EstimateMeta,
  ProjectEstimate,
  ProjectSummary,
  UpdateProjectInput,
} from "@/app/lib/projects/types";
import { parseProjectModuleBlocks } from "@/app/lib/projects/project-module-utils";
import { validateProjectContactFields } from "@/app/lib/validation/contact-fields";
import { deleteAllProjectBlockFiles } from "@/app/lib/modules/file-storage";

type ProjectRow = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  created_at?: string;
  building_module_id?: string | null;
  visualization_blocks?: unknown;
  project_blocks?: unknown;
  project_description?: unknown;
  status?: string | null;
};

type EstimateRow = {
  id?: string;
  title: string;
  meta: EstimateMeta;
  categories: EstimateCategory[];
  updated_at?: string;
};

function mapProject(row: ProjectRow): ProjectSummary {
  const moduleBlocks = parseProjectModuleBlocks(row);

  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone ?? "",
    email: row.email ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
    buildingModuleId: row.building_module_id ?? null,
    visualizationBlocks: moduleBlocks.visualizationBlocks,
    projectBlocks: moduleBlocks.projectBlocks,
    projectDescription: moduleBlocks.projectDescription,
    status: normalizeProjectStatus(row.status),
  };
}

const PROJECT_BASE_COLUMNS =
  "id, name, address, phone, email, created_at, building_module_id, visualization_blocks, project_blocks";

const PROJECT_SELECT_VARIANTS = [
  `${PROJECT_BASE_COLUMNS}, project_description, status`,
  `${PROJECT_BASE_COLUMNS}, project_description`,
  `${PROJECT_BASE_COLUMNS}, status`,
  PROJECT_BASE_COLUMNS,
] as const;

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

function isRetryableProjectSelectError(
  error: { code?: string; message?: string } | null,
): boolean {
  return (
    isMissingColumnError(error, "project_description") ||
    isMissingColumnError(error, "status")
  );
}

async function fetchProjectRows(
  supabase: SupabaseAdminClient,
  companyId: string,
): Promise<ProjectRow[] | null> {
  let lastError: { message?: string } | null = null;

  for (const select of PROJECT_SELECT_VARIANTS) {
    const { data, error } = await supabase
      .from("projects")
      .select(select)
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });

    if (!error) {
      return (data ?? []) as unknown as ProjectRow[];
    }

    lastError = error;

    if (!isRetryableProjectSelectError(error)) {
      console.error("listProjects:", error.message);
      return null;
    }
  }

  if (lastError) {
    console.error("listProjects:", lastError.message);
  }

  return null;
}

async function fetchProjectRowById(
  supabase: SupabaseAdminClient,
  id: string,
  companyId: string,
): Promise<ProjectRow | null | undefined> {
  let lastError: { message?: string } | null = null;

  for (const select of PROJECT_SELECT_VARIANTS) {
    const { data, error } = await supabase
      .from("projects")
      .select(select)
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (!error) {
      return (data as unknown as ProjectRow | null) ?? null;
    }

    lastError = error;

    if (!isRetryableProjectSelectError(error)) {
      console.error("getProject:", error.message);
      return undefined;
    }
  }

  if (lastError) {
    console.error("getProject:", lastError.message);
  }

  return undefined;
}

function estimateMetaForProject(
  project: ProjectSummary,
  validityDays: number,
  overrides: Partial<EstimateMeta> = {},
): EstimateMeta {
  return resolveEstimateMeta(
    project.createdAt,
    project.address,
    validityDays,
    overrides,
  );
}

async function defaultEstimateForProject(
  project: ProjectSummary,
  validityDays: number,
): Promise<ProjectEstimate> {
  const base = await getProjectEstimateBaseFromSagatave();

  return {
    title: project.name,
    meta: estimateMetaForProject(project, validityDays),
    categories: base.categories,
    multiOptionLinks: base.multiOptionLinks,
  };
}

async function parseEstimateRow(
  row: EstimateRow | null,
  project: ProjectSummary,
  validityDays: number,
): Promise<ProjectEstimate> {
  if (!row) {
    return defaultEstimateForProject(project, validityDays);
  }

  const parsed = parseEstimatePositionDocumentPayload(row.categories);
  const hasCategories = parsed.sections.length > 0;
  const base = hasCategories ? null : await getProjectEstimateBaseFromSagatave();

  const meta = estimateMetaForProject(project, validityDays, {
    ...row.meta,
  });

  if (
    hasCategories &&
    row.updated_at &&
    !meta.savedAt &&
    isProjectEstimateSaved(meta, {
      projectCreatedAt: project.createdAt,
      estimateUpdatedAt: row.updated_at,
    })
  ) {
    meta.savedAt = row.updated_at;
    meta.pricesFrozen = true;
  }

  return {
    id: row.id,
    title: row.title || project.name,
    meta,
    categories: hasCategories ? parsed.sections : base!.categories,
    multiOptionLinks: hasCategories
      ? parsed.multiOptionLinks
      : base!.multiOptionLinks,
    updatedAt: row.updated_at,
  };
}

export type ProjectListBadges = {
  staleCatalogPriceProjectIds: Set<string>;
  newSagatavePositionProjectIds: Set<string>;
  sagatavePositionChangeProjectIds: Set<string>;
  pendingMaterialsProjectIds: Set<string>;
};

export async function getProjectListBadges(
  projects: ProjectSummary[],
): Promise<ProjectListBadges> {
  const empty: ProjectListBadges = {
    staleCatalogPriceProjectIds: new Set(),
    newSagatavePositionProjectIds: new Set(),
    sagatavePositionChangeProjectIds: new Set(),
    pendingMaterialsProjectIds: new Set(),
  };

  if (!isSupabaseAdminConfigured() || projects.length === 0) {
    return empty;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return empty;
  }

  // Only projects that can actually show a badge need their estimate JSON.
  // Archived / rejected / completed rows are skipped before the query.
  const badgeProjects = projects.filter(
    (project) =>
      shouldShowStaleCatalogPriceWarnings(project.status) ||
      project.status === "approved",
  );

  if (badgeProjects.length === 0) {
    return empty;
  }

  const [catalogPositions, companySettings, sagatave] = await Promise.all([
    listPositionPrices(),
    getCompanySettings(),
    ensureDefaultEstimatePosition(),
  ]);
  const defaultHourlyRate = companySettings.defaultHourlyRate;
  const projectById = new Map(
    badgeProjects.map((project) => [project.id, project]),
  );
  const approvedProjectById = new Map(
    badgeProjects
      .filter((project) => project.status === "approved")
      .map((project) => [project.id, project]),
  );
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("project_id, meta, categories, updated_at")
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN)
    .in(
      "project_id",
      badgeProjects.map((project) => project.id),
    );

  if (error || !data) {
    return empty;
  }

  const staleCatalogPriceProjectIds = new Set<string>();
  const newSagatavePositionProjectIds = new Set<string>();
  const sagatavePositionChangeProjectIds = new Set<string>();
  const pendingMaterialsProjectIds = new Set<string>();
  const moduleIds = Array.from(
    new Set(
      data
        .map((row) =>
          approvedProjectById.get(row.project_id as string)?.buildingModuleId,
        )
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const moduleCache = await getBuildingModulesByIds(moduleIds);

  for (const row of data) {
    const projectId = row.project_id as string;
    const project = projectById.get(projectId);
    if (!project) {
      continue;
    }

    const parsed = parseEstimatePositionDocumentPayload(
      row.categories as EstimateCategory[],
    );
    if (parsed.sections.length === 0) {
      continue;
    }

    const rawMeta = (row.meta ?? {}) as EstimateMeta;

    if (shouldShowStaleCatalogPriceWarnings(project.status)) {
      const meta = estimateMetaForProject(
        project,
        companySettings.estimateValidityDays,
        { ...rawMeta },
      );

      if (
        isProjectEstimateSaved(meta, {
          projectCreatedAt: project.createdAt,
          estimateUpdatedAt: row.updated_at as string | undefined,
        }) &&
        estimateHasStaleCatalogPrices(
          parsed.sections,
          catalogPositions,
          defaultHourlyRate,
        )
      ) {
        staleCatalogPriceProjectIds.add(projectId);
      }

      if (
        (rawMeta.unacknowledgedSagataveStructureIds ?? []).length > 0
      ) {
        newSagatavePositionProjectIds.add(projectId);
      }

      if (
        sagatave.sections.length > 0 &&
        sagataveHasPositionChangesForProject(sagatave.sections, parsed.sections)
      ) {
        sagatavePositionChangeProjectIds.add(projectId);
      }
    }

    const approvedProject = approvedProjectById.get(projectId);
    if (approvedProject) {
      const orderedIds = rawMeta.orderedMaterialPositionIds ?? [];

      let buildingModule: Awaited<ReturnType<typeof getBuildingModule>> = null;
      if (approvedProject.buildingModuleId) {
        buildingModule = moduleCache.get(approvedProject.buildingModuleId) ?? null;
      }

      const moduleName = buildingModule?.name ?? "Individuāls projekts";
      const moduleSizeOptions = buildPendingMaterialsModuleSizeOptions(
        approvedProject,
        buildingModule,
        moduleName,
        parsed.sections,
      );

      if (
        hasPendingProjectMaterials(
          parsed.sections,
          catalogPositions,
          moduleSizeOptions,
          orderedIds,
        )
      ) {
        pendingMaterialsProjectIds.add(projectId);
      }
    }
  }

  return {
    staleCatalogPriceProjectIds,
    newSagatavePositionProjectIds,
    sagatavePositionChangeProjectIds,
    pendingMaterialsProjectIds,
  };
}

export async function listProjectIdsWithStaleCatalogPrices(
  projects: ProjectSummary[],
): Promise<Set<string>> {
  const badges = await getProjectListBadges(projects);
  return badges.staleCatalogPriceProjectIds;
}

export async function listProjectIdsWithNewSagatavePositions(
  projects: ProjectSummary[],
): Promise<Set<string>> {
  const badges = await getProjectListBadges(projects);
  return badges.newSagatavePositionProjectIds;
}

export async function listProjectIdsWithPendingMaterials(
  projects: ProjectSummary[],
): Promise<Set<string>> {
  const badges = await getProjectListBadges(projects);
  return badges.pendingMaterialsProjectIds;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const projects = await listAllProjects();
  return projects.filter((project) => isProjectVisibleInList(project.status));
}

export async function listAllProjects(): Promise<ProjectSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return SAMPLE_PROJECTS;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return [];
  }

  const supabase = createAdminClient();
  const rows = await fetchProjectRows(supabase, companyId);

  if (!rows) {
    return [];
  }

  return rows.map(mapProject);
}

export async function getProject(id: string): Promise<ProjectSummary | null> {
  if (!isSupabaseAdminConfigured()) {
    return getSampleProjectById(id) ?? null;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return null;
  }

  const supabase = createAdminClient();
  const row = await fetchProjectRowById(supabase, id, companyId);

  if (!row) {
    return null;
  }

  return mapProject(row);
}

export async function getProjectsByIds(ids: string[]): Promise<ProjectSummary[]> {
  const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  if (uniqueIds.length === 0) {
    return [];
  }

  if (!isSupabaseAdminConfigured()) {
    return uniqueIds
      .map((id) => getSampleProjectById(id))
      .filter((project): project is ProjectSummary => project != null);
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT_VARIANTS[0])
    .eq("company_id", companyId)
    .in("id", uniqueIds);

  if (error || !data) {
    return [];
  }

  return (data as unknown as ProjectRow[]).map(mapProject);
}

export async function getProjectEstimate(id: string): Promise<ProjectEstimate | null> {
  const project = await getProject(id);
  if (!project) return null;

  const companySettings = await getCompanySettings();
  return getProjectEstimateForProject(project, companySettings.estimateValidityDays);
}

export async function getProjectEstimateForProject(
  project: ProjectSummary,
  validityDays: number,
): Promise<ProjectEstimate | null> {
  if (!isSupabaseAdminConfigured()) {
    return defaultEstimateForProject(project, validityDays);
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return defaultEstimateForProject(project, validityDays);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("id, title, meta, categories, updated_at")
    .eq("project_id", project.id)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN)
    .maybeSingle();

  if (error) {
    return defaultEstimateForProject(project, validityDays);
  }

  return parseEstimateRow(data as EstimateRow | null, project, validityDays);
}

/**
 * Project estimate + hidden sagatave structure sync in a single estimate read.
 * The merge runs in memory on the row we already loaded, so opening a project
 * does not query `estimates` twice.
 */
export async function getProjectEstimateWithSagataveSync(
  project: ProjectSummary,
  validityDays: number,
  sagatave: {
    sections: EstimateCategory[];
    multiOptionLinks: MultiOptionLinkGroup[];
  },
): Promise<ProjectEstimate | null> {
  if (!isSupabaseAdminConfigured()) {
    return defaultEstimateForProject(project, validityDays);
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return defaultEstimateForProject(project, validityDays);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("id, title, meta, categories, updated_at")
    .eq("project_id", project.id)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN)
    .maybeSingle();

  if (error) {
    return defaultEstimateForProject(project, validityDays);
  }

  let row = data as EstimateRow | null;

  if (row && shouldShowStaleCatalogPriceWarnings(project.status)) {
    const parsed = parseEstimatePositionDocumentPayload(row.categories);
    const merged = mergeMissingSagataveAsHiddenForProject(
      parsed.sections,
      parsed.multiOptionLinks,
      (row.meta ?? {}) as EstimateMeta,
      sagatave.sections,
      sagatave.multiOptionLinks,
    );

    if (merged.changed) {
      const categories = buildEstimatePositionSectionsStorage(
        merged.categories,
        merged.multiOptionLinks,
      ) as unknown as EstimateCategory[];

      row = { ...row, meta: merged.meta, categories };

      const { error: updateError } = await supabase
        .from("estimates")
        .update({ meta: merged.meta, categories })
        .eq("project_id", project.id)
        .eq("company_id", companyId)
        .eq("estimate_kind", ESTIMATE_KIND_MAIN);

      if (updateError) {
        console.error("syncHiddenSagataveStructure:", updateError.message);
      }
    }
  }

  return parseEstimateRow(row, project, validityDays);
}

export async function createProject(
  input: CreateProjectInput,
  author: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const clientName = input.clientName.trim();
  const address = input.address.trim();

  if (!clientName) {
    return { ok: false, error: "Ievadi pasūtītāja vārdu un uzvārdu." };
  }

  if (!address) {
    return { ok: false, error: "Ievadi adresi." };
  }

  if (input.buildingModuleId === undefined) {
    return { ok: false, error: "Izvēlies moduli." };
  }

  if (input.buildingModuleId) {
    const mod = await getBuildingModule(input.buildingModuleId);
    if (!mod) {
      return { ok: false, error: "Izvēlētais modulis vairs neeksistē." };
    }
  }

  if (input.copyEstimateFromProjectId) {
    const sourceProject = await getProject(input.copyEstimateFromProjectId);

    if (!sourceProject) {
      return { ok: false, error: "Avota projekts nav atrasts." };
    }

    if (sourceProject.buildingModuleId !== input.buildingModuleId) {
      return {
        ok: false,
        error: "Kopējot projektu, moduli nevar mainīt.",
      };
    }
  }

  const contact = validateProjectContactFields({
    email: input.email,
    phone: input.phone,
    phoneCallingCode: input.phoneCallingCode ?? DEFAULT_CALLING_CODE,
  });

  if (contact.error) {
    return { ok: false, error: contact.error };
  }

  const phone = contact.phone;
  const email = contact.email;

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      company_id: companyId,
      name: clientName,
      address,
      phone,
      email,
      building_module_id: input.buildingModuleId,
    })
    .select("id, created_at")
    .single();

  if (projectError || !project) {
    return { ok: false, error: "Neizdevās izveidot projektu." };
  }

  const companySettings = await getCompanySettings();
  const estimateDate = projectCreatedDateIso(project.created_at);
  const meta: EstimateMeta = {
    client: clientName,
    project: address,
    author,
    date: estimateDate,
    deadline: defaultEstimateDeadline(
      estimateDate,
      companySettings.estimateValidityDays,
    ),
    number: "",
  };

  let estimateCategories: EstimateCategory[];
  let estimateMultiOptionLinks: MultiOptionLinkGroup[];

  if (input.copyEstimateFromProjectId) {
    const sourceEstimate = await getProjectEstimate(input.copyEstimateFromProjectId);

    if (!sourceEstimate) {
      await supabase
        .from("projects")
        .delete()
        .eq("id", project.id)
        .eq("company_id", companyId);
      return { ok: false, error: "Avota projekta tāme nav atrasta." };
    }

    const cloned = cloneSagataveDocumentForProject(
      sourceEstimate.categories,
      sourceEstimate.multiOptionLinks,
    );
    estimateCategories = cloned.categories;
    estimateMultiOptionLinks = cloned.multiOptionLinks;
    meta.clonedFromProjectId = input.copyEstimateFromProjectId;
    if (sourceEstimate.meta.excludedPositionIdsOmitted?.length) {
      meta.excludedPositionIdsOmitted = [
        ...sourceEstimate.meta.excludedPositionIdsOmitted,
      ];
    }
  } else {
    const estimateBase = await getProjectEstimateBaseFromSagatave();
    estimateCategories = estimateBase.categories;
    estimateMultiOptionLinks = estimateBase.multiOptionLinks;
  }

  const categories = buildEstimatePositionSectionsStorage(
    estimateCategories,
    estimateMultiOptionLinks,
  );

  const { error: estimateError } = await supabase.from("estimates").insert({
    company_id: companyId,
    project_id: project.id,
    estimate_kind: ESTIMATE_KIND_MAIN,
    title: clientName,
    meta,
    categories,
  });

  if (estimateError) {
    await supabase
      .from("projects")
      .delete()
      .eq("id", project.id)
      .eq("company_id", companyId);
    return { ok: false, error: "Neizdevās izveidot tāmi." };
  }

  // Cilvēku skaits no pēdējā (vai kopēšanas avota) projekta + paralēlās saites.
  const { inheritTimelineGraphSettingsForProject } = await import(
    "@/app/lib/timeline-graph/cross-project-sync"
  );
  await inheritTimelineGraphSettingsForProject(project.id, {
    preferSourceProjectId: input.copyEstimateFromProjectId,
  });

  return { ok: true, id: project.id };
}

export async function updateProject(
  input: UpdateProjectInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const clientName = input.clientName.trim();
  const address = input.address.trim();

  if (!clientName) {
    return { ok: false, error: "Ievadi pasūtītāja vārdu un uzvārdu." };
  }

  if (!address) {
    return { ok: false, error: "Ievadi adresi." };
  }

  if (input.buildingModuleId === undefined) {
    return { ok: false, error: "Izvēlies moduli." };
  }

  if (input.buildingModuleId) {
    const mod = await getBuildingModule(input.buildingModuleId);
    if (!mod) {
      return { ok: false, error: "Izvēlētais modulis vairs neeksistē." };
    }
  }

  const contact = validateProjectContactFields({
    email: input.email,
    phone: input.phone,
    phoneCallingCode: input.phoneCallingCode ?? DEFAULT_CALLING_CODE,
  });

  if (contact.error) {
    return { ok: false, error: contact.error };
  }

  const editable = await assertProjectEstimateEditable(input.id);
  if (!editable.ok) {
    return editable;
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { error: projectError } = await supabase
    .from("projects")
    .update({
      name: clientName,
      address,
      phone: contact.phone,
      email: contact.email,
      building_module_id: input.buildingModuleId,
    })
    .eq("id", input.id)
    .eq("company_id", companyId);

  if (projectError) {
    return { ok: false, error: "Neizdevās saglabāt projektu." };
  }

  const { data: estimate, error: estimateFetchError } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", input.id)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN)
    .maybeSingle();

  if (estimateFetchError) {
    return { ok: false, error: "Neizdevās saglabāt tāmi." };
  }

  if (estimate) {
    const meta = (estimate.meta ?? {}) as EstimateMeta;
    const { error: estimateError } = await supabase
      .from("estimates")
      .update({
        title: clientName,
        meta: {
          ...meta,
          client: clientName,
          project: address,
        },
      })
      .eq("project_id", input.id)
      .eq("company_id", companyId)
      .eq("estimate_kind", ESTIMATE_KIND_MAIN);

    if (estimateError) {
      return { ok: false, error: "Neizdevās saglabāt tāmi." };
    }
  }

  return { ok: true };
}

async function assertProjectEstimateEditable(
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const project = await getProject(projectId);

  if (!project) {
    return { ok: false, error: "Projekts nav atrasts." };
  }

  if (isProjectEstimateLocked(project.status)) {
    return { ok: false, error: "Tāme ir apstiprināta un to vairs nevar labot." };
  }

  return { ok: true };
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const project = await getProject(projectId);

  if (!project) {
    return { ok: false, error: "Projekts nav atrasts." };
  }

  if (status === "approved" && project.status !== "active") {
    return { ok: false, error: "Projektu nevar apstiprināt šajā statusā." };
  }

  if (status === "rejected" && project.status === "rejected") {
    return { ok: false, error: "Projekts jau ir noraidīts." };
  }

  if (status === "completed" && project.status !== "approved") {
    return { ok: false, error: "Projektu nevar atzīmēt kā pabeigtu šajā statusā." };
  }

  if (status === "completed" && project.status === "completed") {
    return { ok: false, error: "Projekts jau ir pabeigts." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId)
    .eq("company_id", companyId);

  if (error) {
    if (isMissingColumnError(error, "status")) {
      return {
        ok: false,
        error: "Projekta statuss vēl nav pieejams. Palaid npm run db:migrate.",
      };
    }

    return { ok: false, error: "Neizdevās atjaunināt projekta statusu." };
  }

  if (status === "approved") {
    const { inheritTimelineGraphSettingsForProject } = await import(
      "@/app/lib/timeline-graph/cross-project-sync"
    );
    await inheritTimelineGraphSettingsForProject(projectId);
  }

  return { ok: true };
}

export async function updateProjectEstimateDates(
  projectId: string,
  dates: Pick<EstimateMeta, "date" | "deadline">,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const editable = await assertProjectEstimateEditable(projectId);
  if (!editable.ok) {
    return editable;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Tāme nav atrasta." };
  }

  const meta = {
    ...((data.meta ?? {}) as EstimateMeta),
    date: dates.date,
    deadline: dates.deadline,
  };

  const { error: updateError } = await supabase
    .from("estimates")
    .update({ meta })
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN);

  if (updateError) {
    return { ok: false, error: "Neizdevās saglabāt datumus." };
  }

  return { ok: true };
}

export async function updateProjectEstimatePlannedProfit(
  projectId: string,
  plannedProfitPercent: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const editable = await assertProjectEstimateEditable(projectId);
  if (!editable.ok) {
    return editable;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Tāme nav atrasta." };
  }

  const currentMeta = (data.meta ?? {}) as EstimateMeta;
  const meta: EstimateMeta = { ...currentMeta };

  if (plannedProfitPercent > 0) {
    meta.plannedProfitPercent = plannedProfitPercent;
  } else {
    delete meta.plannedProfitPercent;
  }

  const { error: updateError } = await supabase
    .from("estimates")
    .update({ meta })
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN);

  if (updateError) {
    return { ok: false, error: "Neizdevās saglabāt plānoto peļņu." };
  }

  return { ok: true };
}

export async function omitProjectExcludedPosition(
  projectId: string,
  excludedPositionId: string,
): Promise<{ ok: true; omittedIds: string[] } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const trimmedId = excludedPositionId.trim();
  if (!trimmedId) {
    return { ok: false, error: "Pozīcija nav norādīta." };
  }

  const editable = await assertProjectEstimateEditable(projectId);
  if (!editable.ok) {
    return editable;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Tāme nav atrasta." };
  }

  const currentMeta = (data.meta ?? {}) as EstimateMeta;
  const omittedIds = Array.from(
    new Set([...(currentMeta.excludedPositionIdsOmitted ?? []), trimmedId]),
  );

  const meta: EstimateMeta = {
    ...currentMeta,
    excludedPositionIdsOmitted: omittedIds,
  };

  const { error: updateError } = await supabase
    .from("estimates")
    .update({ meta })
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN);

  if (updateError) {
    return { ok: false, error: "Neizdevās noņemt pozīciju no projekta." };
  }

  return { ok: true, omittedIds };
}

export async function restoreProjectExcludedPosition(
  projectId: string,
  excludedPositionId: string,
): Promise<{ ok: true; omittedIds: string[] } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const trimmedId = excludedPositionId.trim();
  if (!trimmedId) {
    return { ok: false, error: "Pozīcija nav norādīta." };
  }

  const editable = await assertProjectEstimateEditable(projectId);
  if (!editable.ok) {
    return editable;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Tāme nav atrasta." };
  }

  const currentMeta = (data.meta ?? {}) as EstimateMeta;
  const omittedIds = (currentMeta.excludedPositionIdsOmitted ?? []).filter(
    (id) => id !== trimmedId,
  );

  const meta: EstimateMeta = {
    ...currentMeta,
    excludedPositionIdsOmitted:
      omittedIds.length > 0 ? omittedIds : undefined,
  };

  const { error: updateError } = await supabase
    .from("estimates")
    .update({ meta })
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN);

  if (updateError) {
    return { ok: false, error: "Neizdevās atjaunot pozīciju projektā." };
  }

  return { ok: true, omittedIds };
}

async function omitExcludedPositionOnOtherProjectEstimates(
  sourceProjectId: string,
  excludedPositionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("project_id, meta")
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN)
    .neq("project_id", sourceProjectId);

  if (error) {
    return { ok: false, error: "Neizdevās atjaunināt pārējos projektus." };
  }

  const rows = data ?? [];
  const updates = rows.map((row) => {
    const currentMeta = (row.meta ?? {}) as EstimateMeta;
    const omittedIds = Array.from(
      new Set([
        ...(currentMeta.excludedPositionIdsOmitted ?? []),
        excludedPositionId,
      ]),
    );

    return supabase
      .from("estimates")
      .update({
        meta: {
          ...currentMeta,
          excludedPositionIdsOmitted: omittedIds,
        },
      })
      .eq("project_id", row.project_id)
      .eq("company_id", companyId)
      .eq("estimate_kind", ESTIMATE_KIND_MAIN);
  });

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    return { ok: false, error: "Neizdevās atjaunināt pārējos projektus." };
  }

  return { ok: true };
}

export async function createExcludedPositionFromProject(
  sourceProjectId: string,
  name: string,
): Promise<{ ok: true; position: ExcludedPosition } | { ok: false; error: string }> {
  const editable = await assertProjectEstimateEditable(sourceProjectId);
  if (!editable.ok) {
    return editable;
  }

  const createResult = await createExcludedPosition({ name });
  if (!createResult.ok) {
    return createResult;
  }

  const omitResult = await omitExcludedPositionOnOtherProjectEstimates(
    sourceProjectId,
    createResult.position.id,
  );

  if (!omitResult.ok) {
    await deleteExcludedPosition(createResult.position.id);
    return omitResult;
  }

  return createResult;
}

export async function reorderProjectExcludedPositions(
  projectId: string,
  input: ReorderExcludedPositionsInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const editable = await assertProjectEstimateEditable(projectId);
  if (!editable.ok) {
    return editable;
  }

  return reorderExcludedPositions(input);
}

export async function markProjectMaterialOrdered(
  projectId: string,
  positionPriceId: string,
): Promise<
  { ok: true; orderedIds: string[] } | { ok: false; error: string }
> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const trimmedId = positionPriceId.trim();
  if (!trimmedId) {
    return { ok: false, error: "Materiāls nav norādīts." };
  }

  const project = await getProject(projectId);
  if (!project) {
    return { ok: false, error: "Projekts nav atrasts." };
  }

  if (!isProjectEstimateLocked(project.status)) {
    return {
      ok: false,
      error: "Materiālu pasūtīšanu var atzīmēt tikai apstiprinātam projektam.",
    };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Tāme nav atrasta." };
  }

  const currentMeta = (data.meta ?? {}) as EstimateMeta;
  const orderedIds = Array.from(
    new Set([...(currentMeta.orderedMaterialPositionIds ?? []), trimmedId]),
  );

  const meta: EstimateMeta = {
    ...currentMeta,
    orderedMaterialPositionIds: orderedIds,
  };

  if (currentMeta.materialAssigneeUserIds?.[trimmedId]) {
    const { [trimmedId]: _removed, ...remainingAssignees } =
      currentMeta.materialAssigneeUserIds;
    if (Object.keys(remainingAssignees).length > 0) {
      meta.materialAssigneeUserIds = remainingAssignees;
    } else {
      delete meta.materialAssigneeUserIds;
    }
  }

  const { error: updateError } = await supabase
    .from("estimates")
    .update({ meta })
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN);

  if (updateError) {
    return { ok: false, error: "Neizdevās atzīmēt materiālu kā pasūtītu." };
  }

  await supabase
    .from("project_material_assignments")
    .delete()
    .eq("company_id", companyId)
    .eq("project_id", projectId)
    .eq("position_price_id", trimmedId);

  const assignedUserId = currentMeta.materialAssigneeUserIds?.[trimmedId]?.trim();
  if (assignedUserId) {
    await deleteDelegatedMaterialTodoTask({
      companyId,
      userId: assignedUserId,
      projectId,
      positionPriceId: trimmedId,
    });
  }

  return { ok: true, orderedIds };
}

export async function assignProjectMaterialUser(
  projectId: string,
  positionPriceId: string,
  userId: string,
): Promise<
  | { ok: true; materialAssigneeUserIds: Record<string, string> }
  | { ok: false; error: string }
> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const trimmedMaterialId = positionPriceId.trim();
  const trimmedUserId = userId.trim();

  if (!trimmedMaterialId) {
    return { ok: false, error: "Materiāls nav norādīts." };
  }

  if (!trimmedUserId) {
    return { ok: false, error: "Lietotājs nav norādīts." };
  }

  const project = await getProject(projectId);
  if (!project) {
    return { ok: false, error: "Projekts nav atrasts." };
  }

  if (!isProjectEstimateLocked(project.status)) {
    return {
      ok: false,
      error: "Lietotāju var piešķirt tikai apstiprinātam projektam.",
    };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Tāme nav atrasta." };
  }

  const currentMeta = (data.meta ?? {}) as EstimateMeta;
  const materialAssigneeUserIds: Record<string, string> = {
    ...(currentMeta.materialAssigneeUserIds ?? {}),
    [trimmedMaterialId]: trimmedUserId,
  };

  const meta: EstimateMeta = {
    ...currentMeta,
    materialAssigneeUserIds,
  };

  const { error: updateError } = await supabase
    .from("estimates")
    .update({ meta })
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN);

  if (updateError) {
    return { ok: false, error: "Neizdevās piešķirt materiālu lietotājam." };
  }

  await supabase.from("project_material_assignments").upsert(
    {
      company_id: companyId,
      project_id: projectId,
      position_price_id: trimmedMaterialId,
      assignee_user_id: trimmedUserId,
    },
    { onConflict: "company_id,project_id,position_price_id" },
  );

  const catalogPositions = await listPositionPrices();
  const materialName =
    catalogPositions.find((position) => position.id === trimmedMaterialId)?.name ?? "";
  await upsertDelegatedMaterialTodoTask({
    companyId,
    userId: trimmedUserId,
    projectId,
    projectName: project.name,
    projectAddress: project.address,
    positionPriceId: trimmedMaterialId,
    materialName,
  });

  return { ok: true, materialAssigneeUserIds };
}

export async function saveProjectEstimate(
  projectId: string,
  payload: {
    title: string;
    meta: EstimateMeta;
    categories: EstimateCategory[];
    multiOptionLinks: MultiOptionLinkGroup[];
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const editable = await assertProjectEstimateEditable(projectId);
  if (!editable.ok) {
    return editable;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const categories = buildEstimatePositionSectionsStorage(
    payload.categories,
    payload.multiOptionLinks,
  );

  const { error } = await supabase
    .from("estimates")
    .update({ title: payload.title, meta: payload.meta, categories })
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_MAIN);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt tāmi." };
  }

  const structureSyncResult = await propagateProjectStructureToSagatave(
    payload.categories,
    payload.multiOptionLinks,
  );
  if (!structureSyncResult.ok) {
    return structureSyncResult;
  }

  if (structureSyncResult.addedNodeIds.length > 0) {
    const propagateResult = await propagateSagataveStructureToOtherProjects(
      projectId,
    );
    if (!propagateResult.ok) {
      return propagateResult;
    }
  }

  const syncResult = await propagateLaborTimeNormsFromProject(
    projectId,
    payload.categories,
  );
  if (!syncResult.ok) {
    return syncResult;
  }

  return { ok: true };
}

export async function deleteProject(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  await deleteAllProjectBlockFiles(id);

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst projektu." };
  }

  return { ok: true };
}
