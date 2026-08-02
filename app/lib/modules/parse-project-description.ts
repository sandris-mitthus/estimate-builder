import {
  createDefaultCrossSectionEntry,
  createEmptyProjectDescriptionFormState,
  type DoorEntry,
  type FoundationAttachmentPlane,
  type FoundationCrossSectionEntry,
  type GablePedimentEntry,
  type OpeningEntry,
  type ProjectDescriptionFormState,
  type RoofGutterEdge,
  type RoofPlaneEntry,
  type SanitaryRoomEntry,
  type WindowEntry,
} from "@/app/lib/modules/project-description-types";
import { isGablePedimentFoundationPlaneKey } from "@/app/lib/modules/foundation-plane-options";

function isAttachmentPlane(value: unknown): value is FoundationAttachmentPlane {
  return value === "width" || value === "depth";
}

function readStringField(row: Record<string, unknown>, key: string): string {
  return typeof row[key] === "string" ? row[key] : "";
}

function parseOpeningEntry(value: unknown): OpeningEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") {
    return null;
  }

  return {
    id: row.id,
    mark: typeof row.mark === "string" ? row.mark : "",
    heightM: typeof row.heightM === "string" ? row.heightM : "",
    widthM: typeof row.widthM === "string" ? row.widthM : "",
    count: typeof row.count === "string" ? row.count : "1",
  };
}

function parseDoorEntry(value: unknown): DoorEntry | null {
  const opening = parseOpeningEntry(value);
  if (!opening) {
    return null;
  }

  const row = value as Record<string, unknown>;

  return {
    ...opening,
    exteriorWall: row.exteriorWall === true,
  };
}

function parseWindowEntry(value: unknown): WindowEntry | null {
  const opening = parseOpeningEntry(value);
  if (!opening) {
    return null;
  }

  const row = value as Record<string, unknown>;

  return {
    ...opening,
    showcase: row.showcase === true,
  };
}

function parseCrossSectionEntry(value: unknown): FoundationCrossSectionEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") {
    return null;
  }

  return {
    id: row.id,
    widthM: typeof row.widthM === "string" ? row.widthM : "",
    depthM: typeof row.depthM === "string" ? row.depthM : "",
    heightM: typeof row.heightM === "string" ? row.heightM : "",
  };
}

function parseCrossSections(value: unknown): FoundationCrossSectionEntry[] {
  if (!Array.isArray(value)) {
    return [createDefaultCrossSectionEntry()];
  }

  const sections = value
    .map(parseCrossSectionEntry)
    .filter((entry): entry is FoundationCrossSectionEntry => entry != null);

  return sections.length > 0 ? sections : [createDefaultCrossSectionEntry()];
}

function isRoofGutterEdge(value: unknown): value is RoofGutterEdge {
  return value === "width" || value === "height";
}

function parseRoofPlaneEntry(value: unknown): RoofPlaneEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") {
    return null;
  }

  return {
    id: row.id,
    widthM: typeof row.widthM === "string" ? row.widthM : "",
    heightM: typeof row.heightM === "string" ? row.heightM : "",
    count: typeof row.count === "string" ? row.count : "1",
    gutterEdge: isRoofGutterEdge(row.gutterEdge) ? row.gutterEdge : "width",
  };
}

function parseRoofPlanes(value: unknown): RoofPlaneEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(parseRoofPlaneEntry)
    .filter((entry): entry is RoofPlaneEntry => entry != null);
}

function parseSanitaryRoomEntry(value: unknown): SanitaryRoomEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") {
    return null;
  }

  return {
    id: row.id,
    name: typeof row.name === "string" ? row.name : "",
    lengthM: typeof row.lengthM === "string" ? row.lengthM : "",
    widthM: typeof row.widthM === "string" ? row.widthM : "",
  };
}

function parseSanitaryRooms(value: unknown): SanitaryRoomEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(parseSanitaryRoomEntry)
    .filter((entry): entry is SanitaryRoomEntry => entry != null);
}

function parseGablePedimentEntry(value: unknown): GablePedimentEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") {
    return null;
  }

  const foundationPlaneKeyRaw =
    typeof row.foundationPlaneKey === "string" ? row.foundationPlaneKey : "";

  return {
    id: row.id,
    heightM: typeof row.heightM === "string" ? row.heightM : "",
    count: typeof row.count === "string" ? row.count : "1",
    foundationPlaneKey: isGablePedimentFoundationPlaneKey(foundationPlaneKeyRaw)
      ? foundationPlaneKeyRaw
      : "",
  };
}

function parseGablePediments(value: unknown): GablePedimentEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(parseGablePedimentEntry)
    .filter((entry): entry is GablePedimentEntry => entry != null);
}

type LegacyBlock = {
  widthM: string;
  depthM: string;
  heightM: string;
  attachmentPlane?: FoundationAttachmentPlane;
};

function parseLegacyBlock(value: unknown): LegacyBlock | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") {
    return null;
  }

  return {
    widthM: typeof row.widthM === "string" ? row.widthM : "",
    depthM: typeof row.depthM === "string" ? row.depthM : "",
    heightM: typeof row.heightM === "string" ? row.heightM : "",
    attachmentPlane: isAttachmentPlane(row.attachmentPlane)
      ? row.attachmentPlane
      : undefined,
  };
}

