export function validatePositionFields(
  name: string,
  unit: string,
): string | null {
  if (!name.trim()) {
    return "Ievadi nosaukumu.";
  }

  if (!unit.trim()) {
    return "Ievadi mērvienību.";
  }

  return null;
}
