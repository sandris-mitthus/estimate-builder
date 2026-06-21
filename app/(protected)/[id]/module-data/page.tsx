import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectModuleDataContent } from "@/app/components/project-module-data-content";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getProject } from "@/app/lib/projects/repository";

export default async function ProjectModuleDataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await assertNavAccess("projects");
  if (!session) {
    return null;
  }

  const { id } = await params;
  const { t } = await getServerTranslations();
  const project = await getProject(id);

  if (!project || project.buildingModuleId !== null) {
    notFound();
  }

  return (
    <main className="page">
      <Link
        href={`/${id}`}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
      >
        <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
        {t("projects.back_to_project", "Atpakaļ uz projektu")}
      </Link>

      <ProjectModuleDataContent project={project} />
    </main>
  );
}
