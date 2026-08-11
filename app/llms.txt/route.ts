import { resolveLocalizedValue } from "@/app/lib/i18n/localized-values";
import { getServerTranslations } from "@/app/lib/i18n/server";
import {
  absolutePublicUrl,
  SEARCH_CRAWL_SITEMAP_ENTRIES,
} from "@/app/lib/seo/search-crawl";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

/**
 * `/llms.txt` — curated Markdown overview for AI agents (llmstxt.org).
 * H2 "Optional" must stay English so agents can skip that block.
 */
export async function GET() {
  const [settings, { languageCode, t }] = await Promise.all([
    getSiteSettings(),
    getServerTranslations(),
  ]);

  const systemName = settings.systemName.trim() || "Estimate Builder";
  const slogan =
    resolveLocalizedValue(settings.sloganValues, languageCode) ||
    settings.slogan.trim();

  const summary =
    slogan ||
    t(
      "llms.summary",
      "Construction estimate and offer software: reusable templates, a shared price catalog, PDF/Excel offers, and material ordering after approval.",
    );

  const primaryPaths = SEARCH_CRAWL_SITEMAP_ENTRIES.filter(
    (entry) => entry.path !== "/sitemap",
  );

  const lines: string[] = [
    `# ${systemName}`,
    "",
    `> ${summary}`,
    "",
    t(
      "llms.details",
      "Public pages below are safe for indexing and citation. Application areas behind login (projects, estimates, catalog, admin) are not listed and should not be crawled.",
    ),
    "",
    "## Pages",
  ];

  for (const entry of primaryPaths) {
    const title = t(entry.titleKey, entry.titleFallback);
    const note =
      entry.path === "/"
        ? t("llms.note.home", "Marketing landing and product overview")
        : entry.path === "/docs"
          ? t("llms.note.docs", "Product documentation")
          : undefined;
    lines.push(
      note
        ? `- [${title}](${absolutePublicUrl(entry.path)}): ${note}`
        : `- [${title}](${absolutePublicUrl(entry.path)})`,
    );
  }

  lines.push(
    "",
    "## Optional",
    `- [${t("sitemap.title", "Lapas karte")}](${absolutePublicUrl("/sitemap")}): ${t(
      "llms.note.sitemap",
      "Human-readable site map",
    )}`,
    `- [robots.txt](${absolutePublicUrl("/robots.txt")})`,
    `- [sitemap.xml](${absolutePublicUrl("/sitemap.xml")})`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
