/** Slug from a user-entered group name (diacritics stripped, ASCII only). */
export function slugifyName(name: string, fallback = "grupa"): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}
