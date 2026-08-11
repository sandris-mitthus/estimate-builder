import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import {
  normalizeTimelineGraphPeopleCount,
} from "@/app/lib/timeline-graph/people-count";
import {
  findSectionIdByIdentity,
  findSectionIdentity,
  listProjectSectionRefs,
  sectionIdentityKey,
  type TimelineSectionIdentity,
} from "@/app/lib/timeline-graph/section-identity";
import type {
  TimelineGraphCategory,
  TimelineGraphProject,
} from "@/app/lib/timeline-graph/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export type TimelineGraphSectionRef = {
  projectId: string;
  sectionId: string;
};

async function loadTimelineGraphProjects(): Promise<TimelineGraphProject[]> {
  // Dynamic import avoids circular dependency with repository.ts.
  const { listTimelineGraphProjects } = await import(
    "@/app/lib/timeline-graph/repository"
  );
  return listTimelineGraphProjects();
}

async function writePeopleCountRow(
  companyId: string,
  projectId: string,
  sectionId: string,
  peopleCount: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminClient();
  const normalized = normalizeTimelineGraphPeopleCount(peopleCount);

  if (normalized === 1) {
    const { error } = await supabase
      .from("company_timeline_graph_people")
      .delete()
      .eq("company_id", companyId)
      .eq("project_id", projectId)
      .eq("section_id", sectionId);
    if (error) {
      return { ok: false, error: "Neizdevās saglabāt cilvēku skaitu." };
    }
    return { ok: true };
  }

  const { error } = await supabase.from("company_timeline_graph_people").upsert(
    {
      company_id: companyId,
      project_id: projectId,
      section_id: sectionId,
      people_count: normalized,
    },
    { onConflict: "company_id,project_id,section_id" },
  );

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt cilvēku skaitu." };
  }
  return { ok: true };
}

function categoryHasSubcategories(
  category: Pick<TimelineGraphCategory, "children">,
): boolean {
  return category.children.some((child) => child.kind === "subcategory");
}

/**
 * Sadaļas, kurām UI glabā cilvēku skaitu (kategorija bez apakškategorijām
 * vai apakškategorija) — bez sintētiskajām „direct” rindām.
 */
function listPeopleSettingRefs(
  project: TimelineGraphProject,
): Array<{ sectionId: string; identity: TimelineSectionIdentity; peopleCount: number }> {
  const refs: Array<{
    sectionId: string;
    identity: TimelineSectionIdentity;
    peopleCount: number;
  }> = [];

  for (const category of project.categories) {
    if (categoryHasSubcategories(category)) {
      for (const child of category.children) {
        if (child.kind !== "subcategory") {
          continue;
        }
        refs.push({
          sectionId: child.id,
          identity: {
            kind: "subcategory",
            categoryTitle: category.title,
            subcategoryTitle: child.title,
          },
          peopleCount: child.peopleCount,
        });
      }
      continue;
    }

    refs.push({
      sectionId: category.id,
      identity: { kind: "category", categoryTitle: category.title },
      peopleCount: category.peopleCount,
    });
  }

  return refs;
}

/** Avots: kopētais projekts, citādi pēdējais laika grafika secībā. */
function pickPeopleSourceProject(
  others: TimelineGraphProject[],
  preferSourceProjectId?: string,
): TimelineGraphProject | null {
  if (preferSourceProjectId) {
    const preferred = others.find(
      (project) => project.id === preferSourceProjectId,
    );
    if (preferred) {
      return preferred;
    }
  }

  if (others.length === 0) {
    return null;
  }

  return others[others.length - 1]!;
}

async function writeParallelGroup(
  companyId: string,
  projectId: string,
  sectionIds: string[],
  groupId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (sectionIds.length < 2) {
    return { ok: true };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("company_timeline_graph_parallel").upsert(
    sectionIds.map((sectionId) => ({
      company_id: companyId,
      project_id: projectId,
      section_id: sectionId,
      parallel_group_id: groupId,
    })),
    { onConflict: "company_id,project_id,section_id" },
  );

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt paralēlo sapārojumu." };
  }
  return { ok: true };
}

