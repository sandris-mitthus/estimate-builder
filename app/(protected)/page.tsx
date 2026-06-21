import { ProjectArchiveContent } from "@/app/components/project-archive-content";
import { ProjectList } from "@/app/components/project-list";
import { ProjectPageActions } from "@/app/components/project-page-actions";
import { NavigationLoadingProvider } from "@/app/components/navigation-loading-context";
import { ProjectsPageCreateProvider } from "@/app/components/projects-page-create-context";
import { SectionPage } from "@/app/components/section-page";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { getServerTranslations } from "@/app/lib/i18n/server";
import type { ServerTranslations } from "@/app/lib/i18n/server";
import { listBuildingModules } from "@/app/lib/modules/repository";
import {
  listAllProjects,
  listProjectIdsWithNewSagatavePositions,
  listProjectIdsWithPendingMaterials,
  listProjectIdsWithStaleCatalogPrices,
  listProjects,
} from "@/app/lib/projects/repository";
import { isSystemAdminUser } from "@/app/lib/users/system-admin-repository";

function isArchiveView(archive: string | string[] | undefined): boolean {
  if (archive === "1" || archive === "true") {
    return true;
  }

  if (Array.isArray(archive)) {
    return archive.includes("1") || archive.includes("true");
  }

  return false;
}

function AdminDashboardNotice({ t }: { t: ServerTranslations["t"] }) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 shadow-sm">
      <p className="font-semibold">
        {t("admin_notice.title", "Sistēmas administrators")}
      </p>
      <p className="mt-1 text-sky-900">
        {t(
          "admin_notice.description",
          "Jūs esat ielogojies kā sistēmas administrators. Dashboard dati paliek tie paši, bet jums ir pieejamas papildu pārvaldības tiesības.",
        )}
      </p>
    </div>
  );
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

  const [{ t }, projects, modules] = await Promise.all([
    getServerTranslations(),
    showArchive ? listAllProjects() : listProjects(),
    listBuildingModules(),
  ]);
  const [staleCatalogPriceProjectIds, newSagatavePositionProjectIds, pendingMaterialsProjectIds] =
    await Promise.all([
      listProjectIdsWithStaleCatalogPrices(projects),
      listProjectIdsWithNewSagatavePositions(projects),
      listProjectIdsWithPendingMaterials(projects),
    ]);

  const subtitle = showArchive
    ? t("projects.page.archive_subtitle", "{count} projekti arhīvā", {
        count: projects.length,
      })
    : t("projects.page.active_subtitle", "{count} aktīvi projekti", {
        count: projects.length,
      });
  const isAdmin = session.user ? await isSystemAdminUser(session.user) : false;

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
          {isAdmin ? <AdminDashboardNotice t={t} /> : null}
          {showArchive ? (
            <ProjectArchiveContent
              projects={projects}
              modules={modules}
              staleCatalogPriceProjectIds={staleCatalogPriceProjectIds}
              newSagatavePositionProjectIds={newSagatavePositionProjectIds}
              pendingMaterialsProjectIds={pendingMaterialsProjectIds}
            />
          ) : (
            <ProjectList
              projects={projects}
              modules={modules}
              staleCatalogPriceProjectIds={staleCatalogPriceProjectIds}
              newSagatavePositionProjectIds={newSagatavePositionProjectIds}
              pendingMaterialsProjectIds={pendingMaterialsProjectIds}
            />
          )}
        </SectionPage>
      </ProjectsPageCreateProvider>
    </NavigationLoadingProvider>
  );
}
