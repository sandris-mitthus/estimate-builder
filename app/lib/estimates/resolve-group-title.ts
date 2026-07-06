/** Kategorijas / subkategorijas nosaukums — atbalsta veco `name` lauku JSON datos. */
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
