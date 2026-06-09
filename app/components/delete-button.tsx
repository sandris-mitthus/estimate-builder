"use client";

import { Tooltip } from "@/app/components/tooltip";

type DeleteButtonProps = {
  label: string;
  onClick: () => void;
  className?: string;
};

export function DeleteButton({ label, onClick, className = "" }: DeleteButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-red-50 hover:text-red-600 ${className}`.trim()}
      >
        <i className="fas fa-trash text-[13px]" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
