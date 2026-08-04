import { todayIsoDate } from "@/app/lib/format-display-date";
import { roundQuantity } from "@/app/lib/positions/variable-quantity";
import type {
  TimelineGraphCategory,
  TimelineGraphChildSection,
  TimelineGraphProject,
} from "@/app/lib/timeline-graph/types";

/** Darba dienas stundas darbietilpības pārvēršanai dienu joslā. */
export const TIMELINE_GRAPH_HOURS_PER_DAY = 8;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ScheduledTimelineGraphChild = TimelineGraphChildSection & {
  startIso: string;
  endIso: string;
  /** Kalendāra dienu skaits joslai (ieskaitot brīvdienas starp sākumu un beigām). */
  durationDays: number;
  dayOffset: number;
};

export type ScheduledTimelineGraphCategory = Omit<
  TimelineGraphCategory,
  "children"
> & {
  startIso: string;
  endIso: string;
  durationDays: number;
  dayOffset: number;
  children: ScheduledTimelineGraphChild[];
};

export type ScheduledTimelineGraphProject = Omit<
  TimelineGraphProject,
  "categories"
> & {
  startIso: string;
  endIso: string;
  durationDays: number;
  dayOffset: number;
  categories: ScheduledTimelineGraphCategory[];
};

function parseIsoDay(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function toIsoDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addCalendarDays(iso: string, days: number): string {
  const date = parseIsoDay(iso);
  date.setDate(date.getDate() + days);
  return toIsoDay(date);
}

export function isWeekendIso(iso: string): boolean {
  const day = parseIsoDay(iso).getDay();
  return day === 0 || day === 6;
}

function calendarDayOffset(fromIso: string, toIso: string): number {
  return Math.round(
    (parseIsoDay(toIso).getTime() - parseIsoDay(fromIso).getTime()) / DAY_MS,
  );
}

function calendarInclusiveSpan(startIso: string, endIso: string): number {
  return calendarDayOffset(startIso, endIso) + 1;
}

/** Pārvieto uz nākamo darba dienu, ja datums ir brīvdiena. */
export function ensureWorkdayIso(iso: string): string {
  let current = iso;
  while (isWeekendIso(current)) {
    current = addCalendarDays(current, 1);
  }
  return current;
}

function nextWorkdayAfter(iso: string): string {
  return ensureWorkdayIso(addCalendarDays(iso, 1));
}

/** Pievieno N darba dienas (brīvdienas izlaižot). start jābūt darba dienai. */
function addWorkDays(startIso: string, workDaysToAdd: number): string {
  if (workDaysToAdd <= 0) {
    return startIso;
  }

  let current = startIso;
  let remaining = workDaysToAdd;
  while (remaining > 0) {
    current = addCalendarDays(current, 1);
    if (!isWeekendIso(current)) {
      remaining -= 1;
    }
  }
  return current;
}

/** Cik darba dienu vajag šai darbietilpībai. */
export function resolveWorkloadDurationDays(laborWorkloadHours: number): number {
  if (!Number.isFinite(laborWorkloadHours) || laborWorkloadHours <= 0) {
    return 1;
  }

  return Math.max(
    1,
    Math.ceil(laborWorkloadHours / TIMELINE_GRAPH_HOURS_PER_DAY),
  );
}

/** Darbietilpība kā pilnas dienas + atlikušās stundas (1 d = 8 c/h). */
export function formatWorkloadDaysAndHours(laborWorkloadHours: number): string {
  if (!Number.isFinite(laborWorkloadHours) || laborWorkloadHours <= 0) {
    return "—";
  }

  const totalHours = roundQuantity(laborWorkloadHours);
  const days = Math.floor(totalHours / TIMELINE_GRAPH_HOURS_PER_DAY);
  const hours = roundQuantity(totalHours - days * TIMELINE_GRAPH_HOURS_PER_DAY);

  const hoursLabel = hours
    .toFixed(2)
    .replace(/\.?0+$/, "")
    .replace(".", ",");

  if (days > 0 && hours > 0) {
    return `${days} d ${hoursLabel} h`;
  }

  if (days > 0) {
    return `${days} d`;
  }

  return `${hoursLabel} h`;
}

function scheduleBlock(
  laborWorkloadHours: number,
  cursor: string,
  calendarStartIso: string,
): {
  startIso: string;
  endIso: string;
  durationDays: number;
  dayOffset: number;
  nextCursor: string;
} {
  const workDays = resolveWorkloadDurationDays(laborWorkloadHours);
  const startIso = ensureWorkdayIso(cursor);
  const endIso =
    workDays <= 1 ? startIso : addWorkDays(startIso, workDays - 1);

  return {
    startIso,
    endIso,
    durationDays: calendarInclusiveSpan(startIso, endIso),
    dayOffset: calendarDayOffset(calendarStartIso, startIso),
    nextCursor: nextWorkdayAfter(endIso),
  };
}

function spanFromChildren(
  children: ScheduledTimelineGraphChild[],
  fallbackHours: number,
  cursor: string,
  calendarStartIso: string,
): {
  startIso: string;
  endIso: string;
  durationDays: number;
  dayOffset: number;
  nextCursor: string;
} {
  if (children.length === 0) {
    return scheduleBlock(fallbackHours, cursor, calendarStartIso);
  }

  const startIso = children[0]!.startIso;
  const endIso = children[children.length - 1]!.endIso;

  return {
    startIso,
    endIso,
    durationDays: calendarInclusiveSpan(startIso, endIso),
    dayOffset: children[0]!.dayOffset,
    nextCursor: nextWorkdayAfter(endIso),
  };
}

export function scheduleTimelineGraphProjects(
  projects: TimelineGraphProject[],
  calendarStartIso: string = todayIsoDate(),
): ScheduledTimelineGraphProject[] {
  let cursor = ensureWorkdayIso(calendarStartIso);

  return projects.map((project) => {
    const scheduledCategories: ScheduledTimelineGraphCategory[] = [];
    let projectStartIso = cursor;
    let projectEndIso = cursor;

    if (project.categories.length > 0) {
      for (const category of project.categories) {
        const scheduledChildren: ScheduledTimelineGraphChild[] = [];

        if (category.children.length > 0) {
          for (const child of category.children) {
            const block = scheduleBlock(
              child.laborWorkloadHours,
              cursor,
              calendarStartIso,
            );
            scheduledChildren.push({
              ...child,
              startIso: block.startIso,
              endIso: block.endIso,
              durationDays: block.durationDays,
              dayOffset: block.dayOffset,
            });
            cursor = block.nextCursor;
          }

          const span = spanFromChildren(
            scheduledChildren,
            category.laborWorkloadHours,
            cursor,
            calendarStartIso,
          );

          scheduledCategories.push({
            ...category,
            startIso: span.startIso,
            endIso: span.endIso,
            durationDays: span.durationDays,
            dayOffset: span.dayOffset,
            children: scheduledChildren,
          });
          projectEndIso = span.endIso;
        } else {
          const block = scheduleBlock(
            category.laborWorkloadHours,
            cursor,
            calendarStartIso,
          );
          cursor = block.nextCursor;
          scheduledCategories.push({
            ...category,
            startIso: block.startIso,
            endIso: block.endIso,
            durationDays: block.durationDays,
            dayOffset: block.dayOffset,
            children: [],
          });
          projectEndIso = block.endIso;
        }
      }

      projectStartIso = scheduledCategories[0]?.startIso ?? cursor;
    } else {
      const block = scheduleBlock(
        project.laborWorkloadHours,
        cursor,
        calendarStartIso,
      );
      cursor = block.nextCursor;
      projectStartIso = block.startIso;
      projectEndIso = block.endIso;
    }

    return {
      ...project,
      startIso: projectStartIso,
      endIso: projectEndIso,
      durationDays: calendarInclusiveSpan(projectStartIso, projectEndIso),
      dayOffset: calendarDayOffset(calendarStartIso, projectStartIso),
      categories: scheduledCategories,
    };
  });
}

export function buildTimelineGraphDayRange(
  scheduled: ScheduledTimelineGraphProject[],
  calendarStartIso: string,
  trailingPadDays = 21,
): string[] {
  let lastEndIso = calendarStartIso;

  for (const project of scheduled) {
    if (calendarDayOffset(lastEndIso, project.endIso) > 0) {
      lastEndIso = project.endIso;
    }
  }

  const spanToLast = Math.max(
    calendarInclusiveSpan(calendarStartIso, lastEndIso),
    30,
  );
  const dayCount = spanToLast + trailingPadDays;
  const days: string[] = [];

  for (let index = 0; index < dayCount; index += 1) {
    days.push(addCalendarDays(calendarStartIso, index));
  }

  return days;
}

export function formatTimelineGraphMonthLabel(iso: string): string {
  const date = parseIsoDay(iso);
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "mai",
    "jūn",
    "jūl",
    "aug",
    "sep",
    "okt",
    "nov",
    "dec",
  ] as const;
  const month = months[date.getMonth()] ?? "";
  return `${month} ${String(date.getFullYear()).slice(-2)}`;
}
