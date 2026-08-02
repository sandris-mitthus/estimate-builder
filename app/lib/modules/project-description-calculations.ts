import { roundToTwoDecimals } from "@/app/lib/estimates/calculate-line";
import type {
  GablePedimentFoundationContext,
} from "@/app/lib/modules/foundation-plane-options";
import {
  isGablePedimentFoundationPlaneKey,
  resolveFoundationPlaneLengthM,
} from "@/app/lib/modules/foundation-plane-options";
import type {
  DoorEntry,
  FoundationAttachmentPlane,
  FoundationCrossSectionEntry,
  GablePedimentEntry,
  OpeningEntry,
  RoofPlaneEntry,
  SanitaryRoomEntry,
} from "@/app/lib/modules/project-description-types";

function parseDimension(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function parseCount(value: string): number {
  const digits = value.trim().replace(/\D/g, "");
  if (!digits) {
    return 0;
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function openingAreaM2(entry: OpeningEntry): number {
  return parseDimension(entry.heightM) * parseDimension(entry.widthM) * parseCount(entry.count);
}

/** Ailas kopējais perimetrs: 2 × (augstums + platums) × skaits. */
export function openingPerimeterM(entry: OpeningEntry): number {
  const height = parseDimension(entry.heightM);
  const width = parseDimension(entry.widthM);
  const count = parseCount(entry.count);

  return roundToTwoDecimals(2 * (height + width) * count);
}

export function sumOpeningAreaM2(entries: OpeningEntry[]): number {
  return entries.reduce((sum, entry) => sum + openingAreaM2(entry), 0);
}

export function sumDoorOpeningAreaM2(
  doors: DoorEntry[],
  exteriorWall: boolean,
): number {
  return doors
    .filter((door) => door.exteriorWall === exteriorWall)
    .reduce((sum, door) => sum + openingAreaM2(door), 0);
}

export type FoundationFootprintCalculations = {
  perimeterM: number;
  areaM2: number;
  volumeM3: number;
  sharedEdgeLengthM: number;
  perimeterDeductionM: number;
};

function calculateRectangleVolume(
  widthM: string,
  depthM: string,
  heightM: string,
): number {
  return (
    parseDimension(widthM) * parseDimension(depthM) * parseDimension(heightM)
  );
}

function calculateRectangleFootprint(widthM: string, depthM: string) {
  const width = parseDimension(widthM);
  const depth = parseDimension(depthM);

  return {
    perimeterM: 2 * (width + depth),
    areaM2: width * depth,
  };
}

function resolveAttachmentEdgeLengthM(
  attachmentPlane: FoundationAttachmentPlane,
  extensionWidthM: string,
  extensionDepthM: string,
): number {
  return attachmentPlane === "width"
    ? parseDimension(extensionWidthM)
    : parseDimension(extensionDepthM);
}

export function calculateFoundationFootprint(
  widthM: string,
  depthM: string,
  heightM: string,
  lShape: boolean,
  extensionWidthM: string,
  extensionDepthM: string,
  attachmentPlane: FoundationAttachmentPlane,
): FoundationFootprintCalculations {
  const main = calculateRectangleFootprint(widthM, depthM);
  const mainVolumeM3 = calculateRectangleVolume(widthM, depthM, heightM);

  if (!lShape) {
    return {
      ...main,
      volumeM3: mainVolumeM3,
      sharedEdgeLengthM: 0,
      perimeterDeductionM: 0,
    };
  }

  const extension = calculateRectangleFootprint(extensionWidthM, extensionDepthM);
  const extensionVolumeM3 = calculateRectangleVolume(
    extensionWidthM,
    extensionDepthM,
    heightM,
  );
  const sharedEdgeLengthM = resolveAttachmentEdgeLengthM(
    attachmentPlane,
    extensionWidthM,
    extensionDepthM,
  );
  const perimeterDeductionM = 2 * sharedEdgeLengthM;

  return {
    perimeterM: Math.max(
      0,
      main.perimeterM + extension.perimeterM - perimeterDeductionM,
    ),
    areaM2: main.areaM2 + extension.areaM2,
    volumeM3: mainVolumeM3 + extensionVolumeM3,
    sharedEdgeLengthM,
    perimeterDeductionM,
  };
}

export function calculateCrossSectionVolumeM3(
  entry: FoundationCrossSectionEntry,
): number {
  return (
    parseDimension(entry.widthM) *
    parseDimension(entry.depthM) *
    parseDimension(entry.heightM)
  );
}

export function calculateTotalCrossSectionVolumeM3(
  crossSections: FoundationCrossSectionEntry[],
): number {
  return crossSections.reduce(
    (sum, entry) => sum + calculateCrossSectionVolumeM3(entry),
    0,
  );
}

/** Pamatu tilpums mīnus visu izgriezumu tilpumi. */
export function calculateNetFoundationVolumeM3(
  foundationVolumeM3: number,
  crossSections: FoundationCrossSectionEntry[],
): number {
  return Math.max(
    0,
    foundationVolumeM3 - calculateTotalCrossSectionVolumeM3(crossSections),
  );
}

export type WallCalculations = {
  grossExteriorWallAreaM2: number;
  grossInteriorWallAreaM2: number;
  windowOpeningAreaM2: number;
  exteriorDoorOpeningAreaM2: number;
  interiorDoorOpeningAreaM2: number;
  gablePedimentAreaM2: number;
  netExteriorWallAreaM2: number;
  netInteriorWallAreaM2: number;
  totalNetWallAreaM2: number;
};

/** Frontona laukums: platums × augstums / 2 × skaits. */
export function calculateGablePedimentAreaM2(
  pediment: GablePedimentEntry,
  foundationContext: GablePedimentFoundationContext,
): number {
  if (!isGablePedimentFoundationPlaneKey(pediment.foundationPlaneKey)) {
    return 0;
  }

  const widthM = resolveFoundationPlaneLengthM(
    pediment.foundationPlaneKey,
    foundationContext,
  );
  const heightM = parseDimension(pediment.heightM);
  const count = parseCount(pediment.count);
  if (widthM <= 0 || heightM <= 0 || count <= 0) {
    return 0;
  }

  return roundToTwoDecimals((widthM * heightM) / 2 * count);
}

export function calculateTotalGablePedimentAreaM2(
  pediments: GablePedimentEntry[],
  foundationContext: GablePedimentFoundationContext,
): number {
  return roundToTwoDecimals(
    pediments.reduce(
      (sum, pediment) =>
        sum + calculateGablePedimentAreaM2(pediment, foundationContext),
      0,
    ),
  );
}

export function calculateWalls(
  floorHeightM: string,
  exteriorWallLengthM: string,
  interiorWallLengthM: string,
  windows: OpeningEntry[],
  doors: DoorEntry[],
  gablePediments: GablePedimentEntry[] = [],
  foundationContext: GablePedimentFoundationContext = {
    foundationWidthM: "",
    foundationDepthM: "",
    foundationLShape: false,
    foundationExtensionWidthM: "",
    foundationExtensionDepthM: "",
  },
): WallCalculations {
  const floorHeight = parseDimension(floorHeightM);
  const exteriorWallLength = parseDimension(exteriorWallLengthM);
  const interiorWallLength = parseDimension(interiorWallLengthM);

  const grossExteriorWallAreaM2 = exteriorWallLength * floorHeight;
  const grossInteriorWallAreaM2 = interiorWallLength * floorHeight;
  const windowOpeningAreaM2 = sumOpeningAreaM2(windows);
  const exteriorDoorOpeningAreaM2 = sumDoorOpeningAreaM2(doors, true);
  const interiorDoorOpeningAreaM2 = sumDoorOpeningAreaM2(doors, false);

  const gablePedimentAreaM2 = calculateTotalGablePedimentAreaM2(
    gablePediments,
    foundationContext,
  );

  const netExteriorWallAreaM2 = roundToTwoDecimals(
    Math.max(
      0,
      grossExteriorWallAreaM2 -
        windowOpeningAreaM2 -
        exteriorDoorOpeningAreaM2 +
        gablePedimentAreaM2,
    ),
  );
  const netInteriorWallAreaM2 = roundToTwoDecimals(
    Math.max(0, grossInteriorWallAreaM2 - interiorDoorOpeningAreaM2),
  );

  return {
    grossExteriorWallAreaM2,
    grossInteriorWallAreaM2,
    windowOpeningAreaM2,
    exteriorDoorOpeningAreaM2,
    interiorDoorOpeningAreaM2,
    gablePedimentAreaM2,
    netExteriorWallAreaM2,
    netInteriorWallAreaM2,
    totalNetWallAreaM2: roundToTwoDecimals(
      netExteriorWallAreaM2 + netInteriorWallAreaM2,
    ),
  };
}

export type SanitaryRoomCalculations = {
  perimeterM: number;
  wallAreaM2: number;
  floorAreaM2: number;
};

/**
 * Sanmezgls: perimetrs = 2 × (garums + platums); sienas = perimetrs × stāvu augstums;
 * grīda = garums × platums. Augstums nāk no sienu sadaļas `floorHeightM`.
 */
export function calculateSanitaryRoom(
  entry: SanitaryRoomEntry,
  floorHeightM: string,
): SanitaryRoomCalculations {
  const lengthM = parseDimension(entry.lengthM);
  const widthM = parseDimension(entry.widthM);
  const heightM = parseDimension(floorHeightM);
  const perimeterM = 2 * (lengthM + widthM);

  return {
    perimeterM: roundToTwoDecimals(perimeterM),
    wallAreaM2: roundToTwoDecimals(perimeterM * heightM),
    floorAreaM2: roundToTwoDecimals(lengthM * widthM),
  };
}

export function calculateSanitaryRoomTotals(
  entries: SanitaryRoomEntry[],
  floorHeightM: string,
): SanitaryRoomCalculations {
  const totals = entries.reduce<SanitaryRoomCalculations>(
    (sum, entry) => {
      const calc = calculateSanitaryRoom(entry, floorHeightM);
      return {
        perimeterM: sum.perimeterM + calc.perimeterM,
        wallAreaM2: sum.wallAreaM2 + calc.wallAreaM2,
        floorAreaM2: sum.floorAreaM2 + calc.floorAreaM2,
      };
    },
    { perimeterM: 0, wallAreaM2: 0, floorAreaM2: 0 },
  );

  return {
    perimeterM: roundToTwoDecimals(totals.perimeterM),
    wallAreaM2: roundToTwoDecimals(totals.wallAreaM2),
    floorAreaM2: roundToTwoDecimals(totals.floorAreaM2),
  };
}

export type RoofPlaneCalculations = {
  areaM2: number;
  gutterLengthM: number;
  downpipeLengthM: number;
};

export type RoofTotalsCalculations = {
  totalAreaM2: number;
  totalGutterLengthM: number;
  totalDownpipeLengthM: number;
};

function parseRoofPlaneCount(value: string): number {
  const digits = value.trim().replace(/\D/g, "");
  if (!digits) {
    return 0;
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function roofGutterEdgeLengthM(plane: RoofPlaneEntry): number {
  return plane.gutterEdge === "width"
    ? parseDimension(plane.widthM)
    : parseDimension(plane.heightM);
}

export function calculateRoofPlane(
  plane: RoofPlaneEntry,
  floorHeightM: string,
): RoofPlaneCalculations {
  const count = parseRoofPlaneCount(plane.count);
  const width = parseDimension(plane.widthM);
  const height = parseDimension(plane.heightM);
  const floorHeight = parseDimension(floorHeightM);

  return {
    areaM2: width * height * count,
    gutterLengthM: roofGutterEdgeLengthM(plane) * count,
    downpipeLengthM: 2 * floorHeight * count,
  };
}

export function calculateRoofTotals(
  planes: RoofPlaneEntry[],
  floorHeightM: string,
): RoofTotalsCalculations {
  return planes.reduce<RoofTotalsCalculations>(
    (totals, plane) => {
      const calc = calculateRoofPlane(plane, floorHeightM);
      return {
        totalAreaM2: totals.totalAreaM2 + calc.areaM2,
        totalGutterLengthM: totals.totalGutterLengthM + calc.gutterLengthM,
        totalDownpipeLengthM: totals.totalDownpipeLengthM + calc.downpipeLengthM,
      };
    },
    {
      totalAreaM2: 0,
      totalGutterLengthM: 0,
      totalDownpipeLengthM: 0,
    },
  );
}
