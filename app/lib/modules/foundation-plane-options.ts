import type {
  GablePedimentFoundationPlaneKey,
  ProjectDescriptionFormState,
} from "@/app/lib/modules/project-description-types";
import type { TranslationParams } from "@/app/lib/i18n/translations";

type Translate = (
  key: string,
  fallback?: string,
  params?: TranslationParams,
) => string;

export type FoundationPlaneOption = {
  key: GablePedimentFoundationPlaneKey;
  label: string;
};

export type GablePedimentFoundationContext = Pick<
  ProjectDescriptionFormState,
  | "foundationWidthM"
  | "foundationDepthM"
  | "foundationLShape"
  | "foundationExtensionWidthM"
  | "foundationExtensionDepthM"
>;

const FOUNDATION_PLANE_LABELS: Record<GablePedimentFoundationPlaneKey, string> = {
  "foundation.main.width": "Pamats platums",
  "foundation.main.depth": "Pamats dziļums",
  "foundation.extension.width": "L Pamata platums",
  "foundation.extension.depth": "L Pamata dziļums",
};

const FOUNDATION_PLANE_LABEL_KEYS: Record<GablePedimentFoundationPlaneKey, string> = {
  "foundation.main.width": "project_description.foundation_plane.main_width",
  "foundation.main.depth": "project_description.foundation_plane.main_depth",
  "foundation.extension.width": "project_description.foundation_plane.extension_width",
  "foundation.extension.depth": "project_description.foundation_plane.extension_depth",
};

function parseDimension(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function isGablePedimentFoundationPlaneKey(
  value: string,
): value is GablePedimentFoundationPlaneKey {
  return value in FOUNDATION_PLANE_LABELS;
}

export function getFoundationPlaneOptionLabel(
  key: GablePedimentFoundationPlaneKey,
  t?: Translate,
): string {
  return t
    ? t(FOUNDATION_PLANE_LABEL_KEYS[key], FOUNDATION_PLANE_LABELS[key])
    : FOUNDATION_PLANE_LABELS[key];
}

export function listFoundationPlaneOptions(
  state: GablePedimentFoundationContext,
  t?: Translate,
): FoundationPlaneOption[] {
  const options: FoundationPlaneOption[] = [
    {
      key: "foundation.main.width",
      label: getFoundationPlaneOptionLabel("foundation.main.width", t),
    },
    {
      key: "foundation.main.depth",
      label: getFoundationPlaneOptionLabel("foundation.main.depth", t),
    },
  ];

  if (state.foundationLShape) {
    options.push(
      {
        key: "foundation.extension.width",
        label: getFoundationPlaneOptionLabel("foundation.extension.width", t),
      },
      {
        key: "foundation.extension.depth",
        label: getFoundationPlaneOptionLabel("foundation.extension.depth", t),
      },
    );
  }

  return options;
}

export function resolveFoundationPlaneLengthM(
  key: GablePedimentFoundationPlaneKey,
  state: GablePedimentFoundationContext,
): number {
  switch (key) {
    case "foundation.main.width":
      return parseDimension(state.foundationWidthM);
    case "foundation.main.depth":
      return parseDimension(state.foundationDepthM);
    case "foundation.extension.width":
      return parseDimension(state.foundationExtensionWidthM);
    case "foundation.extension.depth":
      return parseDimension(state.foundationExtensionDepthM);
    default:
      return 0;
  }
}

export function formatFoundationPlaneOptionLabel(
  option: FoundationPlaneOption,
  state: GablePedimentFoundationContext,
): string {
  const lengthM = resolveFoundationPlaneLengthM(option.key, state);
  if (lengthM <= 0) {
    return option.label;
  }

  const formatted = String(lengthM).replace(".", ",");
  return `${option.label} (${formatted} m)`;
}
