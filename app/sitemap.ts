import type { MetadataRoute } from "next";
import {
  absolutePublicUrl,
  SEARCH_CRAWL_SITEMAP_ENTRIES,
} from "@/app/lib/seo/search-crawl";

export default function sitemap(): MetadataRoute.Sitemap {
  return SEARCH_CRAWL_SITEMAP_ENTRIES.map((entry) => ({
    url: absolutePublicUrl(entry.path),
    lastModified: new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
