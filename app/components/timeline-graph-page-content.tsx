"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
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
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { reorderTimelineGraphProjectsAction } from "@/app/(protected)/timeline-graph/actions";
import { DragHandle } from "@/app/components/drag-handle";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { SectionPage } from "@/app/components/section-page";
import { useTranslations } from "@/app/components/translations-provider";
import { formatDisplayDateDdMmYy, todayIsoDate } from "@/app/lib/format-display-date";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  TIMELINE_GRAPH_HOURS_PER_DAY,
  buildTimelineGraphDayRange,
  formatTimelineGraphMonthLabel,
  formatWorkloadDaysAndHours,
  isWeekendIso,
  scheduleTimelineGraphProjects,
  type ScheduledTimelineGraphCategory,
  type ScheduledTimelineGraphChild,
  type ScheduledTimelineGraphProject,
} from "@/app/lib/timeline-graph/schedule";
import {
  isTimelineGraphConfirmedStatus,
  type TimelineGraphProject,
} from "@/app/lib/timeline-graph/types";

const PROJECT_COL_PX = 300;
const DAY_WIDTH_PX = 36;
const PROJECT_ROW_HEIGHT_CLASS = "h-14";
const SECTION_ROW_HEIGHT_CLASS = "h-10";
const HEADER_HEIGHT_CLASS = "h-14";

type TimelineGraphPageContentProps = {
  projects: TimelineGraphProject[];
};

