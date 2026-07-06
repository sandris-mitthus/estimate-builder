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
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createTodoCategoryAction,
  createTodoTaskAction,
  deleteTodoCategoryAction,
  deleteTodoTaskAction,
  reorderTodoCategoriesAction,
  reorderTodoTasksAction,
  updateTodoCategoryAction,
  updateTodoTaskAction,
} from "@/app/(protected)/tasks/actions";
import { AppModal, appModalWidePanelMaxWidthClassName } from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { DragHandle } from "@/app/components/drag-handle";
import { IconActionButton } from "@/app/components/icon-action-button";
import { Tooltip } from "@/app/components/tooltip";
import { TruncatedText } from "@/app/components/truncated-text";
import { SectionPage } from "@/app/components/section-page";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type {
  TodoCategoryInput,
  TodoCategorySummary,
  TodoTaskInput,
  TodoTaskSummary,
} from "@/app/lib/todo/repository";

type CategoryDraft = TodoCategoryInput;
type TaskDraft = TodoTaskInput;
type DropIndicator = {
  categoryId: string;
  beforeTaskId: string | null;
};

const categoryContainerId = (categoryId: string) => `todo-category:${categoryId}`;
const categorySortId = (categoryId: string) => `todo-category-sort:${categoryId}`;
const DEFAULT_TODO_CATEGORY_SOURCE_KEY = "default:tasks";
const TODO_DELETE_ZONE_ID = "todo-delete-zone";

const todoCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const deleteZoneCollision = pointerCollisions.find(
    (collision) => collision.id === TODO_DELETE_ZONE_ID,
  );

  if (deleteZoneCollision) {
    return [deleteZoneCollision];
  }

  return closestCorners(args);
};

function getCategoryIdFromContainerId(id: UniqueIdentifier | null | undefined) {
  const value = id == null ? "" : String(id);
  return value.startsWith("todo-category:")
    ? value.slice("todo-category:".length)
    : null;
}

function getCategoryIdFromSortId(id: UniqueIdentifier | null | undefined) {
  const value = id == null ? "" : String(id);
  return value.startsWith("todo-category-sort:")
    ? value.slice("todo-category-sort:".length)
    : null;
}

function isDefaultCategory(category: TodoCategorySummary) {
  return category.sourceKey === DEFAULT_TODO_CATEGORY_SOURCE_KEY;
}

function createEmptyCategoryDraft(): CategoryDraft {
  return { title: "" };
}

function createCategoryDraft(category: TodoCategorySummary): CategoryDraft {
  return { title: category.title };
}

function createEmptyTaskDraft(categoryId: string): TaskDraft {
  return { categoryId, title: "", description: "" };
}

function createTaskDraft(task: TodoTaskSummary): TaskDraft {
  return {
    categoryId: task.categoryId,
    title: task.title,
    description: task.description,
  };
}

function findTask(categories: TodoCategorySummary[], taskId: string) {
  for (const category of categories) {
    const task = category.tasks.find((item) => item.id === taskId);
    if (task) {
      return task;
    }
  }

  return null;
}

function findTaskCategoryId(
  categories: TodoCategorySummary[],
  id: UniqueIdentifier | null | undefined,
) {
  const categoryId = getCategoryIdFromContainerId(id);
  if (categoryId) {
    return categoryId;
  }

  const sortableCategoryId = getCategoryIdFromSortId(id);
  if (sortableCategoryId) {
    return sortableCategoryId;
  }

  const taskId = id == null ? "" : String(id);
  return (
    categories.find((category) => category.tasks.some((task) => task.id === taskId))
      ?.id ?? null
  );
}

function normalizeTaskSort(categories: TodoCategorySummary[]) {
  return categories.map((category) => ({
    ...category,
    tasks: category.tasks.map((task, index) => ({
      ...task,
      categoryId: category.id,
      sortOrder: (index + 1) * 10,
    })),
  }));
}

