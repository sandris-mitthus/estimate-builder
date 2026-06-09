"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type GroupDragKind = "category" | "subcategory";

export type GroupDragState = {
  kind: GroupDragKind;
  entityId: string;
  transform?: string;
  transition?: string;
} | null;

type DragGroupContextValue = {
  groupDrag: GroupDragState;
  setGroupDrag: (state: GroupDragState) => void;
};

const DragGroupContext = createContext<DragGroupContextValue | null>(null);

export function DragGroupProvider({ children }: { children: ReactNode }) {
  const [groupDrag, setGroupDrag] = useState<GroupDragState>(null);
  const value = useMemo(
    () => ({ groupDrag, setGroupDrag }),
    [groupDrag],
  );

  return (
    <DragGroupContext.Provider value={value}>{children}</DragGroupContext.Provider>
  );
}

function useDragGroupContext() {
  const context = useContext(DragGroupContext);
  if (!context) {
    throw new Error("DragGroupProvider is required");
  }
  return context;
}

export function useSyncGroupDrag(
  kind: GroupDragKind,
  entityId: string,
  isDragging: boolean,
  transform?: string,
  transition?: string,
) {
  const { setGroupDrag } = useDragGroupContext();

  useLayoutEffect(() => {
    if (isDragging) {
      setGroupDrag({ kind, entityId, transform, transition });
    }
  }, [kind, entityId, isDragging, transform, transition, setGroupDrag]);
}

export function useClearGroupDrag() {
  const { setGroupDrag } = useDragGroupContext();
  return () => setGroupDrag(null);
}

export function useFollowGroupDrag({
  categoryId,
  subcategoryId,
}: {
  categoryId: string;
  subcategoryId?: string;
}): CSSProperties | undefined {
  const { groupDrag } = useDragGroupContext();

  if (!groupDrag) return undefined;

  if (groupDrag.kind === "category" && groupDrag.entityId === categoryId) {
    return {
      transform: groupDrag.transform,
      transition: groupDrag.transition,
      position: "relative",
      zIndex: 30,
    };
  }

  if (
    groupDrag.kind === "subcategory" &&
    subcategoryId &&
    groupDrag.entityId === subcategoryId
  ) {
    return {
      transform: groupDrag.transform,
      transition: groupDrag.transition,
      position: "relative",
      zIndex: 25,
    };
  }

  return undefined;
}
