export type ProjectStatus = "active" | "approved" | "rejected";

export function normalizeProjectStatus(value: unknown): ProjectStatus {
  if (value === "approved" || value === "rejected") {
    return value;
  }

  return "active";
}

export function isProjectVisibleInList(status: ProjectStatus): boolean {
  return status !== "rejected";
}

export function isProjectEstimateLocked(status: ProjectStatus): boolean {
  return status === "approved";
}
