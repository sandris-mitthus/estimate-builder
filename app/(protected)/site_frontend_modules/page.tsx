import { SectionPage } from "@/app/components/section-page";
import { FrontendModulesForm } from "@/app/components/frontend-modules-form";
import { listFrontendModules } from "@/app/lib/frontend-modules/repository";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";

export default async function SiteFrontendModulesPage() {
  await assertSystemAdminAccess();
  const [modules, { t }] = await Promise.all([
    listFrontendModules(),
    getServerTranslations(),
  ]);

  return (
    <SectionPage
      title={t("nav.system_admin.site_frontend_modules", "Frontend moduļi")}
      subtitle={t(
        "frontend_modules.page.subtitle",
        "Definē frontend moduļu atslēgas un ieslēgšanas statusu",
      )}
    >
      <FrontendModulesForm initialModules={modules} />
    </SectionPage>
  );
}
