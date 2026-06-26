"use client";

import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { Tooltip } from "@/app/components/tooltip";

type TruncatedTextTag = "h2" | "h3" | "p" | "span";

type TruncatedTextProps = {
  text: string;
  as?: TruncatedTextTag;
  className?: string;
  lineClamp?: 1 | 2 | 3;
  tooltipAlign?: "center" | "start" | "end";
};

const lineClampClassName: Record<NonNullable<TruncatedTextProps["lineClamp"]>, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
};

export function TruncatedText({
  text,
  as: tag = "span",
  className = "",
  lineClamp,
  tooltipAlign = "center",
}: TruncatedTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const updateTruncation = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    setIsTruncated(
      element.scrollWidth > element.clientWidth + 1 ||
        element.scrollHeight > element.clientHeight + 1,
    );
  }, []);

  useEffect(() => {
    updateTruncation();

    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(updateTruncation);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, updateTruncation]);

  const truncateClassName = lineClamp
    ? `${lineClampClassName[lineClamp]} min-w-0 max-w-full overflow-hidden`
    : "min-w-0 max-w-full truncate";

  const node = createElement(
    tag,
    {
      ref,
      className: `${truncateClassName} ${className}`.trim(),
    },
    text,
  );

  if (!isTruncated) {
    return node;
  }

  return (
    <Tooltip label={text} align={tooltipAlign} className="w-full min-w-0 max-w-full">
      {node}
    </Tooltip>
  );
}
