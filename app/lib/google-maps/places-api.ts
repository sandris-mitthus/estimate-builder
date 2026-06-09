import {
  getGoogleMapsReferer,
  getGoogleMapsServerApiKey,
} from "@/app/lib/google-maps/env";

export type PlaceSuggestion = {
  placeId: string;
  label: string;
};

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
    };
  }>;
};

type PlaceDetailsResponse = {
  formattedAddress?: string;
};

type GoogleErrorResponse = {
  error?: {
    message?: string;
    status?: string;
  };
};

function googlePlacesHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    Referer: getGoogleMapsReferer(),
  };
}

async function readGoogleError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as GoogleErrorResponse;
    const message = data.error?.message?.trim();
    if (message) return message;
  } catch {
    // ignore parse errors
  }

  return `Google Places atbilde (${response.status}).`;
}

export async function fetchPlaceSuggestions(
  input: string,
): Promise<PlaceSuggestion[]> {
  const apiKey = getGoogleMapsServerApiKey();
  if (!apiKey) {
    throw new Error("Google Maps API key is not configured.");
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: googlePlacesHeaders(apiKey),
      body: JSON.stringify({
        input,
        includedRegionCodes: ["lv"],
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(await readGoogleError(response));
  }

  const data = (await response.json()) as AutocompleteResponse;

  return (data.suggestions ?? [])
    .map((item) => ({
      placeId: item.placePrediction?.placeId ?? "",
      label: item.placePrediction?.text?.text ?? "",
    }))
    .filter((item) => item.placeId && item.label);
}

export async function fetchPlaceFormattedAddress(
  placeId: string,
): Promise<string | null> {
  const apiKey = getGoogleMapsServerApiKey();
  if (!apiKey) return null;

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-FieldMask": "formattedAddress",
        "X-Goog-Api-Key": apiKey,
        Referer: getGoogleMapsReferer(),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) return null;

  const data = (await response.json()) as PlaceDetailsResponse;
  return data.formattedAddress?.trim() ?? null;
}
