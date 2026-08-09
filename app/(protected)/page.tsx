import { ProjectArchiveContent } from "@/app/components/project-archive-content";
import { ProjectList } from "@/app/components/project-list";
import { ProjectPageActions } from "@/app/components/project-page-actions";
import { NavigationLoadingProvider } from "@/app/components/navigation-loading-context";
import { ProjectsPageCreateProvider } from "@/app/components/projects-page-create-context";
import { SectionPage } from "@/app/components/section-page";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { listBuildingModules } from "@/app/lib/modules/repository";
import {
  getProjectListBadges,
  listAllProjects,
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
  const session = await assertNavAccess("projects");
  if (!session) {
    return null;
  }

  const { archive } = await searchParams;
  const showArchive = isArchiveView(archive);

  const projectsPromise = showArchive ? listAllProjects() : listProjects();
  const [{ t }, projects, modules, badges, delegatedOrdersModuleEnabled] =
    await Promise.all([
      getServerTranslations(),
      projectsPromise,
      listBuildingModules(),
      projectsPromise.then(getProjectListBadges),
      isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.delegatedOrders),
    ]);
  const {
    staleCatalogPriceProjectIds,
    newSagatavePositionProjectIds,
    sagatavePositionChangeProjectIds,
  } = badges;
  const pendingMaterialsProjectIds = delegatedOrdersModuleEnabled
    ? badges.pendingMaterialsProjectIds
    : new Set<string>();

  const subtitle = showArchive
    ? t("projects.page.archive_subtitle", "{count} projekti arhīvā", {
        count: projects.length,
      })
    : t("projects.page.active_subtitle", "{count} aktīvi projekti", {
        count: projects.length,
      });

  return (
    <NavigationLoadingProvider>
      <ProjectsPageCreateProvider>
        <SectionPage
          title={
            showArchive
              ? t("projects.archive.title", "Arhīvs")
              : t("nav.projects", "Projekti")
          }
          subtitle={subtitle}
          actions={<ProjectPageActions modules={modules} archive={showArchive} />}
        >
          {showArchive ? (
            <ProjectArchiveContent
              projects={projects}
              modules={modules}
              staleCatalogPriceProjectIds={staleCatalogPriceProjectIds}
              newSagatavePositionProjectIds={newSagatavePositionProjectIds}
              sagatavePositionChangeProjectIds={sagatavePositionChangeProjectIds}
              pendingMaterialsProjectIds={pendingMaterialsProjectIds}
            />
          ) : (
            <ProjectList
              projects={projects}
              modules={modules}
              staleCatalogPriceProjectIds={staleCatalogPriceProjectIds}
              newSagatavePositionProjectIds={newSagatavePositionProjectIds}
              sagatavePositionChangeProjectIds={sagatavePositionChangeProjectIds}
              pendingMaterialsProjectIds={pendingMaterialsProjectIds}
            />
          )}
        </SectionPage>
      </ProjectsPageCreateProvider>
    </NavigationLoadingProvider>
  );
}