function formatWorkload(hours: number): string {
  return formatWorkloadDaysAndHours(hours);
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
              className={`flex items-center justify-center border-r border-zinc-100 text-[11px] tabular-nums ${
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
          className={`border-r border-zinc-50 ${
            isWeekendIso(day) ? "bg-zinc-50/70" : ""
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
  child,
  days,
  confirmed,
  label,
}: {
  child: ScheduledTimelineGraphChild;
  days: string[];
  confirmed: boolean;
  label: string;
}) {
  const { t } = useTranslations();
  const barTitle = t("timeline_graph.bar_range", "{start} — {end}", {
    start: formatDisplayDateDdMmYy(child.startIso),
    end: formatDisplayDateDdMmYy(child.endIso),
  });

  return (
    <div
      className={`flex border-b border-zinc-50 ${SECTION_ROW_HEIGHT_CLASS} ${
        confirmed ? "bg-white" : "bg-zinc-50/30"
      }`}
    >
      <div
        className={`sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-zinc-200 px-3 ${
          confirmed ? "bg-white" : "bg-zinc-50"
        }`}
        style={{ width: PROJECT_COL_PX }}
      >
        <span className="inline-block w-6 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1 pl-7">
          <p
            className={`truncate text-xs ${
              confirmed ? "text-zinc-600" : "text-zinc-400"
            }`}
          >
            <span className="mr-1 text-zinc-300">↳</span>
            {label}
          </p>
        </div>
        <p
          className={`shrink-0 text-xs tabular-nums ${
            confirmed ? "text-zinc-600" : "text-zinc-400"
          }`}
        >
          {formatWorkload(child.laborWorkloadHours)}
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
  category,
  days,
  confirmed,
  expanded,
  onToggle,
}: {
  category: ScheduledTimelineGraphCategory;
  days: string[];
  confirmed: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslations();
  const hasExpandableChildren = category.children.some(
    (child) => child.kind === "subcategory",
  );
  const showChildren = expanded && category.children.length > 0;
  const barTitle = t("timeline_graph.bar_range", "{start} — {end}", {
    start: formatDisplayDateDdMmYy(category.startIso),
    end: formatDisplayDateDdMmYy(category.endIso),
  });

  return (
    <>
      <div
        className={`flex border-b border-zinc-50 ${SECTION_ROW_HEIGHT_CLASS} ${
          confirmed ? "bg-white" : "bg-zinc-50/30"
        }`}
      >
        <div
          className={`sticky left-0 z-10 flex shrink-0 items-center gap-1 border-r border-zinc-200 px-2 ${
            confirmed ? "bg-white" : "bg-zinc-50"
          }`}
          style={{ width: PROJECT_COL_PX }}
        >
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
          ) : (
            <span className="inline-block w-7 shrink-0" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-xs font-medium ${
                confirmed ? "text-zinc-800" : "text-zinc-500"
              }`}
            >
              {category.title}
            </p>
          </div>
          <p
            className={`shrink-0 pr-1 text-xs tabular-nums ${
              confirmed ? "text-zinc-600" : "text-zinc-400"
            }`}
          >
            {formatWorkload(category.laborWorkloadHours)}
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
        ? category.children.map((child) => (
            <ChildRow
              key={child.id}
              child={child}
              days={days}
              confirmed={confirmed}
              label={
                child.kind === "direct"
                  ? t("timeline_graph.direct_positions", "Pozīcijas")
                  : child.title
              }
            />
          ))
        : null}
    </>
  );
}

function SortableProjectBlock({
  project,
  days,
  expanded,
  expandedCategoryIds,
  onToggleProject,
  onToggleCategory,
}: {
  project: ScheduledTimelineGraphProject;
  days: string[];
  expanded: boolean;
  expandedCategoryIds: ReadonlySet<string>;
  onToggleProject: () => void;
  onToggleCategory: (categoryId: string) => void;
}) {
  const { t } = useTranslations();
  const confirmed = isTimelineGraphConfirmedStatus(project.status);
  const hasCategories = project.categories.length > 0;
  const showCategories = expanded && hasCategories;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const barTitle = t("timeline_graph.bar_range", "{start} — {end}", {
    start: formatDisplayDateDdMmYy(project.startIso),
    end: formatDisplayDateDdMmYy(project.endIso),
  });

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
          <DragHandle
            label={t("timeline_graph.drag", "Mainīt prioritāti")}
            attributes={attributes}
            listeners={listeners}
          />
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
                ? project.address.trim() || "\u00a0"
                : t(
                    "timeline_graph.status.unconfirmed",
                    "Nav apstiprināts · aptuveni līdz {date}",
                    { date: formatDisplayDateDdMmYy(project.endIso) },
                  )}
            </p>
          </Link>
          <p
            className={`shrink-0 pr-1 text-sm tabular-nums ${
              confirmed ? "text-zinc-800" : "text-zinc-400"
            }`}
          >
            {formatWorkload(project.laborWorkloadHours)}
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
              key={category.id}
              category={category}
              days={days}
              confirmed={confirmed}
              expanded={expandedCategoryIds.has(category.id)}
              onToggle={() => onToggleCategory(category.id)}
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
  const dndId = useId();
  const calendarStartIso = useMemo(() => todayIsoDate(), []);
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [projects, setProjects] = useState(initialProjects);
  const [collapsedProjectIds, setCollapsedProjectIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const scheduled = useMemo(
    () => scheduleTimelineGraphProjects(projects, calendarStartIso),
    [projects, calendarStartIso],
  );
  const days = useMemo(
    () => buildTimelineGraphDayRange(scheduled, calendarStartIso),
    [scheduled, calendarStartIso],
  );

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

  function handleToggleCategory(categoryId: string) {
    setExpandedCategoryIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || isPending) {
      return;
    }

    const oldIndex = projects.findIndex((project) => project.id === active.id);
    const newIndex = projects.findIndex((project) => project.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previous = projects;
    const next = arrayMove(projects, oldIndex, newIndex);
    setProjects(next);
    clearFeedback();

    startTransition(async () => {
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
      subtitle={t(
        "timeline_graph.page.subtitle",
        "Sakļauj projektu vienā rindā vai izvērs kategorijas un subkategorijas. Velc projektu, lai mainītu prioritāti.",
      )}
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
                    isPending ? "pointer-events-none opacity-70" : ""
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
                        expanded={!collapsedProjectIds.has(project.id)}
                        expandedCategoryIds={expandedCategoryIds}
                        onToggleProject={() => handleToggleProject(project.id)}
                        onToggleCategory={handleToggleCategory}
                      />
                    ))}
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </SectionPage>
  );
}
