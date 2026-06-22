import {
  formatAmountDisplay,
  isAmountDisplayEmpty,
  roundToTwoDecimals,
} from "@/app/lib/estimates/calculate-line";
import type {
  ModuleSizeSummaryItem,
  ModuleSizeSummarySection,
} from "@/app/lib/modules/module-size-summary-types";
import type { TranslationParams } from "@/app/lib/i18n/translations";
import {
  calculateCrossSectionVolumeM3,
  calculateFoundationFootprint,
  calculateGablePedimentAreaM2,
  calculateNetFoundationVolumeM3,
  calculateRoofPlane,
  calculateRoofTotals,
  calculateTotalCrossSectionVolumeM3,
  calculateWalls,
  openingAreaM2,
} from "@/app/lib/modules/project-description-calculations";
import {
  getFoundationPlaneOptionLabel,
  isGablePedimentFoundationPlaneKey,
} from "@/app/lib/modules/foundation-plane-options";
import type {
  FoundationCrossSectionEntry,
  OpeningEntry,
  ProjectDescriptionFormState,
  RoofPlaneEntry,
} from "@/app/lib/modules/project-description-types";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

function hasDimension(value: string): boolean {
  return value.trim().length > 0;
}

function parseDimensionInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCountInput(value: string): number | null {
  const digits = value.trim().replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function pushInput(
  items: ModuleSizeSummaryItem[],
  key: string,
  label: string,
  value: string,
  unit: string,
) {
  if (!hasDimension(value)) {
    return;
  }

  items.push({
    key,
    label,
    value: `${value.trim()} ${unit}`,
    numericValue: parseDimensionInput(value),
    unit,
    adjustable: true,
  });
}

function pushCalculated(
  items: ModuleSizeSummaryItem[],
  key: string,
  label: string,
  value: number,
  unit: string,
) {
  if (isAmountDisplayEmpty(value)) {
    return;
  }

  const roundedValue = roundToTwoDecimals(value);

  items.push({
    key,
    label,
    value: `${formatAmountDisplay(roundedValue)} ${unit}`,
    numericValue: roundedValue,
    unit,
    adjustable: false,
  });
}

function pushCount(
  items: ModuleSizeSummaryItem[],
  key: string,
  label: string,
  value: string,
) {
  if (!value.trim()) {
    return;
  }

  items.push({
    key,
    label,
    value: value.trim(),
    numericValue: parseCountInput(value),
    unit: null,
    adjustable: true,
  });
}

function pushText(
  items: ModuleSizeSummaryItem[],
  key: string,
  label: string,
  value: string,
) {
  if (!value.trim()) {
    return;
  }

  items.push({
    key,
    label,
    value: value.trim(),
    numericValue: null,
    unit: null,
    adjustable: false,
  });
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
    hasDimension(entry.mark) ||
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

function buildFoundationSection(
  state: ProjectDescriptionFormState,
): ModuleSizeSummarySection | null {
  const items: ModuleSizeSummaryItem[] = [];

  pushInput(items, "foundation.width", "Platums (m)", state.foundationWidthM, "m");
  pushInput(items, "foundation.depth", "Dziļums (m)", state.foundationDepthM, "m");
  pushInput(items, "foundation.height", "Augstums (m)", state.foundationHeightM, "m");

  const footprint = calculateFoundationFootprint(
    state.foundationWidthM,
    state.foundationDepthM,
    state.foundationHeightM,
    state.foundationLShape,
    state.foundationExtensionWidthM,
    state.foundationExtensionDepthM,
    state.foundationAttachmentPlane,
  );

  if (state.foundationLShape) {
    pushInput(
      items,
      "foundation.extension-width",
      "L paplašinājums — platums (m)",
      state.foundationExtensionWidthM,
      "m",
    );
    pushInput(
      items,
      "foundation.extension-depth",
      "L paplašinājums — dziļums (m)",
      state.foundationExtensionDepthM,
      "m",
    );
    pushCalculated(
      items,
      "foundation.shared-edge",
      "Savienojuma plaknes garums",
      footprint.sharedEdgeLengthM,
      "m",
    );
    pushCalculated(
      items,
      "foundation.perimeter-deduction",
      "Atņemams no perimetra (×2)",
      footprint.perimeterDeductionM,
      "m",
    );
  }

  pushCalculated(items, "foundation.perimeter", "Perimetrs", footprint.perimeterM, "m");
  pushCalculated(items, "foundation.area", "Laukums", footprint.areaM2, "m²");
  pushCalculated(items, "foundation.volume", "Pamatu tilpums", footprint.volumeM3, "m³");

  if (items.length === 0) {
    return null;
  }

  return { title: "Pamats", items };
}

function buildCrossSectionsSection(
  state: ProjectDescriptionFormState,
): ModuleSizeSummarySection | null {
  const activeSections = state.foundationCrossSections.filter(hasCrossSectionData);
  const items: ModuleSizeSummaryItem[] = [];

  activeSections.forEach((entry, index) => {
    const prefix = `cross-section.${index}`;
    const labelPrefix = `Izgriezums ${index + 1}`;
    pushInput(items, `${prefix}.width`, `${labelPrefix} — platums (m)`, entry.widthM, "m");
    pushInput(items, `${prefix}.depth`, `${labelPrefix} — dziļums (m)`, entry.depthM, "m");
    pushInput(items, `${prefix}.height`, `${labelPrefix} — augstums (m)`, entry.heightM, "m");
    pushCalculated(
      items,
      `${prefix}.volume`,
      `${labelPrefix} — izgriezuma tilpums (atņemams)`,
      calculateCrossSectionVolumeM3(entry),
      "m³",
    );
  });

  const footprint = calculateFoundationFootprint(
    state.foundationWidthM,
    state.foundationDepthM,
    state.foundationHeightM,
    state.foundationLShape,
    state.foundationExtensionWidthM,
    state.foundationExtensionDepthM,
    state.foundationAttachmentPlane,
  );
  const removedVolume = calculateTotalCrossSectionVolumeM3(
    state.foundationCrossSections,
  );
  const netVolume = calculateNetFoundationVolumeM3(
    footprint.volumeM3,
    state.foundationCrossSections,
  );

  pushCalculated(items, "cross-sections.removed-total", "Atņemams tilpums (kopā)", removedVolume, "m³");
  pushCalculated(items, "cross-sections.net-volume", "Galīgais pamatu tilpums", netVolume, "m³");

  if (items.length === 0) {
    return null;
  }

  return { title: "Pamata izgriezumi", items };
}

function buildWallsSection(
  state: ProjectDescriptionFormState,
): ModuleSizeSummarySection | null {
  const items: ModuleSizeSummaryItem[] = [];
  const walls = calculateWalls(
    state.floorHeightM,
    state.exteriorWallLengthM,
    state.interiorWallLengthM,
    state.windows,
    state.doors,
    state.gablePediments,
    {
      foundationWidthM: state.foundationWidthM,
      foundationDepthM: state.foundationDepthM,
      foundationLShape: state.foundationLShape,
      foundationExtensionWidthM: state.foundationExtensionWidthM,
      foundationExtensionDepthM: state.foundationExtensionDepthM,
    },
  );

  pushInput(items, "walls.floor-height", "Stāvu augstums (m)", state.floorHeightM, "m");
  pushInput(items, "walls.exterior-length", "Ārsienu garums (m)", state.exteriorWallLengthM, "m");
  pushInput(items, "walls.interior-length", "Starpsienu garums (m)", state.interiorWallLengthM, "m");
  pushCalculated(items, "walls.exterior-gross", "Ārsienu kvadratūra (bruto)", walls.grossExteriorWallAreaM2, "m²");
  pushCalculated(items, "walls.interior-gross", "Starpsienu kvadratūra (bruto)", walls.grossInteriorWallAreaM2, "m²");
  pushCalculated(items, "walls.windows-area", "Logu laukums (atņemams no ārsienām)", walls.windowOpeningAreaM2, "m²");
  pushCalculated(
    items,
    "walls.exterior-doors-area",
    "Durvju laukums ārsienās (atņemams)",
    walls.exteriorDoorOpeningAreaM2,
    "m²",
  );
  pushCalculated(
    items,
    "walls.interior-doors-area",
    "Durvju laukums starpsienās (atņemams)",
    walls.interiorDoorOpeningAreaM2,
    "m²",
  );
  pushCalculated(items, "walls.total-net", "Kopējā sienu kvadratūra (neto)", walls.totalNetWallAreaM2, "m²");
  pushCalculated(items, "walls.exterior-net", "Ārsienu kvadratūra (neto)", walls.netExteriorWallAreaM2, "m²");
  pushCalculated(items, "walls.interior-net", "Starpsienu kvadratūra (neto)", walls.netInteriorWallAreaM2, "m²");
  pushCalculated(
    items,
    "walls.gable-total",
    "Frontonu kopējā platība",
    walls.gablePedimentAreaM2,
    "m²",
  );

  const foundationContext = {
    foundationWidthM: state.foundationWidthM,
    foundationDepthM: state.foundationDepthM,
    foundationLShape: state.foundationLShape,
    foundationExtensionWidthM: state.foundationExtensionWidthM,
    foundationExtensionDepthM: state.foundationExtensionDepthM,
  };
  const activeGables = state.gablePediments.filter(
    (entry) =>
      entry.heightM.trim().length > 0 ||
      entry.foundationPlaneKey.trim().length > 0 ||
      entry.count.trim().replace(/\D/g, "").length > 0,
  );
  activeGables.forEach((entry, index) => {
    const prefix = `gable.${index}`;
    const planeLabel = isGablePedimentFoundationPlaneKey(entry.foundationPlaneKey)
      ? getFoundationPlaneOptionLabel(entry.foundationPlaneKey)
      : "Pamata plakne";
    pushInput(items, `${prefix}.height`, `Frontons ${index + 1} augstums (m)`, entry.heightM, "m");
    pushCount(items, `${prefix}.count`, `Frontons ${index + 1} skaits`, entry.count);
    pushText(items, `${prefix}.plane`, `Frontons ${index + 1} plakne`, planeLabel);
    pushCalculated(
      items,
      `${prefix}.area`,
      `Frontons ${index + 1} platība`,
      calculateGablePedimentAreaM2(entry, foundationContext),
      "m²",
    );
  });

  if (items.length === 0) {
    return null;
  }

  return { title: "Sienas", items };
}

function buildWindowsSection(
  state: ProjectDescriptionFormState,
): ModuleSizeSummarySection | null {
  const activeWindows = state.windows.filter(hasOpeningData);
  if (activeWindows.length === 0) {
    return null;
  }

  const items: ModuleSizeSummaryItem[] = [];

  activeWindows.forEach((entry, index) => {
    const prefix = `windows.${index}`;
    const labelPrefix = entry.mark.trim() || `Logu veids ${index + 1}`;
    pushText(items, `${prefix}.mark`, `${labelPrefix} — marka`, entry.mark);
    pushInput(items, `${prefix}.height`, `${labelPrefix} — augstums (m)`, entry.heightM, "m");
    pushInput(items, `${prefix}.width`, `${labelPrefix} — platums (m)`, entry.widthM, "m");
    pushCount(items, `${prefix}.count`, `${labelPrefix} — skaits`, entry.count);
    pushCalculated(items, `${prefix}.area`, `${labelPrefix} — laukums`, openingAreaM2(entry), "m²");
  });

  return { title: "Logi", items };
}

function buildDoorsSection(
  state: ProjectDescriptionFormState,
): ModuleSizeSummarySection | null {
  const activeDoors = state.doors.filter(hasOpeningData);
  if (activeDoors.length === 0) {
    return null;
  }

  const items: ModuleSizeSummaryItem[] = [];

  activeDoors.forEach((entry, index) => {
    const prefix = `doors.${index}`;
    const labelPrefix = entry.mark.trim() || `Durvju veids ${index + 1}`;
    pushText(items, `${prefix}.mark`, `${labelPrefix} — marka`, entry.mark);
    pushInput(items, `${prefix}.height`, `${labelPrefix} — augstums (m)`, entry.heightM, "m");
    pushInput(items, `${prefix}.width`, `${labelPrefix} — platums (m)`, entry.widthM, "m");
    pushCount(items, `${prefix}.count`, `${labelPrefix} — skaits`, entry.count);
    pushText(
      items,
      `${prefix}.placement`,
      `${labelPrefix} — vieta`,
      entry.exteriorWall ? "Ārsienu siena" : "Starpsienu siena",
    );
    pushCalculated(items, `${prefix}.area`, `${labelPrefix} — laukums`, openingAreaM2(entry), "m²");
  });

  return { title: "Durvis", items };
}

function buildRoofSection(
  state: ProjectDescriptionFormState,
): ModuleSizeSummarySection | null {
  const activePlanes = state.roofPlanes.filter(hasRoofPlaneData);
  if (activePlanes.length === 0) {
    return null;
  }

  const items: ModuleSizeSummaryItem[] = [];

  activePlanes.forEach((plane, index) => {
    const calc = calculateRoofPlane(plane, state.floorHeightM);
    const prefix = `roof.${index}`;
    const labelPrefix = `Plakne ${index + 1}`;
    pushInput(items, `${prefix}.width`, `${labelPrefix} — platums (m)`, plane.widthM, "m");
    pushInput(items, `${prefix}.height`, `${labelPrefix} — augstums (m)`, plane.heightM, "m");
    pushCount(items, `${prefix}.count`, `${labelPrefix} — skaits`, plane.count);
    pushCalculated(items, `${prefix}.area`, `${labelPrefix} — plaknes laukums`, calc.areaM2, "m²");
    pushCalculated(items, `${prefix}.gutter`, `${labelPrefix} — teknes garums`, calc.gutterLengthM, "m");
    pushCalculated(items, `${prefix}.downpipe`, `${labelPrefix} — noteku garums`, calc.downpipeLengthM, "m");
  });

  const roofTotals = calculateRoofTotals(state.roofPlanes, state.floorHeightM);
  pushCalculated(items, "roof.total-area", "Kopējā jumta platība", roofTotals.totalAreaM2, "m²");
  pushCalculated(items, "roof.total-gutter", "Kopējais teknes garums", roofTotals.totalGutterLengthM, "m");
  pushCalculated(items, "roof.total-downpipe", "Kopējais noteku garums", roofTotals.totalDownpipeLengthM, "m");

  return { title: "Jumts", items };
}

export function buildModuleSizeSummarySections(
  state: ProjectDescriptionFormState,
): ModuleSizeSummarySection[] {
  return [
    buildFoundationSection(state),
    buildCrossSectionsSection(state),
    buildWallsSection(state),
    buildWindowsSection(state),
    buildDoorsSection(state),
    buildRoofSection(state),
  ].filter((section): section is ModuleSizeSummarySection => section != null);
}

function translateSummaryTitle(title: string, t: Translate): string {
  const keys: Record<string, string> = {
    Pamats: "project_description.summary.foundation.title",
    "Pamata izgriezumi": "project_description.summary.cross_sections.title",
    Sienas: "project_description.summary.walls.title",
    Logi: "project_description.summary.windows.title",
    Durvis: "project_description.summary.doors.title",
    Jumts: "project_description.summary.roof.title",
  };

  const key = keys[title];
  return key ? t(key, title) : title;
}

function translateSummaryLabel(item: ModuleSizeSummaryItem, t: Translate): string {
  const staticKeys: Record<string, string> = {
    "foundation.width": "project_description.summary.foundation.width",
    "foundation.depth": "project_description.summary.foundation.depth",
    "foundation.height": "project_description.summary.foundation.height",
    "foundation.extension-width": "project_description.summary.foundation.extension_width",
    "foundation.extension-depth": "project_description.summary.foundation.extension_depth",
    "foundation.shared-edge": "project_description.summary.foundation.shared_edge",
    "foundation.perimeter-deduction": "project_description.summary.foundation.perimeter_deduction",
    "foundation.perimeter": "project_description.summary.foundation.perimeter",
    "foundation.area": "project_description.summary.foundation.area",
    "foundation.volume": "project_description.summary.foundation.volume",
    "cross-sections.removed-total": "project_description.summary.cross_sections.removed_total",
    "cross-sections.net-volume": "project_description.summary.cross_sections.net_volume",
    "walls.floor-height": "project_description.summary.walls.floor_height",
    "walls.exterior-length": "project_description.summary.walls.exterior_length",
    "walls.interior-length": "project_description.summary.walls.interior_length",
    "walls.exterior-gross": "project_description.summary.walls.exterior_gross",
    "walls.interior-gross": "project_description.summary.walls.interior_gross",
    "walls.windows-area": "project_description.summary.walls.windows_area",
    "walls.exterior-doors-area": "project_description.summary.walls.exterior_doors_area",
    "walls.interior-doors-area": "project_description.summary.walls.interior_doors_area",
    "walls.total-net": "project_description.summary.walls.total_net",
    "walls.exterior-net": "project_description.summary.walls.exterior_net",
    "walls.interior-net": "project_description.summary.walls.interior_net",
    "walls.gable-total": "project_description.summary.walls.gable_total",
    "roof.total-area": "project_description.summary.roof.total_area",
    "roof.total-gutter": "project_description.summary.roof.total_gutter",
    "roof.total-downpipe": "project_description.summary.roof.total_downpipe",
  };

  const staticKey = staticKeys[item.key];
  if (staticKey) {
    return t(staticKey, item.label);
  }

  const crossSectionMatch = item.key.match(/^cross-section\.(\d+)\.(width|depth|height|volume)$/);
  if (crossSectionMatch) {
    const [, rawIndex, field] = crossSectionMatch;
    return t(`project_description.summary.cross_sections.item_${field}`, item.label, {
      index: Number(rawIndex) + 1,
    });
  }

  const gableMatch = item.key.match(/^gable\.(\d+)\.(height|count|plane|area)$/);
  if (gableMatch) {
    const [, rawIndex, field] = gableMatch;
    return t(`project_description.summary.gable.item_${field}`, item.label, {
      index: Number(rawIndex) + 1,
    });
  }

  const openingMatch = item.key.match(/^(windows|doors)\.(\d+)\.(mark|height|width|count|placement|area)$/);
  if (openingMatch) {
    const [, group, rawIndex, field] = openingMatch;
    return t(`project_description.summary.${group}.item_${field}`, item.label, {
      index: Number(rawIndex) + 1,
    });
  }

  const roofMatch = item.key.match(/^roof\.(\d+)\.(width|height|count|area|gutter|downpipe)$/);
  if (roofMatch) {
    const [, rawIndex, field] = roofMatch;
    return t(`project_description.summary.roof.item_${field}`, item.label, {
      index: Number(rawIndex) + 1,
    });
  }

  return item.label;
}

function translateSummaryValue(item: ModuleSizeSummaryItem, t: Translate): string {
  if (item.key.match(/^doors\.\d+\.placement$/)) {
    if (item.value === "Ārsienu siena") {
      return t("project_description.summary.doors.exterior_wall", item.value);
    }
    if (item.value === "Starpsienu siena") {
      return t("project_description.summary.doors.interior_wall", item.value);
    }
  }

  return item.value;
}

export function translateModuleSizeSummarySections(
  sections: ModuleSizeSummarySection[],
  t: Translate,
): ModuleSizeSummarySection[] {
  return sections.map((section) => ({
    ...section,
    title: translateSummaryTitle(section.title, t),
    items: section.items.map((item) => ({
      ...item,
      label: translateSummaryLabel(item, t),
      value: translateSummaryValue(item, t),
    })),
  }));
}
