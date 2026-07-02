export type OpeningEntry = {
  id: string;
  mark: string;
  heightM: string;
  widthM: string;
  count: string;
};

export type DoorEntry = OpeningEntry & {
  exteriorWall: boolean;
};

/** Kura L veida papildu pamata plakne piegulst pamatam. */
export type FoundationAttachmentPlane = "width" | "depth";

/** Pamata betona izgriezums tilpuma aprēķinam (m³ kopsumma). */
export type FoundationCrossSectionEntry = {
  id: string;
  widthM: string;
  depthM: string;
  heightM: string;
};

/** Kura malā ir tekne (jumta plakne). */
export type RoofGutterEdge = "width" | "height";

export type RoofPlaneEntry = {
  id: string;
  widthM: string;
  heightM: string;
  count: string;
  gutterEdge: RoofGutterEdge;
};

export type GablePedimentFoundationPlaneKey =
  | "foundation.main.width"
  | "foundation.main.depth"
  | "foundation.extension.width"
  | "foundation.extension.depth";

/** Trijstūrveida frontons, piesaistīts pamata plaknei. */
export type GablePedimentEntry = {
  id: string;
  heightM: string;
  count: string;
  foundationPlaneKey: GablePedimentFoundationPlaneKey | "";
};

export type ProjectDescriptionFormState = {
  foundationWidthM: string;
  foundationDepthM: string;
  foundationHeightM: string;
  foundationLShape: boolean;
  foundationExtensionWidthM: string;
  foundationExtensionDepthM: string;
  foundationAttachmentPlane: FoundationAttachmentPlane;
  foundationCrossSections: FoundationCrossSectionEntry[];
  floorHeightM: string;
  exteriorWallLengthM: string;
  interiorWallLengthM: string;
  windows: OpeningEntry[];
  doors: DoorEntry[];
  gablePediments: GablePedimentEntry[];
  roofPlanes: RoofPlaneEntry[];
  coldWaterLengthM: string;
  hotWaterLengthM: string;
  recirculationLengthM: string;
};

export const DEFAULT_FOUNDATION_CROSS_SECTION_ID = "foundation-cross-section-default";

export function createDefaultCrossSectionEntry(): FoundationCrossSectionEntry {
  return {
    id: DEFAULT_FOUNDATION_CROSS_SECTION_ID,
    widthM: "",
    depthM: "",
    heightM: "",
  };
}

export function createCrossSectionEntry(): FoundationCrossSectionEntry {
  return {
    id: crypto.randomUUID(),
    widthM: "",
    depthM: "",
    heightM: "",
  };
}

export function createWindowEntry(): OpeningEntry {
  return {
    id: crypto.randomUUID(),
    mark: "",
    heightM: "",
    widthM: "",
    count: "1",
  };
}

export function createDoorEntry(): DoorEntry {
  return {
    id: crypto.randomUUID(),
    mark: "",
    heightM: "",
    widthM: "",
    count: "1",
    exteriorWall: true,
  };
}

export const DEFAULT_ROOF_PLANE_ID = "roof-plane-default";

export function createDefaultRoofPlaneEntry(): RoofPlaneEntry {
  return {
    id: DEFAULT_ROOF_PLANE_ID,
    widthM: "",
    heightM: "",
    count: "1",
    gutterEdge: "width",
  };
}

export function createRoofPlaneEntry(): RoofPlaneEntry {
  return {
    id: crypto.randomUUID(),
    widthM: "",
    heightM: "",
    count: "1",
    gutterEdge: "width",
  };
}

export function createGablePedimentEntry(): GablePedimentEntry {
  return {
    id: crypto.randomUUID(),
    heightM: "",
    count: "1",
    foundationPlaneKey: "",
  };
}

export function createEmptyProjectDescriptionFormState(): ProjectDescriptionFormState {
  return {
    foundationWidthM: "",
    foundationDepthM: "",
    foundationHeightM: "",
    foundationLShape: false,
    foundationExtensionWidthM: "",
    foundationExtensionDepthM: "",
    foundationAttachmentPlane: "width",
    foundationCrossSections: [createDefaultCrossSectionEntry()],
    floorHeightM: "",
    exteriorWallLengthM: "",
    interiorWallLengthM: "",
    windows: [],
    doors: [],
    gablePediments: [],
    roofPlanes: [],
    coldWaterLengthM: "",
    hotWaterLengthM: "",
    recirculationLengthM: "",
  };
}