async function clearParallelSection(
  companyId: string,
  projectId: string,
  sectionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminClient();
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

/**
 * Fan-out paralēlo sapārojumu (pēc nosaukumiem) uz citiem projektiem.
 * Katram projektam sava `parallel_group_id` — plānošana joprojām projekta ietvaros.
 */
export async function syncParallelPairAcrossProjects(
  sourceProjectId: string,
  sourceSectionId: string,
  targetSectionId: string | null,
): Promise<
  | { ok: true; syncedProjectIds: string[] }
  | { ok: false; error: string }
> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: false, error: "Uzņēmums nav atrasts." };
  }

  const projects = await loadTimelineGraphProjects();
  const source = projects.find((project) => project.id === sourceProjectId);
  if (!source) {
    return { ok: true, syncedProjectIds: [sourceProjectId] };
  }

  const sourceIdentity = findSectionIdentity(source, sourceSectionId);
  if (!sourceIdentity) {
    return { ok: true, syncedProjectIds: [sourceProjectId] };
  }

  const syncedProjectIds = [sourceProjectId];

  if (!targetSectionId) {
    for (const project of projects) {
      if (project.id === sourceProjectId) continue;
      const matchId = findSectionIdByIdentity(project, sourceIdentity);
      if (!matchId) continue;
      const cleared = await clearParallelSection(companyId, project.id, matchId);
      if (!cleared.ok) return cleared;
      syncedProjectIds.push(project.id);
    }
    return { ok: true, syncedProjectIds };
  }

  const targetIdentity = findSectionIdentity(source, targetSectionId);
  if (!targetIdentity) {
    return { ok: true, syncedProjectIds };
  }

  // After local merge, take the full parallel group around the source section.
  let groupId = source.categories
    .flatMap((category) => [
      { id: category.id, groupId: category.parallelGroupId },
      ...category.children.map((child) => ({
        id: child.id,
        groupId: child.parallelGroupId,
      })),
    ])
    .find((entry) => entry.id === sourceSectionId)?.groupId;

  // listTimelineGraphProjects may not yet reflect this request's write — fall back
  // to pairing just the two identities.
  const sourceGroupIdentities: TimelineSectionIdentity[] = [];
  if (groupId) {
    for (const ref of listProjectSectionRefs(source)) {
      let refGroup: string | undefined;
      for (const category of source.categories) {
        if (category.id === ref.sectionId) {
          refGroup = category.parallelGroupId;
          break;
        }
        const child = category.children.find(
          (entry) => entry.id === ref.sectionId,
        );
        if (child) {
          refGroup = child.parallelGroupId;
          break;
        }
      }
      if (refGroup === groupId) {
        sourceGroupIdentities.push(ref.identity);
      }
    }
  }

  const identitiesToMirror =
    sourceGroupIdentities.length >= 2
      ? sourceGroupIdentities
      : [sourceIdentity, targetIdentity];

  for (const project of projects) {
    if (project.id === sourceProjectId) continue;
    const sectionIds = identitiesToMirror
      .map((identity) => findSectionIdByIdentity(project, identity))
      .filter((id): id is string => Boolean(id));
    const uniqueIds = Array.from(new Set(sectionIds));
    if (uniqueIds.length < 2) continue;

    const written = await writeParallelGroup(
      companyId,
      project.id,
      uniqueIds,
      crypto.randomUUID(),
    );
    if (!written.ok) return written;
    syncedProjectIds.push(project.id);
  }

  return { ok: true, syncedProjectIds };
}

/**
 * Jaunam / nokopētam projektam pārmanto cilvēku skaitu no pēdējā (vai avota)
 * projekta un paralēlās saites no citiem projektiem (pēc nosaukuma).
 * Cilvēku skaits netiek dzīvi sinhronizēts starp projektiem — tikai snapshot
 * izveides / apstiprināšanas brīdī.
 */
