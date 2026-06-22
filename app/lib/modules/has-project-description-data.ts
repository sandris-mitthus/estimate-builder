import type { ProjectDescriptionFormState } from "@/app/lib/modules/project-description-types";

function hasDimension(value: string): boolean {
  return value.trim().length > 0;
}

function hasOpeningData(
  entries: ReadonlyArray<{
    mark?: string;
    heightM: string;
    widthM: string;
    count: string;
  }>,
): boolean {
  return entries.some(
    (entry) =>
      hasDimension(entry.mark ?? "") ||
      hasDimension(entry.heightM) ||
      hasDimension(entry.widthM) ||
      entry.count.trim().replace(/\D/g, "").length > 0,
  );
}

export function hasProjectDescriptionData(
  state: ProjectDescriptionFormState,
): boolean {
  if (
    hasDimension(state.foundationWidthM) ||
    hasDimension(state.foundationDepthM) ||
    hasDimension(state.foundationHeightM) ||
    hasDimension(state.foundationExtensionWidthM) ||
    hasDimension(state.foundationExtensionDepthM) ||
    hasDimension(state.floorHeightM) ||
    hasDimension(state.exteriorWallLengthM) ||
    hasDimension(state.interiorWallLengthM)
  ) {
    return true;
  }

  if (state.foundationLShape) {
    return true;
  }

  if (
    state.foundationCrossSections.some(
      (entry) =>
        hasDimension(entry.widthM) ||
        hasDimension(entry.depthM) ||
        hasDimension(entry.heightM),
    )
  ) {
    return true;
  }

  if (hasOpeningData(state.windows) || hasOpeningData(state.doors)) {
    return true;
  }

  if (
    state.gablePediments.some(
      (entry) =>
        hasDimension(entry.heightM) ||
        entry.foundationPlaneKey.trim().length > 0 ||
        entry.count.trim().replace(/\D/g, "").length > 0,
    )
  ) {
    return true;
  }

  return state.roofPlanes.some(
    (plane) =>
      hasDimension(plane.widthM) ||
      hasDimension(plane.heightM) ||
      plane.count.trim().replace(/\D/g, "").length > 0,
  );
}
