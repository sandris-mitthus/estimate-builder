/**
 * Kategorijas / subkategorijas nosaukums ievades laukam — bez `trim`,
 * lai rakstīšanas laikā nepazustu atstarpes.
 * Atbalsta veco `name` lauku JSON datos.
 */
export function resolveEstimateGroupTitleInput(
  value: { title?: string; name?: string } | null | undefined,
): string {
  if (typeof value?.title === "string") {
    return value.title;
  }

  if (typeof value?.name === "string") {
    return value.name;
  }

  return "";
}

/** Kategorijas / subkategorijas nosaukums — ar `trim` (rādīšanai / normalizācijai). */
export function resolveEstimateGroupTitle(
  value: { title?: string; name?: string } | null | undefined,
): string {
  const title = typeof value?.title === "string" ? value.title.trim() : "";
  if (title.length > 0) {
    return title;
  }

  const name = typeof value?.name === "string" ? value.name.trim() : "";
  return name;
}
