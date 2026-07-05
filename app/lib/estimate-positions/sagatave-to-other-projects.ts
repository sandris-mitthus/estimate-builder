import type { MultiOptionLinkGroup } from "@/app/lib/estimates/types";
import type { EstimateCategory } from "@/app/lib/estimates/types";
import { hideEstimateStructureByNodeIds } from "@/app/lib/estimates/hidden-estimate-rows";
import {
  mergeNewSagatavePositionsIntoProject,
  sagataveHasNewPositionsForProject,
} from "@/app/lib/estimate-positions/sagatave-has-new-positions";
import { ensureDefaultEstimatePosition } from "@/app/lib/estimate-positions/repository";
import { buildEstimatePositionSectionsStorage } from "@/app/lib/estimate-positions/serialize-document";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { parseEstimatePositionDocumentPayload } from "@/app/lib/estimate-positions/serialize-document";
import type { EstimateMeta } from "@/app/lib/projects/types";
import { shouldShowStaleCatalogPriceWarnings } from "@/app/lib/projects/project-status";
import type { ProjectStatus } from "@/app/lib/projects/project-status";

export type { SagataveStructureIntroEntry } from "@/app/lib/estimate-positions/sagatave-structure-intro-entries";
export { listSagataveStructureIntroEntries } from "@/app/lib/estimate-positions/sagatave-structure-intro-entries";

export function mergeMissingSagataveAsHiddenForProject(
  projectCategories: EstimateCategory[],
  projectMultiOptionLinks: MultiOptionLinkGroup[],
  projectMeta: EstimateMeta,
  sagataveSections: EstimateCategory[],
  sagataveMultiOptionLinks: MultiOptionLinkGroup[] = [],
): {
  categories: EstimateCategory[];
  multiOptionLinks: MultiOptionLinkGroup[];
  meta: EstimateMeta;
  changed: boolean;
  addedNodeIds: string[];
} {
  if (
    sagataveSections.length === 0 ||
    !sagataveHasNewPositionsForProject(sagataveSections, projectCategories)
  ) {
    return {
      categories: projectCategories,
      multiOptionLinks: projectMultiOptionLinks,
      meta: projectMeta,
      changed: false,
      addedNodeIds: [],
    };
  }

  const merged = mergeNewSagatavePositionsIntoProject(
    projectCategories,
    projectMultiOptionLinks,
    sagataveSections,
    sagataveMultiOptionLinks,
  );

  if (merged.addedNodeIds.length === 0) {
    return {
      categories: projectCategories,
      multiOptionLinks: projectMultiOptionLinks,
      meta: projectMeta,
      changed: false,
      addedNodeIds: [],
    };
  }

  const categories = hideEstimateStructureByNodeIds(
    merged.categories,
    new Set(merged.addedNodeIds),
  );
  const meta: EstimateMeta = {
    ...projectMeta,
    unacknowledgedSagataveStructureIds: Array.from(
      new Set([
        ...(projectMeta.unacknowledgedSagataveStructureIds ?? []),
        ...merged.addedNodeIds,
      ]),
    ),
  };

  return {
    categories,
    multiOptionLinks: merged.multiOptionLinks,
    meta,
    changed: true,
    addedNodeIds: merged.addedNodeIds,
  };
}

export async function ensureHiddenSagataveStructureForProject(
  projectId: string,
): Promise<{ ok: true; changed: boolean } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: true, changed: false };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (
    projectError ||
    !projectRow ||
    !shouldShowStaleCatalogPriceWarnings(projectRow.status as ProjectStatus)
  ) {
    return { ok: true, changed: false };
  }

  const sagatave = await ensureDefaultEstimatePosition();
  const { data, error } = await supabase
    .from("estimates")
    .select("title, meta, categories")
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Tāme nav atrasta." };
  }

  const parsed = parseEstimatePositionDocumentPayload(data.categories);
  const merged = mergeMissingSagataveAsHiddenForProject(
    parsed.sections,
    parsed.multiOptionLinks,
    (data.meta ?? {}) as EstimateMeta,
    sagatave.sections,
    sagatave.multiOptionLinks,
  );

  if (!merged.changed) {
    return { ok: true, changed: false };
  }

  const { error: updateError } = await supabase
    .from("estimates")
    .update({
      meta: merged.meta,
      categories: buildEstimatePositionSectionsStorage(
        merged.categories,
        merged.multiOptionLinks,
      ),
    })
    .eq("project_id", projectId)
    .eq("company_id", companyId);

  if (updateError) {
    return { ok: false, error: "Neizdevās sinhronizēt sagataves struktūru." };
  }

  return { ok: true, changed: true };
}

export async function propagateSagataveStructureToOtherProjects(
  sourceProjectId: string,
): Promise<{ ok: true; updatedProjectIds: string[] } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: true, updatedProjectIds: [] };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const sagatave = await ensureDefaultEstimatePosition();
  const supabase = createAdminClient();
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, status")
    .eq("company_id", companyId)
    .neq("id", sourceProjectId);

  if (projectsError || !projects) {
    return { ok: false, error: "Neizdevās ielādēt projektus." };
  }

  const updatedProjectIds: string[] = [];

  for (const project of projects) {
    if (!shouldShowStaleCatalogPriceWarnings(project.status as Parameters<typeof shouldShowStaleCatalogPriceWarnings>[0])) {
      continue;
    }

    const { data: estimate, error: estimateError } = await supabase
      .from("estimates")
      .select("meta, categories")
      .eq("project_id", project.id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (estimateError || !estimate) {
      continue;
    }

    const parsed = parseEstimatePositionDocumentPayload(estimate.categories);
    const merged = mergeMissingSagataveAsHiddenForProject(
      parsed.sections,
      parsed.multiOptionLinks,
      (estimate.meta ?? {}) as EstimateMeta,
      sagatave.sections,
      sagatave.multiOptionLinks,
    );

    if (!merged.changed) {
      continue;
    }

    const { error: updateError } = await supabase
      .from("estimates")
      .update({
        meta: merged.meta,
        categories: buildEstimatePositionSectionsStorage(
          merged.categories,
          merged.multiOptionLinks,
        ),
      })
      .eq("project_id", project.id)
      .eq("company_id", companyId);

    if (updateError) {
      return { ok: false, error: "Neizdevās sinhronizēt sagataves struktūru." };
    }

    updatedProjectIds.push(project.id);
  }

  return { ok: true, updatedProjectIds };
}

export async function acknowledgeSagataveStructureIntro(
  projectId: string,
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
    .select("meta")
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Tāme nav atrasta." };
  }

  const currentMeta = (data.meta ?? {}) as EstimateMeta;
  if (!currentMeta.unacknowledgedSagataveStructureIds?.length) {
    return { ok: true };
  }

  const meta: EstimateMeta = { ...currentMeta };
  delete meta.unacknowledgedSagataveStructureIds;

  const { error: updateError } = await supabase
    .from("estimates")
    .update({ meta })
    .eq("project_id", projectId)
    .eq("company_id", companyId);

  if (updateError) {
    return { ok: false, error: "Neizdevās saglabāt apstiprinājumu." };
  }

  return { ok: true };
}
