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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRef, useId, useState, useTransition } from "react";
import { DragHandle } from "@/app/components/drag-handle";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ModulePdfThumbnail } from "@/app/components/module-pdf-thumbnail";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { ModuleVisualizationImage } from "@/app/components/module-visualization-image";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  resolveModuleBlockAssetUrl,
} from "@/app/lib/modules/resolve-block-asset";
import {
  validateModuleImageFile,
  validateModuleProjectFile,
} from "@/app/lib/modules/file-validation";
import type { ModuleBlockKind, ModuleContentBlock } from "@/app/lib/modules/types";

const tileClassName =
  "group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm";

function SortableModuleTile({
  block,
  dragLabel,
  openPdfLabel,
  openImageLabel,
  deleteLabel,
  onDelete,
  deletePending,
}: {
  block: ModuleContentBlock;
  dragLabel: string;
  openPdfLabel: string;
  openImageLabel: string;
  deleteLabel: string;
  onDelete: () => void;
  deletePending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: block.id,
      animateLayoutChanges: () => false,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : undefined,
  };

  const isPdf = block.mimeType === "application/pdf";

  return (
    <div ref={setNodeRef} style={style} className={tileClassName}>
      <a
        href={resolveModuleBlockAssetUrl(block)}
        target="_blank"
        rel="noopener noreferrer"
        className="block size-full"
        aria-label={`${isPdf ? openPdfLabel : openImageLabel}: ${block.title}`}
      >
        {isPdf ? (
          <ModulePdfThumbnail storagePath={block.storagePath} />
        ) : (
          <ModuleVisualizationImage block={block} />
        )}
      </a>

      <div className="absolute left-1 top-1 z-10">
        <DragHandle
          label={dragLabel}
          attributes={attributes}
          listeners={listeners}
        />
      </div>

      <div className="absolute right-1 top-1 z-10">
        <IconActionButton
          label={deleteLabel}
          icon="fas fa-trash"
          variant="delete"
          onClick={onDelete}
          className={`bg-white/90 shadow-sm ${deletePending ? "pointer-events-none opacity-50" : ""}`}
        />
      </div>
    </div>
  );
}

type ModuleFileBlockColumnProps = {
  title: string;
  kind: ModuleBlockKind;
  blocks: ModuleContentBlock[];
  dragLabel: string;
  emptyLabel: string;
  uploadHint: string;
  accept: string;
  uploadBlockAction: (
    formData: FormData,
  ) => Promise<
    | { ok: true; block: ModuleContentBlock }
    | { ok: false; error: string }
  >;
  removeBlockAction: (
    blockId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  onReorder: (blocks: ModuleContentBlock[]) => void;
  onBlocksChange: (blocks: ModuleContentBlock[]) => void;
};

export function ModuleFileBlockColumn({
  title,
  kind,
  blocks,
  dragLabel,
  emptyLabel,
  uploadHint,
  accept,
  uploadBlockAction,
  removeBlockAction,
  onReorder,
  onBlocksChange,
}: ModuleFileBlockColumnProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dndContextId = useId();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isUploadPending, startUploadTransition] = useTransition();
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function validateFile(file: File) {
    return kind === "visualization"
      ? validateModuleImageFile(file)
      : validateModuleProjectFile(file);
  }

  function uploadFiles(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;

    clearFeedback();

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.ok) {
        showFeedback({ type: "error", text: translateActionError(t, validation) });
        return;
      }
    }

    startUploadTransition(async () => {
      const uploadedBlocks: ModuleContentBlock[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.set("file", file);

        const result = await uploadBlockAction(formData);

        if (!result.ok) {
          showFeedback({ type: "error", text: translateActionError(t, result) });
          if (uploadedBlocks.length > 0) {
            onBlocksChange([...blocks, ...uploadedBlocks]);
          }
          return;
        }

        uploadedBlocks.push(result.block);
      }

      onBlocksChange([...blocks, ...uploadedBlocks]);
      showFeedback({
        type: "success",
        text:
          files.length === 1
            ? t("files.feedback.uploaded_one", "Fails augšupielādēts.")
            : t("files.feedback.uploaded_many", "Faili augšupielādēti."),
      });
    });
  }

  function handleDelete(blockId: string) {
    clearFeedback();
    setDeletingBlockId(blockId);

    startUploadTransition(async () => {
      const result = await removeBlockAction(blockId);

      setDeletingBlockId(null);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result) });
        return;
      }

      onBlocksChange(blocks.filter((block) => block.id !== blockId));
      showFeedback({
        type: "success",
        text: t("files.feedback.deleted", "Fails dzēsts."),
      });
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder(arrayMove(blocks, oldIndex, newIndex));
  }

  return (
    <section className="min-w-0">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>

      <div
        onDragEnter={(event) => {
          if (event.dataTransfer.types.includes("Files")) {
            event.preventDefault();
            setIsDraggingFiles(true);
          }
        }}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("Files")) {
            event.preventDefault();
            setIsDraggingFiles(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDraggingFiles(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDraggingFiles(false);
          uploadFiles(event.dataTransfer.files);
        }}
        className={`mt-3 rounded-2xl border-2 border-dashed p-3 transition-colors ${
          isDraggingFiles
            ? "border-zinc-900 bg-zinc-50"
            : "border-zinc-200 bg-zinc-50/40"
        } ${isUploadPending ? "pointer-events-none opacity-60" : ""}`}
      >
        {blocks.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-zinc-500">{emptyLabel}</p>
        ) : (
          <DndContext
            id={dndContextId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((block) => block.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-2">
                {blocks.map((block) => (
                  <SortableModuleTile
                    key={block.id}
                    block={block}
                    dragLabel={dragLabel}
                    openPdfLabel={t("files.open_pdf", "Atvērt PDF")}
                    openImageLabel={t("files.open_image", "Atvērt attēlu")}
                    deleteLabel={t("actions.delete", "Dzēst")}
                    onDelete={() => handleDelete(block.id)}
                    deletePending={deletingBlockId === block.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <div className={`${blocks.length > 0 ? "mt-3 border-t border-zinc-200 pt-3" : ""}`}>
          <p className="text-sm text-zinc-700">
            {t("files.drop_hint_prefix", "Velc failus šeit vai")}{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-zinc-900 underline-offset-2 hover:underline"
            >
              {t("files.choose", "izvēlies")}
            </button>
          </p>
          <p className="mt-1 text-xs text-zinc-500">{uploadHint}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(event) => {
          uploadFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {isUploadPending ? (
        <p className="mt-2 text-xs text-zinc-500">
          {t("files.uploading", "Augšupielādē…")}
        </p>
      ) : null}
    </section>
  );
}
