export type ProjectStatus =
  | "active"
  | "approved"
  | "rejected"
  | "completed";

const PROJECT_STATUSES = new Set<ProjectStatus>([
  "active",
  "approved",
  "rejected",
  "completed",
]);

export function normalizeProjectStatus(value: unknown): ProjectStatus {
  if (typeof value === "string" && PROJECT_STATUSES.has(value as ProjectStatus)) {
    return value as ProjectStatus;
  }

  return "active";
}

export function isProjectVisibleInList(status: ProjectStatus): boolean {
  return status === "active" || status === "approved";
}

export function isProjectEstimateLocked(status: ProjectStatus): boolean {
  return status === "approved" || status === "completed";
}

export function shouldShowStaleCatalogPriceWarnings(
  status: ProjectStatus,
): boolean {
  return status === "active";
}
