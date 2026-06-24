import { SiteDocsManager } from "@/app/components/site-docs-manager";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { listSiteDocs } from "@/app/lib/site-admin/repository";

export default async function SiteDocsPage() {
  await assertSystemAdminAccess();
  const [categories, { t }] = await Promise.all([
    listSiteDocs(),
    getServerTranslations(),
  ]);

  return (
    <SiteDocsManager
      initialCategories={categories}
      title={t("nav.system_admin.site_docs", "Docs")}
      subtitle={t(
        "site_docs.page.subtitle",
        "Publiskās dokumentācijas kategoriju un docs ierakstu pārvaldība",
      )}
    />
  );
}