function moveTask(
  categories: TodoCategorySummary[],
  activeId: string,
  overId: UniqueIdentifier | null | undefined,
) {
  if (!overId) return categories;

  const sourceCategoryId = findTaskCategoryId(categories, activeId);
  const targetCategoryId = findTaskCategoryId(categories, overId);
  if (!sourceCategoryId || !targetCategoryId) return categories;

  const activeTask = findTask(categories, activeId);
  if (!activeTask) return categories;

  const overTaskId = String(overId);
  if (sourceCategoryId === targetCategoryId) {
    return normalizeTaskSort(
      categories.map((category) => {
        if (category.id !== sourceCategoryId) return category;

        const oldIndex = category.tasks.findIndex((task) => task.id === activeId);
        const newIndex = category.tasks.findIndex((task) => task.id === overTaskId);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return category;

        return { ...category, tasks: arrayMove(category.tasks, oldIndex, newIndex) };
      }),
    );
  }

  return normalizeTaskSort(
    categories.map((category) => {
      if (category.id === sourceCategoryId) {
        return {
          ...category,
          tasks: category.tasks.filter((task) => task.id !== activeId),
        };
      }

      if (category.id === targetCategoryId) {
        const overIndex = category.tasks.findIndex((task) => task.id === overTaskId);
        const insertIndex = overIndex >= 0 ? overIndex : category.tasks.length;
        const nextTasks = [...category.tasks];
        nextTasks.splice(insertIndex, 0, {
          ...activeTask,
          categoryId: targetCategoryId,
        });
        return { ...category, tasks: nextTasks };
      }

      return category;
    }),
  );
}

function createReorderPayload(categories: TodoCategorySummary[]) {
  return categories.flatMap((category) =>
    category.tasks.map((task, index) => ({
      id: task.id,
      categoryId: category.id,
      sortOrder: (index + 1) * 10,
    })),
  );
}

function normalizeCategorySort(categories: TodoCategorySummary[]) {
  const defaultCategory = categories.find(isDefaultCategory) ?? null;
  const otherCategories = categories.filter((category) => !isDefaultCategory(category));
  const normalizedOtherCategories = otherCategories.map((category, index) => ({
    ...category,
    sortOrder: (index + 1) * 10,
  }));

  return defaultCategory
    ? [{ ...defaultCategory, sortOrder: 0 }, ...normalizedOtherCategories]
    : normalizedOtherCategories;
}

function moveCategory(
  categories: TodoCategorySummary[],
  activeCategoryId: string,
  overId: UniqueIdentifier | null | undefined,
) {
  const overCategoryId = getCategoryIdFromSortId(overId);
  if (!overCategoryId || activeCategoryId === overCategoryId) {
    return categories;
  }

  const activeCategory = categories.find((category) => category.id === activeCategoryId);
  if (!activeCategory || isDefaultCategory(activeCategory)) {
    return categories;
  }

  const otherCategories = categories.filter((category) => !isDefaultCategory(category));
  const oldIndex = otherCategories.findIndex((category) => category.id === activeCategoryId);
  const overCategory = categories.find((category) => category.id === overCategoryId);
  const newIndex = overCategory
    ? isDefaultCategory(overCategory)
      ? 0
      : otherCategories.findIndex((category) => category.id === overCategoryId)
    : -1;

  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return categories;
  }

  const reorderedOtherCategories = arrayMove(otherCategories, oldIndex, newIndex);
  return normalizeCategorySort([
    ...categories.filter(isDefaultCategory),
    ...reorderedOtherCategories,
  ]);
}

function createCategoryReorderPayload(categories: TodoCategorySummary[]) {
  return categories
    .filter((category) => !isDefaultCategory(category))
    .map((category, index) => ({
      id: category.id,
      sortOrder: (index + 1) * 10,
    }));
}

function addCategoryToBoard(
  categories: TodoCategorySummary[],
  category: TodoCategorySummary,
) {
  return [...categories.filter((item) => item.id !== category.id), category].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title),
  );
}

function updateCategoryInBoard(
  categories: TodoCategorySummary[],
  category: TodoCategorySummary,
) {
  return categories.map((item) =>
    item.id === category.id ? { ...category, tasks: item.tasks } : item,
  );
}

function addTaskToBoard(categories: TodoCategorySummary[], task: TodoTaskSummary) {
  return categories.map((category) => {
    if (category.id !== task.categoryId) {
      return category;
    }

    const tasks = [...category.tasks.filter((item) => item.id !== task.id), task].sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.title.localeCompare(right.title),
    );
    return { ...category, tasks };
  });
}

