"use client";

import type { ReactNode } from "react";

type TooltipProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function Tooltip({ label, children, className = "" }: TooltipProps) {
  return (
    <span
      className={`group/tooltip relative inline-flex ${className}`.trim()}
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 max-w-[200px] -translate-x-1/2 rounded-md bg-black px-2.5 py-1 text-center text-[11px] font-medium leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
