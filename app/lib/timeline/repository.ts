import { cache } from "react";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { defaultEstimateDeadline, projectCreatedDateIso } from "@/app/lib/estimates/sample-data";
import {
  normalizeProjectStatus,
  type ProjectStatus,
} from "@/app/lib/projects/project-status";
import type { EstimateMeta } from "@/app/lib/projects/types";
import { ESTIMATE_KIND_MAIN } from "@/app/lib/estimates/kind";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import type {
  TimelineEntry,
  TimelineEntryRow,
  UpdateTimelineEntryInput,
} from "@/app/lib/timeline/types";

const TIMELINE_SELECT =
  "id, project_id, start_date, end_date, projects (name, address, status)";

function mapTimelineEntry(row: TimelineEntryRow): TimelineEntry {
  const projectRecord = Array.isArray(row.projects)
    ? row.projects[0]
    : row.projects;
  const project = projectRecord ?? null;

  return {
    id: row.id,
    projectId: row.project_id,
    projectName: project?.name?.trim() || "—",
    projectAddress: project?.address?.trim() || "",
    projectStatus: normalizeProjectStatus(project?.status),
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

function resolveProjectDates(
  createdAt: string,
  meta: Partial<EstimateMeta>,
  validityDays: number,
): { startDate: string; endDate: string } {
  const startDate =
    meta.date?.trim() || projectCreatedDateIso(createdAt);
  const endDate =
    meta.deadline?.trim() || defaultEstimateDeadline(startDate, validityDays);
  return { startDate, endDate };
}

export async function ensureTimelineEntryForProject({
  companyId,
  projectId,
  projectCreatedAt,
}: {
  companyId: string;
  projectId: string;
  projectCreatedAt: string;
}): Promise<void> {
  const supabase = createAdminClient();
  const [settings, existingResult, estimateResult] = await Promise.all([
    getCompanySettings(),
    supabase
      .from("company_timeline_entries")
      .select("project_id")
      .eq("company_id", companyId)
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase
      .from("estimates")
      .select("meta")
      .eq("company_id", companyId)
      .eq("project_id", projectId)
      .eq("estimate_kind", ESTIMATE_KIND_MAIN)
      .maybeSingle(),
  ]);

  if (!existingResult.error && existingResult.data) {
    return;
  }

  const meta = (estimateResult.data?.meta as Partial<EstimateMeta> | null) ?? {};
  const dates = resolveProjectDates(
    projectCreatedAt,
    meta,
    settings.offerValidityDays,
  );

  await supabase
    .from("company_timeline_entries")
    .upsert(
      {
      company_id: companyId,
        project_id: projectId,
      start_date: dates.startDate,
      end_date: dates.endDate,
      },
      { onConflict: "company_id,project_id" },
    );
}

export const listTimelineEntries = cache(async function listTimelineEntries(): Promise<
  TimelineEntry[]
> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_timeline_entries")
    .select(TIMELINE_SELECT)
    .eq("company_id", companyId)
    .order("start_date", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => mapTimelineEntry(row as unknown as TimelineEntryRow))
    .filter((entry) => isTimelineVisibleStatus(entry.projectStatus));
});

function isTimelineVisibleStatus(status: ProjectStatus): boolean {
  return status === "approved" || status === "completed";
}

export async function updateTimelineEntry(
  input: UpdateTimelineEntryInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const startDate = input.startDate.trim();
  const endDate = input.endDate.trim();

  if (!startDate || !endDate) {
    return { ok: false, error: "Ievadi datumus." };
  }

  if (endDate < startDate) {
    return {
      ok: false,
      error: "Beigu datumam jābūt pēc sākuma datuma.",
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Datubāze nav konfigurēta. Pievieno SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("company_timeline_entries")
    .update({
      start_date: startDate,
      end_date: endDate,
    })
    .eq("id", input.id)
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt laika grafiku." };
  }

  return { ok: true };
}
