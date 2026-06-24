"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, KeyboardEvent } from "react";
import { AppModal, appModalWidePanelMaxWidthClassName } from "@/app/components/app-modal";
import { DragHandle } from "@/app/components/drag-handle";
import { SectionPage } from "@/app/components/section-page";
import { useTranslations } from "@/app/components/translations-provider";

type TodoStatus = "todo" | "in_progress";

type TodoItem = {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
};

type TodoColumn = {
  status: TodoStatus;
  titleKey: string;
  fallbackTitle: string;
  emptyKey: string;
  fallbackEmpty: string;
};

const TODO_STORAGE_KEY = "estimate-builder-system-admin-todo-list";
const TODO_COUNT_CHANGE_EVENT = "estimate-builder-todo-count-change";
const DELETE_ZONE_ID = "todo-delete-zone";

const todoCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const deleteZoneCollision = pointerCollisions.find(
    (collision) => collision.id === DELETE_ZONE_ID,
  );

  if (deleteZoneCollision) {
    return [deleteZoneCollision];
  }

  return closestCorners(args);
};

const COLUMNS: TodoColumn[] = [
  {
    status: "todo",
    titleKey: "todo_list.columns.todo",
    fallbackTitle: "Darāmo darbu saraksts",
    emptyKey: "todo_list.empty.todo",
    fallbackEmpty: "Šajā kolonnā vēl nav darbu.",
  },
  {
    status: "in_progress",
    titleKey: "todo_list.columns.in_progress",
    fallbackTitle: "Darbi procesā",
    emptyKey: "todo_list.empty.in_progress",
    fallbackEmpty: "Pārvelc darbu šeit, kad tas ir sākts.",
  },
];

function createDefaultItems(t: ReturnType<typeof useTranslations>["t"]): TodoItem[] {
  return [
    {
      id: "task-default-docs",
      title: t("todo_list.defaults.review_docs", "Pārskatīt dokumentācijas sadaļu"),
      description: t(
        "todo_list.defaults.review_docs_description",
        "Pārbaudīt, vai publiskā dokumentācija atbilst jaunākajai sistēmas funkcionalitātei.",
      ),
      status: "todo",
    },
    {
      id: "task-default-translations",
      title: t("todo_list.defaults.check_translations", "Pārbaudīt jaunās tulkojumu atslēgas"),
      description: t(
        "todo_list.defaults.check_translations_description",
        "Pārliecināties, ka jaunajiem UI tekstiem ir latviešu un angļu tulkojumi.",
      ),
      status: "todo",
    },
    {
      id: "task-default-admin",
      title: t("todo_list.defaults.admin_permissions", "Sakārtot sistēmas administratora pieejas"),
      description: t(
        "todo_list.defaults.admin_permissions_description",
        "Pārskatīt sistēmas administratora izvēlnes sadaļas un pieejas.",
      ),
      status: "in_progress",
    },
  ];
}

function isTodoStatus(value: string): value is TodoStatus {
  return value === "todo" || value === "in_progress";
}

function normalizeStoredItems(value: unknown): TodoItem[] | null {
  if (!Array.isArray(value)) return null;

  const items = value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("title" in item) ||
        !("status" in item)
      ) {
        return null;
      }

      const id = String(item.id);
      const title = String(item.title).trim();
      const description =
        "description" in item && typeof item.description === "string"
          ? item.description
          : "";
      const status = String(item.status);
      if (!id || !title || !isTodoStatus(status)) return null;

      return { id, title, description, status };
    })
    .filter((item): item is TodoItem => item !== null);

  return items;
}

function getTaskContainer(
  id: UniqueIdentifier | null | undefined,
  items: TodoItem[],
): TodoStatus | null {
  if (id == null) return null;

  const stringId = String(id);
  if (isTodoStatus(stringId)) return stringId;

  return items.find((item) => item.id === stringId)?.status ?? null;
}

function TodoTaskCardShell({
  item,
  dragLabel,
  attributes,
  listeners,
  setNodeRef,
  style,
  dragging = false,
  onOpen,
}: {
  item: TodoItem;
  dragLabel: string;
  attributes?: ReturnType<typeof useSortable>["attributes"];
  listeners?: ReturnType<typeof useSortable>["listeners"];
  setNodeRef?: ReturnType<typeof useSortable>["setNodeRef"];
  style?: CSSProperties;
  dragging?: boolean;
  onOpen?: (item: TodoItem) => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onOpen || dragging) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onOpen(item);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen && !dragging ? () => onOpen(item) : undefined}
      onKeyDown={handleKeyDown}
      className={`flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-left shadow-sm transition ${
        dragging
          ? "shadow-lg ring-2 ring-blue-200"
          : onOpen
            ? "cursor-pointer hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
            : ""
      }`}
    >
      {attributes ? (
        <span
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          className="shrink-0"
        >
          <DragHandle label={dragLabel} attributes={attributes} listeners={listeners} />
        </span>
      ) : (
        <span
          className="inline-flex h-7 w-6 shrink-0 items-center justify-center self-center rounded text-zinc-300"
          aria-hidden="true"
        >
          <i className="fas fa-grip-vertical text-[11px]" />
        </span>
      )}
      <p className="min-w-0 flex-1 text-sm font-medium leading-5 text-zinc-900">
        <span>{item.title}</span>
        {item.description.trim() ? (
          <span className="mt-1 line-clamp-2 block text-xs font-normal leading-5 text-zinc-500">
            {item.description}
          </span>
        ) : null}
      </p>
    </div>
  );
}

