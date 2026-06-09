import { AddProjectButton } from "@/app/components/add-project-button";
import { ProjectList } from "@/app/components/project-list";
import { SectionPage } from "@/app/components/section-page";
import { listProjects } from "@/app/lib/projects/repository";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <SectionPage
      title="Projekti"
      subtitle={`${projects.length} aktīvi projekti`}
      actions={<AddProjectButton />}
    >
      <ProjectList projects={projects} />
    </SectionPage>
  );
}