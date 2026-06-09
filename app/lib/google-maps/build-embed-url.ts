import {
  getGoogleMapsApiKey,
  isGoogleMapsEmbedConfigured,
} from "@/app/lib/google-maps/env";

export function buildGoogleMapsEmbedUrl(query: string): string | null {
  if (!isGoogleMapsEmbedConfigured()) {
    return null;
  }

  const apiKey = getGoogleMapsApiKey();
  const trimmed = query.trim();

  if (!apiKey || !trimmed) {
    return null;
  }

  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(trimmed)}`;
}
