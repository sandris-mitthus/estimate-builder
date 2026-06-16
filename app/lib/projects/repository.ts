import { defaultEstimateDeadline, projectCreatedDateIso } from "@/app/lib/estimates/sample-data";
import { resolveEstimateMeta } from "@/app/lib/estimates/resolve-estimate-meta";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import type { MultiOptionLinkGroup } from "@/app/lib/estimates/types";
import {
  buildEstimatePositionSectionsStorage,
  parseEstimatePositionDocumentPayload,
} from "@/app/lib/estimate-positions/serialize-document";
import { cloneSagataveDocumentForProject } from "@/app/lib/estimate-positions/clone-sagatave-for-project";
import { getProjectEstimateBaseFromSagatave } from "@/app/lib/estimate-positions/project-estimate-base";
import { sagataveHasNewPositionsForProject } from "@/app/lib/estimate-positions/sagatave-has-new-positions";
import { ensureDefaultEstimatePosition } from "@/app/lib/estimate-positions/repository";
import { listPositionPrices } from "@/app/lib/positions/repository";
import {
  estimateHasStaleCatalogPrices,
  isProjectEstimateSaved,
} from "@/app/lib/positions/stale-catalog-price";
import { DEFAULT_CALLING_CODE } from "@/app/lib/geo/country-calling-codes";
import { getBuildingModule } from "@/app/lib/modules/repository";
import {
  buildPendingMaterialsModuleSizeOptions,
  hasPendingProjectMaterials,
} from "@/app/lib/projects/pending-project-materials";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { isMissingColumnError } from "@/app/lib/supabase/missing-column";
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
import { parseProjectModuleBlocks } from "@/app/lib/projects/project-module-data";
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
): Promise<ProjectRow[] | null> {
  let lastError: { message?: string } | null = null;

  for (const select of PROJECT_SELECT_VARIANTS) {
    const { data, error } = await supabase
      .from("projects")
      .select(select)
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
): Promise<ProjectRow | null | undefined> {
  let lastError: { message?: string } | null = null;

  for (const select of PROJECT_SELECT_VARIANTS) {
    const { data, error } = await supabase
      .from("projects")
      .select(select)
      .eq("id", id)
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
    title: row.title || project.name,
    meta,
    categories: hasCategories ? parsed.sections : base!.categories,
    multiOptionLinks: hasCategories
      ? parsed.multiOptionLinks
      : base!.multiOptionLinks,
    updatedAt: row.updated_at,
  };
}

export async function listProjectIdsWithStaleCatalogPrices(
  projects: ProjectSummary[],
): Promise<Set<string>> {
  if (!isSupabaseAdminConfigured() || projects.length === 0) {
    return new Set();
  }

  const [catalogPositions, companySettings] = await Promise.all([
    listPositionPrices(),
    getCompanySettings(),
  ]);
  const defaultHourlyRate = companySettings.defaultHourlyRate;
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("project_id, meta, categories, updated_at")
    .in(
      "project_id",
      projects.map((project) => project.id),
    );

  if (error || !data) {
    return new Set();
  }

  const staleProjectIds = new Set<string>();

  for (const row of data) {
    const project = projectById.get(row.project_id as string);
    if (!project || !shouldShowStaleCatalogPriceWarnings(project.status)) {
      continue;
    }

    const parsed = parseEstimatePositionDocumentPayload(
      row.categories as EstimateCategory[],
    );
    if (parsed.sections.length === 0) {
      continue;
    }

    const meta = estimateMetaForProject(
      project,
      companySettings.estimateValidityDays,
      {
        ...((row.meta ?? {}) as EstimateMeta),
      },
    );

    if (
      !isProjectEstimateSaved(meta, {
        projectCreatedAt: project.createdAt,
        estimateUpdatedAt: row.updated_at as string | undefined,
      })
    ) {
      continue;
    }

    if (
      estimateHasStaleCatalogPrices(
        parsed.sections,
        catalogPositions,
        defaultHourlyRate,
      )
    ) {
      staleProjectIds.add(project.id);
    }
  }

  return staleProjectIds;
}

export async function listProjectIdsWithNewSagatavePositions(
  projects: ProjectSummary[],
): Promise<Set<string>> {
  if (!isSupabaseAdminConfigured() || projects.length === 0) {
    return new Set();
  }

  const sagatave = await ensureDefaultEstimatePosition();
  if (sagatave.sections.length === 0) {
    return new Set();
  }

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("project_id, meta, categories")
    .in(
      "project_id",
      projects.map((project) => project.id),
    );

  if (error || !data) {
    return new Set();
  }

  const projectIdsWithNewSagatavePositions = new Set<string>();

  for (const row of data) {
    const project = projectById.get(row.project_id as string);
    if (!project || !shouldShowStaleCatalogPriceWarnings(project.status)) {
      continue;
    }

    const meta = (row.meta ?? {}) as EstimateMeta;
    if (meta.clonedFromProjectId) {
      continue;
    }

    const parsed = parseEstimatePositionDocumentPayload(
      row.categories as EstimateCategory[],
    );

    if (
      sagataveHasNewPositionsForProject(sagatave.sections, parsed.sections)
    ) {
      projectIdsWithNewSagatavePositions.add(project.id);
    }
  }

  return projectIdsWithNewSagatavePositions;
}

export async function listProjectIdsWithPendingMaterials(
  projects: ProjectSummary[],
): Promise<Set<string>> {
  const approvedProjects = projects.filter(
    (project) => project.status === "approved",
  );

  if (!isSupabaseAdminConfigured() || approvedProjects.length === 0) {
    return new Set();
  }

  const catalogPositions = await listPositionPrices();
  const projectById = new Map(
    approvedProjects.map((project) => [project.id, project]),
  );
  const moduleCache = new Map<
    string,
    Awaited<ReturnType<typeof getBuildingModule>>
  >();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("project_id, meta, categories")
    .in(
      "project_id",
      approvedProjects.map((project) => project.id),
    );

  if (error || !data) {
    return new Set();
  }

  const pendingProjectIds = new Set<string>();

  for (const row of data) {
    const project = projectById.get(row.project_id as string);
    if (!project) {
      continue;
    }

    const parsed = parseEstimatePositionDocumentPayload(
      row.categories as EstimateCategory[],
    );
    if (parsed.sections.length === 0) {
      continue;
    }

    const meta = (row.meta ?? {}) as EstimateMeta;
    const orderedIds = meta.orderedMaterialPositionIds ?? [];

    let buildingModule: Awaited<ReturnType<typeof getBuildingModule>> = null;
    if (project.buildingModuleId) {
      if (!moduleCache.has(project.buildingModuleId)) {
        moduleCache.set(
          project.buildingModuleId,
          await getBuildingModule(project.buildingModuleId),
        );
      }
      buildingModule = moduleCache.get(project.buildingModuleId) ?? null;
    }

    const moduleName = buildingModule?.name ?? "Individuāls projekts";
    const moduleSizeOptions = buildPendingMaterialsModuleSizeOptions(
      project,
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
      pendingProjectIds.add(project.id);
    }
  }

  return pendingProjectIds;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const projects = await listAllProjects();
  return projects.filter((project) => isProjectVisibleInList(project.status));
}

export async function listAllProjects(): Promise<ProjectSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return SAMPLE_PROJECTS;
  }

  const supabase = createAdminClient();
  const rows = await fetchProjectRows(supabase);

  if (!rows) {
    return [];
  }

  return rows.map(mapProject);
}