function SortableTodoTaskCard({
  item,
  dragLabel,
  onOpen,
}: {
  item: TodoItem;
  dragLabel: string;
  onOpen: (item: TodoItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: item.id,
      animateLayoutChanges: () => false,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : undefined,
  };

  return (
    <TodoTaskCardShell
      item={item}
      dragLabel={dragLabel}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      style={style}
      onOpen={onOpen}
    />
  );
}

function TodoColumnView({
  column,
  items,
  onOpenTask,
}: {
  column: TodoColumn;
  items: TodoItem[];
  onOpenTask: (item: TodoItem) => void;
}) {
  const { t } = useTranslations();
  const { setNodeRef, isOver } = useDroppable({ id: column.status });
  const title = t(column.titleKey, column.fallbackTitle);

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[360px] flex-col rounded-3xl border bg-zinc-50 p-4 transition ${
        isOver ? "border-blue-300 bg-blue-50/70" : "border-zinc-200"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200">
          {items.length}
        </span>
      </div>

      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-3">
          {items.length > 0 ? (
            items.map((item) => (
              <SortableTodoTaskCard
                key={item.id}
                item={item}
                dragLabel={t("todo_list.drag_task", "Pārvietot darbu: {name}", {
                  name: item.title,
                })}
                onOpen={onOpenTask}
              />
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/70 px-4 py-10 text-center">
              <p className="text-sm text-zinc-500">
                {t(column.emptyKey, column.fallbackEmpty)}
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function DeleteDropZone() {
  const { t } = useTranslations();
  const { setNodeRef, isOver } = useDroppable({ id: DELETE_ZONE_ID });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-3xl border border-dashed px-5 py-6 text-center transition ${
        isOver
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-zinc-300 bg-white text-zinc-500"
      }`}
    >
      <i className="fas fa-trash-can mb-2 text-lg" aria-hidden="true" />
      <p className="text-sm font-semibold">
        {t("todo_list.delete_zone.title", "Ievelc darbu šeit, lai to izdzēstu")}
      </p>
    </div>
  );
}

type TodoTaskModalMode = "create" | "edit";

function TodoTaskModal({
  item,
  mode,
  open,
  onOpenChange,
  onCreate,
  onSave,
}: {
  item: TodoItem | null;
  mode: TodoTaskModalMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string, description: string) => void;
  onSave: (item: TodoItem) => void;
}) {
  const { t } = useTranslations();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraftTitle(mode === "edit" ? (item?.title ?? "") : "");
    setDraftDescription(mode === "edit" ? (item?.description ?? "") : "");
  }, [item, mode, open]);

  const trimmedTitle = draftTitle.trim();
  const trimmedDescription = draftDescription.trim();
  const dirty =
    mode === "create"
      ? Boolean(trimmedTitle || trimmedDescription)
      : trimmedTitle !== (item?.title ?? "") ||
        trimmedDescription !== (item?.description ?? "").trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedTitle) return;

    if (mode === "create") {
      onCreate(trimmedTitle, trimmedDescription);
      onOpenChange(false);
      return;
    }

    if (!item) return;

    onSave({
      ...item,
      title: trimmedTitle,
      description: trimmedDescription,
    });
    onOpenChange(false);
  }

  const title =
    mode === "create"
      ? t("todo_list.add.title", "Pievienot uzdevumu")
      : t("todo_list.edit.title", "Labot uzdevumu");
  const description =
    mode === "create"
      ? t(
          "todo_list.add.description",
          "Ieraksti uzdevuma nosaukumu un aprakstu.",
        )
      : t(
          "todo_list.edit.description",
          "Atjauno uzdevuma nosaukumu un aprakstu.",
        );

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      dirty={dirty}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="todo-edit-title"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("todo_list.fields.title", "Nosaukums")}
          </label>
          <input
            id="todo-edit-title"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={t("todo_list.fields.title_placeholder", "Uzdevuma nosaukums")}
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="todo-edit-description"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("todo_list.fields.description", "Apraksts")}
          </label>
          <textarea
            id="todo-edit-description"
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            rows={5}
            className="mt-2 w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={t(
              "todo_list.fields.description_placeholder",
              "Uzdevuma apraksts",
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="submit"
            disabled={!trimmedTitle || (mode === "edit" && !dirty)}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {mode === "create"
              ? t("todo_list.add.button", "Pievienot")
              : t("actions.save", "Saglabāt")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}

export function TodoListPageContent() {
  const dndContextId = useId();
  const { t } = useTranslations();
  const loadedFromStorage = useRef(false);
  const [items, setItems] = useState<TodoItem[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskModalMode, setTaskModalMode] = useState<TodoTaskModalMode | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (loadedFromStorage.current) return;
    loadedFromStorage.current = true;

    try {
      const storedValue = window.localStorage.getItem(TODO_STORAGE_KEY);
      const storedItems = storedValue
        ? normalizeStoredItems(JSON.parse(storedValue))
        : null;
      setItems(storedItems ?? createDefaultItems(t));
    } catch {
      setItems(createDefaultItems(t));
    } finally {
      setIsHydrated(true);
    }
  }, [t]);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(TODO_COUNT_CHANGE_EVENT));
  }, [isHydrated, items]);

  const activeTask = useMemo(
    () => items.find((item) => item.id === activeTaskId) ?? null,
    [activeTaskId, items],
  );
  const editingTask = useMemo(
    () => items.find((item) => item.id === editingTaskId) ?? null,
    [editingTaskId, items],
  );

  function handleCreateTask(title: string, description: string) {
    setItems((current) => [
      ...current,
      {
        id: `task-${Date.now()}-${crypto.randomUUID()}`,
        title,
        description,
        status: "todo",
      },
    ]);
  }

  function handleSaveTask(updatedItem: TodoItem) {
    setItems((current) =>
      current.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id;
    setActiveTaskId(null);

    if (!overId) return;

    if (String(overId) === DELETE_ZONE_ID) {
      setItems((current) => current.filter((item) => item.id !== activeId));
      return;
    }

    setItems((current) => {
      const activeItem = current.find((item) => item.id === activeId);
      if (!activeItem) return current;

      const sourceStatus = activeItem.status;
      const targetStatus = getTaskContainer(overId, current);
      if (!targetStatus) return current;

      const sourceItems = current.filter((item) => item.status === sourceStatus);
      const sourceIndex = sourceItems.findIndex((item) => item.id === activeId);
      if (sourceIndex < 0) return current;

      if (sourceStatus === targetStatus) {
        const targetItems = current.filter((item) => item.status === targetStatus);
        const targetIndex = targetItems.findIndex((item) => item.id === String(overId));
        if (targetIndex < 0 || sourceIndex === targetIndex) return current;

        const reorderedIds = arrayMove(
          targetItems.map((item) => item.id),
          sourceIndex,
          targetIndex,
        );
        return current
          .filter((item) => item.status !== targetStatus)
          .concat(
            reorderedIds
              .map((id) => current.find((item) => item.id === id))
              .filter((item): item is TodoItem => item != null),
          );
      }

      const targetItems = current.filter((item) => item.status === targetStatus);
      const overTaskIndex = targetItems.findIndex((item) => item.id === String(overId));
      const insertIndex = overTaskIndex >= 0 ? overTaskIndex : targetItems.length;
      const withoutActive = current.filter((item) => item.id !== activeId);
      const nextTargetItems = [
        ...targetItems.slice(0, insertIndex),
        { ...activeItem, status: targetStatus },
        ...targetItems.slice(insertIndex),
      ];

      return COLUMNS.flatMap((column) => {
        if (column.status === targetStatus) return nextTargetItems;
        return withoutActive.filter((item) => item.status === column.status);
      });
    });
  }

  return (
    <SectionPage
      title={t("nav.system_admin.todo", "Todo")}
      subtitle={t(
        "todo_list.page.subtitle",
        "Sistēmas administratora darāmo darbu plāns ar drag-and-drop kolonnām",
      )}
      actions={
        <button
          type="button"
          onClick={() => {
            setEditingTaskId(null);
            setTaskModalMode("create");
          }}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          <i className="fas fa-plus text-xs" aria-hidden="true" />
          {t("todo_list.add.button", "Pievienot")}
        </button>
      }
    >
      <div className="space-y-4">
        <DndContext
          id={dndContextId}
          sensors={sensors}
          collisionDetection={todoCollisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveTaskId(null)}
        >
          <DeleteDropZone />

          <div className="grid gap-4 lg:grid-cols-2">
            {COLUMNS.map((column) => (
              <TodoColumnView
                key={column.status}
                column={column}
                items={items.filter((item) => item.status === column.status)}
                onOpenTask={(item) => {
                  setEditingTaskId(item.id);
                  setTaskModalMode("edit");
                }}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TodoTaskCardShell
                item={activeTask}
                dragging
                dragLabel={t("todo_list.drag_task", "Pārvietot darbu: {name}", {
                  name: activeTask.title,
                })}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        <TodoTaskModal
          item={editingTask}
          mode={taskModalMode ?? "create"}
          open={taskModalMode != null}
          onOpenChange={(open) => {
            if (!open) {
              setTaskModalMode(null);
              setEditingTaskId(null);
            }
          }}
          onCreate={handleCreateTask}
          onSave={handleSaveTask}
        />
      </div>
    </SectionPage>
  );
}
