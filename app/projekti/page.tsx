import { ProjectList } from "@/app/components/project-list";
import { SectionPage } from "@/app/components/section-page";
import { listProjects } from "@/app/lib/projects/repository";

export default async function ProjektiPage() {
  const projects = await listProjects();

  return (
    <SectionPage
      title="Projekti"
      subtitle={`${projects.length} aktīvi projekti`}
    >
      <ProjectList projects={projects} />
    </SectionPage>
  );
}
