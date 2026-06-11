import { isBlankRowItem } from "@/app/lib/estimates/multi-position";
import { parseMultiOptionLinks } from "@/app/lib/estimates/multi-position-links";
import type { MultiOptionLinkGroup } from "@/app/lib/estimates/types";

import type { EstimatePositionSection } from "@/app/lib/estimate-positions/types";

import { normalizeEstimatePositionSection } from "@/app/lib/estimate-positions/create-empty";

function normalizeSection(section: EstimatePositionSection): EstimatePositionSection {
  const normalized = normalizeEstimatePositionSection(section);

  return {
    ...normalized,
    title: normalized.title.trim(),
    subcategories: normalized.subcategories
      .map((subcategory) => ({
        ...subcategory,
        title: subcategory.title.trim(),
        items: subcategory.items.filter((row) => !isBlankRowItem(row)),
      }))
      .filter(
        (subcategory) =>
          subcategory.title.length > 0 || subcategory.items.length > 0,
      ),
    items: normalized.items.filter((row) => !isBlankRowItem(row)),
  };
}

export function normalizeEstimatePositionSectionsForCompare(
  sections: EstimatePositionSection[],
): EstimatePositionSection[] {
  return sections.map(normalizeSection);
}

export function sanitizeEstimatePositionSections(
  sections: EstimatePositionSection[],
): EstimatePositionSection[] {
  return normalizeEstimatePositionSectionsForCompare(sections).filter(
    (section) =>
      section.title.length > 0 ||
      section.items.length > 0 ||
      section.subcategories.length > 0,
  );
}

export function parseEstimatePositionSectionsPayload(
  value: unknown,
): EstimatePositionSection[] {
  if (Array.isArray(value)) {
    return value.map((section) =>
      normalizeEstimatePositionSection(section as EstimatePositionSection),
    );
  }

  if (value && typeof value === "object" && "sections" in value) {
    const record = value as { sections?: unknown };
    if (!Array.isArray(record.sections)) {
      return [];
    }

    return record.sections.map((section) =>
      normalizeEstimatePositionSection(section as EstimatePositionSection),
    );
  }

  return [];
}

export function parseEstimatePositionDocumentPayload(value: unknown): {
  sections: EstimatePositionSection[];
  multiOptionLinks: MultiOptionLinkGroup[];
} {
  if (Array.isArray(value)) {
    return {
      sections: parseEstimatePositionSectionsPayload(value),
      multiOptionLinks: [],
    };
  }

  if (value && typeof value === "object") {
    const record = value as {
      sections?: unknown;
      multiOptionLinks?: unknown;
    };

    return {
      sections: Array.isArray(record.sections)
        ? parseEstimatePositionSectionsPayload(record.sections)
        : [],
      multiOptionLinks: parseMultiOptionLinks(record.multiOptionLinks),
    };
  }

  return { sections: [], multiOptionLinks: [] };
}

export function buildEstimatePositionSectionsStorage(
  sections: EstimatePositionSection[],
  multiOptionLinks: MultiOptionLinkGroup[],
): EstimatePositionSection[] | {
  sections: EstimatePositionSection[];
  multiOptionLinks: MultiOptionLinkGroup[];
} {
  const normalizedSections = sanitizeEstimatePositionSections(sections);

  if (multiOptionLinks.length === 0) {
    return normalizedSections;
  }

  return {
    sections: normalizedSections,
    multiOptionLinks,
  };
}

export function serializeEstimatePositionDocument(
  title: string,
  sections: EstimatePositionSection[],
  multiOptionLinks: MultiOptionLinkGroup[] = [],
): string {
  return JSON.stringify({
    title: title.trim(),
    sections: normalizeEstimatePositionSectionsForCompare(sections),
    multiOptionLinks,
  });
}
