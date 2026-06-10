/** Noklusējuma datuma attēlojums UI: dd.mm.yy */
export function formatDisplayDateDdMmYy(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const date = new Date(
    trimmed.includes("T") ? trimmed : `${trimmed}T12:00:00`,
  );
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${day}.${month}.${year}`;
}

/** Šodienas datums glabāšanai DB / stāvoklī (YYYY-MM-DD). */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
