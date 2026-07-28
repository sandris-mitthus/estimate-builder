const STICKY_GROUP_ATTRIBUTE = "data-estimate-sticky-group";
const STICKY_GROUP_END_ATTRIBUTE = "data-estimate-sticky-group-end";

const GROUP_NODE_SELECTOR = `[${STICKY_GROUP_ATTRIBUTE}],[${STICKY_GROUP_END_ATTRIBUTE}]`;

type StickyGroupKind = "category" | "subcategory";

type MeasuredGroupNode = {
  cell: HTMLElement | null;
  kind: StickyGroupKind | null;
  top: number;
  height: number;
};

function toGroupKind(value: string | null): StickyGroupKind | null {
  return value === "category" || value === "subcategory" ? value : null;
}

function measureGroupNodes(scope: HTMLElement): MeasuredGroupNode[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(GROUP_NODE_SELECTOR)).map(
    (node) => {
      const rect = node.getBoundingClientRect();

      return {
        cell: node.querySelector<HTMLElement>(":scope > tr > td"),
        kind: toGroupKind(node.getAttribute(STICKY_GROUP_ATTRIBUTE)),
        top: rect.top,
        height: rect.height,
      };
    },
  );
}

/**
 * Kategoriju un subkategoriju rindas ir `position: sticky`, bet pārlūks tās
 * notur līdz visas tabulas beigām. Tāpēc `top` jāpārrēķina ritināšanas laikā:
 * kategorija turas tieši zem piespraustās galvenes, subkategorija zem
 * kategorijas, un subkategorija tiek izstumta augšup, tiklīdz beidzas tās
 * saturs (nākamā grupa vai kategorijas tiešā pozīcija).
 */
export function syncStickyGroupRows(scope: HTMLElement, headerHeight: number) {
  const nodes = measureGroupNodes(scope);
  if (nodes.length === 0) {
    return;
  }

  const categoryTop = headerHeight;
  let subcategoryTop = headerHeight;
  const offsets: Array<[HTMLElement, number]> = [];

  nodes.forEach((node, index) => {
    const cell = node.cell;
    if (!cell || !node.kind) {
      return;
    }

    if (node.kind === "category") {
      if (node.top <= categoryTop) {
        subcategoryTop = categoryTop + node.height;
      }
      offsets.push([cell, categoryTop]);
      return;
    }

    const groupEndTop = nodes[index + 1]?.top ?? Number.POSITIVE_INFINITY;
    offsets.push([
      cell,
      Math.round(Math.min(subcategoryTop, groupEndTop - node.height)),
    ]);
  });

  for (const [cell, top] of offsets) {
    cell.style.top = `${top}px`;
  }
}
