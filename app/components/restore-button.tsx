"use client";

import { Tooltip } from "@/app/components/tooltip";

type RestoreButtonProps = {
  label: string;
  onClick: () => void;
  className?: string;
  tooltipAlign?: "center" | "start" | "end";
};

export function RestoreButton({
  label,
  onClick,
  className = "",
  tooltipAlign = "end",
}: RestoreButtonProps) {
  return (
    <Tooltip label={label} align={tooltipAlign}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-emerald-50 hover:text-emerald-700 ${className}`.trim()}
      >
        <i className="fas fa-rotate-left text-[13px]" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