function migrateFromLegacyBlocks(row: Record<string, unknown>): {
  foundationWidthM: string;
  foundationDepthM: string;
  foundationHeightM: string;
  foundationExtensionWidthM: string;
  foundationExtensionDepthM: string;
  foundationAttachmentPlane: FoundationAttachmentPlane;
  foundationCrossSections: FoundationCrossSectionEntry[];
} {
  const blocks = Array.isArray(row.foundationBlocks)
    ? row.foundationBlocks
        .map(parseLegacyBlock)
        .filter((entry): entry is LegacyBlock => entry != null)
    : [];

  let foundationWidthM = readStringField(row, "foundationWidthM");
  let foundationDepthM = readStringField(row, "foundationDepthM");
  let foundationHeightM = readStringField(row, "foundationHeightM");
  let foundationExtensionWidthM = readStringField(row, "foundationExtensionWidthM");
  let foundationExtensionDepthM = readStringField(row, "foundationExtensionDepthM");
  let foundationAttachmentPlane = isAttachmentPlane(row.foundationAttachmentPlane)
    ? row.foundationAttachmentPlane
    : "width";

  if (!foundationWidthM && blocks[0]) {
    foundationWidthM = blocks[0].widthM;
    foundationDepthM = blocks[0].depthM;
    foundationHeightM = blocks[0].heightM;
  }

  if (!foundationExtensionWidthM && blocks[1]) {
    foundationExtensionWidthM = blocks[1].widthM;
    foundationExtensionDepthM = blocks[1].depthM;
    if (blocks[1].attachmentPlane) {
      foundationAttachmentPlane = blocks[1].attachmentPlane;
    }
  }

  const crossSectionsFromBlocks = blocks.map((block, index) => ({
    id:
      index === 0
        ? createDefaultCrossSectionEntry().id
        : `foundation-cross-section-${index + 1}`,
    widthM: block.widthM,
    depthM: block.depthM,
    heightM: block.heightM,
  }));

  return {
    foundationWidthM,
    foundationDepthM,
    foundationHeightM,
    foundationExtensionWidthM,
    foundationExtensionDepthM,
    foundationAttachmentPlane,
    foundationCrossSections:
      crossSectionsFromBlocks.length > 0
        ? crossSectionsFromBlocks
        : [createDefaultCrossSectionEntry()],
  };
}

export function parseProjectDescriptionFormState(
  value: unknown,
): ProjectDescriptionFormState {
  if (!value || typeof value !== "object") {
    return createEmptyProjectDescriptionFormState();
  }

  const row = value as Record<string, unknown>;
  const hasCrossSectionsField = Array.isArray(row.foundationCrossSections);
  const migrated = hasCrossSectionsField ? null : migrateFromLegacyBlocks(row);

  return {
    foundationWidthM:
      readStringField(row, "foundationWidthM") || migrated?.foundationWidthM || "",
    foundationDepthM:
      readStringField(row, "foundationDepthM") || migrated?.foundationDepthM || "",
    foundationHeightM:
      readStringField(row, "foundationHeightM") || migrated?.foundationHeightM || "",
    livingAreaM2: readStringField(row, "livingAreaM2"),
    foundationLShape: row.foundationLShape === true,
    foundationExtensionWidthM:
      readStringField(row, "foundationExtensionWidthM") ||
      migrated?.foundationExtensionWidthM ||
      "",
    foundationExtensionDepthM:
      readStringField(row, "foundationExtensionDepthM") ||
      migrated?.foundationExtensionDepthM ||
      "",
    foundationAttachmentPlane: isAttachmentPlane(row.foundationAttachmentPlane)
      ? row.foundationAttachmentPlane
      : migrated?.foundationAttachmentPlane ?? "width",
    foundationCrossSections: hasCrossSectionsField
      ? parseCrossSections(row.foundationCrossSections)
      : migrated?.foundationCrossSections ?? [createDefaultCrossSectionEntry()],
    floorHeightM: readStringField(row, "floorHeightM"),
    exteriorWallLengthM: readStringField(row, "exteriorWallLengthM"),
    interiorWallLengthM: readStringField(row, "interiorWallLengthM"),
    windows: Array.isArray(row.windows)
      ? row.windows
          .map(parseWindowEntry)
          .filter((entry): entry is WindowEntry => entry != null)
      : [],
    doors: Array.isArray(row.doors)
      ? row.doors.map(parseDoorEntry).filter((entry): entry is DoorEntry => entry != null)
      : [],
    gablePediments: parseGablePediments(row.gablePediments),
    roofPlanes: parseRoofPlanes(row.roofPlanes),
    sanitaryRooms: parseSanitaryRooms(row.sanitaryRooms),
    coldWaterLengthM: readStringField(row, "coldWaterLengthM"),
    hotWaterLengthM: readStringField(row, "hotWaterLengthM"),
    recirculationLengthM: readStringField(row, "recirculationLengthM"),
  };
}

export function serializeProjectDescriptionFormState(
  state: ProjectDescriptionFormState,
): string {
  return JSON.stringify(state);
}
