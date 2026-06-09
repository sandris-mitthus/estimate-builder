import { getGoogleMapsApiKey } from "@/app/lib/google-maps/env";

let loadPromise: Promise<typeof google> | null = null;

function waitForPlaces(timeoutMs = 10_000): Promise<typeof google> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    function check() {
      if (window.google?.maps?.places) {
        resolve(window.google);
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error("Google Places failed to load."));
        return;
      }

      window.setTimeout(check, 50);
    }

    check();
  });
}

async function ensurePlacesLibrary(): Promise<typeof google> {
  if (window.google?.maps?.places) {
    return window.google;
  }

  if (!window.google?.maps) {
    throw new Error("Google Maps failed to load.");
  }

  if (typeof window.google.maps.importLibrary === "function") {
    await window.google.maps.importLibrary("places");
    return window.google;
  }

  return waitForPlaces();
}

function injectPlacesScript(apiKey: string): Promise<typeof google> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="places"]',
    );

    if (existing) {
      if (existing.src.includes("libraries=places")) {
        void ensurePlacesLibrary().then(resolve).catch(reject);
        return;
      }

      existing.remove();
    }

    const script = document.createElement("script");
    script.dataset.googleMaps = "places";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      ensurePlacesLibrary().then(resolve).catch(reject);
    };
    script.onerror = () =>
      reject(new Error("Google Maps script failed to load."));
    document.head.appendChild(script);
  });
}

export function loadGooglePlaces(): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps is browser-only."));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (loadPromise) return loadPromise;

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is not configured."));
  }

  loadPromise = injectPlacesScript(apiKey).catch((error) => {
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}

export function resetGooglePlacesLoader() {
  loadPromise = null;
}
