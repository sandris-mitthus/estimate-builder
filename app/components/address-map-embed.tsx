"use client";

import { useEffect, useState } from "react";
import { buildGoogleMapsEmbedUrl } from "@/app/lib/google-maps/build-embed-url";
import { isGoogleMapsEmbedConfigured } from "@/app/lib/google-maps/env";

type AddressMapEmbedProps = {
  address: string;
  title?: string;
  className?: string;
  debounceMs?: number;
};

export function AddressMapEmbed({
  address,
  title = "Objekta karte",
  className = "",
  debounceMs = 400,
}: AddressMapEmbedProps) {
  const [mapQuery, setMapQuery] = useState<string | null>(null);
  const embedConfigured = isGoogleMapsEmbedConfigured();

  useEffect(() => {
    if (!embedConfigured) {
      setMapQuery(null);
      return;
    }

    const trimmed = address.trim();
    if (!trimmed) {
      setMapQuery(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setMapQuery(trimmed);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [address, debounceMs, embedConfigured]);

  if (!embedConfigured) {
    return null;
  }

  const embedUrl = mapQuery ? buildGoogleMapsEmbedUrl(mapQuery) : null;

  if (!embedUrl) {
    return (
      <div
        className={`flex h-full min-h-[14rem] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 text-center text-sm text-zinc-400 ${className}`.trim()}
      >
        Ievadi objekta adresi, lai redzētu karti.
      </div>
    );
  }

  return (
    <div
      className={`h-full min-h-[14rem] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 ${className}`.trim()}
    >
      <iframe
        title={title}
        src={embedUrl}
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
