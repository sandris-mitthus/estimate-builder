import { createSampleCategories, defaultEstimateDeadline, SAMPLE_META } from "@/app/lib/estimates/sample-data";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import { DEFAULT_CALLING_CODE } from "@/app/lib/geo/country-calling-codes";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
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
import { validateProjectContactFields } from "@/app/lib/validation/contact-fields";

type ProjectRow = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
};

type EstimateRow = {
  title: string;
  meta: EstimateMeta;
  categories: EstimateCategory[];
};

function mapProject(row: ProjectRow): ProjectSummary {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone ?? "",
    email: row.email ?? "",
  };
}

function defaultEstimateForProject(project: ProjectSummary): ProjectEstimate {
  return {
    title: project.name,
    meta: {
      ...SAMPLE_META,
      project: project.address,
    },
    categories: createSampleCategories(),
  };
}

function parseEstimateRow(row: EstimateRow | null, project: ProjectSummary): ProjectEstimate {
  if (!row) {
    return defaultEstimateForProject(project);
  }

  return {
    title: row.title || project.name,
    meta: {
      ...SAMPLE_META,
      ...row.meta,
      project: row.meta?.project ?? project.address,
      deadline: row.meta?.deadline ?? "",
    },
    categories: Array.isArray(row.categories) && row.categories.length > 0
      ? row.categories
      : createSampleCategories(),
  };
}

export async function listProjects(): Promise<ProjectSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return SAMPLE_PROJECTS;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, address, phone, email")
    .order("created_at", { ascending: true });

  if (error || !data?.length) {
    return SAMPLE_PROJECTS;
  }

  return data.map(mapProject);
}

export async function getProject(id: string): Promise<ProjectSummary | null> {
  if (!isSupabaseAdminConfigured()) {
    return getSampleProjectById(id) ?? null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, address, phone, email")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return getSampleProjectById(id) ?? null;
  }

  return mapProject(data);
}

export async function getProjectEstimate(id: string): Promise<ProjectEstimate | null> {
  const project = await getProject(id);
  if (!project) return null;

  if (!isSupabaseAdminConfigured()) {
    return defaultEstimateForProject(project);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("title, meta, categories")
    .eq("project_id", id)
    .maybeSingle();

  if (error) {
    return defaultEstimateForProject(project);
  }

  return parseEstimateRow(data as EstimateRow | null, project);
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
    })
    .select("id")
    .single();

  if (projectError || !project) {
    return { ok: false, error: "Neizdevās izveidot projektu." };
  }

  const today = new Date().toISOString().slice(0, 10);
  const meta: EstimateMeta = {
    client: clientName,
    project: address,
    author,
    date: today,
    deadline: defaultEstimateDeadline(today),
    number: "",
  };

  const { error: estimateError } = await supabase.from("estimates").insert({
    project_id: project.id,
    title: clientName,
    meta,
    categories: [],
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

export async function deleteProject(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst projektu." };
  }

  return { ok: true };
}
