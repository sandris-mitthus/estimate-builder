"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
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
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createSiteDocAction,
  createSiteDocCategoryAction,
  deleteSiteDocAction,
  deleteSiteDocCategoryAction,
  reorderSiteDocsAction,
  updateSiteDocAction,
  updateSiteDocCategoryAction,
} from "@/app/(protected)/site_docs/actions";
import { AppModal, appModalWidePanelMaxWidthClassName } from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { DragHandle } from "@/app/components/drag-handle";
import { IconActionButton } from "@/app/components/icon-action-button";
import { SectionPage } from "@/app/components/section-page";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type {
  SiteDocCategorySummary,
  SiteDocInput,
  SiteDocSummary,
} from "@/app/lib/site-admin/repository";

type CategoryDraft = {
  title: string;
};

type DocDraft = SiteDocInput;

const categoryContainerId = (categoryId: string) => `category:${categoryId}`;

function getCategoryIdFromContainerId(id: UniqueIdentifier | null | undefined) {
  const value = id == null ? "" : String(id);
  return value.startsWith("category:") ? value.slice("category:".length) : null;
}

function createEmptyCategoryDraft(): CategoryDraft {
  return { title: "" };
}

function createCategoryDraft(category: SiteDocCategorySummary): CategoryDraft {
  return { title: category.title };
}

function createEmptyDocDraft(categoryId: string): DocDraft {
  return { categoryId, title: "", description: "" };
}

function createDocDraft(doc: SiteDocSummary): DocDraft {
  return {
    categoryId: doc.categoryId,
    title: doc.title,
    description: doc.description,
  };
}

function findDoc(categories: SiteDocCategorySummary[], docId: string) {
  for (const category of categories) {
    const doc = category.docs.find((item) => item.id === docId);
    if (doc) {
      return doc;
    }
  }

  return null;
}

function findDocCategoryId(
  categories: SiteDocCategorySummary[],
  id: UniqueIdentifier | null | undefined,
) {
  const categoryId = getCategoryIdFromContainerId(id);
  if (categoryId) {
    return categoryId;
  }

  const docId = id == null ? "" : String(id);
  return categories.find((category) =>
    category.docs.some((doc) => doc.id === docId),
  )?.id ?? null;
}

function normalizeCategorySort(categories: SiteDocCategorySummary[]) {
  return categories.map((category) => ({
    ...category,
    docs: category.docs.map((doc, index) => ({
      ...doc,
      categoryId: category.id,
      sortOrder: (index + 1) * 10,
    })),
  }));
}

function moveDoc(
  categories: SiteDocCategorySummary[],
  activeId: string,
  overId: UniqueIdentifier | null | undefined,
) {
  if (!overId) return categories;

  const sourceCategoryId = findDocCategoryId(categories, activeId);
  const targetCategoryId = findDocCategoryId(categories, overId);
  if (!sourceCategoryId || !targetCategoryId) return categories;

  const activeDoc = findDoc(categories, activeId);
  if (!activeDoc) return categories;

  const overDocId = String(overId);
  if (sourceCategoryId === targetCategoryId) {
    return normalizeCategorySort(
      categories.map((category) => {
        if (category.id !== sourceCategoryId) return category;

        const oldIndex = category.docs.findIndex((doc) => doc.id === activeId);
        const newIndex = category.docs.findIndex((doc) => doc.id === overDocId);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return category;

        return { ...category, docs: arrayMove(category.docs, oldIndex, newIndex) };
      }),
    );
  }

  return normalizeCategorySort(
    categories.map((category) => {
      if (category.id === sourceCategoryId) {
        return {
          ...category,
          docs: category.docs.filter((doc) => doc.id !== activeId),
        };
      }

      if (category.id === targetCategoryId) {
        const overIndex = category.docs.findIndex((doc) => doc.id === overDocId);
        const insertIndex = overIndex >= 0 ? overIndex : category.docs.length;
        const nextDocs = [...category.docs];
        nextDocs.splice(insertIndex, 0, { ...activeDoc, categoryId: targetCategoryId });
        return { ...category, docs: nextDocs };
      }

      return category;
    }),
  );
}

function createReorderPayload(categories: SiteDocCategorySummary[]) {
  return categories.flatMap((category) =>
    category.docs.map((doc, index) => ({
      id: doc.id,
      categoryId: category.id,
      sortOrder: (index + 1) * 10,
    })),
  );
}

