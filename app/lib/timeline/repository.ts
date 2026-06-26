import { cache } from "react";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { defaultEstimateDeadline, projectCreatedDateIso } from "@/app/lib/estimates/sample-data";
import {
  normalizeProjectStatus,
  type ProjectStatus,
} from "@/app/lib/projects/project-status";
import type { EstimateMeta } from "@/app/lib/projects/types";
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

async function syncApprovedProjects(companyId: string) {
  const supabase = createAdminClient();
  const [settings, projectsResult, existingResult] = await Promise.all([
    getCompanySettings(),
    supabase
      .from("projects")
      .select("id, name, created_at, status")
      .eq("company_id", companyId)
      .in("status", ["approved", "completed"]),
    supabase
      .from("company_timeline_entries")
      .select("project_id")
      .eq("company_id", companyId),
  ]);

  const projects = projectsResult.data ?? [];
  const existingProjectIds = new Set(
    (existingResult.data ?? []).map((row) => row.project_id as string),
  );

  const missingProjects = projects.filter(
    (project) => !existingProjectIds.has(project.id as string),
  );

  if (missingProjects.length === 0) {
    return;
  }

  const projectIds = missingProjects.map((project) => project.id as string);
  const { data: estimates } = await supabase
    .from("estimates")
    .select("project_id, meta")
    .in("project_id", projectIds);

  const metaByProjectId = new Map<string, Partial<EstimateMeta>>();
  for (const row of estimates ?? []) {
    metaByProjectId.set(
      row.project_id as string,
      (row.meta as Partial<EstimateMeta>) ?? {},
    );
  }

  const inserts = missingProjects.map((project) => {
    const meta = metaByProjectId.get(project.id as string) ?? {};
    const dates = resolveProjectDates(
      (project.created_at as string) ?? new Date().toISOString(),
      meta,
      settings.offerValidityDays,
    );

    return {
      company_id: companyId,
      project_id: project.id,
      start_date: dates.startDate,
      end_date: dates.endDate,
    };
  });

  if (inserts.length > 0) {
    await supabase.from("company_timeline_entries").insert(inserts);
  }
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

  await syncApprovedProjects(companyId);

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
