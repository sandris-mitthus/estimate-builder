import { AddModuleButton } from "@/app/components/add-module-button";
import { ModuleList } from "@/app/components/module-list";
import { NavigationLoadingProvider } from "@/app/components/navigation-loading-context";
import { SectionPage } from "@/app/components/section-page";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { listBuildingModules } from "@/app/lib/modules/repository";

export default async function ModulesPage() {
  const session = await assertNavAccess("modules");
  if (!session) {
    return null;
  }

  const [{ t }, modules] = await Promise.all([
    getServerTranslations(),
    listBuildingModules(),
  ]);

  return (
    <NavigationLoadingProvider>
      <SectionPage
        title={t("nav.modules", "Ēku moduļi")}
        subtitle={t("modules.page.subtitle", "{count} moduļi katalogā", {
          count: modules.length,
        })}
        actions={<AddModuleButton />}
      >
        <ModuleList modules={modules} />
      </SectionPage>
    </NavigationLoadingProvider>
  );
}