export async function getProject(id: string): Promise<ProjectSummary | null> {
  if (!isSupabaseAdminConfigured()) {
    return getSampleProjectById(id) ?? null;
  }

  const supabase = createAdminClient();
  const row = await fetchProjectRowById(supabase, id);

  if (!row) {
    return null;
  }

  return mapProject(row);
}

export async function getProjectEstimate(id: string): Promise<ProjectEstimate | null> {
  const project = await getProject(id);
  if (!project) return null;

  const companySettings = await getCompanySettings();
  const validityDays = companySettings.estimateValidityDays;

  if (!isSupabaseAdminConfigured()) {
    return defaultEstimateForProject(project, validityDays);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("title, meta, categories, updated_at")
    .eq("project_id", id)
    .maybeSingle();

  if (error) {
    return defaultEstimateForProject(project, validityDays);
  }

  return parseEstimateRow(data as EstimateRow | null, project, validityDays);
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

  const supabase = createAdminClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
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
      await supabase.from("projects").delete().eq("id", project.id);
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
    project_id: project.id,
    title: clientName,
    meta,
    categories,
  });

  if (estimateError) {
    await supabase.from("projects").delete().eq("id", project.id);
    return { ok: false, error: "Neizdevās izveidot tāmi." };
  }

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
    .eq("id", input.id);

  if (projectError) {
    return { ok: false, error: "Neizdevās saglabāt projektu." };
  }

  const { data: estimate, error: estimateFetchError } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", input.id)
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
      .eq("project_id", input.id);

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

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId);

  if (error) {
    if (isMissingColumnError(error, "status")) {
      return {
        ok: false,
        error: "Projekta statuss vēl nav pieejams. Palaid npm run db:migrate.",
      };
    }

    return { ok: false, error: "Neizdevās atjaunināt projekta statusu." };
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

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", projectId)
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
    .eq("project_id", projectId);

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

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", projectId)
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
    .eq("project_id", projectId);

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

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", projectId)
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
    .eq("project_id", projectId);

  if (updateError) {
    return { ok: false, error: "Neizdevās noņemt pozīciju no projekta." };
  }

  return { ok: true, omittedIds };
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

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", projectId)
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
    .eq("project_id", projectId);

  if (updateError) {
    return { ok: false, error: "Neizdevās atzīmēt materiālu kā pasūtītu." };
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

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("meta")
    .eq("project_id", projectId)
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
    .eq("project_id", projectId);

  if (updateError) {
    return { ok: false, error: "Neizdevās piešķirt materiālu lietotājam." };
  }

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

  const supabase = createAdminClient();
  const categories = buildEstimatePositionSectionsStorage(
    payload.categories,
    payload.multiOptionLinks,
  );

  const { error } = await supabase
    .from("estimates")
    .update({ title: payload.title, meta: payload.meta, categories })
    .eq("project_id", projectId);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt tāmi." };
  }

  return { ok: true };
}

export async function deleteProject(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  await deleteAllProjectBlockFiles(id);

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst projektu." };
  }

  return { ok: true };
}
