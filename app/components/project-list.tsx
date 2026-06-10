import { ListEntryGrid } from "@/app/components/list-entry-card";
import { ProjectCard } from "@/app/components/project-card";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";
import type { ProjectSummary } from "@/app/lib/projects/types";

type ProjectListProps = {
  projects: ProjectSummary[];
  modules: BuildingModuleSummary[];
};

export function ProjectList({ projects, modules }: ProjectListProps) {
  return (
    <ListEntryGrid>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} modules={modules} />
      ))}
    </ListEntryGrid>
  );
}
