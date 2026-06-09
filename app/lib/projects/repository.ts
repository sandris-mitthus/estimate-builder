import { createSampleCategories, SAMPLE_META } from "@/app/lib/estimates/sample-data";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import {
  getProjectById as getSampleProjectById,
  SAMPLE_PROJECTS,
} from "@/app/lib/projects/sample-projects";
import type {
  EstimateMeta,
  ProjectEstimate,
  ProjectSummary,
} from "@/app/lib/projects/types";

type ProjectRow = {
  id: string;
  name: string;
  address: string;
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
    .select("id, name, address")
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
    .select("id, name, address")
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
