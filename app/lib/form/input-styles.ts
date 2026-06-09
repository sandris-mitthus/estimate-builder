export function formInputClassName(invalid = false) {
  const base =
    "rounded-lg border px-3 py-2.5 text-sm text-zinc-900 transition placeholder:text-zinc-400 focus:outline-none focus:ring-2";

  if (invalid) {
    return `${base} border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-500/10`;
  }

  return `${base} border-zinc-200 bg-white focus:border-zinc-400 focus:ring-zinc-900/5`;
}

export const formInputFullWidthClass = "w-full";
export const formInputFlexClass = "min-w-0 flex-1";
