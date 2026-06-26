import type { ProjectStatus } from "@/app/lib/projects/project-status";

export type TimelineEntry = {
  id: string;
  projectId: string;
  projectName: string;
  projectAddress: string;
  projectStatus: ProjectStatus;
  startDate: string;
  endDate: string;
};

export type TimelineEntryRow = {
  id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  projects?: {
    name: string;
    address: string;
    status: string;
  } | {
    name: string;
    address: string;
    status: string;
  }[] | null;
};

export type UpdateTimelineEntryInput = {
  id: string;
  startDate: string;
  endDate: string;
};
