import { AddModuleButton } from "@/app/components/add-module-button";
import { ModuleList } from "@/app/components/module-list";
import { NavigationLoadingProvider } from "@/app/components/navigation-loading-context";
import { SectionPage } from "@/app/components/section-page";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { listBuildingModules } from "@/app/lib/modules/repository";

export default async function ModulesPage() {
  const session = await assertNavAccess("modules");
  if (!session) {
    return null;
  }

  const modules = await listBuildingModules();

  return (
    <NavigationLoadingProvider>
      <SectionPage
        title="Ēku moduļi"
        subtitle={`${modules.length} moduļi katalogā`}
        actions={<AddModuleButton />}
      >
        <ModuleList modules={modules} />
      </SectionPage>
    </NavigationLoadingProvider>
  );
}
