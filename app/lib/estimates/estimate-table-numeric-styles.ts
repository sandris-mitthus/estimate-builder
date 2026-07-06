export function getEstimateNumericStyles(compact: boolean) {
  if (!compact) {
    return {
      cell: "border-b border-zinc-100 px-1 py-0.5 align-middle text-center",
      unitCell: "border-b border-zinc-100 px-1 py-0.5 align-middle text-center",
      quantityCell: "border-b border-zinc-100 px-1 py-0.5 align-middle text-center",
      cellTotal:
        "border-b border-zinc-100 px-1 py-0.5 align-middle text-center bg-zinc-50/60",
      volumeCell:
        "border-b border-zinc-100 px-1 py-0.5 align-middle text-center bg-emerald-50/25",
      volumeCellTotal:
        "border-b border-zinc-100 px-1 py-0.5 align-middle text-center bg-emerald-50/50",
      readOnly:
        "block px-2 py-1.5 text-center text-sm tabular-nums text-zinc-700",
      input:
        "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm transition focus:border-zinc-300 focus:bg-white focus:outline-none text-center tabular-nums",
      headerSub:
        "border-b border-r border-zinc-200 max-w-0 overflow-hidden px-1 py-1.5 text-center align-middle text-[10px] font-medium leading-snug text-zinc-500",
      headerMetric:
        "border-b border-r border-zinc-200 max-w-0 overflow-hidden bg-white py-1.5 px-1 text-center align-middle text-[10px] font-medium uppercase leading-snug tracking-normal text-zinc-500",
      headerGroup:
        "border-b border-r border-zinc-200 px-1 py-1.5 text-center align-middle text-[10px] font-medium uppercase leading-snug tracking-normal whitespace-normal",
    };
  }

  return {
    cell: "border-b border-zinc-100 px-1 py-px align-middle text-center",
    unitCell:
      "border-b border-zinc-100 py-px pl-1 pr-2 align-middle text-center whitespace-nowrap",
    quantityCell:
      "border-b border-zinc-100 py-px pl-1 pr-1 align-middle text-center whitespace-nowrap",
    cellTotal:
      "border-b border-zinc-100 px-1 py-px align-middle text-center bg-zinc-50/60",
    volumeCell:
      "border-b border-zinc-100 px-1 py-px align-middle text-center bg-emerald-50/25",
    volumeCellTotal:
      "border-b border-zinc-100 px-1 py-px align-middle text-center bg-emerald-50/50",
    readOnly:
      "block px-1 py-px text-center text-[11px] tabular-nums leading-tight text-zinc-700",
    input:
      "w-full rounded border border-transparent bg-transparent px-1 py-px text-[11px] transition focus:border-zinc-300 focus:bg-white focus:outline-none text-center tabular-nums leading-tight",
    headerSub:
      "border-b border-r border-zinc-200 max-w-0 overflow-hidden px-0.5 py-1 text-center align-middle text-[9px] font-medium leading-tight text-zinc-500",
    headerMetric:
      "border-b border-r border-zinc-200 max-w-0 overflow-hidden bg-white py-1 px-1 text-center align-middle text-[9px] font-medium uppercase leading-tight tracking-normal text-zinc-500",
    headerGroup:
      "border-b border-r border-zinc-200 px-0.5 py-1 text-center align-middle text-[9px] font-medium uppercase leading-tight tracking-normal whitespace-normal",
  };
}

/** Aizstāj `text-zinc-700`, lai blāvinājums strādātu arī uz read-only skaitļu šūnām. */
export function deemphasizeReadOnlyNumericClass(
  readOnlyClass: string,
  deemphasize: boolean,
): string {
  if (!deemphasize) {
    return readOnlyClass;
  }

  return readOnlyClass.replace(/\btext-zinc-700\b/g, "text-zinc-400");
}
