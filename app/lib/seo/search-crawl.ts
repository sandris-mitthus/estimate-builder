/**
 * Search-engine crawl policy for robots.txt + sitemap.xml.
 * Public marketing / legal / docs paths are indexed; app and auth stay disallowed.
 */

import { getSiteOrigin } from "@/app/lib/auth/auth-confirm-link";

/** robots.txt `Disallow` values (session / auth / admin / API). */
export const SEARCH_CRAWL_DISALLOW_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/register-company",
  "/wiki",
  "/estimate",
  "/positions",
  "/excluded-positions",
  "/modules",
  "/settings",
  "/users",
  "/workers",
  "/tasks",
  "/tools",
  "/todo",
  "/timeline-graph",
  "/site_settings",
  "/site_integrations",
  "/site_companies",
  "/site_companies_users",
  "/site_user_groups",
  "/site_docs",
  "/site_announcements",
  "/site_frontend_modules",
  "/site_payment_plans",
  "/site_languages",
  "/site_translations",
  "/site_email_templates",
  "/api",
] as const;

export type SearchCrawlSitemapEntry = {
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
  /** Translation key for the human-readable HTML sitemap. */
  titleKey: string;
  titleFallback: string;
};

/** Indexable public pages (anonymous or general marketing content). */
export const SEARCH_CRAWL_SITEMAP_ENTRIES: SearchCrawlSitemapEntry[] = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
    titleKey: "sitemap.pages.home",
    titleFallback: "Sākums",
  },
  {
    path: "/docs",
    changeFrequency: "weekly",
    priority: 0.7,
    titleKey: "sitemap.pages.docs",
    titleFallback: "Dokumentācija",
  },
  {
    path: "/privacy",
    changeFrequency: "monthly",
    priority: 0.3,
    titleKey: "legal.privacy.title",
    titleFallback: "Privātuma politika",
  },
  {
    path: "/terms",
    changeFrequency: "monthly",
    priority: 0.3,
    titleKey: "legal.terms.title",
    titleFallback: "Lietošanas noteikumi",
  },
  {
    path: "/cookies",
    changeFrequency: "monthly",
    priority: 0.3,
    titleKey: "legal.cookies.title",
    titleFallback: "Sīkdatņu politika",
  },
  {
    path: "/sitemap",
    changeFrequency: "monthly",
    priority: 0.2,
    titleKey: "sitemap.title",
    titleFallback: "Lapas karte",
  },
];

export function getPublicSiteUrl(): string {
  return getSiteOrigin();
}

export function absolutePublicUrl(path: string): string {
  const origin = getPublicSiteUrl();
  if (!path || path === "/") {
    return `${origin}/`;
  }
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
