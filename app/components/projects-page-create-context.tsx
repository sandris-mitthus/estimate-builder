"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useNavigationLoading } from "@/app/components/navigation-loading-context";
import { createEmptyProjectDescriptionFormState } from "@/app/lib/modules/project-description-types";
import type { ProjectSummary } from "@/app/lib/projects/types";

export type OptimisticCreateInput = {
  clientName: string;
  phone: string;
  email: string;
  address: string;
  buildingModuleId: string | null;
};

type ProjectsPageCreateContextValue = {
  optimisticProject: ProjectSummary | null;
  beginOptimisticCreate: (input: OptimisticCreateInput) => void;
  clearOptimisticCreate: () => void;
  beginProjectNavigation: (href: string) => void;
};

const ProjectsPageCreateContext =
  createContext<ProjectsPageCreateContextValue | null>(null);

export function isOptimisticProjectId(id: string): boolean {
  return id.startsWith("optimistic-");
}

function buildOptimisticProject(input: OptimisticCreateInput): ProjectSummary {
  return {
    id: `optimistic-${Date.now()}`,
    name: input.clientName.trim(),
    address: input.address.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    createdAt: new Date().toISOString(),
    buildingModuleId: input.buildingModuleId,
    visualizationBlocks: [],
    projectBlocks: [],
    projectDescription: createEmptyProjectDescriptionFormState(),
    status: "active",
  };
}

function ProjectsPageCreateProviderInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { beginNavigation } = useNavigationLoading();
  const [optimisticProject, setOptimisticProject] = useState<ProjectSummary | null>(
    null,
  );

  const beginOptimisticCreate = useCallback((input: OptimisticCreateInput) => {
    setOptimisticProject(buildOptimisticProject(input));
  }, []);

  const clearOptimisticCreate = useCallback(() => {
    setOptimisticProject(null);
  }, []);

  const beginProjectNavigation = useCallback(
    (href: string) => {
      beginNavigation(href, "Ielādē projektu…");
    },
    [beginNavigation],
  );

  const value = useMemo(
    () => ({
      optimisticProject,
      beginOptimisticCreate,
      clearOptimisticCreate,
      beginProjectNavigation,
    }),
    [
      optimisticProject,
      beginOptimisticCreate,
      clearOptimisticCreate,
      beginProjectNavigation,
    ],
  );

  return (
    <ProjectsPageCreateContext.Provider value={value}>
      {children}
    </ProjectsPageCreateContext.Provider>
  );
}

export function ProjectsPageCreateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectsPageCreateProviderInner>{children}</ProjectsPageCreateProviderInner>
  );
}

export function useProjectsPageCreate(): ProjectsPageCreateContextValue {
  const context = useContext(ProjectsPageCreateContext);
  if (!context) {
    throw new Error(
      "useProjectsPageCreate must be used within ProjectsPageCreateProvider",
    );
  }
  return context;
}

export function useOptionalProjectsPageCreate(): ProjectsPageCreateContextValue | null {
  return useContext(ProjectsPageCreateContext);
}
