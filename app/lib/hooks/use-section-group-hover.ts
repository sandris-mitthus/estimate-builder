import { useCallback, useEffect, useRef, useState } from "react";

const SECTION_HOVER_LEAVE_DELAY_MS = 40;

export type SectionGroupHoverHandlers = {
  onSectionGroupEnter?: () => void;
  onSectionGroupLeave?: () => void;
};

export function mergeSectionGroupHoverHandlers(
  ...handlers: (SectionGroupHoverHandlers | undefined)[]
): SectionGroupHoverHandlers {
  return {
    onSectionGroupEnter: () => {
      for (const handler of handlers) {
        handler?.onSectionGroupEnter?.();
      }
    },
    onSectionGroupLeave: () => {
      for (const handler of handlers) {
        handler?.onSectionGroupLeave?.();
      }
    },
  };
}

export function useSectionGroupHover() {
  const [hovered, setHovered] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSectionGroupEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setHovered(true);
  }, []);

  const onSectionGroupLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setHovered(false);
      leaveTimerRef.current = null;
    }, SECTION_HOVER_LEAVE_DELAY_MS);
  }, []);

  useEffect(
    () => () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
    },
    [],
  );

  return {
    hovered,
    onSectionGroupEnter,
    onSectionGroupLeave,
  };
}
