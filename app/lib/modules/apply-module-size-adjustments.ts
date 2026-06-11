import { formatAmountDisplay } from "@/app/lib/estimates/calculate-line";
import { buildModuleSizeSummarySections } from "@/app/lib/modules/format-module-size-summary";
import {
  hasModuleSizeAdjustment,
  parseModuleSizeAdjustment,
} from "@/app/lib/modules/module-size-value";
import type { ModuleSizeSummarySection } from "@/app/lib/modules/module-size-summary-types";
import type {
  DoorEntry,
  FoundationCrossSectionEntry,
  GablePedimentEntry,
  OpeningEntry,
  ProjectDescriptionFormState,
  RoofPlaneEntry,
} from "@/app/lib/modules/project-description-types";

function hasDimension(value: string): boolean {
  return value.trim().length > 0;
}

function parseDimensionInput(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCountInput(value: string): number {
  const digits = value.trim().replace(/\D/g, "");
  if (!digits) {
    return 0;
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAdjustedDimension(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return formatAmountDisplay(value).replace(".", ",");
}

function formatAdjustedCount(value: number): string {
  return String(Math.max(0, Math.round(value)));
}

function applyDimensionAdjustment(value: string, adjustment: string): string {
  if (!hasModuleSizeAdjustment(adjustment)) {
    return value;
  }

  const total =
    parseDimensionInput(value) + parseModuleSizeAdjustment(adjustment);
  return formatAdjustedDimension(total);
}

function applyCountAdjustment(value: string, adjustment: string): string {
  if (!hasModuleSizeAdjustment(adjustment)) {
    return value;
  }

  const total =
    parseCountInput(value) + parseModuleSizeAdjustment(adjustment);
  return formatAdjustedCount(total);
}

function hasCrossSectionData(entry: FoundationCrossSectionEntry): boolean {
  return (
    hasDimension(entry.widthM) ||
    hasDimension(entry.depthM) ||
    hasDimension(entry.heightM)
  );
}

function hasOpeningData(entry: OpeningEntry): boolean {
  return (
    hasDimension(entry.heightM) ||
    hasDimension(entry.widthM) ||
    entry.count.trim().replace(/\D/g, "").length > 0
  );
}

function hasRoofPlaneData(plane: RoofPlaneEntry): boolean {
  return (
    hasDimension(plane.widthM) ||
    hasDimension(plane.heightM) ||
    plane.count.trim().replace(/\D/g, "").length > 0
  );
}

function hasGablePedimentData(entry: GablePedimentEntry): boolean {
  return (
    hasDimension(entry.heightM) ||
    entry.foundationPlaneKey.trim().length > 0 ||
    entry.count.trim().replace(/\D/g, "").length > 0
  );
}

function getActiveGablePediments(state: ProjectDescriptionFormState) {
  return state.gablePediments.filter(hasGablePedimentData);
}

function getActiveCrossSections(state: ProjectDescriptionFormState) {
  return state.foundationCrossSections.filter(hasCrossSectionData);
}

function updateCrossSectionField(
  state: ProjectDescriptionFormState,
  index: number,
  field: "widthM" | "depthM" | "heightM",
  adjustment: string,
): ProjectDescriptionFormState {
  const activeEntry = getActiveCrossSections(state)[index];
  if (!activeEntry) {
    return state;
  }

  return {
    ...state,
    foundationCrossSections: state.foundationCrossSections.map((entry) =>
      entry.id === activeEntry.id
        ? {
            ...entry,
            [field]: applyDimensionAdjustment(entry[field], adjustment),
          }
        : entry,
    ),
  };
}

function updateOpeningField(
  entries: OpeningEntry[],
  index: number,
  field: "heightM" | "widthM" | "count",
  adjustment: string,
): OpeningEntry[] {
  const activeEntry = entries.filter(hasOpeningData)[index];
  if (!activeEntry) {
    return entries;
  }

  const applyValue =
    field === "count" ? applyCountAdjustment : applyDimensionAdjustment;

  return entries.map((entry) =>
    entry.id === activeEntry.id
      ? {
          ...entry,
          [field]: applyValue(entry[field], adjustment),
        }
      : entry,
  );
}

function updateDoorField(
  entries: DoorEntry[],
  index: number,
  field: "heightM" | "widthM" | "count",
  adjustment: string,
): DoorEntry[] {
  const activeEntry = entries.filter(hasOpeningData)[index];
  if (!activeEntry) {
    return entries;
  }

  const applyValue =
    field === "count" ? applyCountAdjustment : applyDimensionAdjustment;

  return entries.map((entry) =>
    entry.id === activeEntry.id
      ? {
          ...entry,
          [field]: applyValue(entry[field], adjustment),
        }
      : entry,
  );
}

function updateRoofPlaneField(
  planes: RoofPlaneEntry[],
  index: number,
  field: "widthM" | "heightM" | "count",
  adjustment: string,
): RoofPlaneEntry[] {
  const activePlane = planes.filter(hasRoofPlaneData)[index];
  if (!activePlane) {
    return planes;
  }

  const applyValue =
    field === "count" ? applyCountAdjustment : applyDimensionAdjustment;

  return planes.map((plane) =>
    plane.id === activePlane.id
      ? {
          ...plane,
          [field]: applyValue(plane[field], adjustment),
        }
      : plane,
  );
}

function applySingleItemKeyAdjustment(
  state: ProjectDescriptionFormState,
  itemKey: string,
  adjustment: string,
): ProjectDescriptionFormState {
  if (!hasModuleSizeAdjustment(adjustment)) {
    return state;
  }

  switch (itemKey) {
    case "foundation.width":
      return {
        ...state,
        foundationWidthM: applyDimensionAdjustment(
          state.foundationWidthM,
          adjustment,
        ),
      };
    case "foundation.depth":
      return {
        ...state,
        foundationDepthM: applyDimensionAdjustment(
          state.foundationDepthM,
          adjustment,
        ),
      };
    case "foundation.height":
      return {
        ...state,
        foundationHeightM: applyDimensionAdjustment(
          state.foundationHeightM,
          adjustment,
        ),
      };
    case "foundation.extension-width":
      return {
        ...state,
        foundationExtensionWidthM: applyDimensionAdjustment(
          state.foundationExtensionWidthM,
          adjustment,
        ),
      };
    case "foundation.extension-depth":
      return {
        ...state,
        foundationExtensionDepthM: applyDimensionAdjustment(
          state.foundationExtensionDepthM,
          adjustment,
        ),
      };
    case "walls.floor-height":
      return {
        ...state,
        floorHeightM: applyDimensionAdjustment(state.floorHeightM, adjustment),
      };
    case "walls.exterior-length":
      return {
        ...state,
        exteriorWallLengthM: applyDimensionAdjustment(
          state.exteriorWallLengthM,
          adjustment,
        ),
      };
    case "walls.interior-length":
      return {
        ...state,
        interiorWallLengthM: applyDimensionAdjustment(
          state.interiorWallLengthM,
          adjustment,
        ),
      };
    default:
      break;
  }

  const crossSectionMatch = /^cross-section\.(\d+)\.(width|depth|height)$/.exec(
    itemKey,
  );
  if (crossSectionMatch) {
    const index = Number.parseInt(crossSectionMatch[1] ?? "", 10);
    const fieldMap = {
      width: "widthM",
      depth: "depthM",
      height: "heightM",
    } as const;
    const field = fieldMap[crossSectionMatch[2] as keyof typeof fieldMap];
    return updateCrossSectionField(state, index, field, adjustment);
  }

  const windowMatch = /^windows\.(\d+)\.(height|width|count)$/.exec(itemKey);
  if (windowMatch) {
    const index = Number.parseInt(windowMatch[1] ?? "", 10);
    const fieldMap = {
      height: "heightM",
      width: "widthM",
      count: "count",
    } as const;
    const field = fieldMap[windowMatch[2] as keyof typeof fieldMap];
    return {
      ...state,
      windows: updateOpeningField(state.windows, index, field, adjustment),
    };
  }

  const doorMatch = /^doors\.(\d+)\.(height|width|count)$/.exec(itemKey);
  if (doorMatch) {
    const index = Number.parseInt(doorMatch[1] ?? "", 10);
    const fieldMap = {
      height: "heightM",
      width: "widthM",
      count: "count",
    } as const;
    const field = fieldMap[doorMatch[2] as keyof typeof fieldMap];
    return {
      ...state,
      doors: updateDoorField(state.doors, index, field, adjustment),
    };
  }

  const roofMatch = /^roof\.(\d+)\.(width|height|count)$/.exec(itemKey);
  if (roofMatch) {
    const index = Number.parseInt(roofMatch[1] ?? "", 10);
    const fieldMap = {
      width: "widthM",
      height: "heightM",
      count: "count",
    } as const;
    const field = fieldMap[roofMatch[2] as keyof typeof fieldMap];
    return {
      ...state,
      roofPlanes: updateRoofPlaneField(state.roofPlanes, index, field, adjustment),
    };
  }

  const gableHeightMatch = /^gable\.(\d+)\.height$/.exec(itemKey);
  if (gableHeightMatch) {
    const index = Number.parseInt(gableHeightMatch[1] ?? "", 10);
    const activeEntry = getActiveGablePediments(state)[index];
    if (!activeEntry) {
      return state;
    }

    return {
      ...state,
      gablePediments: state.gablePediments.map((entry) =>
        entry.id === activeEntry.id
          ? {
              ...entry,
              heightM: applyDimensionAdjustment(entry.heightM, adjustment),
            }
          : entry,
      ),
    };
  }

  const gableCountMatch = /^gable\.(\d+)\.count$/.exec(itemKey);
  if (gableCountMatch) {
    const index = Number.parseInt(gableCountMatch[1] ?? "", 10);
    const activeEntry = getActiveGablePediments(state)[index];
    if (!activeEntry) {
      return state;
    }

    return {
      ...state,
      gablePediments: state.gablePediments.map((entry) =>
        entry.id === activeEntry.id
          ? {
              ...entry,
              count: applyCountAdjustment(entry.count, adjustment),
            }
          : entry,
      ),
    };
  }

  return state;
}

export function applyModuleSizeAdjustmentsToProjectDescription(
  state: ProjectDescriptionFormState,
  adjustmentsByItemKey: Record<string, string>,
): ProjectDescriptionFormState {
  return Object.entries(adjustmentsByItemKey).reduce(
    (current, [itemKey, adjustment]) =>
      applySingleItemKeyAdjustment(current, itemKey, adjustment),
    state,
  );
}

export function buildAdjustedModuleSizeSummarySections(
  state: ProjectDescriptionFormState,
  adjustmentsByItemKey: Record<string, string>,
): ModuleSizeSummarySection[] {
  const adjustedState = applyModuleSizeAdjustmentsToProjectDescription(
    state,
    adjustmentsByItemKey,
  );
  return buildModuleSizeSummarySections(adjustedState);
}

export function findModuleSizeSummaryItem(
  sections: ModuleSizeSummarySection[],
  itemKey: string,
) {
  for (const section of sections) {
    const item = section.items.find((entry) => entry.key === itemKey);
    if (item) {
      return item;
    }
  }

  return undefined;
}

export function collectModuleSizeAdjustmentsFromAttachState(
  moduleId: string,
  attachState: Record<string, { adjustment: string }>,
): Record<string, string> {
  const adjustments: Record<string, string> = {};

  for (const [stateKey, state] of Object.entries(attachState)) {
    if (!stateKey.startsWith(`${moduleId}:`)) {
      continue;
    }

    if (!hasModuleSizeAdjustment(state.adjustment)) {
      continue;
    }

    const itemKey = stateKey.slice(moduleId.length + 1);
    adjustments[itemKey] = state.adjustment;
  }

  return adjustments;
}
