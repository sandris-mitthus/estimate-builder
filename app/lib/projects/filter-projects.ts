import type { ProjectStatus } from "@/app/lib/projects/project-status";
import type { ProjectSummary } from "@/app/lib/projects/types";

export type ProjectArchiveFilter =
  | "all"
  | "in_progress"
  | "active"
  | "completed"
  | "rejected";

const FILTER_STATUS_MAP: Record<
  Exclude<ProjectArchiveFilter, "all">,
  ProjectStatus
> = {
  in_progress: "approved",
  active: "active",
  completed: "completed",
  rejected: "rejected",
};

export function filterProjectsForArchive(
  projects: ProjectSummary[],
  filter: ProjectArchiveFilter,
): ProjectSummary[] {
  if (filter === "all") {
    return projects;
  }

  const status = FILTER_STATUS_MAP[filter];
  return projects.filter((project) => project.status === status);
}
