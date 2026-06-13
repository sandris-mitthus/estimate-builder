import { ProjectArchiveContent } from "@/app/components/project-archive-content";
import { ProjectList } from "@/app/components/project-list";
import { ProjectPageActions } from "@/app/components/project-page-actions";
import { SectionPage } from "@/app/components/section-page";
import { listBuildingModules } from "@/app/lib/modules/repository";
import {
  listAllProjects,
  listProjectIdsWithStaleCatalogPrices,
  listProjects,
} from "@/app/lib/projects/repository";

function isArchiveView(archive: string | string[] | undefined): boolean {
  if (archive === "1" || archive === "true") {
    return true;
  }

  if (Array.isArray(archive)) {
    return archive.includes("1") || archive.includes("true");
  }

  return false;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ archive?: string | string[] }>;
}) {
  const { archive } = await searchParams;
  const showArchive = isArchiveView(archive);

  const [projects, modules] = await Promise.all([
    showArchive ? listAllProjects() : listProjects(),
    listBuildingModules(),
  ]);
  const staleCatalogPriceProjectIds =
    await listProjectIdsWithStaleCatalogPrices(projects);

  const subtitle = showArchive
    ? `${projects.length} projekti arhīvā`
    : `${projects.length} aktīvi projekti`;

  return (
    <SectionPage
      title={showArchive ? "Arhīvs" : "Projekti"}
      subtitle={subtitle}
      actions={<ProjectPageActions modules={modules} archive={showArchive} />}
    >
      {showArchive ? (
        <ProjectArchiveContent
          projects={projects}
          modules={modules}
          staleCatalogPriceProjectIds={staleCatalogPriceProjectIds}
        />
      ) : (
        <ProjectList
          projects={projects}
          modules={modules}
          staleCatalogPriceProjectIds={staleCatalogPriceProjectIds}
        />
      )}
    </SectionPage>
  );
}
