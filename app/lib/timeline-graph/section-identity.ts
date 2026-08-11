import type {
  TimelineGraphCategory,
  TimelineGraphProject,
} from "@/app/lib/timeline-graph/types";

export type TimelineSectionIdentity =
  | { kind: "category"; categoryTitle: string }
  | { kind: "subcategory"; categoryTitle: string; subcategoryTitle: string }
  | { kind: "direct"; categoryTitle: string };

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

export function sectionIdentityKey(identity: TimelineSectionIdentity): string {
  if (identity.kind === "category") {
    return `category::${normalizeTitle(identity.categoryTitle)}`;
  }
  if (identity.kind === "direct") {
    return `direct::${normalizeTitle(identity.categoryTitle)}`;
  }
  return `subcategory::${normalizeTitle(identity.categoryTitle)}::${normalizeTitle(identity.subcategoryTitle)}`;
}

function categoryHasSubcategories(
  category: Pick<TimelineGraphCategory, "children">,
): boolean {
  return category.children.some((child) => child.kind === "subcategory");
}

/** Resolve work identity for a section id inside one graph project. */
export function findSectionIdentity(
  project: TimelineGraphProject,
  sectionId: string,
): TimelineSectionIdentity | null {
  const trimmed = sectionId.trim();
  if (!trimmed || trimmed === project.id) {
    return null;
  }

  for (const category of project.categories) {
    if (category.id === trimmed) {
      return {
        kind: "category",
        categoryTitle: category.title,
      };
    }

    for (const child of category.children) {
      if (child.id !== trimmed) {
        continue;
      }
      if (child.kind === "subcategory") {
        return {
          kind: "subcategory",
          categoryTitle: category.title,
          subcategoryTitle: child.title,
        };
      }
      return {
        kind: "direct",
        categoryTitle: category.title,
      };
    }
  }

  return null;
}

/** Find section id in a project that matches the given work identity. */
export function findSectionIdByIdentity(
  project: TimelineGraphProject,
  identity: TimelineSectionIdentity,
): string | null {
  const categoryTitle = normalizeTitle(identity.categoryTitle);
  if (!categoryTitle) {
    return null;
  }

  const category = project.categories.find(
    (entry) => normalizeTitle(entry.title) === categoryTitle,
  );
  if (!category) {
    return null;
  }

  if (identity.kind === "category") {
    return category.id;
  }

  if (identity.kind === "direct") {
    const direct = category.children.find((child) => child.kind === "direct");
    // Bez apakškategorijām cilvēku skaits glabājas uz kategorijas id.
    if (!categoryHasSubcategories(category)) {
      return category.id;
    }
    return direct?.id ?? null;
  }

  const subcategoryTitle = normalizeTitle(identity.subcategoryTitle);
  if (!subcategoryTitle) {
    return null;
  }

  const child = category.children.find(
    (entry) =>
      entry.kind === "subcategory" &&
      normalizeTitle(entry.title) === subcategoryTitle,
  );
  return child?.id ?? null;
}

export function listProjectSectionRefs(
  project: TimelineGraphProject,
): Array<{ sectionId: string; identity: TimelineSectionIdentity }> {
  const refs: Array<{ sectionId: string; identity: TimelineSectionIdentity }> =
    [];

  for (const category of project.categories) {
    refs.push({
      sectionId: category.id,
      identity: { kind: "category", categoryTitle: category.title },
    });

    for (const child of category.children) {
      if (child.kind === "subcategory") {
        refs.push({
          sectionId: child.id,
          identity: {
            kind: "subcategory",
            categoryTitle: category.title,
            subcategoryTitle: child.title,
          },
        });
      } else {
        refs.push({
          sectionId: child.id,
          identity: { kind: "direct", categoryTitle: category.title },
        });
      }
    }
  }

  return refs;
}
