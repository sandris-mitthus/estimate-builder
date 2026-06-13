import {
  fetchPlaceFormattedAddress,
  fetchPlaceSuggestions,
} from "@/app/lib/google-maps/places-api";
import { isGoogleMapsConfigured } from "@/app/lib/google-maps/env";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { checkRateLimit, rateLimitResponse } from "@/app/lib/security/rate-limit";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!checkRateLimit(`places:${user.id}`, 60, 60_000)) {
    return rateLimitResponse();
  }

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
  } catch {
    return Response.json(
      { error: "Neizdevās ielādēt adreses ieteikumus." },
      { status: 502 },
    );
  }
}
