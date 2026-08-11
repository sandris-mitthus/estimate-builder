"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  clearTimelineGraphPeopleSectionsAction,
  reorderTimelineGraphProjectsAction,
  setTimelineGraphParallelPairAction,
  updateTimelineGraphPeopleCountAction,
} from "@/app/(protected)/timeline-graph/actions";
import { useActionPermission } from "@/app/components/action-permissions-context";
import { DragHandle } from "@/app/components/drag-handle";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { SectionPage } from "@/app/components/section-page";
import {
  TimelineGraphParallelGroupModal,
  type TimelineGraphParallelGroupMember,
} from "@/app/components/timeline-graph-parallel-group-modal";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { formatDisplayDateDdMmYy, todayIsoDate } from "@/app/lib/format-display-date";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  TIMELINE_GRAPH_PEOPLE_COUNT_MAX,
  TIMELINE_GRAPH_PEOPLE_COUNT_MIN,
  normalizeTimelineGraphPeopleCount,
  timelineGraphPeopleCountKey,
} from "@/app/lib/timeline-graph/people-count";
import {
  findSectionIdByIdentity,
  findSectionIdentity,
} from "@/app/lib/timeline-graph/section-identity";
import {
  TIMELINE_GRAPH_HOURS_PER_DAY,
  buildTimelineGraphDayRange,
  formatTimelineGraphMonthLabel,
  formatWorkloadDaysAndHours,
  isWeekendIso,
  resolveEffectiveWorkloadHours,
  scheduleTimelineGraphProjects,
  type ScheduledTimelineGraphCategory,
  type ScheduledTimelineGraphChild,
  type ScheduledTimelineGraphProject,
} from "@/app/lib/timeline-graph/schedule";
import {
  isTimelineGraphConfirmedStatus,
  type TimelineGraphProject,
} from "@/app/lib/timeline-graph/types";

const PROJECT_COL_PX = 390;
const WORK_DRAG_PREFIX = "tg-work:";

function makeWorkDragId(projectId: string, sectionId: string): string {
  return `${WORK_DRAG_PREFIX}${projectId}:${sectionId}`;
}

function parseWorkDragId(
  value: string | number,
): { projectId: string; sectionId: string } | null {
  const id = String(value);
  if (!id.startsWith(WORK_DRAG_PREFIX)) {
    return null;
  }
  const rest = id.slice(WORK_DRAG_PREFIX.length);
  const separator = rest.indexOf(":");
  if (separator <= 0) {
    return null;
  }
  return {
    projectId: rest.slice(0, separator),
    sectionId: rest.slice(separator + 1),
  };
}
const DAY_WIDTH_PX = 36;
const PROJECT_ROW_HEIGHT_CLASS = "h-14";
const SECTION_ROW_HEIGHT_CLASS = "h-10";
const HEADER_HEIGHT_CLASS = "h-14";

type TimelineGraphPageContentProps = {
  projects: TimelineGraphProject[];
};

function formatWorkload(hours: number, peopleCount = 1): string {
  return formatWorkloadDaysAndHours(hours, peopleCount);
}

function categoryHasSubcategories(
  category: Pick<TimelineGraphProject["categories"][number], "children">,
): boolean {
  return category.children.some((child) => child.kind === "subcategory");
}

function resolveStoredPeopleCount(
  projects: TimelineGraphProject[],
  projectId: string,
  sectionId: string,
): number {
  const project = projects.find((entry) => entry.id === projectId);
  if (!project) {
    return 1;
  }

  if (sectionId === project.id) {
    return project.peopleCount;
  }

  for (const category of project.categories) {
    if (category.id === sectionId) {
      return category.peopleCount;
    }

    for (const child of category.children) {
      if (child.id === sectionId) {
        return child.peopleCount;
      }
    }
  }

  return 1;
}

function resolveParallelGroupId(
  projects: TimelineGraphProject[],
  projectId: string,
  sectionId: string,
): string | undefined {
  const project = projects.find((entry) => entry.id === projectId);
  if (!project) {
    return undefined;
  }

  if (sectionId === project.id) {
    return project.parallelGroupId;
  }

  for (const category of project.categories) {
    if (category.id === sectionId) {
      return category.parallelGroupId;
    }

    for (const child of category.children) {
      if (child.id === sectionId) {
        return child.parallelGroupId;
      }
    }
  }

  return undefined;
}

function mapSectionParallelGroup(
  project: TimelineGraphProject,
  sectionId: string,
  parallelGroupId: string | undefined,
): TimelineGraphProject {
  if (sectionId === project.id) {
    return { ...project, parallelGroupId };
  }

  return {
    ...project,
    categories: project.categories.map((category) => {
      if (category.id === sectionId) {
        return { ...category, parallelGroupId };
      }

      return {
        ...category,
        children: category.children.map((child) =>
          child.id === sectionId ? { ...child, parallelGroupId } : child,
        ),
      };
    }),
  };
}

function collectSectionIdsInParallelGroups(
  project: TimelineGraphProject,
  groupIds: ReadonlySet<string>,
): string[] {
  const ids: string[] = [];
  if (project.parallelGroupId && groupIds.has(project.parallelGroupId)) {
    ids.push(project.id);
  }
  for (const category of project.categories) {
    if (category.parallelGroupId && groupIds.has(category.parallelGroupId)) {
      ids.push(category.id);
    }
    for (const child of category.children) {
      if (child.parallelGroupId && groupIds.has(child.parallelGroupId)) {
        ids.push(child.id);
      }
    }
  }
  return ids;
}

function patchParallelPair(
  projects: TimelineGraphProject[],
  projectId: string,
  sectionId: string,
  targetSectionId: string,
  groupId: string,
): TimelineGraphProject[] {
  return projects.map((project) => {
    if (project.id !== projectId) {
      return project;
    }

    const sourceGroup = resolveParallelGroupId(
      [project],
      project.id,
      sectionId,
    );
    const targetGroup = resolveParallelGroupId(
      [project],
      project.id,
      targetSectionId,
    );
    const relatedGroups = new Set(
      [sourceGroup, targetGroup].filter((value): value is string =>
        Boolean(value),
      ),
    );
    const sectionIds = new Set([
      sectionId,
      targetSectionId,
      ...collectSectionIdsInParallelGroups(project, relatedGroups),
    ]);

    let next = project;
    for (const id of sectionIds) {
      next = mapSectionParallelGroup(next, id, groupId);
    }
    return next;
  });
}

