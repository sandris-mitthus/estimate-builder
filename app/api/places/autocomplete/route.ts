import {
  fetchPlaceFormattedAddress,
  fetchPlaceSuggestions,
} from "@/app/lib/google-maps/places-api";
import { isGoogleMapsConfigured } from "@/app/lib/google-maps/env";

export async function GET(request: Request) {
  if (!isGoogleMapsConfigured()) {
    return Response.json(
      { error: "Google Maps nav konfigurēts." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input")?.trim() ?? "";
  const placeId = searchParams.get("placeId")?.trim() ?? "";

  if (placeId) {
    const formattedAddress = await fetchPlaceFormattedAddress(placeId);
    if (!formattedAddress) {
      return Response.json(
        { error: "Neizdevās ielādēt adresi." },
        { status: 502 },
      );
    }

    return Response.json({ formattedAddress });
  }

  if (input.length < 2) {
    return Response.json({ suggestions: [] });
  }

  try {
    const suggestions = await fetchPlaceSuggestions(input);
    return Response.json({ suggestions });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Neizdevās ielādēt adreses ieteikumus.";
    return Response.json({ error: message }, { status: 502 });
  }
}
