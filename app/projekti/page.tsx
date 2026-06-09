import { ProjectList } from "@/app/components/project-list";
import { SectionPage } from "@/app/components/section-page";
import { SAMPLE_PROJECTS } from "@/app/lib/projects/sample-projects";

export default function ProjektiPage() {
  return (
    <SectionPage
      title="Projekti"
      subtitle={`${SAMPLE_PROJECTS.length} aktīvi projekti`}
    >
      <ProjectList projects={SAMPLE_PROJECTS} />
    </SectionPage>
  );
}
