import { defaultEstimateDeadline, projectCreatedDateIso } from "@/app/lib/estimates/sample-data";
import { resolveEstimateMeta } from "@/app/lib/estimates/resolve-estimate-meta";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import {
  buildEstimatePositionSectionsStorage,
  parseEstimatePositionDocumentPayload,
} from "@/app/lib/estimate-positions/serialize-document";
import { getProjectEstimateBaseFromSagatave } from "@/app/lib/estimate-positions/project-estimate-base";
import { DEFAULT_CALLING_CODE } from "@/app/lib/geo/country-calling-codes";
import { getBuildingModule } from "@/app/lib/modules/repository";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { isMissingColumnError } from "@/app/lib/supabase/missing-column";
import {
  getProjectById as getSampleProjectById,
  SAMPLE_PROJECTS,
} from "@/app/lib/projects/sample-projects";
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
};

type EstimateRow = {
  title: string;
  meta: EstimateMeta;
  categories: EstimateCategory[];
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
  };
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

  return {
    title: row.title || project.name,
    meta: estimateMetaForProject(project, validityDays, {
      ...row.meta,
    }),
    categories: hasCategories ? parsed.sections : base!.categories,
    multiOptionLinks: hasCategories
      ? parsed.multiOptionLinks
      : base!.multiOptionLinks,
  };
}

export async function listProjects(): Promise<ProjectSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return SAMPLE_PROJECTS;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, address, phone, email, created_at, building_module_id, visualization_blocks, project_blocks, project_description")
    .order("created_at", { ascending: true });

  if (!error) {
    return (data ?? []).map(mapProject);
  }

  if (isMissingColumnError(error, "project_description")) {
    const legacy = await supabase
      .from("projects")
      .select("id, name, address, phone, email, created_at, building_module_id, visualization_blocks, project_blocks")
      .order("created_at", { ascending: true });

    if (!legacy.error) {
      return (legacy.data ?? []).map(mapProject);
    }

    console.error("listProjects:", legacy.error.message);
    return [];
  }

  console.error("listProjects:", error.message);
  return [];
}

export async function getProject(id: string): Promise<ProjectSummary | null> {
  if (!isSupabaseAdminConfigured()) {
    return getSampleProjectById(id) ?? null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, address, phone, email, created_at, building_module_id, visualization_blocks, project_blocks, project_description")
    .eq("id", id)
    .maybeSingle();

  if (!error && data) {
    return mapProject(data);
  }

  if (error && isMissingColumnError(error, "project_description")) {
    const legacy = await supabase
      .from("projects")
      .select("id, name, address, phone, email, created_at, building_module_id, visualization_blocks, project_blocks")
      .eq("id", id)
      .maybeSingle();

    if (!legacy.error && legacy.data) {
      return mapProject(legacy.data);
    }

    if (legacy.error) {
      console.error("getProject:", legacy.error.message);
    }

    return null;
  }

  if (error) {
    console.error("getProject:", error.message);
  }

  return null;
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
    .select("title, meta, categories")
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
    const module = await getBuildingModule(input.buildingModuleId);
    if (!module) {
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

  const estimateBase = await getProjectEstimateBaseFromSagatave();
  const categories = buildEstimatePositionSectionsStorage(
    estimateBase.categories,
    estimateBase.multiOptionLinks,
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
    const module = await getBuildingModule(input.buildingModuleId);
    if (!module) {
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

export async function updateProjectEstimateDates(
  projectId: string,
  dates: Pick<EstimateMeta, "date" | "deadline">,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
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