function patchParallelPairAcrossMatchingProjects(
  projects: TimelineGraphProject[],
  projectId: string,
  sectionId: string,
  targetSectionId: string,
  groupId: string,
): TimelineGraphProject[] {
  const source = projects.find((project) => project.id === projectId);
  if (!source) {
    return patchParallelPair(
      projects,
      projectId,
      sectionId,
      targetSectionId,
      groupId,
    );
  }

  const leftIdentity = findSectionIdentity(source, sectionId);
  const rightIdentity = findSectionIdentity(source, targetSectionId);
  if (!leftIdentity || !rightIdentity) {
    return patchParallelPair(
      projects,
      projectId,
      sectionId,
      targetSectionId,
      groupId,
    );
  }

  let next = projects;
  for (const project of projects) {
    const leftId = findSectionIdByIdentity(project, leftIdentity);
    const rightId = findSectionIdByIdentity(project, rightIdentity);
    if (!leftId || !rightId || leftId === rightId) continue;
    next = patchParallelPair(
      next,
      project.id,
      leftId,
      rightId,
      project.id === projectId ? groupId : crypto.randomUUID(),
    );
  }
  return next;
}

function patchParallelUnpair(
  projects: TimelineGraphProject[],
  projectId: string,
  sectionId: string,
): TimelineGraphProject[] {
  return projects.map((project) => {
    if (project.id !== projectId) {
      return project;
    }

    const groupId = resolveParallelGroupId([project], project.id, sectionId);
    let next = mapSectionParallelGroup(project, sectionId, undefined);

    if (!groupId) {
      return next;
    }

    const remaining: string[] = [];
    if (next.parallelGroupId === groupId) {
      remaining.push(next.id);
    }
    for (const category of next.categories) {
      if (category.parallelGroupId === groupId) {
        remaining.push(category.id);
      }
      for (const child of category.children) {
        if (child.parallelGroupId === groupId) {
          remaining.push(child.id);
        }
      }
    }

    if (remaining.length === 1) {
      next = mapSectionParallelGroup(next, remaining[0]!, undefined);
    }

    return next;
  });
}

function patchParallelUnpairAcrossMatchingProjects(
  projects: TimelineGraphProject[],
  projectId: string,
  sectionId: string,
): TimelineGraphProject[] {
  const source = projects.find((project) => project.id === projectId);
  if (!source) {
    return patchParallelUnpair(projects, projectId, sectionId);
  }

  const identity = findSectionIdentity(source, sectionId);
  if (!identity) {
    return patchParallelUnpair(projects, projectId, sectionId);
  }

  let next = projects;
  for (const project of projects) {
    const matchId = findSectionIdByIdentity(project, identity);
    if (!matchId) continue;
    next = patchParallelUnpair(next, project.id, matchId);
  }
  return next;
}

function listParallelGroupMembers(
  project: TimelineGraphProject,
  groupId: string,
  directPositionsLabel: string,
): TimelineGraphParallelGroupMember[] {
  const members: TimelineGraphParallelGroupMember[] = [];

  if (project.parallelGroupId === groupId) {
    members.push({ sectionId: project.id, title: project.name });
  }

  for (const category of project.categories) {
    if (category.parallelGroupId === groupId) {
      members.push({ sectionId: category.id, title: category.title });
    }
    for (const child of category.children) {
      if (child.parallelGroupId === groupId) {
        members.push({
          sectionId: child.id,
          title:
            child.kind === "direct"
              ? `${category.title} · ${directPositionsLabel}`
              : child.title,
        });
      }
    }
  }

  return members;
}

