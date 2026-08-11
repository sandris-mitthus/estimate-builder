import type { Metadata } from "next";

/** Canonical + Open Graph URL for public indexable pages. */
export function publicPageSeo(
  path: string,
  options: {
    title: string;
    description?: string;
  },
): Metadata {
  const canonical = path === "/" ? "/" : path;

  return {
    title: options.title,
    description: options.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: options.title,
      description: options.description,
      url: canonical,
    },
  };
}
