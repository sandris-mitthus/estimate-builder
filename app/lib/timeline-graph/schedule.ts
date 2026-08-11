import { todayIsoDate } from "@/app/lib/format-display-date";
import { roundQuantity } from "@/app/lib/positions/variable-quantity";
import { normalizeTimelineGraphPeopleCount } from "@/app/lib/timeline-graph/people-count";
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

type ScheduleBlock = {
  startIso: string;
  endIso: string;
  durationDays: number;
  dayOffset: number;
};

type FlattenedWorkUnit = {
  sectionId: string;
  categoryId: string | null;
  laborWorkloadHours: number;
  peopleCount: number;
  parallelGroupId?: string;
  child: TimelineGraphChildSection | null;
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

/** Cik darba dienu vajag šai darbietilpībai (cilvēku skaits saīsina kalendāru). */
export function resolveWorkloadDurationDays(
  laborWorkloadHours: number,
  peopleCount = 1,
): number {
  if (!Number.isFinite(laborWorkloadHours) || laborWorkloadHours <= 0) {
    return 1;
  }

  const people = normalizeTimelineGraphPeopleCount(peopleCount);
  return Math.max(
    1,
    Math.ceil(laborWorkloadHours / (TIMELINE_GRAPH_HOURS_PER_DAY * people)),
  );
}

/**
 * Efektīvā darbietilpība kalendārā — kopējās c/h dalītas ar cilvēku skaitu.
 * (Kopējais darba apjoms stundās nemainās; grafikā saīsinās ilgums.)
 */
export function resolveEffectiveWorkloadHours(
  laborWorkloadHours: number,
  peopleCount = 1,
): number {
  if (!Number.isFinite(laborWorkloadHours) || laborWorkloadHours <= 0) {
    return 0;
  }

  const people = normalizeTimelineGraphPeopleCount(peopleCount);
  return laborWorkloadHours / people;
}

/** Darbietilpība kā pilnas dienas + atlikušās stundas (1 d = 8 c/h). */
export function formatWorkloadDaysAndHours(
  laborWorkloadHours: number,
  peopleCount = 1,
): string {
  const totalHours = roundQuantity(
    resolveEffectiveWorkloadHours(laborWorkloadHours, peopleCount),
  );
  if (totalHours <= 0) {
    return "—";
  }

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

function scheduleBlockAt(
  laborWorkloadHours: number,
  startCursor: string,
  calendarStartIso: string,
  peopleCount = 1,
): ScheduleBlock {
  const workDays = resolveWorkloadDurationDays(laborWorkloadHours, peopleCount);
  const startIso = ensureWorkdayIso(startCursor);
  const endIso =
    workDays <= 1 ? startIso : addWorkDays(startIso, workDays - 1);

  return {
    startIso,
    endIso,
    durationDays: calendarInclusiveSpan(startIso, endIso),
    dayOffset: calendarDayOffset(calendarStartIso, startIso),
  };
}

function laterIso(left: string, right: string): string {
  return calendarDayOffset(left, right) >= 0 ? right : left;
}

function earlierIso(left: string, right: string): string {
  return calendarDayOffset(left, right) >= 0 ? left : right;
}

function categoryHasSubcategories(
  category: Pick<TimelineGraphCategory, "children">,
): boolean {
  return category.children.some((child) => child.kind === "subcategory");
}

function advanceStartCursor(current: string, afterEndIso: string): string {
  const next = nextWorkdayAfter(afterEndIso);
  return calendarDayOffset(current, next) > 0 ? next : current;
}

function scheduleUnitBlock(
  unit: FlattenedWorkUnit,
  startIso: string,
  calendarStartIso: string,
  blocksBySectionId: Map<string, ScheduleBlock>,
): ScheduleBlock {
  const block = scheduleBlockAt(
    unit.laborWorkloadHours,
    startIso,
    calendarStartIso,
    unit.peopleCount,
  );
  blocksBySectionId.set(unit.sectionId, block);
  return block;
}

function resourceKeyForCategory(category: TimelineGraphCategory): string {
  return category.title.trim().toLowerCase() || "—";
}

/**
 * Plāno vienu projektu.
 * - Projekta iekšienē kategorijas iet secīgi (ja nav parallelGroupId).
 * - Vienādas kategorijas (pēc nosaukuma) starp projektiem nesākās, kamēr
 *   iepriekšējā projekta tā pati kategorija nav beigusies
 *   (`categoryResourceFreeAt`).
 * - Projekti kā veselums drīkst pārklāties (dažādas kategorijas vienlaikus).
 */
function scheduleProjectWaves(
  project: TimelineGraphProject,
  calendarStartIso: string,
  categoryResourceFreeAt: Map<string, string>,
): {
  projectStartIso: string;
  projectEndIso: string;
  blocksBySectionId: Map<string, ScheduleBlock>;
} {
  const blocksBySectionId = new Map<string, ScheduleBlock>();
  const categoryGroupStartById = new Map<string, string>();
  const calendarStart = ensureWorkdayIso(calendarStartIso);
  // Projekta iekšējā secība — NESAGAIDA iepriekšējā projekta beigas.
  let nextCategoryStart = calendarStart;
  let latestEndIso: string | null = null;
  let projectStartIso = calendarStart;
  let projectEndIso = calendarStart;
  let started = false;

  function resolveCategoryStart(
    category: TimelineGraphCategory,
    categoryGroupId: string | undefined,
  ): string {
    if (categoryGroupId && categoryGroupStartById.has(categoryGroupId)) {
      return categoryGroupStartById.get(categoryGroupId)!;
    }

    let start = nextCategoryStart;
    const ownResource = categoryResourceFreeAt.get(
      resourceKeyForCategory(category),
    );
    if (ownResource && calendarDayOffset(start, ownResource) > 0) {
      start = ownResource;
    }

    // Paralēlai grupai — sākums pēc visu grupas biedru resursu atbrīvošanās.
    if (categoryGroupId) {
      for (const other of project.categories) {
        if (other.parallelGroupId?.trim() !== categoryGroupId) {
          continue;
        }
        const otherFree = categoryResourceFreeAt.get(
          resourceKeyForCategory(other),
        );
        if (otherFree && calendarDayOffset(start, otherFree) > 0) {
          start = otherFree;
        }
      }
      categoryGroupStartById.set(categoryGroupId, start);
    }

    return start;
  }

  if (project.categories.length === 0) {
    const block = scheduleUnitBlock(
      {
        sectionId: project.id,
        categoryId: null,
        laborWorkloadHours: project.laborWorkloadHours,
        peopleCount: project.peopleCount,
        parallelGroupId: project.parallelGroupId,
        child: null,
      },
      calendarStart,
      calendarStartIso,
      blocksBySectionId,
    );
    return {
      projectStartIso: block.startIso,
      projectEndIso: block.endIso,
      blocksBySectionId,
    };
  }

  for (const category of project.categories) {
    const hasSubcategories = categoryHasSubcategories(category);
    const categoryGroupId = category.parallelGroupId?.trim() || undefined;
    const categoryStart = resolveCategoryStart(category, categoryGroupId);

    const units: FlattenedWorkUnit[] = hasSubcategories
      ? category.children.map((child) => ({
          sectionId: child.id,
          categoryId: category.id,
          laborWorkloadHours: child.laborWorkloadHours,
          peopleCount: child.peopleCount,
          parallelGroupId: child.parallelGroupId,
          child,
        }))
      : [
          {
            sectionId: category.id,
            categoryId: category.id,
            laborWorkloadHours: category.laborWorkloadHours,
            peopleCount: category.peopleCount,
            parallelGroupId: category.parallelGroupId,
            child: null,
          },
        ];

    let sequentialStart = categoryStart;
    const unitGroupStartById = new Map<string, string>();
    let categoryEndIso = categoryStart;

    for (const unit of units) {
      if (blocksBySectionId.has(unit.sectionId)) {
        continue;
      }

      // Leaf kategorija: sākums = kategorijas (iesk. paralēlās grupas) sākums.
      // Ar apakškategorijām: bērnu savstarpējā sapārošana + secība kategorijā.
      let startIso: string;
      if (!hasSubcategories) {
        startIso = categoryStart;
      } else {
        const unitGroupId = unit.parallelGroupId?.trim() || undefined;
        if (unitGroupId && unitGroupStartById.has(unitGroupId)) {
          startIso = unitGroupStartById.get(unitGroupId)!;
        } else {
          startIso = sequentialStart;
          if (unitGroupId) {
            unitGroupStartById.set(unitGroupId, startIso);
          }
        }
      }

      const block = scheduleUnitBlock(
        unit,
        startIso,
        calendarStartIso,
        blocksBySectionId,
      );

      if (!started) {
        projectStartIso = block.startIso;
        started = true;
      }
      projectEndIso = laterIso(projectEndIso, block.endIso);
      categoryEndIso = laterIso(categoryEndIso, block.endIso);
      latestEndIso = latestEndIso
        ? laterIso(latestEndIso, block.endIso)
        : block.endIso;
      sequentialStart = advanceStartCursor(sequentialStart, block.endIso);
    }

    // Resurss „kategorijas nosaukums” brīvs nākamajam projektam pēc šīs beigas.
    const freeAt = nextWorkdayAfter(categoryEndIso);
    const key = resourceKeyForCategory(category);
    const previousFree = categoryResourceFreeAt.get(key);
    categoryResourceFreeAt.set(
      key,
      previousFree ? laterIso(previousFree, freeAt) : freeAt,
    );

    // Nākamā (nesapārotā) kategorija šajā projektā — pēc šīs kategorijas beigām.
    nextCategoryStart = advanceStartCursor(nextCategoryStart, categoryEndIso);
  }

  if (!started) {
    const empty = scheduleBlockAt(0, nextCategoryStart, calendarStartIso, 1);
    return {
      projectStartIso: empty.startIso,
      projectEndIso: empty.endIso,
      blocksBySectionId,
    };
  }

  return {
    projectStartIso,
    projectEndIso: latestEndIso ?? projectEndIso,
    blocksBySectionId,
  };
}

function spanFromBlocks(
  blocks: ScheduleBlock[],
  fallbackHours: number,
  fallbackPeopleCount: number,
  cursor: string,
  calendarStartIso: string,
): ScheduleBlock & { nextCursor: string } {
  if (blocks.length === 0) {
    const block = scheduleBlockAt(
      fallbackHours,
      cursor,
      calendarStartIso,
      fallbackPeopleCount,
    );
    return { ...block, nextCursor: nextWorkdayAfter(block.endIso) };
  }

  let startIso = blocks[0]!.startIso;
  let endIso = blocks[0]!.endIso;
  for (const block of blocks) {
    startIso = earlierIso(startIso, block.startIso);
    endIso = laterIso(endIso, block.endIso);
  }

  return {
    startIso,
    endIso,
    durationDays: calendarInclusiveSpan(startIso, endIso),
    dayOffset: calendarDayOffset(calendarStartIso, startIso),
    nextCursor: nextWorkdayAfter(endIso),
  };
}

export function scheduleTimelineGraphProjects(
  projects: TimelineGraphProject[],
  calendarStartIso: string = todayIsoDate(),
): ScheduledTimelineGraphProject[] {
  /** Kad brīva katra kategorijas nosaukuma „josla” nākamajam projektam. */
  const categoryResourceFreeAt = new Map<string, string>();

  return projects.map((project) => {
    const wave = scheduleProjectWaves(
      project,
      calendarStartIso,
      categoryResourceFreeAt,
    );

    if (project.categories.length === 0) {
      const block =
        wave.blocksBySectionId.get(project.id) ??
        scheduleBlockAt(
          project.laborWorkloadHours,
          wave.projectStartIso,
          calendarStartIso,
          project.peopleCount,
        );

      return {
        ...project,
        startIso: block.startIso,
        endIso: block.endIso,
        durationDays: block.durationDays,
        dayOffset: block.dayOffset,
        categories: [],
      };
    }

    const scheduledCategories: ScheduledTimelineGraphCategory[] = [];

    for (const category of project.categories) {
      const hasSubcategories = categoryHasSubcategories(category);

      if (hasSubcategories) {
        const scheduledChildren: ScheduledTimelineGraphChild[] =
          category.children.map((child) => {
            const block =
              wave.blocksBySectionId.get(child.id) ??
              scheduleBlockAt(
                child.laborWorkloadHours,
                wave.projectStartIso,
                calendarStartIso,
                child.peopleCount,
              );
            return {
              ...child,
              startIso: block.startIso,
              endIso: block.endIso,
              durationDays: block.durationDays,
              dayOffset: block.dayOffset,
            };
          });

        const span = spanFromBlocks(
          scheduledChildren.map((child) => ({
            startIso: child.startIso,
            endIso: child.endIso,
            durationDays: child.durationDays,
            dayOffset: child.dayOffset,
          })),
          category.laborWorkloadHours,
          category.peopleCount,
          wave.projectStartIso,
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
        continue;
      }

      const block =
        wave.blocksBySectionId.get(category.id) ??
        scheduleBlockAt(
          category.laborWorkloadHours,
          wave.projectStartIso,
          calendarStartIso,
          category.peopleCount,
        );

      scheduledCategories.push({
        ...category,
        startIso: block.startIso,
        endIso: block.endIso,
        durationDays: block.durationDays,
        dayOffset: block.dayOffset,
        // Bez apakškategorijām bērnu rindas UI nerāda — darbs ir kategorija.
        children: category.children.map((child) => ({
          ...child,
          startIso: block.startIso,
          endIso: block.endIso,
          durationDays: block.durationDays,
          dayOffset: block.dayOffset,
        })),
      });
    }

    return {
      ...project,
      startIso: wave.projectStartIso,
      endIso: wave.projectEndIso,
      durationDays: calendarInclusiveSpan(
        wave.projectStartIso,
        wave.projectEndIso,
      ),
      dayOffset: calendarDayOffset(calendarStartIso, wave.projectStartIso),
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