function ParallelBadgeButton({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const { t } = useTranslations();
  const openLabel = t(
    "timeline_graph.parallel.modal.open",
    "Rādīt sapārotās pozīcijas",
  );
  return (
    <Tooltip label={openLabel} className="ml-1 inline-flex">
      <button
        type="button"
        className="text-[10px] font-medium text-violet-500 transition hover:text-violet-700 hover:underline"
        aria-label={openLabel}
        onClick={onOpen}
      >
        {t("timeline_graph.parallel.badge", "Paralēli")}
      </button>
    </Tooltip>
  );
}

function WorkPairControls({
  projectId,
  sectionId,
  parallelGroupId,
  canManage,
  pairingLoading,
  onOpenGroup,
}: {
  projectId: string;
  sectionId: string;
  parallelGroupId?: string;
  canManage: boolean;
  pairingLoading?: boolean;
  onOpenGroup: () => void;
}) {
  const { t } = useTranslations();
  const dragId = makeWorkDragId(projectId, sectionId);
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: dragId,
    disabled: !canManage || pairingLoading,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dragId,
    disabled: !canManage,
  });

  function setNodeRef(node: HTMLElement | null) {
    setDragRef(node);
    setDropRef(node);
  }

  const openGroupLabel = t(
    "timeline_graph.parallel.modal.open",
    "Rādīt sapārotās pozīcijas",
  );
  const dragLabel = t(
    "timeline_graph.parallel.drag",
    "Velc uz citu kategoriju vai darbu tajā pašā projektā, lai sāktos paralēli",
  );
  const parallelHintLabel = t(
    "timeline_graph.parallel.drag",
    "Velc uz citu kategoriju vai darbu tajā pašā projektā, lai sāktos paralēli",
  );

  if (!canManage) {
    return parallelGroupId ? (
      <Tooltip label={openGroupLabel} className="inline-flex shrink-0">
        <button
          type="button"
          className="inline-flex items-center rounded px-1 text-[10px] font-medium text-violet-500 transition hover:bg-violet-50"
          aria-label={openGroupLabel}
          onClick={onOpenGroup}
        >
          <i className="fas fa-link text-[9px]" aria-hidden="true" />
        </button>
      </Tooltip>
    ) : (
      <span className="inline-block w-6 shrink-0" aria-hidden="true" />
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`inline-flex shrink-0 items-center gap-0.5 ${
        isOver ? "rounded-md ring-2 ring-violet-400 ring-offset-1" : ""
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <DragHandle
        label={dragLabel}
        attributes={attributes}
        listeners={listeners}
      />
      {pairingLoading ? (
        <i
          className="fas fa-circle-notch fa-spin text-[10px] text-violet-500"
          aria-hidden="true"
        />
      ) : parallelGroupId ? (
        <Tooltip label={openGroupLabel} className="inline-flex shrink-0">
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-violet-500 transition hover:bg-violet-50 hover:text-violet-700"
            aria-label={openGroupLabel}
            onClick={onOpenGroup}
          >
            <i className="fas fa-link text-[10px]" aria-hidden="true" />
          </button>
        </Tooltip>
      ) : (
        <Tooltip label={parallelHintLabel} className="inline-flex shrink-0">
          <span
            className="inline-flex h-6 w-6 items-center justify-center text-zinc-300"
            aria-hidden="true"
          >
            <i className="fas fa-link text-[9px]" aria-hidden="true" />
          </span>
        </Tooltip>
      )}
    </div>
  );
}

function resolveCategoryDisplayHours(
  category: TimelineGraphProject["categories"][number],
): { hours: number; peopleCount: number } {
  if (category.children.length === 0) {
    return {
      hours: category.laborWorkloadHours,
      peopleCount: category.peopleCount,
    };
  }

  if (!categoryHasSubcategories(category)) {
    return {
      hours: category.laborWorkloadHours,
      peopleCount: category.peopleCount,
    };
  }

  const hours = category.children.reduce((sum, child) => {
    const people = normalizeTimelineGraphPeopleCount(child.peopleCount);
    return sum + child.laborWorkloadHours / people;
  }, 0);

  return { hours, peopleCount: 1 };
}

function cloneTimelineGraphProjects(
  projects: TimelineGraphProject[],
): TimelineGraphProject[] {
  return projects.map((project) => ({
    ...project,
    categories: project.categories.map((category) => ({
      ...category,
      children: category.children.map((child) => ({ ...child })),
    })),
  }));
}

function categoryExpandKey(projectId: string, categoryId: string): string {
  return `${projectId}::${categoryId}`;
}

function patchProjectPeopleCount(
  projects: TimelineGraphProject[],
  projectId: string,
  sectionId: string,
  peopleCount: number,
): TimelineGraphProject[] {
  const nextCount = normalizeTimelineGraphPeopleCount(peopleCount);

  return projects.map((project) => {
    if (project.id !== projectId) {
      // Jauna atsauce — nedrīkst dalīt nested objektus ar citiem projektiem / props.
      return {
        ...project,
        categories: project.categories.map((category) => ({
          ...category,
          children: category.children.map((child) => ({ ...child })),
        })),
      };
    }

    if (sectionId === project.id) {
      return { ...project, peopleCount: nextCount };
    }

    return {
      ...project,
      categories: project.categories.map((category) => {
        if (category.id === sectionId) {
          return {
            ...category,
            peopleCount: nextCount,
            // Bez apakškategorijām cilvēku skaits attiecas uz visām tiešajām pozīcijām.
            children: categoryHasSubcategories(category)
              ? category.children.map((child) => ({ ...child }))
              : category.children.map((child) => ({
                  ...child,
                  peopleCount: nextCount,
                })),
          };
        }

        return {
          ...category,
          children: category.children.map((child) =>
            child.id === sectionId
              ? { ...child, peopleCount: nextCount }
              : { ...child },
          ),
        };
      }),
    };
  });
}

function PeopleCountControl({
  value,
  canEdit,
  disabled,
  loading = false,
  onChange,
}: {
  value: number;
  canEdit: boolean;
  disabled?: boolean;
  loading?: boolean;
  onChange: (next: number) => void;
}) {
  const { t } = useTranslations();
  const people = normalizeTimelineGraphPeopleCount(value);
  const busy = disabled || loading;
  const peopleLabel = t("timeline_graph.field.people_count", "Cilvēki");

  if (!canEdit) {
    return (
      <Tooltip label={peopleLabel} className="inline-flex shrink-0">
        <span className="inline-flex items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] tabular-nums text-zinc-500">
          <i className="fas fa-user text-[9px]" aria-hidden="true" />
          {people}
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={peopleLabel} className="inline-flex shrink-0">
      <div
        className={`inline-flex items-center overflow-hidden rounded-md border border-zinc-200 bg-white ${
          loading ? "border-violet-300" : ""
        }`}
        aria-busy={loading || undefined}
      >
        <button
          type="button"
          disabled={busy || people <= TIMELINE_GRAPH_PEOPLE_COUNT_MIN}
          className="flex h-6 w-5 items-center justify-center text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t(
            "timeline_graph.people_count.decrease",
            "Samazināt cilvēku skaitu",
          )}
          onClick={() => onChange(people - 1)}
        >
          −
        </button>
        <span className="inline-flex min-w-7 items-center justify-center gap-0.5 px-0.5 text-[11px] tabular-nums text-zinc-700">
          {loading ? (
            <i
              className="fas fa-circle-notch fa-spin text-[10px] text-violet-500"
              aria-hidden="true"
            />
          ) : (
            <i
              className="fas fa-user text-[9px] text-zinc-400"
              aria-hidden="true"
            />
          )}
          {people}
        </span>
        <button
          type="button"
          disabled={busy || people >= TIMELINE_GRAPH_PEOPLE_COUNT_MAX}
          className="flex h-6 w-5 items-center justify-center text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t(
            "timeline_graph.people_count.increase",
            "Palielināt cilvēku skaitu",
          )}
          onClick={() => onChange(people + 1)}
        >
          +
        </button>
      </div>
    </Tooltip>
  );
}

function CalendarDayHeaders({ days }: { days: string[] }) {
  const monthSpans: { label: string; startIndex: number; span: number }[] = [];

  for (let index = 0; index < days.length; index += 1) {
    const label = formatTimelineGraphMonthLabel(days[index]!);
    const last = monthSpans[monthSpans.length - 1];
    if (last && last.label === label) {
      last.span += 1;
    } else {
      monthSpans.push({ label, startIndex: index, span: 1 });
    }
  }

  return (
    <div className={HEADER_HEIGHT_CLASS} style={{ width: days.length * DAY_WIDTH_PX }}>
      <div className="flex h-6 border-b border-zinc-100">
        {monthSpans.map((month) => (
          <div
            key={`${month.label}-${month.startIndex}`}
            className="flex items-center justify-center border-r border-zinc-100 text-[10px] font-semibold uppercase tracking-wide text-zinc-500"
            style={{ width: month.span * DAY_WIDTH_PX }}
          >
            {month.label}
          </div>
        ))}
      </div>
      <div className="flex h-8">
        {days.map((day) => {
          const date = new Date(`${day}T12:00:00`);
          const weekend = isWeekendIso(day);
          return (
            <div
              key={day}
              className={`flex items-center justify-center border-r border-zinc-200 text-[11px] tabular-nums ${
                weekend ? "bg-zinc-100/80 text-zinc-400" : "text-zinc-600"
              }`}
              style={{ width: DAY_WIDTH_PX }}
              title={formatDisplayDateDdMmYy(day)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayGrid({ days, rowKey }: { days: string[]; rowKey: string }) {
  return (
    <div className="absolute inset-0 flex">
      {days.map((day) => (
        <div
          key={`${rowKey}-${day}`}
          className={`border-r border-zinc-200 ${
            isWeekendIso(day) ? "bg-zinc-50/80" : ""
          }`}
          style={{ width: DAY_WIDTH_PX }}
        />
      ))}
    </div>
  );
}

function ScheduleBar({
  dayOffset,
  durationDays,
  confirmed,
  title,
  variant,
}: {
  dayOffset: number;
  durationDays: number;
  confirmed: boolean;
  title: string;
  variant: "project" | "category" | "child";
}) {
  const tone = confirmed
    ? variant === "project"
      ? "bg-violet-600"
      : variant === "category"
        ? "bg-violet-500"
        : "bg-violet-400"
    : variant === "project"
      ? "border border-dashed border-violet-300 bg-violet-200/50"
      : variant === "category"
        ? "border border-dashed border-violet-300/80 bg-violet-200/40"
        : "border border-dashed border-violet-200 bg-violet-100/50";

  const height = variant === "project" ? "h-6" : "h-5";

  return (
    <div
      className={`absolute top-1/2 ${height} -translate-y-1/2 rounded-md shadow-sm ${tone}`}
      style={{
        left: dayOffset * DAY_WIDTH_PX + 2,
        width: Math.max(durationDays * DAY_WIDTH_PX - 4, DAY_WIDTH_PX - 4),
      }}
      title={title}
    />
  );
}

function ChildRow({
  projectId,
  child,
  days,
  confirmed,
  label,
  canManage,
  peopleLoading,
  pairingLoading,
  showPeopleControl = true,
  onPeopleCountChange,
  onOpenParallelGroup,
}: {
  projectId: string;
  child: ScheduledTimelineGraphChild;
  days: string[];
  confirmed: boolean;
  label: string;
  canManage: boolean;
  peopleLoading?: boolean;
  pairingLoading?: boolean;
  showPeopleControl?: boolean;
  onPeopleCountChange: (peopleCount: number) => void;
  onOpenParallelGroup: () => void;
}) {
  const { t } = useTranslations();
  const barTitle = t("timeline_graph.bar_range", "{start} — {end}", {
    start: formatDisplayDateDdMmYy(child.startIso),
    end: formatDisplayDateDdMmYy(child.endIso),
  });
  const isSubcategory = child.kind === "subcategory";
  const isParallel = Boolean(child.parallelGroupId);
  const rowBg = isSubcategory
    ? confirmed
      ? "bg-violet-50/70"
      : "bg-violet-50/40"
    : confirmed
      ? "bg-white"
      : "bg-zinc-50/30";
  const stickyBg = isSubcategory
    ? confirmed
      ? "bg-violet-50"
      : "bg-violet-50/70"
    : confirmed
      ? "bg-white"
      : "bg-zinc-50";

  return (
    <div
      className={`flex border-b border-zinc-200 ${SECTION_ROW_HEIGHT_CLASS} ${rowBg} ${
        isParallel ? "bg-violet-50/30" : ""
      }`}
    >
      <div
        className={`sticky left-0 z-10 flex shrink-0 items-center gap-1 border-r border-zinc-200 px-2 ${stickyBg}`}
        style={{ width: PROJECT_COL_PX }}
      >
        <WorkPairControls
          projectId={projectId}
          sectionId={child.id}
          parallelGroupId={child.parallelGroupId}
          canManage={canManage}
          pairingLoading={pairingLoading}
          onOpenGroup={onOpenParallelGroup}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-xs ${
              confirmed ? "text-zinc-700" : "text-zinc-400"
            }`}
          >
            <span className="mr-1 text-violet-300">↳</span>
            {label}
            {isParallel ? (
              <ParallelBadgeButton onOpen={onOpenParallelGroup} />
            ) : null}
          </p>
        </div>
        {showPeopleControl ? (
          <PeopleCountControl
            value={child.peopleCount}
            canEdit={canManage}
            loading={peopleLoading}
            onChange={onPeopleCountChange}
          />
        ) : null}
        <p
          className={`w-14 shrink-0 text-right text-xs tabular-nums ${
            confirmed ? "text-zinc-600" : "text-zinc-400"
          }`}
        >
          {formatWorkload(child.laborWorkloadHours, child.peopleCount)}
        </p>
      </div>

      <div
        className="relative shrink-0"
        style={{ width: days.length * DAY_WIDTH_PX }}
      >
        <DayGrid days={days} rowKey={child.id} />
        <ScheduleBar
          dayOffset={child.dayOffset}
          durationDays={child.durationDays}
          confirmed={confirmed}
          title={`${label}: ${barTitle}`}
          variant="child"
        />
      </div>
    </div>
  );
}

