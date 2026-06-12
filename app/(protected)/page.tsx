import { AddProjectButton } from "@/app/components/add-project-button";
import { ProjectList } from "@/app/components/project-list";
import { SectionPage } from "@/app/components/section-page";
import { listBuildingModules } from "@/app/lib/modules/repository";
import {
  listProjectIdsWithStaleCatalogPrices,
  listProjects,
} from "@/app/lib/projects/repository";

export default async function ProjectsPage() {
  const [projects, modules] = await Promise.all([
    listProjects(),
    listBuildingModules(),
  ]);
  const staleCatalogPriceProjectIds =
    await listProjectIdsWithStaleCatalogPrices(projects);

  return (
    <SectionPage
      title="Projekti"
      subtitle={`${projects.length} aktīvi projekti`}
      actions={<AddProjectButton modules={modules} />}
    >
      <ProjectList
        projects={projects}
        modules={modules}
        staleCatalogPriceProjectIds={staleCatalogPriceProjectIds}
      />
    </SectionPage>
  );
}