function updateTaskInBoard(categories: TodoCategorySummary[], task: TodoTaskSummary) {
  return categories.map((category) => {
    const withoutTask = category.tasks.filter((item) => item.id !== task.id);
    if (category.id !== task.categoryId) {
      return { ...category, tasks: withoutTask };
    }

    const tasks = [...withoutTask, task].sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.title.localeCompare(right.title),
    );
    return { ...category, tasks };
  });
}

function TodoTaskCard({
  task,
  dragLabel,
  attributes,
  listeners,
  setNodeRef,
  style,
  dragging = false,
  onEdit,
}: {
  task: TodoTaskSummary;
  dragLabel: string;
  attributes?: ReturnType<typeof useSortable>["attributes"];
  listeners?: ReturnType<typeof useSortable>["listeners"];
  setNodeRef?: ReturnType<typeof useSortable>["setNodeRef"];
  style?: CSSProperties;
  dragging?: boolean;
  onEdit?: (task: TodoTaskSummary) => void;
}) {
  const { t } = useTranslations();
  const hasDescription = task.description.trim().length > 0;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group/task rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition ${
        dragging ? "opacity-50 ring-2 ring-blue-200" : "hover:border-blue-200"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {attributes ? (
          <span className="inline-flex shrink-0 self-start">
            <DragHandle label={dragLabel} attributes={attributes} listeners={listeners} />
          </span>
        ) : (
          <span className="inline-flex h-7 w-6 shrink-0 items-center justify-center rounded text-zinc-300">
            <i className="fas fa-grip-vertical text-[11px]" aria-hidden="true" />
          </span>
        )}
        <div
          className={`min-w-0 flex-1 ${
            hasDescription ? "" : "flex min-h-8 items-center"
          }`}
        >
          <TruncatedText
            as="h3"
            text={task.title}
            className="text-sm font-semibold leading-5 text-zinc-950"
          />
          {hasDescription ? (
            <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-zinc-500">
              {task.description}
            </p>
          ) : null}
        </div>
        {onEdit ? (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/task:opacity-100 focus-within:opacity-100">
            <IconActionButton
              label={t("actions.edit", "Labot")}
              icon="fas fa-pen"
              onClick={() => onEdit(task)}
              variant="edit"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function TaskDropIndicator() {
  return (
    <div
      className="h-2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.16)]"
      aria-hidden="true"
    />
  );
}

function DeleteDropZone() {
  const { t } = useTranslations();
  const { setNodeRef, isOver } = useDroppable({ id: TODO_DELETE_ZONE_ID });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center gap-2 rounded-3xl border border-dashed px-5 py-5 text-center transition ${
        isOver
          ? "border-red-300 bg-red-50 text-red-800 shadow-sm ring-4 ring-red-100"
          : "border-zinc-300 bg-white text-zinc-500"
      }`}
    >
      <i className="fas fa-trash-can text-sm" aria-hidden="true" />
      <p className="text-sm font-semibold">
        {t("todo.delete_zone.title", "Ievelc uzdevumu šeit, lai to izdzēstu")}
      </p>
    </div>
  );
}

function SortableTodoTaskCard({
  task,
  dragLabel,
  onEdit,
}: {
  task: TodoTaskSummary;
  dragLabel: string;
  onEdit: (task: TodoTaskSummary) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      animateLayoutChanges: () => false,
      data: { type: "task" },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TodoTaskCard
      task={task}
      dragLabel={dragLabel}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      style={style}
      dragging={isDragging}
      onEdit={onEdit}
    />
  );
}

function TodoCategoryColumn({
  category,
  dragLabel,
  categoryDragLabel,
  emptyLabel,
  dropIndicator,
  onCreateTask,
  onEditCategory,
  onDeleteCategory,
  onEditTask,
}: {
  category: TodoCategorySummary;
  dragLabel: (name: string) => string;
  categoryDragLabel: string;
  emptyLabel: string;
  dropIndicator: DropIndicator | null;
  onCreateTask: (categoryId: string) => void;
  onEditCategory: (category: TodoCategorySummary) => void;
  onDeleteCategory: (category: TodoCategorySummary) => void;
  onEditTask: (task: TodoTaskSummary) => void;
}) {
  const { t } = useTranslations();
  const defaultCategory = isDefaultCategory(category);
  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: categorySortId(category.id),
    disabled: defaultCategory,
    animateLayoutChanges: () => false,
    data: { type: "category", categoryId: category.id },
  });
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: categoryContainerId(category.id),
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : undefined,
  };

  function setNodeRef(node: HTMLElement | null) {
    setSortableNodeRef(node);
    setDroppableNodeRef(node);
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`group/category flex min-h-64 flex-col rounded-3xl border bg-white/90 p-3 shadow-sm transition ${
        isOver ? "border-blue-300 ring-4 ring-blue-100" : "border-zinc-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {defaultCategory ? null : (
            <span className="inline-flex shrink-0 self-start">
              <DragHandle
                label={categoryDragLabel}
                attributes={attributes}
                listeners={listeners}
              />
            </span>
          )}
          <div
            className={
              defaultCategory ? "min-w-0 flex-1 ml-[5px]" : "min-w-0 flex-1"
            }
          >
            <TruncatedText
              as="h2"
              text={category.title}
              tooltipAlign="start"
              className="text-base font-semibold tracking-[-0.03em] text-zinc-950"
            />
            <p className="mt-1 text-xs text-zinc-400">
              {t("todo.category.task_count", "{count} darbi", {
                count: String(category.tasks.length),
              })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/category:opacity-100 focus-within:opacity-100">
            <IconActionButton
              label={t("todo.category.edit", "Labot kategoriju")}
              icon="fas fa-pen"
              onClick={() => onEditCategory(category)}
              variant="edit"
            />
            <IconActionButton
              label={t("todo.category.delete_action", "Dzēst kategoriju")}
              icon="fas fa-trash"
              onClick={() => onDeleteCategory(category)}
              variant="delete"
            />
          </div>
          <Tooltip
            label={t("todo.task.add", "Pievienot darbu")}
            align="end"
            labelClassName="!bg-blue-600"
          >
            <button
              type="button"
              onClick={() => onCreateTask(category.id)}
              aria-label={t("todo.task.add", "Pievienot darbu")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              <i className="fas fa-plus text-sm" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </div>

      <SortableContext
        items={category.tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="mt-3 flex flex-1 flex-col gap-2.5">
          {category.tasks.map((task) => (
            <div key={task.id} className="flex flex-col gap-3">
              {dropIndicator?.categoryId === category.id &&
              dropIndicator.beforeTaskId === task.id ? (
                <TaskDropIndicator />
              ) : null}
              <SortableTodoTaskCard
                task={task}
                dragLabel={dragLabel(task.title)}
                onEdit={onEditTask}
              />
            </div>
          ))}
          {dropIndicator?.categoryId === category.id &&
          dropIndicator.beforeTaskId === null ? (
            <TaskDropIndicator />
          ) : null}
          {category.tasks.length === 0 ? (
            <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 text-center text-sm text-zinc-400">
              {emptyLabel}
            </div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}

export function TodoBoard({
  initialCategories,
  title,
  subtitle,
}: {
  initialCategories: TodoCategorySummary[];
  title: string;
  subtitle: string;
}) {
  const dndContextId = useId();
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState(initialCategories);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState(createEmptyCategoryDraft);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(() =>
    createEmptyTaskDraft(initialCategories[0]?.id ?? ""),
  );
  const [deleteCategoryTarget, setDeleteCategoryTarget] =
    useState<TodoCategorySummary | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const activeTask = useMemo(
    () => (activeTaskId ? findTask(categories, activeTaskId) : null),
    [activeTaskId, categories],
  );

  const editingCategory = useMemo(
    () =>
      editingCategoryId
        ? categories.find((category) => category.id === editingCategoryId) ?? null
        : null,
    [categories, editingCategoryId],
  );

  const editingTask = useMemo(
    () => (editingTaskId ? findTask(categories, editingTaskId) : null),
    [categories, editingTaskId],
  );

  const initialCategoryDraft = editingCategory
    ? createCategoryDraft(editingCategory)
    : createEmptyCategoryDraft();
  const initialTaskDraft = editingTask
    ? createTaskDraft(editingTask)
    : createEmptyTaskDraft(taskDraft.categoryId || categories[0]?.id || "");
  const isCategoryDirty =
    JSON.stringify(categoryDraft) !== JSON.stringify(initialCategoryDraft);
  const isTaskDirty = JSON.stringify(taskDraft) !== JSON.stringify(initialTaskDraft);

  function openCreateCategoryModal() {
    clearFeedback();
    setEditingCategoryId(null);
    setCategoryDraft(createEmptyCategoryDraft());
    setCategoryModalOpen(true);
  }

  function openEditCategoryModal(category: TodoCategorySummary) {
    clearFeedback();
    setEditingCategoryId(category.id);
    setCategoryDraft(createCategoryDraft(category));
    setCategoryModalOpen(true);
  }

  function openCreateTaskModal(categoryId: string) {
    clearFeedback();
    setEditingTaskId(null);
    setTaskDraft(createEmptyTaskDraft(categoryId));
    setTaskModalOpen(true);
  }

  function openEditTaskModal(task: TodoTaskSummary) {
    clearFeedback();
    setEditingTaskId(task.id);
    setTaskDraft(createTaskDraft(task));
    setTaskModalOpen(true);
  }

  function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!categoryDraft.title.trim()) {
      showFeedback({
        type: "error",
        text: t("todo.validation.category_title_required", "Ievadi kategorijas nosaukumu."),
      });
      return;
    }

    const isEditing = editingCategoryId !== null;
    showFeedback({
      type: "info",
      text: isEditing
        ? t("todo.feedback.category_saving", "Saglabā kategoriju…")
        : t("todo.feedback.category_creating", "Pievieno kategoriju…"),
    });

    startTransition(async () => {
      const result = editingCategoryId
        ? await updateTodoCategoryAction(editingCategoryId, categoryDraft)
        : await createTodoCategoryAction(categoryDraft);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setCategories((current) =>
        editingCategoryId
          ? updateCategoryInBoard(current, result.category)
          : addCategoryToBoard(current, result.category),
      );
      setCategoryModalOpen(false);
      showFeedback({
        type: "success",
        text: editingCategoryId
          ? t("todo.feedback.category_saved", "Kategorija saglabāta.")
          : t("todo.feedback.category_created", "Kategorija pievienota."),
      });
      router.refresh();
    });
  }

  function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!taskDraft.categoryId.trim()) {
      showFeedback({
        type: "error",
        text: t("todo.validation.category_required", "Izvēlies kategoriju."),
      });
      return;
    }

    if (!taskDraft.title.trim()) {
      showFeedback({
        type: "error",
        text: t("todo.validation.task_title_required", "Ievadi darba nosaukumu."),
      });
      return;
    }

    const isEditing = editingTaskId !== null;
    showFeedback({
      type: "info",
      text: isEditing
        ? t("todo.feedback.task_saving", "Saglabā darbu…")
        : t("todo.feedback.task_creating", "Pievieno darbu…"),
    });

    startTransition(async () => {
      const result = editingTaskId
        ? await updateTodoTaskAction(editingTaskId, taskDraft)
        : await createTodoTaskAction(taskDraft);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setCategories((current) =>
        editingTaskId
          ? updateTaskInBoard(current, result.task)
          : addTaskToBoard(current, result.task),
      );
      setTaskModalOpen(false);
      showFeedback({
        type: "success",
        text: editingTaskId
          ? t("todo.feedback.task_saved", "Darbs saglabāts.")
          : t("todo.feedback.task_created", "Darbs pievienots."),
      });
      router.refresh();
    });
  }

  function handleDeleteCategory() {
    if (!deleteCategoryTarget) return;

    startTransition(async () => {
      const result = await deleteTodoCategoryAction(deleteCategoryTarget.id);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setDeleteCategoryTarget(null);
      setCategories((current) =>
        current.filter((category) => category.id !== deleteCategoryTarget.id),
      );
      showFeedback({
        type: "success",
        text: t("todo.feedback.category_deleted", "Kategorija dzēsta."),
      });
      router.refresh();
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const activeType = event.active.data.current?.type;
    setActiveTaskId(activeType === "task" ? String(event.active.id) : null);
  }

  function handleDragOver(event: DragOverEvent) {
    if (event.active.data.current?.type !== "task") {
      setDropIndicator(null);
      return;
    }

    const activeId = String(event.active.id);
    const overId = event.over?.id;
    if (!overId || String(overId) === activeId || String(overId) === TODO_DELETE_ZONE_ID) {
      setDropIndicator(null);
      return;
    }

    const targetCategoryId = findTaskCategoryId(categories, overId);
    if (!targetCategoryId) {
      setDropIndicator(null);
      return;
    }

    setDropIndicator({
      categoryId: targetCategoryId,
      beforeTaskId:
        getCategoryIdFromContainerId(overId) || getCategoryIdFromSortId(overId)
          ? null
          : String(overId),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeType = event.active.data.current?.type;
    const activeId = String(event.active.id);
    const overId = event.over?.id;
    setActiveTaskId(null);
    setDropIndicator(null);

    if (activeType === "category") {
      const activeCategoryId = String(event.active.data.current?.categoryId ?? "");
      const nextCategories = moveCategory(categories, activeCategoryId, overId);
      if (nextCategories === categories) {
        return;
      }

      setCategories(nextCategories);
      startTransition(async () => {
        const result = await reorderTodoCategoriesAction(
          createCategoryReorderPayload(nextCategories),
        );
        if (!result.ok) {
          setCategories(categories);
          showFeedback({ type: "error", text: translateActionError(t, result) });
          return;
        }

        showFeedback({
          type: "success",
          text: t("todo.feedback.category_order_saved", "Kategoriju secība saglabāta."),
        });
        router.refresh();
      });
      return;
    }

    if (activeType !== "task") {
      return;
    }

    if (String(overId) === TODO_DELETE_ZONE_ID) {
      const previousCategories = categories;
      setCategories((current) =>
        current.map((category) => ({
          ...category,
          tasks: category.tasks.filter((task) => task.id !== activeId),
        })),
      );

      startTransition(async () => {
        const result = await deleteTodoTaskAction(activeId);
        if (!result.ok) {
          setCategories(previousCategories);
          showFeedback({ type: "error", text: translateActionError(t, result) });
          return;
        }

        showFeedback({
          type: "success",
          text: t("todo.feedback.task_deleted", "Darbs dzēsts."),
        });
        router.refresh();
      });
      return;
    }

    const nextCategories = moveTask(categories, activeId, overId);

    if (nextCategories === categories) {
      return;
    }

    setCategories(nextCategories);
    startTransition(async () => {
      const result = await reorderTodoTasksAction(createReorderPayload(nextCategories));
      if (!result.ok) {
        setCategories(categories);
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text: t("todo.feedback.order_saved", "Darbu secība saglabāta."),
      });
      router.refresh();
    });
  }

  return (
    <SectionPage
      title={title}
      subtitle={subtitle}
      actions={
        <button
          type="button"
          onClick={openCreateCategoryModal}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          <i className="fas fa-plus text-xs" aria-hidden="true" />
          {t("todo.category.add", "Pievienot kategoriju")}
        </button>
      }
    >
      <div className="space-y-4">
        {categories.length > 0 ? (
          <DndContext
            id={dndContextId}
            sensors={sensors}
            collisionDetection={todoCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
              setActiveTaskId(null);
              setDropIndicator(null);
            }}
          >
            <DeleteDropZone />

            <SortableContext
              items={categories.map((category) => categorySortId(category.id))}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                {categories.map((category) => (
                  <div key={category.id} className="min-w-0">
                    <TodoCategoryColumn
                      category={category}
                      dragLabel={(name) =>
                        t("todo.task.drag", "Pārvietot darbu: {name}", { name })
                      }
                      categoryDragLabel={t(
                        "todo.category.drag",
                        "Pārvietot kategoriju: {name}",
                        { name: category.title },
                      )}
                      dropIndicator={dropIndicator}
                      emptyLabel={t(
                        "todo.category.empty",
                        "Šajā kategorijā vēl nav darbu. Ievelc darbu šeit vai pievieno jaunu.",
                      )}
                      onCreateTask={openCreateTaskModal}
                      onEditCategory={openEditCategoryModal}
                      onDeleteCategory={setDeleteCategoryTarget}
                      onEditTask={openEditTaskModal}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeTask ? (
                <TodoTaskCard
                  task={activeTask}
                  dragLabel={t("todo.task.drag", "Pārvietot darbu: {name}", {
                    name: activeTask.title,
                  })}
                  dragging
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
            {t(
              "todo.empty_page",
              "Pievieno pirmo kategoriju, lai sāktu veidot darāmo darbu sarakstu.",
            )}
          </div>
        )}

        <AppModal
          open={categoryModalOpen}
          onOpenChange={setCategoryModalOpen}
          title={
            editingCategoryId
              ? t("todo.category_modal.edit_title", "Labot kategoriju")
              : t("todo.category_modal.create_title", "Jauna kategorija")
          }
          dirty={isCategoryDirty}
          blocking={isPending}
        >
          <form onSubmit={handleCategorySubmit} className="space-y-5">
            <label className="block text-sm font-medium text-zinc-800">
              {t("todo.category_modal.title_label", "Kategorijas nosaukums")}
              <input
                value={categoryDraft.title}
                onChange={(event) =>
                  setCategoryDraft({ title: event.target.value })
                }
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                placeholder={t(
                  "todo.category_modal.title_placeholder",
                  "Piemēram, Materiālu pasūtīšana",
                )}
              />
            </label>

            <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                disabled={isPending}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("actions.cancel", "Atcelt")}
              </button>
              <button
                type="submit"
                disabled={isPending || !isCategoryDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
                ) : null}
                {isPending ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
              </button>
            </div>
          </form>
        </AppModal>

        <AppModal
          open={taskModalOpen}
          onOpenChange={setTaskModalOpen}
          title={
            editingTaskId
              ? t("todo.task_modal.edit_title", "Labot darbu")
              : t("todo.task_modal.create_title", "Jauns darbs")
          }
          dirty={isTaskDirty}
          blocking={isPending}
          panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
        >
          <form onSubmit={handleTaskSubmit} className="space-y-5">
            <label className="block text-sm font-medium text-zinc-800">
              {t("todo.task_modal.category_label", "Kategorija")}
              <select
                value={taskDraft.categoryId}
                onChange={(event) =>
                  setTaskDraft((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-zinc-800">
              {t("todo.task_modal.title_label", "Darba nosaukums")}
              <input
                value={taskDraft.title}
                onChange={(event) =>
                  setTaskDraft((current) => ({ ...current, title: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                placeholder={t(
                  "todo.task_modal.title_placeholder",
                  "Piemēram, Pasūtīt skrūves un profilus",
                )}
              />
            </label>

            <label className="block text-sm font-medium text-zinc-800">
              {t("todo.task_modal.description_label", "Apraksts")}
              <textarea
                value={taskDraft.description}
                onChange={(event) =>
                  setTaskDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={5}
                className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                placeholder={t(
                  "todo.task_modal.description_placeholder",
                  "Papildu piezīmes par darba izpildi.",
                )}
              />
            </label>

            <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
              <button
                type="button"
                onClick={() => setTaskModalOpen(false)}
                disabled={isPending}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("actions.cancel", "Atcelt")}
              </button>
              <button
                type="submit"
                disabled={isPending || !isTaskDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
                ) : null}
                {isPending ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
              </button>
            </div>
          </form>
        </AppModal>

        <ConfirmModal
          open={deleteCategoryTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteCategoryTarget(null);
          }}
          title={t("todo.delete_category.title", "Dzēst kategoriju?")}
          description={t(
            "todo.delete_category.description",
            "Kategorija un visi tajā esošie darbi tiks dzēsti.",
          )}
          confirmLabel={t("actions.delete", "Dzēst")}
          confirmVariant="danger"
          blocking={isPending}
          onConfirm={handleDeleteCategory}
        />
      </div>
    </SectionPage>
  );
}
