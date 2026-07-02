export function arrayMove<T>(array: readonly T[], from: number, to: number): T[] {
  const next = array.slice();
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
}