function SiteDocCard({
  doc,
  dragLabel,
  attributes,
  listeners,
  setNodeRef,
  style,
  dragging = false,
  onEdit,
  onDelete,
}: {
  doc: SiteDocSummary;
  dragLabel: string;
  attributes?: ReturnType<typeof useSortable>["attributes"];
  listeners?: ReturnType<typeof useSortable>["listeners"];
  setNodeRef?: ReturnType<typeof useSortable>["setNodeRef"];
  style?: CSSProperties;
  dragging?: boolean;
  onEdit?: (doc: SiteDocSummary) => void;
  onDelete?: (doc: SiteDocSummary) => void;
}) {
  const { t } = useTranslations();

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition ${
        dragging ? "opacity-50 ring-2 ring-blue-200" : "hover:border-blue-200"
      }`}
    >
      <div className="flex items-start gap-3">
        {attributes ? (
          <DragHandle label={dragLabel} attributes={attributes} listeners={listeners} />
        ) : (
          <span className="inline-flex h-7 w-6 shrink-0 items-center justify-center rounded text-zinc-300">
            <i className="fas fa-grip-vertical text-[11px]" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-zinc-950">{doc.title}</h3>
          <p className="mt-1 line-clamp-3 text-sm leading-6 text-zinc-500">
            {doc.description}
          </p>
        </div>
        {onEdit && onDelete ? (
          <div className="flex shrink-0 items-center gap-1">
            <IconActionButton
              label={t("actions.edit", "Labot")}
              icon="fas fa-pen"
              onClick={() => onEdit(doc)}
              variant="edit"
            />
            <IconActionButton
              label={t("actions.delete", "Dzēst")}
              icon="fas fa-trash"
              onClick={() => onDelete(doc)}
              variant="delete"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function SortableSiteDocCard({
  doc,
  dragLabel,
  onEdit,
  onDelete,
}: {
  doc: SiteDocSummary;
  dragLabel: string;
  onEdit: (doc: SiteDocSummary) => void;
  onDelete: (doc: SiteDocSummary) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: doc.id, animateLayoutChanges: () => false });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <SiteDocCard
      doc={doc}
      dragLabel={dragLabel}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      style={style}
      dragging={isDragging}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

function SiteDocCategoryColumn({
  category,
  dragLabel,
  emptyLabel,
  onCreateDoc,
  onEditCategory,
  onDeleteCategory,
  onEditDoc,
  onDeleteDoc,
}: {
  category: SiteDocCategorySummary;
  dragLabel: (name: string) => string;
  emptyLabel: string;
  onCreateDoc: (categoryId: string) => void;
  onEditCategory: (category: SiteDocCategorySummary) => void;
  onDeleteCategory: (category: SiteDocCategorySummary) => void;
  onEditDoc: (doc: SiteDocSummary) => void;
  onDeleteDoc: (doc: SiteDocSummary) => void;
}) {
  const { t } = useTranslations();
  const { setNodeRef, isOver } = useDroppable({
    id: categoryContainerId(category.id),
  });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-64 flex-col rounded-3xl border bg-white/90 p-4 shadow-sm transition ${
        isOver ? "border-blue-300 ring-4 ring-blue-100" : "border-zinc-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-950">
            {category.title}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">{category.docs.length}</p>
        </div>
        <div className="flex items-center gap-1">
          <IconActionButton
            label={t("site_docs.edit_category", "Labot kategoriju")}
            icon="fas fa-pen"
            onClick={() => onEditCategory(category)}
            variant="edit"
          />
          <IconActionButton
            label={t("site_docs.delete_category.action", "Dzēst kategoriju")}
            icon="fas fa-trash"
            onClick={() => onDeleteCategory(category)}
            variant="delete"
          />
        </div>
      </div>

      <SortableContext
        items={category.docs.map((doc) => doc.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="mt-4 flex flex-1 flex-col gap-3">
          {category.docs.map((doc) => (
            <SortableSiteDocCard
              key={doc.id}
              doc={doc}
              dragLabel={dragLabel(doc.title)}
              onEdit={onEditDoc}
              onDelete={onDeleteDoc}
            />
          ))}
          {category.docs.length === 0 ? (
            <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 text-center text-sm text-zinc-400">
              {emptyLabel}
            </div>
          ) : null}
        </div>
      </SortableContext>

      <button
        type="button"
        onClick={() => onCreateDoc(category.id)}
        className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
      >
        <i className="fas fa-plus text-xs" aria-hidden="true" />
        {t("site_docs.add_doc", "Pievienot docs")}
      </button>
    </section>
  );
}

export function SiteDocsManager({
  initialCategories,
  title,
  subtitle,
}: {
  initialCategories: SiteDocCategorySummary[];
  title: string;
  subtitle: string;
}) {
  const dndContextId = useId();
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState(initialCategories);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState(createEmptyCategoryDraft);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docDraft, setDocDraft] = useState<DocDraft>(() =>
    createEmptyDocDraft(initialCategories[0]?.id ?? ""),
  );
  const [deleteCategoryTarget, setDeleteCategoryTarget] =
    useState<SiteDocCategorySummary | null>(null);
  const [deleteDocTarget, setDeleteDocTarget] = useState<SiteDocSummary | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const activeDoc = useMemo(
    () => (activeDocId ? findDoc(categories, activeDocId) : null),
    [activeDocId, categories],
  );

  const editingCategory = useMemo(
    () =>
      editingCategoryId
        ? categories.find((category) => category.id === editingCategoryId) ?? null
        : null,
    [categories, editingCategoryId],
  );

  const editingDoc = useMemo(
    () => (editingDocId ? findDoc(categories, editingDocId) : null),
    [categories, editingDocId],
  );

  const initialCategoryDraft = editingCategory
    ? createCategoryDraft(editingCategory)
    : createEmptyCategoryDraft();
  const initialDocDraft = editingDoc
    ? createDocDraft(editingDoc)
    : createEmptyDocDraft(docDraft.categoryId || categories[0]?.id || "");
  const isCategoryDirty =
    JSON.stringify(categoryDraft) !== JSON.stringify(initialCategoryDraft);
  const isDocDirty = JSON.stringify(docDraft) !== JSON.stringify(initialDocDraft);

  function openCreateCategoryModal() {
    clearFeedback();
    setEditingCategoryId(null);
    setCategoryDraft(createEmptyCategoryDraft());
    setCategoryModalOpen(true);
  }

  function openEditCategoryModal(category: SiteDocCategorySummary) {
    clearFeedback();
    setEditingCategoryId(category.id);
    setCategoryDraft(createCategoryDraft(category));
    setCategoryModalOpen(true);
  }

  function openCreateDocModal(categoryId: string) {
    clearFeedback();
    setEditingDocId(null);
    setDocDraft(createEmptyDocDraft(categoryId));
    setDocModalOpen(true);
  }

  function openEditDocModal(doc: SiteDocSummary) {
    clearFeedback();
    setEditingDocId(doc.id);
    setDocDraft(createDocDraft(doc));
    setDocModalOpen(true);
  }

  function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!categoryDraft.title.trim()) {
      showFeedback({
        type: "error",
        text: t("site_docs.validation.category_title_required", "Ievadi kategorijas nosaukumu."),
      });
      return;
    }

    startTransition(async () => {
      const result = editingCategoryId
        ? await updateSiteDocCategoryAction(editingCategoryId, categoryDraft)
        : await createSiteDocCategoryAction(categoryDraft);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setCategoryModalOpen(false);
      showFeedback({
        type: "success",
        text: editingCategoryId
          ? t("site_docs.feedback.category_saved", "Kategorija saglabāta.")
          : t("site_docs.feedback.category_created", "Kategorija pievienota."),
      });
      router.refresh();
    });
  }

  function handleDocSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!docDraft.categoryId.trim()) {
      showFeedback({
        type: "error",
        text: t("site_docs.validation.category_required", "Izvēlies kategoriju."),
      });
      return;
    }

    if (!docDraft.title.trim()) {
      showFeedback({
        type: "error",
        text: t("site_docs.validation.doc_title_required", "Ievadi docs nosaukumu."),
      });
      return;
    }

    if (!docDraft.description.trim()) {
      showFeedback({
        type: "error",
        text: t("site_docs.validation.doc_description_required", "Ievadi docs aprakstu."),
      });
      return;
    }

    startTransition(async () => {
      const result = editingDocId
        ? await updateSiteDocAction(editingDocId, docDraft)
        : await createSiteDocAction(docDraft);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setDocModalOpen(false);
      showFeedback({
        type: "success",
        text: editingDocId
          ? t("site_docs.feedback.doc_saved", "Docs saglabāts.")
          : t("site_docs.feedback.doc_created", "Docs pievienots."),
      });
      router.refresh();
    });
  }

  function handleDeleteCategory() {
    if (!deleteCategoryTarget) return;

    startTransition(async () => {
      const result = await deleteSiteDocCategoryAction(deleteCategoryTarget.id);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setDeleteCategoryTarget(null);
      showFeedback({
        type: "success",
        text: t("site_docs.feedback.category_deleted", "Kategorija dzēsta."),
      });
      router.refresh();
    });
  }

  function handleDeleteDoc() {
    if (!deleteDocTarget) return;

    startTransition(async () => {
      const result = await deleteSiteDocAction(deleteDocTarget.id);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      setDeleteDocTarget(null);
      showFeedback({
        type: "success",
        text: t("site_docs.feedback.doc_deleted", "Docs dzēsts."),
      });
      router.refresh();
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDocId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const nextCategories = moveDoc(categories, activeId, event.over?.id);
    setActiveDocId(null);

    if (nextCategories === categories) {
      return;
    }

    setCategories(nextCategories);
    startTransition(async () => {
      const result = await reorderSiteDocsAction(createReorderPayload(nextCategories));
      if (!result.ok) {
        setCategories(categories);
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      showFeedback({
        type: "success",
        text: t("site_docs.feedback.order_saved", "Docs secība saglabāta."),
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
          {t("site_docs.add_category", "Pievienot kategoriju")}
        </button>
      }
    >
      <div className="space-y-4">
      {categories.length > 0 ? (
        <DndContext
          id={dndContextId}
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDocId(null)}
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {categories.map((category) => (
              <SiteDocCategoryColumn
                key={category.id}
                category={category}
                dragLabel={(name) =>
                  t("site_docs.drag_doc", "Pārvietot docs: {name}", { name })
                }
                emptyLabel={t(
                  "site_docs.empty_category",
                  "Šajā kategorijā vēl nav docs. Ievelc docs šeit vai pievieno jaunu.",
                )}
                onCreateDoc={openCreateDocModal}
                onEditCategory={openEditCategoryModal}
                onDeleteCategory={setDeleteCategoryTarget}
                onEditDoc={openEditDocModal}
                onDeleteDoc={setDeleteDocTarget}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDoc ? (
              <SiteDocCard
                doc={activeDoc}
                dragLabel={t("site_docs.drag_doc", "Pārvietot docs: {name}", {
                  name: activeDoc.title,
                })}
                dragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
          {t("site_docs.empty_page", "Pievieno pirmo kategoriju, lai sāktu veidot docs sadaļu.")}
        </div>
      )}

      <AppModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        title={
          editingCategoryId
            ? t("site_docs.category_modal.edit_title", "Labot kategoriju")
            : t("site_docs.category_modal.create_title", "Jauna kategorija")
        }
        dirty={isCategoryDirty}
        blocking={isPending}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-5">
          <label className="block text-sm font-medium text-zinc-800">
            {t("site_docs.category_modal.title_label", "Kategorijas nosaukums")}
            <input
              value={categoryDraft.title}
              onChange={(event) =>
                setCategoryDraft({ title: event.target.value })
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              placeholder={t("site_docs.category_modal.title_placeholder", "Piemēram, Projekti")}
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
        open={docModalOpen}
        onOpenChange={setDocModalOpen}
        title={
          editingDocId
            ? t("site_docs.doc_modal.edit_title", "Labot docs")
            : t("site_docs.doc_modal.create_title", "Jauns docs")
        }
        dirty={isDocDirty}
        blocking={isPending}
        panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
      >
        <form onSubmit={handleDocSubmit} className="space-y-5">
          <label className="block text-sm font-medium text-zinc-800">
            {t("site_docs.doc_modal.category_label", "Kategorija")}
            <select
              value={docDraft.categoryId}
              onChange={(event) =>
                setDocDraft((current) => ({
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
            {t("site_docs.doc_modal.title_label", "Docs nosaukums")}
            <input
              value={docDraft.title}
              onChange={(event) =>
                setDocDraft((current) => ({ ...current, title: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              placeholder={t("site_docs.doc_modal.title_placeholder", "Piemēram, Projekta izveide")}
            />
          </label>

          <label className="block text-sm font-medium text-zinc-800">
            {t("site_docs.doc_modal.description_label", "Apraksts")}
            <textarea
              value={docDraft.description}
              onChange={(event) =>
                setDocDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={5}
              className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              placeholder={t(
                "site_docs.doc_modal.description_placeholder",
                "Īss paskaidrojums, ko lietotājs šajā docs sadaļā uzzina.",
              )}
            />
          </label>

          <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
            <button
              type="button"
              onClick={() => setDocModalOpen(false)}
              disabled={isPending}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("actions.cancel", "Atcelt")}
            </button>
            <button
              type="submit"
              disabled={isPending || !isDocDirty}
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
        title={t("site_docs.delete_category.title", "Dzēst kategoriju?")}
        description={t(
          "site_docs.delete_category.description",
          "Kategorija un visi tajā esošie docs tiks dzēsti.",
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        blocking={isPending}
        onConfirm={handleDeleteCategory}
      />

      <ConfirmModal
        open={deleteDocTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteDocTarget(null);
        }}
        title={t("site_docs.delete_doc.title", "Dzēst docs?")}
        description={t(
          "site_docs.delete_doc.description",
          "Docs ieraksts tiks dzēsts no dokumentācijas sadaļas.",
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        blocking={isPending}
        onConfirm={handleDeleteDoc}
      />
      </div>
    </SectionPage>
  );
}