export async function inheritTimelineGraphSettingsForProject(
  projectId: string,
  options: { preferSourceProjectId?: string | null } = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: true };
  }

  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return { ok: true };
  }

  const projects = await loadTimelineGraphProjects();
  const target = projects.find((project) => project.id === projectId);
  if (!target) {
    return { ok: true };
  }

  const others = projects.filter((project) => project.id !== projectId);
  if (others.length === 0) {
    return { ok: true };
  }

  const preferSource = options.preferSourceProjectId?.trim() || undefined;
  const peopleSource = pickPeopleSourceProject(others, preferSource);

  if (peopleSource) {
    for (const ref of listPeopleSettingRefs(peopleSource)) {
      const people = normalizeTimelineGraphPeopleCount(ref.peopleCount);
      if (people <= 1) {
        continue;
      }

      const targetSectionId = findSectionIdByIdentity(target, ref.identity);
      if (!targetSectionId) {
        continue;
      }

      // Neārraksta jau iestatītu skaitu (piem. pēc manuālas maiņas pirms apstiprināšanas).
      const alreadySet = listPeopleSettingRefs(target).some(
        (entry) =>
          entry.sectionId === targetSectionId &&
          normalizeTimelineGraphPeopleCount(entry.peopleCount) > 1,
      );
      if (alreadySet) {
        continue;
      }

      const written = await writePeopleCountRow(
        companyId,
        projectId,
        targetSectionId,
        people,
      );
      if (!written.ok) {
        return written;
      }
    }
  }

  // Paralēlās grupas: ņem no preferētā avota / pēdējā, tad no pārējiem.
  const parallelSources = preferSource
    ? [
        others.find((project) => project.id === preferSource),
        ...others.filter((project) => project.id !== preferSource),
      ].filter((project): project is TimelineGraphProject => Boolean(project))
    : [...others].reverse();

  const appliedGroupKeys = new Set<string>();

  for (const source of parallelSources) {
    const groupMembers = new Map<string, TimelineSectionIdentity[]>();

    for (const ref of listProjectSectionRefs(source)) {
      let groupId: string | undefined;
      for (const category of source.categories) {
        if (category.id === ref.sectionId) {
          groupId = category.parallelGroupId;
          break;
        }
        const child = category.children.find(
          (entry) => entry.id === ref.sectionId,
        );
        if (child) {
          groupId = child.parallelGroupId;
          break;
        }
      }
      if (!groupId) continue;
      const list = groupMembers.get(groupId) ?? [];
      list.push(ref.identity);
      groupMembers.set(groupId, list);
    }

    for (const identities of groupMembers.values()) {
      if (identities.length < 2) continue;
      const key = identities
        .map((identity) => sectionIdentityKey(identity))
        .sort()
        .join("|");
      if (appliedGroupKeys.has(key)) continue;

      const sectionIds = identities
        .map((identity) => findSectionIdByIdentity(target, identity))
        .filter((id): id is string => Boolean(id));
      const uniqueIds = Array.from(new Set(sectionIds));
      if (uniqueIds.length < 2) continue;

      // Skip if any target section is already in a parallel group.
      const alreadyLinked = uniqueIds.some((sectionId) => {
        for (const category of target.categories) {
          if (category.id === sectionId && category.parallelGroupId) {
            return true;
          }
          const child = category.children.find((entry) => entry.id === sectionId);
          if (child?.parallelGroupId) {
            return true;
          }
        }
        return false;
      });
      if (alreadyLinked) continue;

      const written = await writeParallelGroup(
        companyId,
        projectId,
        uniqueIds,
        crypto.randomUUID(),
      );
      if (!written.ok) {
        return written;
      }
      appliedGroupKeys.add(key);
    }
  }

  return { ok: true };
}
