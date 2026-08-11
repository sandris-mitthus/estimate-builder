import type { MetadataRoute } from "next";
import {
  getPublicSiteUrl,
  SEARCH_CRAWL_DISALLOW_PATHS,
} from "@/app/lib/seo/search-crawl";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();
  let host: string | undefined;
  try {
    host = new URL(siteUrl).host;
  } catch {
    host = undefined;
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...SEARCH_CRAWL_DISALLOW_PATHS],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host,
  };
}
