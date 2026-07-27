import { defaultEstimateDeadline } from "@/app/lib/estimates/sample-data";
import {
  ESTIMATE_KIND_ADDITIONAL_WORK,
  ESTIMATE_KIND_MAIN,
} from "@/app/lib/estimates/kind";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import type { MultiOptionLinkGroup } from "@/app/lib/estimates/types";
import {
  buildEstimatePositionSectionsStorage,
  parseEstimatePositionDocumentPayload,
} from "@/app/lib/estimate-positions/serialize-document";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { isProjectEstimateLocked } from "@/app/lib/projects/project-status";
import { getProject } from "@/app/lib/projects/repository";
import type {
  AdditionalWorkEstimateSummary,
  EstimateMeta,
  ProjectEstimate,
} from "@/app/lib/projects/types";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { todayIsoDate } from "@/app/lib/format-display-date";

type AdditionalWorkEstimateRow = {
  id: string;
  title: string;
  meta: EstimateMeta;
  categories: unknown;
  updated_at?: string;
  created_at?: string;
};

function mapAdditionalWorkSummary(
  row: AdditionalWorkEstimateRow,
): AdditionalWorkEstimateSummary {
  return {
    id: row.id,
    title: row.title,
    meta: (row.meta ?? {}) as EstimateMeta,
    updatedAt: row.updated_at,
  };
}

function parseAdditionalWorkEstimateRow(
  row: AdditionalWorkEstimateRow,
): ProjectEstimate {
  const parsed = parseEstimatePositionDocumentPayload(row.categories);

  return {
    id: row.id,
    title: row.title,
    meta: (row.meta ?? {}) as EstimateMeta,
    categories: parsed.sections,
    multiOptionLinks: parsed.multiOptionLinks,
    updatedAt: row.updated_at,
  };
}

async function assertAdditionalWorkEditable(
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const project = await getProject(projectId);
  if (!project) {
    return { ok: false, error: "Projekts nav atrasts." };
  }

  if (isProjectEstimateLocked(project.status)) {
    return { ok: false, error: "Apstiprināta vai pabeigta tāme vairs nav rediģējama." };
  }

  return { ok: true };
}

export async function listAdditionalWorkEstimates(
  projectId: string,
): Promise<AdditionalWorkEstimateSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("id, title, meta, updated_at")
    .eq("company_id", companyId)
    .eq("project_id", projectId)
    .eq("estimate_kind", ESTIMATE_KIND_ADDITIONAL_WORK)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as AdditionalWorkEstimateRow[]).map(mapAdditionalWorkSummary);
}

export async function getAdditionalWorkEstimate(
  projectId: string,
  estimateId: string,
): Promise<ProjectEstimate | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .select("id, title, meta, categories, updated_at")
    .eq("company_id", companyId)
    .eq("project_id", projectId)
    .eq("id", estimateId)
    .eq("estimate_kind", ESTIMATE_KIND_ADDITIONAL_WORK)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parseAdditionalWorkEstimateRow(data as AdditionalWorkEstimateRow);
}

export async function createAdditionalWorkEstimate(
  projectId: string,
  author: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const editable = await assertAdditionalWorkEditable(projectId);
  if (!editable.ok) {
    return editable;
  }

  const project = await getProject(projectId);
  if (!project) {
    return { ok: false, error: "Projekts nav atrasts." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const existing = await listAdditionalWorkEstimates(projectId);
  const nextNumber = existing.length + 1;
  const title = `Papildu darbi #${nextNumber}`;

  const companySettings = await getCompanySettings();
  const estimateDate = todayIsoDate();
  const meta: EstimateMeta = {
    client: project.name,
    project: project.address,
    author,
    date: estimateDate,
    deadline: defaultEstimateDeadline(
      estimateDate,
      companySettings.estimateValidityDays,
    ),
    number: "",
  };

  const categories = buildEstimatePositionSectionsStorage([], []);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("estimates")
    .insert({
      company_id: companyId,
      project_id: projectId,
      estimate_kind: ESTIMATE_KIND_ADDITIONAL_WORK,
      display_name: title,
      title,
      meta,
      categories,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās izveidot papildu darbu tāmi." };
  }

  return { ok: true, id: data.id as string };
}

export async function saveAdditionalWorkEstimate(
  projectId: string,
  estimateId: string,
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

  const editable = await assertAdditionalWorkEditable(projectId);
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
    .update({
      title: payload.title,
      display_name: payload.title,
      meta: payload.meta,
      categories,
    })
    .eq("id", estimateId)
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .eq("estimate_kind", ESTIMATE_KIND_ADDITIONAL_WORK);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt papildu darbu tāmi." };
  }

  return { ok: true };
}

export { ESTIMATE_KIND_MAIN };
