import { AddModuleButton } from "@/app/components/add-module-button";
import { ModuleList } from "@/app/components/module-list";
import { SectionPage } from "@/app/components/section-page";
import { listBuildingModules } from "@/app/lib/modules/repository";

export default async function ModulesPage() {
  const modules = await listBuildingModules();

  return (
    <SectionPage
      title="Ēku moduļi"
      subtitle={`${modules.length} moduļi katalogā`}
      actions={<AddModuleButton />}
    >
      <ModuleList modules={modules} />
    </SectionPage>
  );
}
