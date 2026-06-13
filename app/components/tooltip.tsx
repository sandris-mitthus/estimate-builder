"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  label: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  /** Horizontal alignment relative to the trigger (default centered). */
  align?: "center" | "start" | "end";
  /** Renders above full-page overlays (e.g. module data spotlight). */
  elevated?: boolean;
};

type TooltipCoords = {
  top: number;
  left: number;
  placement: "top" | "bottom";
};

const GAP_PX = 6;

function computeCoords(
  rect: DOMRect,
  align: "center" | "start" | "end",
): TooltipCoords {
  const placement = rect.top >= 56 ? "top" : "bottom";
  const top =
    placement === "top" ? rect.top - GAP_PX : rect.bottom + GAP_PX;

  let left = rect.left + rect.width / 2;
  if (align === "start") left = rect.left;
  if (align === "end") left = rect.right;

  return { top, left, placement };
}

function transformForCoords(
  coords: TooltipCoords,
  align: "center" | "start" | "end",
): string {
  const y = coords.placement === "top" ? "-100%" : "0";

  if (align === "start") return `translate(0, ${y})`;
  if (align === "end") return `translate(-100%, ${y})`;
  return `translate(-50%, ${y})`;
}

export function Tooltip({
  label,
  children,
  className = "",
  labelClassName = "",
  align = "center",
  elevated = false,
}: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setCoords(computeCoords(trigger.getBoundingClientRect(), align));
  }, [align]);

  const show = useCallback(() => {
    updatePosition();
    setVisible(true);
  }, [updatePosition]);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;

    updatePosition();

    function handleReposition() {
      updatePosition();
    }

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [visible, updatePosition]);

  const textAlignClass =
    align === "start" ? "text-left" : align === "end" ? "text-right" : "text-center";

  const tooltipNode =
    visible && coords && mounted
      ? createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: transformForCoords(coords, align),
              zIndex: elevated ? 120 : 50,
            }}
            className={`pointer-events-none w-max max-w-[min(18rem,calc(100vw-1.5rem))] whitespace-normal rounded-md bg-black px-3 py-1.5 text-[11px] font-medium leading-snug text-white shadow-lg ${textAlignClass} ${labelClassName}`.trim()}
          >
            {label}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className={`inline-flex ${className}`.trim()}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            hide();
          }
        }}
      >
        {children}
      </span>
      {tooltipNode}
    </>
  );
}