function CategoryBlock({
  projectId,
  category,
  days,
  confirmed,
  expanded,
  canManage,
  pendingPeopleKeys,
  pendingParallelKeys,
  onToggle,
  onPeopleCountChange,
  onOpenParallelGroup,
}: {
  projectId: string;
  category: ScheduledTimelineGraphCategory;
  days: string[];
  confirmed: boolean;
  expanded: boolean;
  canManage: boolean;
  pendingPeopleKeys: ReadonlySet<string>;
  pendingParallelKeys: ReadonlySet<string>;
  onToggle: () => void;
  onPeopleCountChange: (sectionId: string, peopleCount: number) => void;
  onOpenParallelGroup: (sectionId: string) => void;
}) {
  const { t } = useTranslations();
  const hasSubcategories = categoryHasSubcategories(category);
  /** Tikai īstās apakškategorijas — mākslīgo „Pozīcijas” rindu nerāda. */
  const hasExpandableChildren = hasSubcategories;
  /** Bez apakškategorijām cilvēki ir pie kategorijas; sapārošana — vienmēr. */
  const peopleOnCategory = !hasSubcategories;
  const showChildren = expanded && hasExpandableChildren;
  const categoryPeopleKey = timelineGraphPeopleCountKey(projectId, category.id);
  const categoryParallelKey = timelineGraphPeopleCountKey(
    projectId,
    category.id,
  );
  const isCategoryParallel = Boolean(category.parallelGroupId);
  const barTitle = t("timeline_graph.bar_range", "{start} — {end}", {
    start: formatDisplayDateDdMmYy(category.startIso),
    end: formatDisplayDateDdMmYy(category.endIso),
  });
  const displayWorkload = resolveCategoryDisplayHours(category);

  return (
    <>
      <div
        className={`flex border-b border-zinc-200 ${SECTION_ROW_HEIGHT_CLASS} ${
          confirmed ? "bg-white" : "bg-zinc-50/30"
        } ${isCategoryParallel ? "bg-violet-50/30" : ""}`}
      >
        <div
          className={`sticky left-0 z-10 flex shrink-0 items-center gap-1 border-r border-zinc-200 px-2 ${
            confirmed ? "bg-white" : "bg-zinc-50"
          }`}
          style={{ width: PROJECT_COL_PX }}
        >
          <WorkPairControls
            projectId={projectId}
            sectionId={category.id}
            parallelGroupId={category.parallelGroupId}
            canManage={canManage}
            pairingLoading={pendingParallelKeys.has(categoryParallelKey)}
            onOpenGroup={() => onOpenParallelGroup(category.id)}
          />
          {hasExpandableChildren ? (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? t("timeline_graph.collapse", "Sakļaut subkategorijas")
                  : t("timeline_graph.expand", "Izvērst subkategorijas")
              }
            >
              <i
                className={`fas fa-chevron-right text-[10px] transition ${
                  expanded ? "rotate-90" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-xs font-medium ${
                confirmed ? "text-zinc-800" : "text-zinc-500"
              }`}
            >
              {category.title}
              {isCategoryParallel ? (
                <ParallelBadgeButton
                  onOpen={() => onOpenParallelGroup(category.id)}
                />
              ) : null}
            </p>
          </div>
          {peopleOnCategory ? (
            <PeopleCountControl
              value={category.peopleCount}
              canEdit={canManage}
              loading={pendingPeopleKeys.has(categoryPeopleKey)}
              onChange={(next) => onPeopleCountChange(category.id, next)}
            />
          ) : null}
          <p
            className={`w-14 shrink-0 pr-1 text-right text-xs tabular-nums ${
              confirmed ? "text-zinc-600" : "text-zinc-400"
            }`}
          >
            {formatWorkload(
              displayWorkload.hours,
              displayWorkload.peopleCount,
            )}
          </p>
        </div>

        <div
          className="relative shrink-0"
          style={{ width: days.length * DAY_WIDTH_PX }}
        >
          <DayGrid days={days} rowKey={category.id} />
          {/* Sakļauti: viena josla visai kategorijai; izvērsti: joslas tikai bērniem */}
          {!showChildren ? (
            <ScheduleBar
              dayOffset={category.dayOffset}
              durationDays={category.durationDays}
              confirmed={confirmed}
              title={`${category.title}: ${barTitle}`}
              variant="category"
            />
          ) : null}
        </div>
      </div>

      {showChildren
        ? category.children.map((child) => {
            const childPeopleKey = timelineGraphPeopleCountKey(
              projectId,
              child.id,
            );
            const childParallelKey = timelineGraphPeopleCountKey(
              projectId,
              child.id,
            );
            return (
              <ChildRow
                key={child.id}
                projectId={projectId}
                child={child}
                days={days}
                confirmed={confirmed}
                canManage={canManage}
                peopleLoading={pendingPeopleKeys.has(childPeopleKey)}
                pairingLoading={pendingParallelKeys.has(childParallelKey)}
                showPeopleControl
                onPeopleCountChange={(next) =>
                  onPeopleCountChange(child.id, next)
                }
                onOpenParallelGroup={() => onOpenParallelGroup(child.id)}
                label={child.title}
              />
            );
          })
        : null}
    </>
  );
}

function SortableProjectBlock({
  project,
  days,
  canManage,
  dragDisabled,
  pendingPeopleKeys,
  pendingParallelKeys,
  expanded,
  expandedCategoryIds,
  onToggleProject,
  onToggleCategory,
  onPeopleCountChange,
  onOpenParallelGroup,
}: {
  project: ScheduledTimelineGraphProject;
  days: string[];
  canManage: boolean;
  dragDisabled?: boolean;
  pendingPeopleKeys: ReadonlySet<string>;
  pendingParallelKeys: ReadonlySet<string>;
  expanded: boolean;
  expandedCategoryIds: ReadonlySet<string>;
  onToggleProject: () => void;
  onToggleCategory: (projectId: string, categoryId: string) => void;
  onPeopleCountChange: (sectionId: string, peopleCount: number) => void;
  onOpenParallelGroup: (sectionId: string) => void;
}) {
  const { t } = useTranslations();
  const confirmed = isTimelineGraphConfirmedStatus(project.status);
  const hasCategories = project.categories.length > 0;
  const showCategories = expanded && hasCategories;
  const peopleOnProject = !hasCategories;
  const projectPeopleKey = timelineGraphPeopleCountKey(project.id, project.id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: project.id,
    disabled: !canManage || dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const barTitle = t("timeline_graph.bar_range", "{start} — {end}", {
    start: formatDisplayDateDdMmYy(project.startIso),
    end: formatDisplayDateDdMmYy(project.endIso),
  });
  const projectDisplayHours = hasCategories
    ? project.categories.reduce((sum, category) => {
        const display = resolveCategoryDisplayHours(category);
        return (
          sum +
          resolveEffectiveWorkloadHours(display.hours, display.peopleCount)
        );
      }, 0)
    : project.laborWorkloadHours;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "z-20 opacity-95 shadow-md" : undefined}
    >
      <div
        className={`flex border-b border-zinc-200 ${PROJECT_ROW_HEIGHT_CLASS} ${
          isDragging
            ? "bg-violet-50"
            : confirmed
              ? "bg-zinc-50/80"
              : "bg-zinc-100/70"
        }`}
      >
        <div
          className={`sticky left-0 z-10 flex shrink-0 items-center gap-1 border-r border-zinc-200 px-2 ${
            isDragging ? "bg-violet-50" : confirmed ? "bg-zinc-50" : "bg-zinc-100"
          }`}
          style={{ width: PROJECT_COL_PX }}
        >
          {canManage ? (
            <DragHandle
              label={t("timeline_graph.drag", "Mainīt prioritāti")}
              attributes={attributes}
              listeners={listeners}
            />
          ) : (
            <span className="inline-block w-6 shrink-0" aria-hidden="true" />
          )}
          {hasCategories ? (
            <button
              type="button"
              onClick={onToggleProject}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? t("timeline_graph.collapse_project", "Sakļaut projektu")
                  : t("timeline_graph.expand_project", "Izvērst projektu")
              }
            >
              <i
                className={`fas fa-chevron-right text-[10px] transition ${
                  expanded ? "rotate-90" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          ) : (
            <span className="inline-block w-7 shrink-0" aria-hidden="true" />
          )}
          <Link
            href={`/${project.id}`}
            className={`min-w-0 flex-1 transition ${
              confirmed
                ? "hover:text-violet-700"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <p
              className={`truncate text-sm font-semibold ${
                confirmed ? "text-zinc-900" : "text-zinc-500"
              }`}
            >
              {project.name}
            </p>
            <p
              className={`truncate text-[11px] ${
                confirmed ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              {confirmed
                ? (() => {
                    const address = project.address.trim();
                    const until = t(
                      "timeline_graph.status.until",
                      "līdz {date}",
                      { date: formatDisplayDateDdMmYy(project.endIso) },
                    );
                    return address ? `${address} · ${until}` : until;
                  })()
                : t(
                    "timeline_graph.status.unconfirmed",
                    "Nav apstiprināts · aptuveni līdz {date}",
                    { date: formatDisplayDateDdMmYy(project.endIso) },
                  )}
            </p>
          </Link>
          {peopleOnProject ? (
            <PeopleCountControl
              value={project.peopleCount}
              canEdit={canManage}
              loading={pendingPeopleKeys.has(projectPeopleKey)}
              onChange={(next) => onPeopleCountChange(project.id, next)}
            />
          ) : null}
          <p
            className={`w-14 shrink-0 pr-1 text-right text-sm tabular-nums ${
              confirmed ? "text-zinc-800" : "text-zinc-400"
            }`}
          >
            {formatWorkload(
              projectDisplayHours,
              peopleOnProject ? project.peopleCount : 1,
            )}
          </p>
        </div>

        <div
          className="relative shrink-0"
          style={{ width: days.length * DAY_WIDTH_PX }}
        >
          <DayGrid days={days} rowKey={project.id} />
          {/* Sakļauti: viena josla projektam; izvērsti: joslas kategorijās */}
          {!showCategories ? (
            <ScheduleBar
              dayOffset={project.dayOffset}
              durationDays={project.durationDays}
              confirmed={confirmed}
              title={barTitle}
              variant="project"
            />
          ) : null}
        </div>
      </div>

      {showCategories
        ? project.categories.map((category) => (
            <CategoryBlock
              key={`${project.id}:${category.id}`}
              projectId={project.id}
              category={category}
              days={days}
              confirmed={confirmed}
              canManage={canManage}
              pendingPeopleKeys={pendingPeopleKeys}
              pendingParallelKeys={pendingParallelKeys}
              expanded={expandedCategoryIds.has(
                categoryExpandKey(project.id, category.id),
              )}
              onToggle={() => onToggleCategory(project.id, category.id)}
              onPeopleCountChange={onPeopleCountChange}
              onOpenParallelGroup={onOpenParallelGroup}
            />
          ))
        : null}
    </div>
  );
}

export function TimelineGraphPageContent({
  projects: initialProjects,
}: TimelineGraphPageContentProps) {
  const { t } = useTranslations();
  const canManage = useActionPermission("timeline_graph.manage");
  const dndId = useId();
  const calendarStartIso = useMemo(() => todayIsoDate(), []);
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [projects, setProjects] = useState(() =>
    cloneTimelineGraphProjects(initialProjects),
  );
  const [collapsedProjectIds, setCollapsedProjectIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingPeopleKeys, setPendingPeopleKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingParallelKeys, setPendingParallelKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [parallelGroupModal, setParallelGroupModal] = useState<{
    projectId: string;
    groupId: string;
  } | null>(null);
  const [isReorderPending, startReorderTransition] = useTransition();
  const previousInitialProjectsRef = useRef(initialProjects);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    const serverPropsChanged =
      previousInitialProjectsRef.current !== initialProjects;
    const isLocalSavePending =
      pendingPeopleKeys.size > 0 ||
      pendingParallelKeys.size > 0 ||
      isReorderPending;

    // Kamēr notiek lokāla saglabāšana, neglābt ar props — citādi optimistic
    // sapārojums / cilvēku skaits pazūd līdz lapas pārlādei.
    if (isLocalSavePending) {
      return;
    }

    if (!serverPropsChanged) {
      return;
    }

    previousInitialProjectsRef.current = initialProjects;
    setProjects(cloneTimelineGraphProjects(initialProjects));
  }, [
    initialProjects,
    pendingPeopleKeys,
    pendingParallelKeys,
    isReorderPending,
  ]);

  const scheduled = useMemo(
    () => scheduleTimelineGraphProjects(projects, calendarStartIso),
    [projects, calendarStartIso],
  );
  const days = useMemo(
    () => buildTimelineGraphDayRange(scheduled, calendarStartIso),
    [scheduled, calendarStartIso],
  );
  const parallelModalMembers = useMemo(() => {
    if (!parallelGroupModal) {
      return [] as TimelineGraphParallelGroupMember[];
    }
    const project = projects.find(
      (entry) => entry.id === parallelGroupModal.projectId,
    );
    if (!project) {
      return [];
    }
    return listParallelGroupMembers(
      project,
      parallelGroupModal.groupId,
      t("timeline_graph.direct_positions", "Pozīcijas"),
    );
  }, [parallelGroupModal, projects, t]);
  const parallelModalPendingSectionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const key of pendingParallelKeys) {
      const separator = key.indexOf("::");
      ids.add(separator >= 0 ? key.slice(separator + 2) : key);
    }
    return ids;
  }, [pendingParallelKeys]);

  const contentWidth = PROJECT_COL_PX + days.length * DAY_WIDTH_PX;

  function handleToggleProject(projectId: string) {
    setCollapsedProjectIds((current) => {
      const next = new Set(current);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  function handleToggleCategory(projectId: string, categoryId: string) {
    const key = categoryExpandKey(projectId, categoryId);
    setExpandedCategoryIds((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handlePeopleCountChange(
    projectId: string,
    sectionId: string,
    peopleCount: number,
  ) {
    if (!canManage || isReorderPending) {
      return;
    }

    const nextCount = normalizeTimelineGraphPeopleCount(peopleCount);
    const peopleKey = timelineGraphPeopleCountKey(projectId, sectionId);
    if (pendingPeopleKeys.has(peopleKey)) {
      return;
    }

    const previousCount = resolveStoredPeopleCount(
      projects,
      projectId,
      sectionId,
    );
    const project = projects.find((entry) => entry.id === projectId);
    const category = project?.categories.find(
      (entry) => entry.id === sectionId,
    );
    const clearChildSectionIds =
      category && !categoryHasSubcategories(category)
        ? category.children.map((child) => child.id)
        : [];

    setProjects((current) =>
      patchProjectPeopleCount(current, projectId, sectionId, nextCount),
    );
    setPendingPeopleKeys((current) => {
      const next = new Set(current);
      next.add(peopleKey);
      return next;
    });
    clearFeedback();

    void (async () => {
      try {
        const result = await updateTimelineGraphPeopleCountAction(
          projectId,
          sectionId,
          nextCount,
        );

        if (!result.ok) {
          setProjects((current) =>
            patchProjectPeopleCount(
              current,
              projectId,
              sectionId,
              previousCount,
            ),
          );
          showFeedback({
            type: "error",
            text: translateActionError(t, result),
          });
          return;
        }

        // Notīra vecos „Pozīcijas” ierakstus tikai šajā projektā.
        if (clearChildSectionIds.length > 0) {
          const clearResult = await clearTimelineGraphPeopleSectionsAction(
            projectId,
            clearChildSectionIds,
          );
          if (!clearResult.ok) {
            showFeedback({
              type: "error",
              text: translateActionError(t, clearResult),
            });
          }
        }
      } finally {
        setPendingPeopleKeys((current) => {
          const next = new Set(current);
          next.delete(peopleKey);
          return next;
        });
      }
    })();
  }

  function legacyDirectSectionIds(
    projectId: string,
    sectionId: string,
  ): string[] {
    const project = projects.find((entry) => entry.id === projectId);
    const category = project?.categories.find(
      (entry) => entry.id === sectionId,
    );
    if (!category || categoryHasSubcategories(category)) {
      return [];
    }
    return category.children.map((child) => child.id);
  }

  async function clearLegacyDirectParallel(
    projectId: string,
    sectionId: string,
  ) {
    for (const childSectionId of legacyDirectSectionIds(projectId, sectionId)) {
      const clearResult = await setTimelineGraphParallelPairAction(
        projectId,
        childSectionId,
        null,
      );
      if (!clearResult.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, clearResult),
        });
        return;
      }
    }
  }

  function handleParallelPair(
    projectId: string,
    sectionId: string,
    targetSectionId: string,
  ) {
    if (!canManage || isReorderPending) {
      return;
    }

    const sourceKey = timelineGraphPeopleCountKey(projectId, sectionId);
    const targetKey = timelineGraphPeopleCountKey(projectId, targetSectionId);
    if (
      pendingParallelKeys.has(sourceKey) ||
      pendingParallelKeys.has(targetKey)
    ) {
      return;
    }

    const previousSourceGroup = resolveParallelGroupId(
      projects,
      projectId,
      sectionId,
    );
    const previousTargetGroup = resolveParallelGroupId(
      projects,
      projectId,
      targetSectionId,
    );
    const groupId =
      previousTargetGroup ?? previousSourceGroup ?? crypto.randomUUID();

    setProjects((current) =>
      patchParallelPairAcrossMatchingProjects(
        current,
        projectId,
        sectionId,
        targetSectionId,
        groupId,
      ),
    );
    setPendingParallelKeys((current) => {
      const next = new Set(current);
      next.add(sourceKey);
      next.add(targetKey);
      return next;
    });
    clearFeedback();

    void (async () => {
      try {
        const result = await setTimelineGraphParallelPairAction(
          projectId,
          sectionId,
          targetSectionId,
        );

        if (!result.ok) {
          setProjects((current) =>
            current.map((project) => {
              if (project.id !== projectId) {
                return project;
              }
              return mapSectionParallelGroup(
                mapSectionParallelGroup(
                  project,
                  sectionId,
                  previousSourceGroup,
                ),
                targetSectionId,
                previousTargetGroup,
              );
            }),
          );
          showFeedback({
            type: "error",
            text: translateActionError(t, result),
          });
          return;
        }

        await clearLegacyDirectParallel(projectId, sectionId);
        await clearLegacyDirectParallel(projectId, targetSectionId);

        showFeedback({
          type: "success",
          text: t(
            "timeline_graph.parallel.feedback.paired",
            "Sapāroti paralēli. Tādi paši darbi citos projektos arī sasaitīti.",
          ),
        });
      } finally {
        setPendingParallelKeys((current) => {
          const next = new Set(current);
          next.delete(sourceKey);
          next.delete(targetKey);
          return next;
        });
      }
    })();
  }

  function handleOpenParallelGroup(projectId: string, sectionId: string) {
    const groupId = resolveParallelGroupId(projects, projectId, sectionId);
    if (!groupId) {
      return;
    }
    setParallelGroupModal({ projectId, groupId });
  }

  function handleParallelUnpair(projectId: string, sectionId: string) {
    if (!canManage || isReorderPending) {
      return;
    }

    const parallelKey = timelineGraphPeopleCountKey(projectId, sectionId);
    if (pendingParallelKeys.has(parallelKey)) {
      return;
    }

    const previousGroup = resolveParallelGroupId(
      projects,
      projectId,
      sectionId,
    );
    if (!previousGroup) {
      return;
    }

    const nextProjects = patchParallelUnpairAcrossMatchingProjects(
      projects,
      projectId,
      sectionId,
    );
    setProjects(nextProjects);

    const nextProject = nextProjects.find((entry) => entry.id === projectId);
    const remainingMembers = nextProject
      ? listParallelGroupMembers(
          nextProject,
          previousGroup,
          t("timeline_graph.direct_positions", "Pozīcijas"),
        )
      : [];
    if (remainingMembers.length < 2) {
      setParallelGroupModal(null);
    }

    setPendingParallelKeys((current) => {
      const next = new Set(current);
      next.add(parallelKey);
      return next;
    });
    clearFeedback();

    void (async () => {
      try {
        const result = await setTimelineGraphParallelPairAction(
          projectId,
          sectionId,
          null,
        );

        if (!result.ok) {
          setProjects((current) =>
            current.map((project) =>
              project.id === projectId
                ? mapSectionParallelGroup(project, sectionId, previousGroup)
                : project,
            ),
          );
          setParallelGroupModal({ projectId, groupId: previousGroup });
          showFeedback({
            type: "error",
            text: translateActionError(t, result),
          });
          return;
        }

        await clearLegacyDirectParallel(projectId, sectionId);

        showFeedback({
          type: "success",
          text: t(
            "timeline_graph.parallel.feedback.unpaired",
            "Darbs atvienots no paralēlās grupas.",
          ),
        });
      } finally {
        setPendingParallelKeys((current) => {
          const next = new Set(current);
          next.delete(parallelKey);
          return next;
        });
      }
    })();
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!canManage || !over || active.id === over.id || isReorderPending) {
      return;
    }

    const activeWork = parseWorkDragId(active.id);
    const overWork = parseWorkDragId(over.id);

    if (activeWork) {
      if (!overWork) {
        return;
      }

      if (activeWork.projectId !== overWork.projectId) {
        showFeedback({
          type: "error",
          text: t(
            "errors.timeline_graph_parallel_cross_project",
            "Nevar sapārot ar citu projektu — paralēli tikai tajā pašā projektā.",
          ),
        });
        return;
      }

      handleParallelPair(
        activeWork.projectId,
        activeWork.sectionId,
        overWork.sectionId,
      );
      return;
    }

    // Projekta prioritāte — ja nomež uz darba rindu, ņem tās projektu.
    const overProjectId = overWork?.projectId ?? String(over.id);
    const oldIndex = projects.findIndex((project) => project.id === active.id);
    const newIndex = projects.findIndex(
      (project) => project.id === overProjectId,
    );
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previous = projects;
    const next = arrayMove(projects, oldIndex, newIndex);
    setProjects(next);
    clearFeedback();

    startReorderTransition(async () => {
      const result = await reorderTimelineGraphProjectsAction(
        next.map((project) => project.id),
      );

      if (!result.ok) {
        setProjects(previous);
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text: t(
          "timeline_graph.feedback.reordered",
          "Prioritātes secība saglabāta.",
        ),
      });
    });
  }

  return (
    <SectionPage
      title={t("nav.timeline_graph", "Laika grafiks")}
      subtitle={
        canManage
          ? t(
              "timeline_graph.page.subtitle",
              "Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Jaunam projektam cilvēku skaits tiek nokopēts no pēdējā projekta pēc kategorijas nosaukuma. Paralēlā sasaistīšana pēc nosaukuma sinhronizējas starp projektiem. Vienādas kategorijas starp projektiem nepārklājas; projekti kā veselums drīkst pārklāties. Velc darbu uz citu darbu tajā pašā projektā, lai ietu paralēli. Velc projektu, lai mainītu prioritāti.",
            )
          : t(
              "timeline_graph.page.subtitle_readonly",
              "Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Jaunam projektam cilvēku skaits tiek nokopēts no pēdējā projekta pēc kategorijas nosaukuma. Vienādas kategorijas starp projektiem nepārklājas; projekti kā veselums drīkst pārklāties.",
            )
      }
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
          <span>
            {t(
              "timeline_graph.hours_per_day_hint",
              "Brīvdienas netiek ieskaitītas · 1 d = {hours} c/h",
              { hours: String(TIMELINE_GRAPH_HOURS_PER_DAY) },
            )}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-4 rounded-sm bg-violet-500"
              aria-hidden="true"
            />
            {t("timeline_graph.legend.confirmed", "Apstiprināts")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-4 rounded-sm border border-dashed border-violet-300 bg-violet-200/55"
              aria-hidden="true"
            />
            {t(
              "timeline_graph.legend.unconfirmed",
              "Nav apstiprināts (aptuveni)",
            )}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {projects.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              {t("timeline_graph.empty", "Nav projektu laika grafikā.")}
            </p>
          ) : (
            <DndContext
              id={dndId}
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={projects.map((project) => project.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className={`overflow-x-auto ${
                    isReorderPending ? "pointer-events-none opacity-70" : ""
                  }`}
                >
                  <div style={{ width: contentWidth, minWidth: "100%" }}>
                    <div
                      className={`sticky top-0 z-20 flex border-b border-zinc-200 bg-zinc-50 ${HEADER_HEIGHT_CLASS}`}
                    >
                      <div
                        className="sticky left-0 z-30 flex shrink-0 items-end justify-between border-r border-zinc-200 bg-zinc-50 px-3 pb-2"
                        style={{ width: PROJECT_COL_PX }}
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                          {t("timeline_graph.column.project", "Projekts")}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                          {t("timeline_graph.column.workload", "Darbietilpība")}
                        </span>
                      </div>
                      <CalendarDayHeaders days={days} />
                    </div>

                    {scheduled.map((project) => (
                      <SortableProjectBlock
                        key={project.id}
                        project={project}
                        days={days}
                        canManage={canManage}
                        dragDisabled={isReorderPending}
                        pendingPeopleKeys={pendingPeopleKeys}
                        pendingParallelKeys={pendingParallelKeys}
                        expanded={!collapsedProjectIds.has(project.id)}
                        expandedCategoryIds={expandedCategoryIds}
                        onToggleProject={() => handleToggleProject(project.id)}
                        onToggleCategory={handleToggleCategory}
                        onPeopleCountChange={(sectionId, peopleCount) =>
                          handlePeopleCountChange(
                            project.id,
                            sectionId,
                            peopleCount,
                          )
                        }
                        onOpenParallelGroup={(sectionId) =>
                          handleOpenParallelGroup(project.id, sectionId)
                        }
                      />
                    ))}
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <TimelineGraphParallelGroupModal
        open={parallelGroupModal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setParallelGroupModal(null);
          }
        }}
        members={parallelModalMembers}
        canManage={canManage}
        pendingSectionIds={parallelModalPendingSectionIds}
        onUnpair={(sectionId) => {
          if (!parallelGroupModal) {
            return;
          }
          handleParallelUnpair(parallelGroupModal.projectId, sectionId);
        }}
      />
    </SectionPage>
  );
}
